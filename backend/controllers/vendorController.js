import mongoose from 'mongoose';
import Package from '../models/Package.js';
import PickupRequest from '../models/PickupRequest.js';
import Settlement from '../models/Settlement.js';
import Product from '../models/Product.js';
import fs from 'fs';
import csv from 'csv-parser';
import { generateLabelUrls } from '../services/labelService.js';
import { calculateDeliveryFee } from '../services/pricingService.js';
import { logger } from '../config/logger.js';

import { uniqueTrackingCode, generateInvoiceId } from '../utils/helpers.js';
import { processCsvImport } from '../utils/csvHelper.js';

// GET /api/vendor/dashboard
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [aggResult] = await Package.aggregate([
      { $match: { vendorId, deletedAt: null } },
      {
        $facet: {
          total: [{ $count: "count" }],
          delivered: [{ $match: { status: 'Delivered' } }, { $count: "count" }],
          pending: [{ $match: { status: { $in: ['Pending', 'Pick Up Requested', 'Picked Up', 'In Warehouse', 'Out for Delivery'] } } }, { $count: "count" }],
          returned: [{ $match: { status: { $in: ['Returned', 'Returned to Vendor'] } } }, { $count: "count" }],
          todayPkgs: [{ $match: { createdAt: { $gte: today } } }, { $count: "count" }],
          // Settlement KPIs
          todaySales: [
            { $match: { status: 'Delivered', updatedAt: { $gte: today } } },
            { $group: { _id: null, amount: { $sum: '$amount' } } }
          ],
          todayCOD: [
            { $match: { status: 'Delivered', updatedAt: { $gte: today } } },
            { $group: { _id: null, amount: { $sum: '$amount' } } }
          ],
          totalDeliveryCharges: [
            { $match: { status: 'Delivered' } },
            { $group: { _id: null, amount: { $sum: '$deliveryCharge' } } }
          ],
          totalReceivable: [
            { $match: { status: 'Delivered' } },
            { $group: { _id: null, amount: { $sum: '$vendorReceivable' } } }
          ],
          totalPaid: [
            { $match: { status: 'Delivered', vendorPaid: true } },
            { $group: { _id: null, amount: { $sum: '$vendorReceivable' } } }
          ],
          totalPending: [
            { $match: { status: 'Delivered', vendorPaid: { $ne: true } } },
            { $group: { _id: null, amount: { $sum: '$vendorReceivable' } } }
          ],
        }
      }
    ]);

    const c = (arr) => arr[0]?.count || 0;
    const g = (arr) => arr[0]?.amount || 0;

    const stats = {
      total: c(aggResult.total),
      delivered: c(aggResult.delivered),
      pending: c(aggResult.pending),
      returned: c(aggResult.returned),
      todayPkgs: c(aggResult.todayPkgs),
      // Settlement KPIs
      todaySales: g(aggResult.todaySales),
      todayCOD: g(aggResult.todayCOD),
      deliveryCharges: g(aggResult.totalDeliveryCharges),
      amountReceivable: g(aggResult.totalReceivable),
      paid: g(aggResult.totalPaid),
      pendingSettlement: g(aggResult.totalPending),
    };

    const pickupRequests = await PickupRequest.countDocuments({ vendorId, status: 'pending' });

    res.json({
      success: true,
      data: { ...stats, pickupRequests },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vendor/packages
export const getVendorPackages = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { status, search, page = 1, limit = 20, startDate, endDate } = req.query;

    const filter = { vendorId };
    if (status && status !== 'all') {
      if (status === 'pickups') {
        filter.status = { $in: ['Pending', 'Pick Up Requested', 'Picked Up'] };
      } else if (status === 'deliveries') {
        filter.status = { $in: ['In Warehouse', 'Out for Delivery', 'Delivered', 'Returned to Vendor', 'Returned', 'Cancelled', 'Postponed'] };
      } else if (status === 'history') {
        filter.status = { $in: ['Delivered', 'Cancelled', 'Returned to Vendor', 'Returned'] };
      } else {
        filter.status = status;
      }
    }
    if (search) {
      filter.$or = [
        { trackingCode: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { invoiceId: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) { filter.createdAt.$gte = new Date(`${startDate}T00:00:00+05:45`); }
      if (endDate) { filter.createdAt.$lte = new Date(`${endDate}T23:59:59+05:45`); }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [packages, total] = await Promise.all([
      Package.find(filter)
        .populate('riderId', 'name contact')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Package.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: packages,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendor/pickup-request
export const createPickupRequest = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { packageIds } = req.body;

    if (!packageIds || !packageIds.length) {
      return res.status(400).json({
        success: false,
        message: 'No packages selected for pickup.',
      });
    }

    const results = [];

    for (const pkgId of packageIds) {
      const pkg = await Package.findOne({ _id: pkgId, vendorId });
      if (!pkg || pkg.status !== 'Pending') continue;

      // Update package status
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      pkg.status = 'Pick Up Requested';
      pkg.timeline.push({
        time: now,
        status: 'Pick Up Requested',
        message: 'Vendor requested courier pickup',
        user: req.user.name,
      });
      await pkg.save();

      // Create pickup request
      const pickup = await PickupRequest.create({
        packageId: pkg._id,
        vendorId,
      });

      results.push({ packageId: pkg._id, trackingCode: pkg.trackingCode, pickupId: pickup._id });
    }

    if (results.length > 0 && req.io) {
      req.io.to('role_dispatcher').to('role_admin').emit('notification', {
        title: 'New Pickup Request',
        message: `Vendor ${req.user.name} requested pickup for ${results.length} package(s).`,
        type: 'pickup_request'
      });
    }

    res.status(201).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendor/packages
export const createPackage = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { invoiceId, customerName, customerPhone, address, outOfValley, city, weight, items, amount, deliveryCharge, deliveryDate, packageAccess } = req.body;

    if (!customerName || !customerPhone || !address || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Customer name, phone, address, and amount are required.' });
    }

    let finalDeliveryCharge;
    try {
      finalDeliveryCharge = await calculateDeliveryFee({
        vendorId,
        outOfValley: !!outOfValley,
        city: city || '',
        weight: weight || 0.5
      });
    } catch (e) {
      logger.error('Pricing calculation failed', e);
      finalDeliveryCharge = 0;
    }

    const trackingCode = await uniqueTrackingCode();
    const labelUrls = generateLabelUrls(trackingCode);

    const pkg = await Package.create({
      trackingCode,
      invoiceId: invoiceId || `INV-${Date.now()}`,
      customerName,
      customerPhone,
      address,
      outOfValley: !!outOfValley,
      city: city || '',
      weight: weight || 0.5,
      packageAccess: packageAccess || 'sealed',
      items: items || [],
      amount: Number(amount),
      deliveryCharge: finalDeliveryCharge,
      vendorReceivable: Math.max(0, Number(amount) - finalDeliveryCharge),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      vendorId,
      ...labelUrls,
      status: 'In Warehouse',
      timeline: [{
        time: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'In Warehouse',
        message: 'Package arrived at warehouse.',
        user: req.user.name,
      }]
    });

    if (req.io) {
      req.io.to('role_admin').emit('notification', {
        title: 'New Order Created',
        message: `Vendor ${req.user.name} created order ${pkg.trackingCode}`,
        type: 'new_order'
      });
      req.io.to('role_admin').emit('package:created', pkg);
      req.io.to('role_dispatcher').emit('package:created', pkg);
    }

    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/vendor/packages/:id
export const updatePackage = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { amount, address, comments, deliveryDate, outOfValley, city, items } = req.body;
    
    const pkg = await Package.findOne({ _id: req.params.id, vendorId });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    if (pkg.status !== 'Pending') return res.status(400).json({ success: false, message: 'Can only edit Pending packages' });

    if (amount !== undefined) pkg.amount = amount;
    if (address !== undefined) pkg.address = address;
    if (comments !== undefined) pkg.comments = comments;
    if (outOfValley !== undefined) pkg.outOfValley = outOfValley;
    if (city !== undefined) pkg.city = city;
    if (items !== undefined) pkg.items = items;

    await pkg.save();
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendor/packages/bulk
export const bulkCreatePackages = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { packages } = req.body;
    
    if (!Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid packages data' });
    }

    const createdPackages = [];
    for (const p of packages) {
      const trackingCode = await uniqueTrackingCode();
      const labelUrls = generateLabelUrls(trackingCode);
      
      let finalDeliveryCharge;
      try {
        finalDeliveryCharge = await calculateDeliveryFee({
          vendorId,
          outOfValley: !!p.outOfValley,
          city: p.city || '',
          weight: Number(p.weight) || 0.5
        });
      } catch (e) {
        finalDeliveryCharge = 0;
      }

      const pkg = await Package.create({
        trackingCode,
        invoiceId: p.invoiceId || `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        address: p.address,
        outOfValley: !!p.outOfValley,
        city: p.city || '',
        weight: Number(p.weight) || 0.5,
        items: p.items || [],
        amount: Number(p.amount) || 0,
        deliveryCharge: finalDeliveryCharge,
        deliveryDate: p.deliveryDate ? new Date(p.deliveryDate) : null,
        vendorId,
        ...labelUrls,
        status: 'In Warehouse',
        timeline: [{
          time: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'In Warehouse',
          message: 'Package arrived at warehouse.',
          user: req.user.name,
        }]
      });
      createdPackages.push(pkg);
    }
    if (req.io) {
      createdPackages.forEach(pkg => {
        req.io.to('role_admin').emit('package:created', pkg);
        req.io.to('role_dispatcher').emit('package:created', pkg);
      });
    }

    res.status(201).json({ success: true, data: createdPackages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/vendor/packages/:id/return
export const requestReturn = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const pkg = await Package.findOne({ _id: req.params.id, vendorId });
    
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    if (!['Pending', 'Cancelled', 'Returned'].includes(pkg.status)) {
      return res.status(400).json({ success: false, message: 'Cannot request return for this package status' });
    }

    pkg.status = 'Returned to Vendor';
    pkg.timeline.push({
      time: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Returned to Vendor',
      message: 'Vendor requested return of package',
      user: req.user.name,
    });
    
    await pkg.save();
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendor/packages/:id/comments
export const addComment = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { text } = req.body;
    
    const pkg = await Package.findOne({ _id: req.params.id, vendorId });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    pkg.comments = pkg.comments ? `${pkg.comments}\n[${req.user.name}]: ${text}` : `[${req.user.name}]: ${text}`;
    await pkg.save();
    
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vendor/finance
export const getFinance = async (req, res) => {
  try {
    const vendorId = req.user._id;
    // We only pay vendors for COD that has been collected by Admin (cashReconciled: true)
    // and hasn't been paid to the vendor yet (vendorPaid: false) and is not currently settling
    const deliveredPkgs = await Package.find({ vendorId, status: 'Delivered', cashReconciled: true, vendorPaid: false, isSettling: false }).lean();
    
    const pendingCOD = deliveredPkgs.reduce((sum, pkg) => sum + (pkg.amount || 0), 0);
    const pendingDeliveryCharges = deliveredPkgs.reduce((sum, pkg) => sum + (pkg.deliveryCharge || 0), 0);
    const totalPayable = pendingCOD - pendingDeliveryCharges;

    res.json({
      success: true,
      data: {
        pendingPackagesCount: deliveredPkgs.length,
        pendingCOD,
        pendingDeliveryCharges,
        totalPayable
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendor/settlements
export const requestSettlement = async (req, res) => {
  let packageIds = [];
  try {
    const vendorId = req.user._id;
    const deliveredPkgs = await Package.find({ vendorId, status: 'Delivered', cashReconciled: true, vendorPaid: false, isSettling: false });
    
    if (deliveredPkgs.length === 0) {
      return res.status(400).json({ success: false, message: 'No unreconciled delivered packages found.' });
    }

    packageIds = deliveredPkgs.map(p => p._id);
    
    // Acquire atomic lock on packages
    const lockResult = await Package.updateMany(
      { _id: { $in: packageIds }, isSettling: false },
      { $set: { isSettling: true } }
    );

    if (lockResult.modifiedCount !== packageIds.length) {
      // Rollback lock
      await Package.updateMany(
        { _id: { $in: packageIds } },
        { $set: { isSettling: false } }
      );
      return res.status(409).json({ success: false, message: 'A settlement request containing some of these packages is already in progress.' });
    }

    const pendingCOD = deliveredPkgs.reduce((sum, pkg) => sum + (pkg.amount || 0), 0);
    const pendingDeliveryCharges = deliveredPkgs.reduce((sum, pkg) => sum + (pkg.deliveryCharge || 0), 0);
    const totalPayable = pendingCOD - pendingDeliveryCharges;

    const settlement = await Settlement.create({
      vendorId,
      requestedAmount: totalPayable,
      packageIds
    });

    res.status(201).json({ success: true, data: settlement });
  } catch (error) {
    if (packageIds && packageIds.length > 0) {
      try {
        await Package.updateMany(
          { _id: { $in: packageIds } },
          { $set: { isSettling: false } }
        );
      } catch (rollbackError) {
        // Just log the rollback failure, don't crash
      }
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vendor/settlements
export const getSettlements = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const settlements = await Settlement.find({ vendorId }).sort({ createdAt: -1 }).lean();
    
    // Populate package details and add summary for each settlement
    const enhancedSettlements = await Promise.all(
      settlements.map(async (settlement) => {
        const packages = await Package.find({ _id: { $in: settlement.packageIds } }).lean();
        
        const summary = {
          totalPackages: packages.length,
          totalCOD: packages.reduce((sum, pkg) => sum + (pkg.amount || 0), 0),
          totalDeliveryCharges: packages.reduce((sum, pkg) => sum + (pkg.deliveryCharge || 0), 0),
          netPayable: settlement.requestedAmount
        };
        
        return {
          ...settlement,
          packages: packages.map(pkg => ({
            _id: pkg._id,
            trackingCode: pkg.trackingCode,
            customerName: pkg.customerName,
            address: pkg.address,
            amount: pkg.amount,
            deliveryCharge: pkg.deliveryCharge,
            status: pkg.status,
            settlementStatus: pkg.settlementStatus,
            deliveredAt: pkg.updatedAt
          })),
          summary
        };
      })
    );
    
    res.json({ success: true, data: enhancedSettlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// POST /api/vendor/packages/upload-csv
export const uploadCsv = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const vendorId = req.user._id;
  const creatorName = req.user.name || 'Vendor';

  try {
    const result = await processCsvImport(req.file.path, vendorId, creatorName);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    
    // Return the detailed partial success response
    res.status(201).json(result);
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const isValidation = err.name === 'ValidationError' || err.message.includes('Exceeded maximum');
    res.status(isValidation ? 400 : 500).json({ 
      success: false, 
      message: isValidation ? err.message : 'Server error during upload' 
    });
  }
};

// --- PRODUCT MANAGEMENT ---

// GET /api/vendor/products
export const getProducts = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const products = await Product.find({ vendorId }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendor/products
export const createProduct = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { barcode, name, category, price, threshold, stockReceived } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const product = await Product.create({
      vendorId,
      barcode: barcode || `BC-${Date.now().toString().slice(-6)}`,
      name,
      category: category || 'General',
      price: Number(price),
      threshold: Number(threshold) || 5,
      stockReceived: Number(stockReceived) || 0,
      stockSold: 0
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/vendor/products/:id
export const updateProduct = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { barcode, name, category, price, threshold } = req.body;

    const product = await Product.findOne({ _id: req.params.id, vendorId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (barcode) product.barcode = barcode;
    if (name) product.name = name;
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (threshold !== undefined) product.threshold = Number(threshold);

    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/vendor/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const product = await Product.findOneAndDelete({ _id: req.params.id, vendorId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/vendor/products/:id/stock
export const updateStock = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(Number(quantity))) {
      return res.status(400).json({ success: false, message: 'Quantity is required' });
    }

    const product = await Product.findOne({ _id: req.params.id, vendorId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Stock received adds to total available stock (Current stock = stockReceived - stockSold)
    product.stockReceived += Number(quantity);
    
    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

