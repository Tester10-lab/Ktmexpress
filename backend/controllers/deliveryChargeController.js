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
    const { from, to, weight, city } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'from and to branch parameters are required',
      });
    }

    const w = Number(weight) || 0;

    // 1. Same-branch / Local intra-valley delivery (e.g. HEAD OFFICE to HEAD OFFICE or local city)
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      const globalSettings = await GlobalPricingSettings.findById('global');
      const ktmBaseRate = globalSettings?.ktmBaseRate || 100;
      const weightSurchargePerKg = globalSettings?.weightSurchargePerKg || 50;

      const extraWeight = Math.max(0, Math.ceil(w - 1));
      const charge = ktmBaseRate + extraWeight * weightSurchargePerKg;

      return res.json({
        success: true,
        data: {
          charge,
          baseCharge: ktmBaseRate,
          perKgCharge: weightSurchargePerKg,
          weightLimit: 1,
          fromBranch: from.trim(),
          toBranch: to.trim(),
          weight: w,
          isLocal: true,
        },
      });
    }

    // 2. Check explicitly configured DeliveryChargeRule
    const rule = await DeliveryChargeRule.findOne({
      fromBranch: { $regex: new RegExp(`^${from.trim()}$`, 'i') },
      toBranch:   { $regex: new RegExp(`^${to.trim()}$`, 'i') },
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

    // 3. Fallback to OutsideValleyFee city pricing or global defaults if no specific route rule
    const searchCity = (city || to).trim().toUpperCase();
    const cityFee = await OutsideValleyFee.findOne({
      $or: [
        { city: searchCity },
        { city: { $regex: new RegExp(`^${searchCity.split(' ')[0]}`, 'i') } }
      ],
      isActive: true
    });

    const globalSettings = await GlobalPricingSettings.findById('global');
    const baseCharge = cityFee ? cityFee.fee : 200;
    const perKgCharge = globalSettings?.weightSurchargePerKg || 50;
    const extraWeight = Math.max(0, Math.ceil(w - 1));
    const charge = baseCharge + extraWeight * perKgCharge;

    return res.json({
      success: true,
      data: {
        charge,
        baseCharge,
        perKgCharge,
        weightLimit: 1,
        fromBranch: from.trim(),
        toBranch: to.trim(),
        weight: w,
        cityMatched: cityFee ? cityFee.city : null,
      },
    });
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
