import Package from '../models/Package.js';
import PickupRequest from '../models/PickupRequest.js';
import Product from '../models/Product.js';
import Settlement from '../models/Settlement.js';
import Comment from '../models/Comment.js';
import ReturnRequest from '../models/ReturnRequest.js';
import fs from 'fs';
import csv from 'csv-parser';
import * as xlsx from 'xlsx';
import { generateLabelUrls } from '../services/labelService.js';

import { uniqueTrackingCode, generateInvoiceId } from '../utils/helpers.js';

// GET /api/vendor/dashboard
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [aggResult] = await Package.aggregate([
      { $match: { vendorId } },
      {
        $facet: {
          total: [{ $count: "count" }],
          delivered: [{ $match: { status: 'Delivered' } }, { $count: "count" }],
          pending: [{ $match: { status: { $in: ['Pending', 'Pick Up Requested', 'Picked Up', 'In Warehouse', 'Out for Delivery'] } } }, { $count: "count" }],
          returned: [{ $match: { status: { $in: ['Returned', 'Returned to Vendor'] } } }, { $count: "count" }],
          todayPkgs: [{ $match: { createdAt: { $gte: today } } }, { $count: "count" }],
        }
      }
    ]);

    const stats = {
      total: aggResult.total[0]?.count || 0,
      delivered: aggResult.delivered[0]?.count || 0,
      pending: aggResult.pending[0]?.count || 0,
      returned: aggResult.returned[0]?.count || 0,
      todayPkgs: aggResult.todayPkgs[0]?.count || 0,
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
      filter.status = status;
    }
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (search) {
      filter.$or = [
        { trackingCode: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { invoiceId: { $regex: search, $options: 'i' } },
      ];
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

// GET /api/vendor/packages/:id
export const getPackageDetails = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const pkg = await Package.findOne({ _id: req.params.id, vendorId })
      .populate('riderId', 'name contact')
      .lean();
      
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    const comments = await Comment.find({ packageId: pkg._id }).sort({ createdAt: -1 }).lean();
    
    res.json({ success: true, data: { ...pkg, commentList: comments } });
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
      deliveryCharge: deliveryCharge || 0,
      vendorId,
      ...labelUrls,
      status: 'Pending',
      timeline: [{
        time: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Invoice Created',
        message: 'Vendor created package invoice',
        user: req.user.name,
      }]
    });

    if (req.io) {
      req.io.to('role_admin').emit('notification', {
        title: 'New Order Created',
        message: `Vendor ${req.user.name} created order ${pkg.trackingCode}`,
        type: 'new_order'
      });
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
    const errors = [];
    
    // In a real prod scenario, use insertMany for speed, but we must generate tracking codes uniquely first.
    // To do it safely with bulk operations, pre-generate all tracking codes.
    const packageDocs = [];
    for (const p of packages) {
      try {
        const trackingCode = await uniqueTrackingCode();
        const labelUrls = generateLabelUrls(trackingCode);
        packageDocs.push({
          trackingCode,
          invoiceId: p.invoiceId || `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          customerName: p.customerName,
          customerPhone: String(p.customerPhone),
          address: p.address,
          outOfValley: !!p.outOfValley,
          city: p.city || '',
          weight: Number(p.weight) || 0.5,
          items: p.items || [],
          amount: Number(p.amount) || 0,
          deliveryCharge: Number(p.deliveryCharge) || 0,
          vendorId,
          ...labelUrls,
          status: 'Pending',
          timeline: [{
            time: new Date().toISOString().replace('T', ' ').substring(0, 16),
            status: 'Invoice Created',
            message: `Vendor bulk created package`,
            user: req.user.name,
          }]
        });
      } catch (err) {
        errors.push({ invoiceId: p.invoiceId, error: err.message });
      }
    }
    
    if (packageDocs.length > 0) {
      const inserted = await Package.insertMany(packageDocs);
      createdPackages.push(...inserted);
    }
    
    if (req.io && createdPackages.length > 0) {
      req.io.to('role_admin').emit('notification', {
        title: 'Bulk Orders Created',
        message: `Vendor ${req.user.name} created ${createdPackages.length} orders`,
        type: 'new_order'
      });
    }
    
    res.status(201).json({ success: true, data: createdPackages, errors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/vendor/packages/:id/return (Legacy route)
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

// POST /api/vendor/returns
export const createReturnRequest = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { packageId, reason, notes } = req.body;
    
    const pkg = await Package.findOne({ _id: packageId, vendorId });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    const existingReturn = await ReturnRequest.findOne({ packageId });
    if (existingReturn) return res.status(400).json({ success: false, message: 'Return request already exists for this package' });

    const returnReq = await ReturnRequest.create({
      packageId,
      vendorId,
      reason,
      notes
    });

    res.status(201).json({ success: true, data: returnReq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vendor/returns
export const getReturnRequests = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({ vendorId: req.user._id })
      .populate('packageId', 'trackingCode customerName amount status')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: returns });
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

    const comment = await Comment.create({
      packageId: pkg._id,
      userId: vendorId,
      userName: req.user.name,
      userRole: req.user.role,
      text
    });
    
    res.json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vendor/finance
export const getFinance = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const deliveredPkgs = await Package.find({ vendorId, status: 'Delivered', cashReconciled: false }).lean();
    
    const pendingCOD = deliveredPkgs.reduce((sum, pkg) => sum + pkg.amount, 0);
    const pendingDeliveryCharges = deliveredPkgs.reduce((sum, pkg) => sum + pkg.deliveryCharge, 0);
    const totalPayable = pendingCOD - pendingDeliveryCharges;

    const settlements = await Settlement.find({ vendorId }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: {
        pendingPackagesCount: deliveredPkgs.length,
        pendingCOD,
        pendingDeliveryCharges,
        totalPayable,
        settlements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendor/settlements
export const requestSettlement = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const deliveredPkgs = await Package.find({ vendorId, status: 'Delivered', cashReconciled: false });
    
    if (deliveredPkgs.length === 0) {
      return res.status(400).json({ success: false, message: 'No unreconciled delivered packages found.' });
    }

    const pendingCOD = deliveredPkgs.reduce((sum, pkg) => sum + pkg.amount, 0);
    const pendingDeliveryCharges = deliveredPkgs.reduce((sum, pkg) => sum + pkg.deliveryCharge, 0);
    const totalPayable = pendingCOD - pendingDeliveryCharges;

    const settlement = await Settlement.create({
      vendorId,
      requestedAmount: totalPayable,
      totalOrders: deliveredPkgs.length,
      totalCOD: pendingCOD,
      totalFees: pendingDeliveryCharges,
      netAmount: totalPayable,
      packageIds: deliveredPkgs.map(p => p._id)
    });

    res.status(201).json({ success: true, data: settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vendor/products
export const getProducts = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const products = await Product.find({ vendorId }).lean();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendor/products
export const createProduct = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const product = await Product.create({ ...req.body, vendorId });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/vendor/products/:id
export const updateProduct = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const product = await Product.findOneAndUpdate({ _id: req.params.id, vendorId }, req.body, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendor/packages/upload-csv (Parses and returns validation preview)
export const uploadCsvPreview = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const results = [];

  // Helper to safely get value from object with various possible header names (case-insensitive)
  const getVal = (row, keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== '') return row[k];
      const lowerRow = Object.keys(row).reduce((acc, key) => {
        acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[key];
        return acc;
      }, {});
      const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lowerRow[lowerK] !== undefined && lowerRow[lowerK] !== '') return lowerRow[lowerK];
    }
    return undefined;
  };

  try {
    // Read file (XLSX or CSV)
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const validatedData = [];

    jsonData.forEach((raw, idx) => {
      // Find mappings
      const customerName = getVal(raw, ['customerName', 'customer name', 'name', 'recipient']);
      const customerPhone = getVal(raw, ['customerPhone', 'customer phone', 'phone', 'contact']);
      const address = getVal(raw, ['address', 'delivery address', 'location']);
      const city = getVal(raw, ['city', 'area', 'district']);
      const amount = getVal(raw, ['amount', 'cod', 'price']);
      
      const errors = [];
      if (!customerName) errors.push('Missing Name');
      if (!customerPhone) errors.push('Missing Phone');
      if (!address) errors.push('Missing Address');
      if (amount === undefined || isNaN(Number(amount))) errors.push('Invalid COD Amount');

      validatedData.push({
        row: idx + 2, // Excel rows are 1-indexed, +1 for header
        data: {
          invoiceId: getVal(raw, ['invoiceId', 'invoice', 'reference']) || '',
          customerName: customerName || '',
          customerPhone: customerPhone || '',
          address: address || '',
          outOfValley: getVal(raw, ['outOfValley', 'out of valley', 'outside valley']) || false,
          city: city || '',
          weight: getVal(raw, ['weight', 'kg']) || 0.5,
          amount: amount || 0,
          deliveryCharge: getVal(raw, ['deliveryCharge', 'delivery charge', 'shipping']) || 0,
        },
        errors,
        isValid: errors.length === 0
      });
    });

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Cleanup
    res.status(200).json({ success: true, data: validatedData });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Cleanup
    res.status(500).json({ success: false, message: 'Failed to process file: ' + err.message });
  }
};
