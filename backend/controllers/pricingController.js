import GlobalPricingSettings from '../models/GlobalPricingSettings.js';
import OutsideValleyFee from '../models/OutsideValleyFee.js';
import User from '../models/User.js';
import { getGlobalSettings, getPricingSummary, calculateDeliveryFee } from '../services/pricingService.js';

// ---- GLOBAL SETTINGS ----

export const getGlobalPricingSettings = async (req, res) => {
  try {
    const settings = await getGlobalSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGlobalPricingSettings = async (req, res) => {
  try {
    const { ktmBaseRate, weightSurchargePerKg } = req.body;
    const settings = await GlobalPricingSettings.findByIdAndUpdate(
      'global',
      { ktmBaseRate, weightSurchargePerKg, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPricingDashboardSummary = async (req, res) => {
  try {
    const summary = await getPricingSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- OUTSIDE VALLEY FEES ----

export const getOutsideValleyFees = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) {
      filter.city = { $regex: search, $options: 'i' };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [fees, total] = await Promise.all([
      OutsideValleyFee.find(filter).sort({ city: 1 }).skip(skip).limit(parseInt(limit)),
      OutsideValleyFee.countDocuments(filter)
    ]);
    
    res.json({ 
      success: true, 
      data: fees,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOutsideValleyFee = async (req, res) => {
  try {
    const { city, fee, isActive } = req.body;
    
    // Check if exists
    const exists = await OutsideValleyFee.findOne({ city: city.trim().toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Fee for this city already exists' });
    }
    
    const newFee = await OutsideValleyFee.create({
      city: city.trim().toUpperCase(),
      fee,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });
    
    res.status(201).json({ success: true, data: newFee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOutsideValleyFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { city, fee, isActive } = req.body;
    
    const updateData = {};
    if (city !== undefined) updateData.city = city.trim().toUpperCase();
    if (fee !== undefined) updateData.fee = fee;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // If changing city name, check uniqueness
    if (updateData.city) {
      const exists = await OutsideValleyFee.findOne({ city: updateData.city, _id: { $ne: id } });
      if (exists) return res.status(400).json({ success: false, message: 'City name already exists' });
    }
    
    const updatedFee = await OutsideValleyFee.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedFee) return res.status(404).json({ success: false, message: 'Fee not found' });
    
    res.json({ success: true, data: updatedFee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOutsideValleyFee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OutsideValleyFee.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Fee not found' });
    
    res.json({ success: true, message: 'Fee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- VENDOR PRICING MATRIX ----

export const getVendorsPricing = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = { role: 'vendor' };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'vendorMeta.shopName': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [vendors, total] = await Promise.all([
      User.find(filter).select('name email vendorMeta status').sort({ 'vendorMeta.shopName': 1, name: 1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);
    
    res.json({ 
      success: true, 
      data: vendors,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVendorPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { customFlatRate, defaultKtmRate, defaultOutsideRate, useGlobalPricing } = req.body;
    
    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    
    if (customFlatRate !== undefined) vendor.vendorMeta.customFlatRate = customFlatRate;
    if (defaultKtmRate !== undefined) vendor.vendorMeta.defaultKtmRate = defaultKtmRate;
    if (defaultOutsideRate !== undefined) vendor.vendorMeta.defaultOutsideRate = defaultOutsideRate;
    if (useGlobalPricing !== undefined) vendor.vendorMeta.useGlobalPricing = useGlobalPricing;
    
    await vendor.save();
    
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- PREVIEW/CALCULATE ----

export const previewCalculateFee = async (req, res) => {
  try {
    const { vendorId, outOfValley, city, weight } = req.body;
    
    if (!vendorId) return res.status(400).json({ success: false, message: 'Vendor ID is required' });
    
    const fee = await calculateDeliveryFee({ vendorId, outOfValley, city, weight });
    res.json({ success: true, data: { fee } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
