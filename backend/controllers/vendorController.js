import Package from '../models/Package.js';
import PickupRequest from '../models/PickupRequest.js';
import Settlement from '../models/Settlement.js';
import Product from '../models/Product.js';
import fs from 'fs';
import csv from 'csv-parser';
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
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
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
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
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
    for (const p of packages) {
      const trackingCode = await uniqueTrackingCode();
      const labelUrls = generateLabelUrls(trackingCode);
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
        deliveryCharge: Number(p.deliveryCharge) || 0,
        deliveryDate: p.deliveryDate ? new Date(p.deliveryDate) : null,
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
      createdPackages.push(pkg);
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
    const deliveredPkgs = await Package.find({ vendorId, status: 'Delivered', cashReconciled: false }).lean();
    
    const pendingCOD = deliveredPkgs.reduce((sum, pkg) => sum + pkg.amount, 0);
    const pendingDeliveryCharges = deliveredPkgs.reduce((sum, pkg) => sum + pkg.deliveryCharge, 0);
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
      packageIds: deliveredPkgs.map(p => p._id)
    });

    res.status(201).json({ success: true, data: settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vendor/settlements
export const getSettlements = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const settlements = await Settlement.find({ vendorId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// POST /api/vendor/packages/upload-csv
export const uploadCsv = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const results = [];
  const vendorId = req.user._id;

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

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const packageDocs = [];
        for (const raw of results) {
          const trackingCode = await uniqueTrackingCode();
          const labelUrls = generateLabelUrls(trackingCode);
          
          const p = {
            invoiceId: getVal(raw, ['invoiceId', 'invoice', 'reference']),
            customerName: getVal(raw, ['customerName', 'customer name', 'name']),
            customerPhone: getVal(raw, ['customerPhone', 'customer phone', 'phone', 'contact']),
            address: getVal(raw, ['address', 'delivery address', 'location']),
            outOfValley: getVal(raw, ['outOfValley', 'out of valley', 'outside valley']),
            city: getVal(raw, ['city', 'area', 'district']),
            weight: getVal(raw, ['weight', 'kg']),
            amount: getVal(raw, ['amount', 'cod', 'price']),
            deliveryCharge: getVal(raw, ['deliveryCharge', 'delivery charge', 'shipping'])
          };

          packageDocs.push({
            trackingCode,
            invoiceId: p.invoiceId || generateInvoiceId(),
            customerName: p.customerName || 'Unknown Customer',
            customerPhone: p.customerPhone || '0000000000',
            address: p.address || 'Unknown Address',
            outOfValley: String(p.outOfValley).toLowerCase() === 'true' || p.outOfValley === '1' || String(p.outOfValley).toLowerCase() === 'yes',
            city: p.city || '',
            weight: Number(p.weight) || 0.5,
            items: [], // Simplified for bulk upload CSV
            amount: Number(p.amount) || 0,
            deliveryCharge: Number(p.deliveryCharge) || 0,
            vendorId,
            ...labelUrls,
            status: 'Pending',
            timeline: [{
              time: new Date().toISOString().replace('T', ' ').substring(0, 16),
              status: 'Invoice Created',
              message: 'Vendor created package via CSV upload',
              user: req.user.name || 'Vendor',
            }]
          });
        }
        const createdPackages = await Package.insertMany(packageDocs);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Cleanup
        res.status(201).json({ success: true, data: createdPackages, message: `Successfully imported ${createdPackages.length} packages` });
      } catch (err) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Cleanup
        const isValidation = err.name === 'ValidationError';
        res.status(isValidation ? 400 : 500).json({ success: false, message: isValidation ? err.message : 'Server error during upload' });
      }
    });
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

