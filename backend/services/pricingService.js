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
  const vendor = _vendor || await User.findById(vendorId);
  if (!vendor || vendor.role !== 'vendor') {
    throw new Error('Vendor not found or invalid role');
  }

  const {
    customFlatRate,
    useGlobalPricing,
    defaultKtmRate,
    defaultOutsideRate,
    weightSurcharge: vendorWeightSurcharge
  } = vendor.vendorMeta;

  let baseFee = 0;
  const globalSettings = _globalSettings || await getGlobalSettings();
  
  // 1. Custom Flat Rate (Overrides everything)
  if (customFlatRate !== null && customFlatRate !== undefined) {
    return customFlatRate;
  }

  // 2. Out of Valley logic
  if (outOfValley) {
    if (!useGlobalPricing && defaultOutsideRate !== undefined) {
      baseFee = defaultOutsideRate;
    } else {
      if (city) {
        const cityFee = await OutsideValleyFee.findOne({ city: city.trim().toUpperCase(), isActive: true });
        if (cityFee) {
          baseFee = cityFee.fee;
        } else {
          // Fallback if city not found
          baseFee = defaultOutsideRate || 200;
        }
      } else {
        baseFee = defaultOutsideRate || 200;
      }
    }
  } 
  // 3. In Valley (KTM) logic
  else {
    if (!useGlobalPricing && defaultKtmRate !== undefined) {
      baseFee = defaultKtmRate;
    } else {
      baseFee = globalSettings.ktmBaseRate;
    }
  }

  // 4. Weight Surcharge (first 1 KG is free)
  const actualWeight = weight || 0;
  let extraWeight = actualWeight > 1 ? actualWeight - 1 : 0;
  // Round up to nearest kg for surcharge if you want, but for now exact math:
  extraWeight = Math.ceil(extraWeight);
  
  const surchargePerKg = useGlobalPricing ? globalSettings.weightSurchargePerKg : (vendorWeightSurcharge || 50);
  const surchargeTotal = extraWeight * surchargePerKg;

  return baseFee + surchargeTotal;
};

export const getPricingSummary = async () => {
  const globalSettings = await getGlobalSettings();
  const totalOvCities = await OutsideValleyFee.countDocuments({ isActive: true });
  
  const vendors = await User.find({ role: 'vendor', status: 'Active' });
  const totalVendors = vendors.length;
  
  let customPricingVendors = 0;
  vendors.forEach(v => {
    if (!v.vendorMeta.useGlobalPricing || v.vendorMeta.customFlatRate !== null) {
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
