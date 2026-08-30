import GlobalPricingSettings from '../models/GlobalPricingSettings.js';
import OutsideValleyFee from '../models/OutsideValleyFee.js';
import User from '../models/User.js';

export const getGlobalSettings = async () => {
  let settings = await GlobalPricingSettings.findById('global');
  if (!settings) {
    settings = await GlobalPricingSettings.create({ _id: 'global' });
  }
  return settings;
};

/**
 * Calculates delivery fee based on vendor configuration, global settings, and destination.
 * Rules:
 * 1. If customFlatRate is set, use it.
 * 2. If Out of Valley:
 *    a. If useGlobalPricing is false and vendor has defaultOutsideRate, use it.
 *    b. Else lookup specific city fee in OutsideValleyFee collection.
 *    c. If no city fee, use default global (which falls back to vendor defaultOutsideRate or 200).
 * 3. If In Valley:
 *    a. If useGlobalPricing is false and vendor has defaultKtmRate, use it.
 *    b. Else use global ktmBaseRate.
 * 4. Add weight surcharge for weight > 1kg.
 */
export const calculateDeliveryFee = async ({ vendorId, outOfValley, city, weight, _vendor, _globalSettings }) => {
  let vendor = _vendor;
  if (!vendor && vendorId) {
    try {
      vendor = await User.findById(vendorId);
    } catch (err) {
      vendor = null;
    }
  }

  const {
    customFlatRate,
    useGlobalPricing = true,
    defaultKtmRate,
    defaultOutsideRate,
    weightSurcharge: vendorWeightSurcharge
  } = vendor?.vendorMeta || {};

  let baseFee = 0;
  const globalSettings = _globalSettings || await getGlobalSettings();
  
  // 1. Custom Flat Rate (Overrides everything)
  if (customFlatRate !== null && customFlatRate !== undefined && !isNaN(Number(customFlatRate))) {
    return Number(customFlatRate);
  }

  // 2. Out of Valley logic
  if (outOfValley) {
    if (!useGlobalPricing && defaultOutsideRate !== undefined) {
      baseFee = Number(defaultOutsideRate);
    } else {
      if (city) {
        const rawSearch = String(city).trim();
        const cleanSearch = rawSearch.replace(/[\(\)]/g, ' ').trim();
        const tokens = cleanSearch.split(/\s+/).filter(t => t.length > 2);
        const regexPatterns = tokens.map(t => new RegExp(t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'));

        const cityFee = await OutsideValleyFee.findOne({
          $or: [
            { city: rawSearch.toUpperCase() },
            { city: { $regex: new RegExp(rawSearch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i') } },
            ...(regexPatterns.length > 0 ? [{ city: { $in: regexPatterns } }] : [])
          ],
          isActive: true
        });

        if (cityFee) {
          baseFee = Number(cityFee.fee);
        } else {
          baseFee = defaultOutsideRate ? Number(defaultOutsideRate) : 200;
        }
      } else {
        baseFee = defaultOutsideRate ? Number(defaultOutsideRate) : 200;
      }
    }
  } 
  // 3. In Valley (KTM) logic
  else {
    if (!useGlobalPricing && defaultKtmRate !== undefined) {
      baseFee = Number(defaultKtmRate);
    } else {
      baseFee = Number(globalSettings.ktmBaseRate || 100);
    }
  }

  // 4. Weight Surcharge (first 1 KG is free)
  const actualWeight = Number(weight) || 0;
  let extraWeight = actualWeight > 1 ? actualWeight - 1 : 0;
  extraWeight = Math.ceil(extraWeight);
  
  const surchargePerKg = useGlobalPricing ? Number(globalSettings.weightSurchargePerKg || 50) : Number(vendorWeightSurcharge || 50);
  const surchargeTotal = extraWeight * surchargePerKg;

  const calculatedTotal = (baseFee || (outOfValley ? 200 : 100)) + surchargeTotal;
  return calculatedTotal > 0 ? calculatedTotal : (outOfValley ? 200 : 100);
};

export const getPricingSummary = async () => {
  const globalSettings = await getGlobalSettings();
  const totalOvCities = await OutsideValleyFee.countDocuments({ isActive: true });
  
  const vendors = await User.find({ role: 'vendor', status: 'Active' });
  const totalVendors = vendors.length;
  
  let customPricingVendors = 0;
  vendors.forEach(v => {
    const meta = v.vendorMeta || {};
    if (meta.useGlobalPricing === false || (meta.customFlatRate !== null && meta.customFlatRate !== undefined)) {
      customPricingVendors++;
    }
  });

  return {
    globalSettings,
    totalOvCities,
    totalVendors,
    customPricingVendors
  };
};
