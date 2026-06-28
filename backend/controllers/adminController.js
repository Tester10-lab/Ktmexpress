import mongoose from 'mongoose';
import User from '../models/User.js';
import Package from '../models/Package.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import PickupRequest from '../models/PickupRequest.js';
import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcryptjs';
import { uniqueTrackingCode, generateInvoiceId } from '../utils/helpers.js';
import { generateLabelUrls } from '../services/labelService.js';
import { calculateDeliveryFee } from '../services/pricingService.js';

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pkgStatsAgg] = await Package.aggregate([
      { $match: { deletedAt: null } },
      {
        $facet: {
          total: [{ $count: "count" }],
          delivered: [{ $match: { status: 'Delivered' } }, { $count: "count" }],
          pending: [{ $match: { status: { $in: ['Pending', 'Pick Up Requested', 'Picked Up', 'In Warehouse', 'Out for Delivery'] } } }, { $count: "count" }],
          cancelled: [{ $match: { status: 'Cancelled' } }, { $count: "count" }],
          returned: [{ $match: { status: { $in: ['Returned', 'Returned to Vendor'] } } }, { $count: "count" }],
          todayPackages: [{ $match: { createdAt: { $gte: today } } }, { $count: "count" }],
          todayDeliveries: [{ $match: { status: 'Delivered', updatedAt: { $gte: today } } }, { $count: "count" }],
        }
      }
    ]);

    const stats = {
      total: pkgStatsAgg.total[0]?.count || 0,
      delivered: pkgStatsAgg.delivered[0]?.count || 0,
      pending: pkgStatsAgg.pending[0]?.count || 0,
      cancelled: pkgStatsAgg.cancelled[0]?.count || 0,
      returned: pkgStatsAgg.returned[0]?.count || 0,
      todayPackages: pkgStatsAgg.todayPackages[0]?.count || 0,
      todayDeliveries: pkgStatsAgg.todayDeliveries[0]?.count || 0,
    };

    const activeVendors = await User.countDocuments({ role: 'vendor', status: 'Active' });
    const activeRiders = await User.countDocuments({ role: 'rider', status: 'Active' });

    // Today's pending expenses
    const todayExpenses = await Expense.countDocuments({ status: 'Pending', date: { $gte: today } });

    // Revenue from delivered packages
    const revenueAgg = await Package.aggregate([
      { $match: { status: 'Delivered', deletedAt: null } },
      { $group: { _id: null, totalRevenue: { $sum: { $ifNull: ['$amount', 0] } }, totalCharges: { $sum: { $ifNull: ['$deliveryCharge', 0] } } } },
    ]);

    const revenue = revenueAgg[0] || { totalRevenue: 0, totalCharges: 0 };

    res.json({
      success: true,
      data: {
        totalPackages: stats.total,
        delivered: stats.delivered,
        pending: stats.pending,
        cancelled: stats.cancelled,
        returned: stats.returned,
        todayPackages: stats.todayPackages,
        todayDeliveries: stats.todayDeliveries,
        todayExpenses,
        activeVendors,
        activeRiders,
        totalRevenue: revenue.totalRevenue,
        totalDeliveryCharges: revenue.totalCharges,
        profit: revenue.totalCharges,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/analytics
export const getFinancialAnalytics = async (req, res) => {
  try {
    const { vendor, startDate, endDate } = req.query;

    const matchFilter = { status: 'Delivered', deletedAt: null };
    if (vendor && vendor !== 'all') {
      matchFilter.vendorId = new mongoose.Types.ObjectId(vendor);
    }

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      // To include the entire end day, we can set the time to 23:59:59 if we wanted to,
      // or assume the client passes an inclusive date. We'll set the time to end of day if endDate is provided.
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.createdAt.$lte = end;
      }
    }

    const analytics = await Package.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$vendorId',
          grossRevenue: { $sum: { $ifNull: ['$amount', 0] } },
          deliveryCosts: { $sum: { $ifNull: ['$deliveryCharge', 0] } },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorInfo',
        },
      },
    ]);

    res.json({ success: true, data: analytics, startDate, endDate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/pricing
export const updatePricing = async (req, res) => {
  try {
    const { vendorId, defaultKtmRate, defaultOutsideRate, weightSurcharge } = req.body;

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    vendor.vendorMeta.defaultKtmRate = defaultKtmRate ?? vendor.vendorMeta.defaultKtmRate;
    vendor.vendorMeta.defaultOutsideRate = defaultOutsideRate ?? vendor.vendorMeta.defaultOutsideRate;
    vendor.vendorMeta.weightSurcharge = weightSurcharge ?? vendor.vendorMeta.weightSurcharge;
    await vendor.save({ validateModifiedOnly: true });

    res.json({ success: true, data: vendor.vendorMeta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ role: 1, name: 1 }).skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/users/:id/toggle-status
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
    await user.save({ validateModifiedOnly: true });

    res.json({ success: true, data: { id: user._id, status: user.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/users - Create a new user
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, contact, shopName } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      contact: contact || '',
      vendorMeta: role === 'vendor' ? { shopName: shopName || '' } : {},
      riderMeta: role === 'rider' ? { monthlyTarget: parseInt(req.body.monthlyTarget) || 0 } : {},
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact,
        status: user.status,
        vendorMeta: user.vendorMeta,
        riderMeta: user.riderMeta,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts.' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/users/:id - Update user details
export const updateUser = async (req, res) => {
  try {
    const { name, contact, status, vendorMeta, riderMeta } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (name) user.name = name;
    if (contact !== undefined) user.contact = contact;
    if (status) user.status = status;
    if (vendorMeta && user.role === 'vendor') {
      user.vendorMeta = { ...user.vendorMeta, ...vendorMeta };
    }
    if (riderMeta && user.role === 'rider') {
      user.riderMeta = { ...user.riderMeta, ...riderMeta };
    }

    await user.save({ validateModifiedOnly: true });
    res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role, contact: user.contact, status: user.status, vendorMeta: user.vendorMeta, riderMeta: user.riderMeta } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/packages - Full package overview for admin
export const getAllPackagesAdmin = async (req, res) => {
  try {
    const { status, vendor, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (vendor) filter.vendorId = vendor;
    if (search) filter.$or = [
      { trackingCode: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [packages, total] = await Promise.all([
      Package.find(filter).populate('vendorId','name').populate('riderId','name').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Package.countDocuments(filter),
    ]);

    res.json({ success: true, data: packages, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/packages/:id - Update package details
export const updatePackageAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, customerPhone, address, city, amount, weight, deliveryDate } = req.body;

    const pkg = await Package.findById(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const updates = [];
    if (customerName && customerName !== pkg.customerName) { updates.push('Customer Name'); pkg.customerName = customerName; }
    if (customerPhone && customerPhone !== pkg.customerPhone) { updates.push('Customer Phone'); pkg.customerPhone = customerPhone; }
    if (address && address !== pkg.address) { updates.push('Address'); pkg.address = address; }
    if (city && city !== pkg.city) { updates.push('City'); pkg.city = city; }
    if (amount !== undefined && amount !== pkg.amount) { updates.push('Amount'); pkg.amount = amount; }
    if (weight !== undefined && weight !== pkg.weight) { updates.push('Weight'); pkg.weight = weight; }
    if (deliveryDate !== undefined) { updates.push('Delivery Date'); pkg.deliveryDate = deliveryDate ? new Date(deliveryDate) : null; }

    if (updates.length > 0) {
      pkg.timeline.push({
        time: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: pkg.status,
        message: `Admin updated details: ${updates.join(', ')}`,
        user: req.user.name,
      });
      await pkg.save();
    }

    res.json({ success: true, data: pkg, message: 'Package updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/packages/:id - Soft-delete a package
export const deletePackageAdmin = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    pkg.deletedAt = new Date();
    pkg.timeline.push({
      time: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: pkg.status,
      message: 'Package deleted by admin',
      user: req.user.name,
    });
    await pkg.save();

    res.json({ success: true, message: 'Package deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/packages - Create a package on behalf of a vendor
export const createPackageForVendor = async (req, res) => {
  try {
    const { vendorId, invoiceId, customerName, customerPhone, address, outOfValley, city, weight, items, amount, deliveryCharge, deliveryDate, packageAccess } = req.body;

    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required.' });
    }
    if (!customerName || !customerPhone || !address || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Customer name, phone, address, and amount are required.' });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const trackingCode = await uniqueTrackingCode();
    const labelUrls = generateLabelUrls(trackingCode);

    let finalDeliveryCharge = Number(deliveryCharge);
    if (!finalDeliveryCharge) {
      try {
        finalDeliveryCharge = await calculateDeliveryFee({
          vendorId,
          outOfValley: !!outOfValley,
          city: city || '',
          weight: weight || 0.5
        });
      } catch (e) {
        finalDeliveryCharge = 0;
      }
    }

    const pkg = await Package.create({
      trackingCode,
      invoiceId: invoiceId || generateInvoiceId(),
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
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      vendorId,
      ...labelUrls,
      status: 'Pending',
      timeline: [{
        time: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Invoice Created',
        message: `Admin created order on behalf of vendor ${vendor.name}`,
        user: req.user.name,
      }]
    });

    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/packages/bulk - Bulk create packages for a vendor
export const bulkCreatePackagesForVendor = async (req, res) => {
  try {
    const { vendorId, packages } = req.body;

    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required.' });
    }
    if (!Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid packages data.' });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const createdPackages = [];
    for (const p of packages) {
      const trackingCode = await uniqueTrackingCode();
      const labelUrls = generateLabelUrls(trackingCode);

      let finalDeliveryCharge = Number(p.deliveryCharge);
      if (!finalDeliveryCharge) {
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
      }

      const pkg = await Package.create({
        trackingCode,
        invoiceId: p.invoiceId || generateInvoiceId(),
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
        status: 'Pending',
        timeline: [{
          time: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'Invoice Created',
          message: `Admin bulk created on behalf of vendor ${vendor.name}`,
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

// POST /api/admin/packages/pickup-request - Request pickup for selected packages
export const requestPickupAdmin = async (req, res) => {
  try {
    const { packageIds } = req.body;

    if (!packageIds || !packageIds.length) {
      return res.status(400).json({
        success: false,
        message: 'No packages selected for pickup.',
      });
    }

    const results = [];

    for (const pkgId of packageIds) {
      const pkg = await Package.findOne({ _id: pkgId });
      if (!pkg || pkg.status !== 'Pending') continue;

      // Update package status
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      pkg.status = 'Pick Up Requested';
      pkg.timeline.push({
        time: now,
        status: 'Pick Up Requested',
        message: 'Admin requested courier pickup on behalf of vendor',
        user: req.user.name,
      });
      await pkg.save();

      // Create pickup request
      const pickup = await PickupRequest.create({
        packageId: pkg._id,
        vendorId: pkg.vendorId,
      });

      results.push({ packageId: pkg._id, trackingCode: pkg.trackingCode, pickupId: pickup._id, vendorId: pkg.vendorId });
    }

    if (results.length > 0 && req.io) {
      req.io.to('role_dispatcher').emit('notification', {
        title: 'New Pickup Request',
        message: `Admin requested pickup for ${results.length} package(s).`,
        type: 'pickup_request'
      });
    }

    res.status(201).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/packages/upload-csv - Upload CSV on behalf of a vendor
export const uploadCsvForVendor = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

  const vendorId = req.body.vendorId;
  if (!vendorId) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, message: 'Vendor ID is required.' });
  }

  const vendor = await User.findById(vendorId);
  if (!vendor || vendor.role !== 'vendor') {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(404).json({ success: false, message: 'Vendor not found.' });
  }

  const results = [];

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
            deliveryCharge: getVal(raw, ['deliveryCharge', 'delivery charge', 'shipping']),
          };

            const outOfValleyParsed = String(p.outOfValley).toLowerCase() === 'true' || p.outOfValley === '1' || String(p.outOfValley).toLowerCase() === 'yes';
            const weightParsed = Number(p.weight) || 0.5;

            let finalDeliveryCharge = Number(p.deliveryCharge);
            if (!finalDeliveryCharge) {
              try {
                finalDeliveryCharge = await calculateDeliveryFee({
                  vendorId,
                  outOfValley: outOfValleyParsed,
                  city: p.city || '',
                  weight: weightParsed
                });
              } catch (e) {
                finalDeliveryCharge = 0;
              }
            }

            packageDocs.push({
              trackingCode,
              invoiceId: p.invoiceId || generateInvoiceId(),
              customerName: p.customerName || 'Unknown Customer',
              customerPhone: p.customerPhone || '0000000000',
              address: p.address || 'Unknown Address',
              outOfValley: outOfValleyParsed,
              city: p.city || '',
              weight: weightParsed,
              items: [],
              amount: Number(p.amount) || 0,
              deliveryCharge: finalDeliveryCharge,
            vendorId,
            ...labelUrls,
            status: 'Pending',
            timeline: [{
              time: new Date().toISOString().replace('T', ' ').substring(0, 16),
              status: 'Invoice Created',
              message: `Admin uploaded CSV on behalf of vendor ${vendor.name}`,
              user: req.user.name,
            }]
          });
        }
        const createdPackages = await Package.insertMany(packageDocs);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(201).json({ success: true, data: createdPackages, message: `Successfully imported ${createdPackages.length} packages for ${vendor.name}.` });
      } catch (err) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        const isValidation = err.name === 'ValidationError';
        res.status(isValidation ? 400 : 500).json({ success: false, message: isValidation ? err.message : 'Server error during upload' });
      }
    });
};

// POST /api/admin/reconcile/:riderId - Mark COD collected from rider
export const reconcileRiderCOD = async (req, res) => {
  try {
    const { riderId } = req.params;
    const result = await Package.updateMany(
      { riderId, status: 'Delivered', cashReconciled: false },
      { $set: { cashReconciled: true } }
    );
    res.json({ success: true, data: { modifiedCount: result.modifiedCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/expenses
export const getAllExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, riderId, category, status } = req.query;
    const filter = {};
    if (riderId) filter.riderId = riderId;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [expenses, total] = await Promise.all([
      Expense.find(filter).populate('riderId', 'name contact').sort({ date: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Expense.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/expenses/:id/status
export const updateExpenseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    
    expense.status = status;
    await expense.save();
    
    res.json({ success: true, data: expense, message: `Expense marked as ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/settlements
export const getSettlements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [settlements, total] = await Promise.all([
      Settlement.find().populate('vendorId', 'name vendorMeta').populate('packageIds').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Settlement.countDocuments()
    ]);

    res.json({
      success: true,
      data: settlements,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/settlements/:id
export const updateSettlement = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const settlement = await Settlement.findById(req.params.id);
    
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found.' });
    }

    settlement.status = status || settlement.status;
    settlement.adminNotes = adminNotes || settlement.adminNotes;
    await settlement.save();

    // If approved, update associated packages to vendorPaid = true and release lock
    if (settlement.status === 'Approved') {
      await Package.updateMany(
        { _id: { $in: settlement.packageIds } },
        { $set: { vendorPaid: true, isSettling: false } }
      );
    } else if (settlement.status === 'Rejected') {
      // If rejected, unlock the packages so they can be requestable in another settlement
      await Package.updateMany(
        { _id: { $in: settlement.packageIds } },
        { $set: { isSettling: false } }
      );
    }

    res.json({ success: true, data: settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

