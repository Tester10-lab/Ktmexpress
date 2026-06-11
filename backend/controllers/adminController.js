import User from '../models/User.js';
import Package from '../models/Package.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const [total, delivered, pending, cancelled, returned] = await Promise.all([
      Package.countDocuments(),
      Package.countDocuments({ status: 'Delivered' }),
      Package.countDocuments({ status: { $in: ['Pending', 'Pick Up Requested', 'Picked Up', 'In Warehouse', 'Out for Delivery'] } }),
      Package.countDocuments({ status: 'Cancelled' }),
      Package.countDocuments({ status: { $in: ['Returned', 'Returned to Vendor'] } }),
    ]);

    const activeVendors = await User.countDocuments({ role: 'vendor', status: 'Active' });
    const activeRiders = await User.countDocuments({ role: 'rider', status: 'Active' });

    // Revenue from delivered packages
    const revenueAgg = await Package.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalCharges: { $sum: '$deliveryCharge' } } },
    ]);

    const revenue = revenueAgg[0] || { totalRevenue: 0, totalCharges: 0 };

    res.json({
      success: true,
      data: {
        totalPackages: total,
        delivered,
        pending,
        cancelled,
        returned,
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
    const { vendor, timeframe } = req.query;

    const matchFilter = { status: 'Delivered' };
    if (vendor && vendor !== 'all') {
      matchFilter.vendorId = vendor;
    }

    const analytics = await Package.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$vendorId',
          grossRevenue: { $sum: '$amount' },
          deliveryCosts: { $sum: '$deliveryCharge' },
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

    res.json({ success: true, data: analytics, timeframe: timeframe || 'weekly' });
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
    const users = await User.find().select('-password').sort({ role: 1, name: 1 });
    res.json({ success: true, data: users });
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
    const { name, contact, status, vendorMeta } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (name) user.name = name;
    if (contact !== undefined) user.contact = contact;
    if (status) user.status = status;
    if (vendorMeta && user.role === 'vendor') {
      user.vendorMeta = { ...user.vendorMeta, ...vendorMeta };
    }

    await user.save({ validateModifiedOnly: true });
    res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role, contact: user.contact, status: user.status, vendorMeta: user.vendorMeta } });
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
      Package.find(filter).populate('vendorId','name').populate('riderId','name').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Package.countDocuments(filter),
    ]);

    res.json({ success: true, data: packages, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
    const expenses = await Expense.find().populate('riderId', 'name contact').sort({ date: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/settlements
export const getSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find().populate('vendorId', 'name vendorMeta').populate('packageIds').sort({ createdAt: -1 });
    res.json({ success: true, data: settlements });
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

    // If approved, update associated packages to cashReconciled = true
    if (settlement.status === 'Approved') {
      await Package.updateMany(
        { _id: { $in: settlement.packageIds } },
        { $set: { cashReconciled: true } }
      );
    }

    res.json({ success: true, data: settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

