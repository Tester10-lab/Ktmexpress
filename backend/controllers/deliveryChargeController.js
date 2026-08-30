import DeliveryChargeRule from '../models/DeliveryChargeRule.js';
import GlobalPricingSettings from '../models/GlobalPricingSettings.js';
import OutsideValleyFee from '../models/OutsideValleyFee.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Core calculation:  charge = baseCharge + max(0, weight - weightLimit) * perKgCharge
 */
function calculateCharge(rule, weight) {
  const w = Number(weight) || 0;
  const extraWeight = Math.max(0, w - (rule.weightLimit || 0));
  return rule.baseCharge + extraWeight * (rule.perKgCharge || 0);
}

// ─── Public endpoint — calculate charge for a given route + weight ─────────────

/**
 * GET /api/delivery-charges/calculate?from=BRANCH&to=BRANCH&weight=KG
 * Accessible by authenticated users (vendor, dispatcher, admin, etc.)
 */
export const calculateDeliveryCharge = async (req, res) => {
  try {
    const { from = 'HEAD OFFICE', to = 'Kathmandu Branch', weight, city } = req.query;

    const w = Number(weight) || 1;
    const globalSettings = (await GlobalPricingSettings.findById('global')) || { ktmBaseRate: 100, weightSurchargePerKg: 50 };
    const ktmBaseRate = globalSettings?.ktmBaseRate || 100;
    const weightSurchargePerKg = globalSettings?.weightSurchargePerKg || 50;

    // Check if authenticated user is a vendor with custom pricing
    let vendorMeta = null;
    if (req.user && req.user._id) {
      const user = await import('../models/User.js').then(m => m.default.findById(req.user._id));
      if (user && user.role === 'vendor') {
        vendorMeta = user.vendorMeta || null;
      }
    }

    // 1. Custom flat rate overrides everything
    if (vendorMeta?.customFlatRate !== null && vendorMeta?.customFlatRate !== undefined) {
      return res.json({
        success: true,
        data: {
          charge: Number(vendorMeta.customFlatRate),
          baseCharge: Number(vendorMeta.customFlatRate),
          perKgCharge: 0,
          weightLimit: 999,
          fromBranch: from,
          toBranch: to,
          weight: w,
          isCustomFlatRate: true,
        },
      });
    }

    const VALLEY_NAMES = ['head office', 'kathmandu', 'lalitpur', 'bhaktapur'];
    const fromStr = String(from || '').trim().toLowerCase();
    const toStr = String(to || '').trim().toLowerCase();
    const cityStr = String(city || '').trim().toLowerCase();

    const isFromValley = VALLEY_NAMES.some(v => fromStr.includes(v));
    const isToValley = VALLEY_NAMES.some(v => toStr.includes(v)) && !toStr.includes('outside') && !cityStr.includes('outside');

    // 2. Intra-Valley Delivery
    if (isFromValley && isToValley && (!city || VALLEY_NAMES.some(v => cityStr.includes(v)))) {
      const baseCharge = (vendorMeta?.useGlobalPricing === false && vendorMeta?.defaultKtmRate !== undefined)
        ? vendorMeta.defaultKtmRate
        : ktmBaseRate;

      const surchargePerKg = (vendorMeta?.useGlobalPricing === false && vendorMeta?.weightSurcharge !== undefined)
        ? vendorMeta.weightSurcharge
        : weightSurchargePerKg;

      const extraWeight = Math.max(0, Math.ceil(w - 1));
      const charge = baseCharge + extraWeight * surchargePerKg;

      return res.json({
        success: true,
        data: {
          charge,
          baseCharge,
          perKgCharge: surchargePerKg,
          weightLimit: 1,
          fromBranch: from,
          toBranch: to,
          weight: w,
          isLocal: true,
        },
      });
    }

    // 3. Check explicitly configured DeliveryChargeRule
    const rule = await DeliveryChargeRule.findOne({
      fromBranch: { $regex: new RegExp(`^${fromStr}$`, 'i') },
      toBranch:   { $regex: new RegExp(`^${toStr}$`, 'i') },
      isActive: true,
    });

    if (rule) {
      const charge = calculateCharge(rule, w);
      return res.json({
        success: true,
        data: {
          charge,
          baseCharge: rule.baseCharge,
          perKgCharge: rule.perKgCharge,
          weightLimit: rule.weightLimit,
          fromBranch: rule.fromBranch,
          toBranch: rule.toBranch,
          weight: w,
          ruleId: rule._id,
        },
      });
    }

    // 4. Outside Valley lookup
    const rawSearch = (city || to || '').trim();
    let cityFee = null;

    if (rawSearch && rawSearch !== '--------') {
      const cleanSearch = rawSearch.replace(/[\(\)]/g, ' ').trim();
      const tokens = cleanSearch.split(/\s+/).filter(t => t.length > 2);
      const regexPatterns = tokens.map(t => new RegExp(t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'));

      cityFee = await OutsideValleyFee.findOne({
        $or: [
          { city: rawSearch.toUpperCase() },
          { city: { $regex: new RegExp(rawSearch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i') } },
          ...(regexPatterns.length > 0 ? [{ city: { $in: regexPatterns } }] : [])
        ],
        isActive: true
      });
    }

    const baseCharge = cityFee 
      ? cityFee.fee 
      : ((vendorMeta?.useGlobalPricing === false && vendorMeta?.defaultOutsideRate !== undefined) ? vendorMeta.defaultOutsideRate : 200);

    const surchargePerKg = (vendorMeta?.useGlobalPricing === false && vendorMeta?.weightSurcharge !== undefined)
      ? vendorMeta.weightSurcharge
      : weightSurchargePerKg;

    const extraWeight = Math.max(0, Math.ceil(w - 1));
    const charge = baseCharge + extraWeight * surchargePerKg;

    return res.json({
      success: true,
      data: {
        charge,
        baseCharge,
        perKgCharge: surchargePerKg,
        weightLimit: 1,
        fromBranch: from,
        toBranch: to,
        weight: w,
        cityMatched: cityFee ? cityFee.city : null,
      },
    });
  } catch (error) {
    return res.json({
      success: true,
      data: {
        charge: 200,
        baseCharge: 200,
        perKgCharge: 50,
        weightLimit: 1,
        fromBranch: req.query.from || 'HEAD OFFICE',
        toBranch: req.query.to || 'Kathmandu Branch',
        weight: Number(req.query.weight) || 1,
        fallback: true
      }
    });
  }
};

/**
 * GET /api/delivery-charges/cities
 * Returns active outside valley delivery cities
 */
export const getActiveDeliveryCities = async (req, res) => {
  try {
    const cities = await OutsideValleyFee.find({ isActive: true })
      .select('city fee')
      .sort({ city: 1 });
    res.json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin CRUD ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/delivery-charges
 * Returns all rules (admin only)
 */
export const getAllDeliveryChargeRules = async (req, res) => {
  try {
    const rules = await DeliveryChargeRule.find()
      .sort({ fromBranch: 1, toBranch: 1 })
      .populate('createdBy', 'name email');
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/delivery-charges
 * Create a new rule (admin only)
 */
export const createDeliveryChargeRule = async (req, res) => {
  try {
    const { fromBranch, toBranch, baseCharge, perKgCharge, weightLimit, isActive } = req.body;

    if (!fromBranch || !toBranch) {
      return res.status(400).json({ success: false, message: 'fromBranch and toBranch are required' });
    }
    if (fromBranch.trim().toLowerCase() === toBranch.trim().toLowerCase()) {
      return res.status(400).json({ success: false, message: 'From and To branch cannot be the same' });
    }
    if (baseCharge === undefined || baseCharge === null || isNaN(Number(baseCharge))) {
      return res.status(400).json({ success: false, message: 'baseCharge is required' });
    }

    // Check for duplicate active route
    const existing = await DeliveryChargeRule.findOne({
      fromBranch: { $regex: new RegExp(`^${fromBranch.trim()}$`, 'i') },
      toBranch:   { $regex: new RegExp(`^${toBranch.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A rule for ${fromBranch} → ${toBranch} already exists. Edit the existing one.`,
      });
    }

    const rule = await DeliveryChargeRule.create({
      fromBranch: fromBranch.trim(),
      toBranch: toBranch.trim(),
      baseCharge: Number(baseCharge),
      perKgCharge: Number(perKgCharge) || 0,
      weightLimit: Number(weightLimit) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/delivery-charges/:id
 * Update an existing rule (admin only)
 */
export const updateDeliveryChargeRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { fromBranch, toBranch, baseCharge, perKgCharge, weightLimit, isActive } = req.body;

    const updateData = {};
    if (fromBranch !== undefined) updateData.fromBranch = fromBranch.trim();
    if (toBranch   !== undefined) updateData.toBranch   = toBranch.trim();
    if (baseCharge !== undefined) updateData.baseCharge  = Number(baseCharge);
    if (perKgCharge !== undefined) updateData.perKgCharge = Number(perKgCharge);
    if (weightLimit !== undefined) updateData.weightLimit  = Number(weightLimit);
    if (isActive    !== undefined) updateData.isActive     = Boolean(isActive);

    // Prevent same-branch rule
    const target = await DeliveryChargeRule.findById(id);
    if (!target) return res.status(404).json({ success: false, message: 'Rule not found' });

    const fb = updateData.fromBranch || target.fromBranch;
    const tb = updateData.toBranch   || target.toBranch;
    if (fb.toLowerCase() === tb.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'From and To branch cannot be the same' });
    }

    const updated = await DeliveryChargeRule.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/delivery-charges/:id
 * Hard-delete a rule (admin only)
 */
export const deleteDeliveryChargeRule = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DeliveryChargeRule.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/admin/delivery-charges/:id/toggle
 * Toggle isActive (admin only)
 */
export const toggleDeliveryChargeRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await DeliveryChargeRule.findById(id);
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    rule.isActive = !rule.isActive;
    await rule.save();
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
