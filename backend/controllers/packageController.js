import Package from '../models/Package.js';
import User from '../models/User.js';
import ScanEvent from '../models/ScanEvent.js';
import { uniqueTrackingCode, generateInvoiceId } from '../utils/helpers.js';
import { generateLabelUrls } from '../services/labelService.js';
import { VALID_PREDECESSORS } from '../services/packageTransitions.js';

// GET /api/packages
export const getAllPackages = async (req, res) => {
  try {
    const { status, search, vendor, rider, startDate, endDate, trackingCode, customer, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (vendor) filter.vendorId = vendor;
    if (rider) filter.riderId = rider;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) { filter.createdAt.$gte = new Date(`${startDate}T00:00:00+05:45`); }
      if (endDate) { filter.createdAt.$lte = new Date(`${endDate}T23:59:59+05:45`); }
    }

    if (trackingCode) {
      filter.trackingCode = { $regex: trackingCode, $options: 'i' };
    }

    if (customer) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { customerName: { $regex: customer, $options: 'i' } },
          { customerPhone: { $regex: customer, $options: 'i' } }
        ]
      });
    }

    if (search) {
      const matchingVendors = await User.find({
        role: 'vendor',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { 'vendorMeta.shopName': { $regex: search, $options: 'i' } }
        ]
      }).select('_id').lean();
      const vendorIds = matchingVendors.map(v => v._id);

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { trackingCode: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { invoiceId: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { vendorId: { $in: vendorIds } }
        ]
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [packages, total] = await Promise.all([
      Package.find(filter)
        .populate('vendorId', 'name vendorMeta')
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

// PUT /api/packages/:id
export const updatePackage = async (req, res) => {
  try {
    const editFields = [
      'amount', 'deliveryCharge', 'paymentMethod', 'status', 
      'address', 'city', 'customerName', 'customerPhone', 
      'weight', 'packageAccess', 'comments', 'deliveryDate'
    ];
    const { reason, ...updates } = req.body;

    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    if (!pkg.originalValues) {
      pkg.originalValues = {};
    }

    const changes = [];
    let isFinancialOrStatusChange = false;

    // Track changes and update fields
    for (const field of editFields) {
      if (updates[field] !== undefined) {
        // Simple comparison, might need to handle Dates or numbers specifically
        let oldVal = pkg[field];
        let newVal = updates[field];
        
        // Handle Date objects comparison
        if (oldVal instanceof Date) oldVal = oldVal.toISOString();
        if (newVal && field === 'deliveryDate') newVal = new Date(newVal).toISOString();

        if (String(oldVal) !== String(newVal)) {
          // Record original value on first edit
          if (pkg.originalValues[field] === undefined) {
            pkg.originalValues[field] = pkg[field];
            pkg.markModified('originalValues');
          }

          changes.push({
            field,
            before: pkg[field],
            after: updates[field]
          });

          // Update the field
          pkg[field] = updates[field];

          if (['amount', 'deliveryCharge', 'paymentMethod', 'status'].includes(field)) {
            isFinancialOrStatusChange = true;
          }
        }
      }
    }

    const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);

    pkg.timeline.push({
      time: ts,
      status: 'Admin Override',
      message: `Package details updated by admin. ${reason ? `Reason: ${reason}` : ''}`,
      user: req.user.name,
      changes
    });

    await pkg.save();

    // Emit live event to vendor for financial/status changes
    if (isFinancialOrStatusChange && req.io) {
      req.io.to(`user_${pkg.vendorId}`).emit('notification', {
        title: 'Package Edited',
        message: `Package ${pkg.trackingCode} was edited by Admin. Important fields (like amount, status) were changed.`,
        type: 'warning',
        timestamp: new Date(),
        changes,
        trackingCode: pkg.trackingCode
      });
    }

    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// GET /api/packages/track/:trackingCode
export const trackPackage = async (req, res) => {
  try {
    const rawCode = req.params.trackingCode || '';
    const trackingCode = rawCode.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().trim();

    if (!trackingCode || trackingCode.length < 5) {
      return res.status(400).json({ success: false, message: 'Invalid tracking code.' });
    }

    const pkg = await Package.findOne({ trackingCode })
      .populate('vendorId', 'name')
      .populate('riderId', 'name')
      .lean();

    if (!pkg) {
      return res.status(404).json({ success: false, message: `No package found with tracking code ${trackingCode}.` });
    }

    // Role-based visibility isolation for vendors
    if (req.user.role === 'vendor' && pkg.vendorId._id.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: `No package found with tracking code ${trackingCode}.` });
    }

    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/packages/:trackingCode/warehouse-arrival
export const confirmWarehouseArrival = async (req, res) => {
  try {
    const rawCode = req.params.trackingCode || '';
    const upperTrackingCode = rawCode.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().trim();

    if (!upperTrackingCode || upperTrackingCode.length < 5) {
      return res.status(400).json({ success: false, message: 'Invalid tracking code.' });
    }
    
    // Check if already in warehouse first (for idempotent success)
    const existing = await Package.findOne({ trackingCode: upperTrackingCode });
    
    if (!existing) {
      return res.status(404).json({ success: false, message: `No package found with tracking code ${upperTrackingCode}.` });
    }

    if (existing.status === 'In Warehouse') {
      const lastEntry = existing.timeline.slice().reverse().find(entry => entry.status === 'In Warehouse');
      const scannerName = lastEntry ? lastEntry.user : 'staff';
      const scanTime = lastEntry ? new Date(lastEntry.time).toLocaleString() : 'recently';
      return res.json({ 
        success: true, 
        message: `Already confirmed by ${scannerName} at ${scanTime}.`,
        data: existing 
      });
    }

    // Atomic update, conditioning on valid predecessor statuses
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const validPredecessors = VALID_PREDECESSORS['In Warehouse'].dispatcher;

    const updatedPkg = await Package.findOneAndUpdate(
      { 
        trackingCode: upperTrackingCode,
        status: { $in: validPredecessors }
      },
      {
        $set: { status: 'In Warehouse' },
        $push: {
          timeline: {
            time: ts,
            status: 'In Warehouse',
            message: `Package arrived at warehouse. Confirmed by ${req.user.role}.`,
            user: req.user.name,
            role: req.user.role,
            scannedBy: req.user.id
          }
        }
      },
      { new: true }
    );

    if (!updatedPkg) {
      // It exists but wasn't updated because status wasn't in validPredecessors
      return res.status(400).json({ 
        success: false, 
        message: `Cannot transition package to 'In Warehouse'. Current status is '${existing.status}'.` 
      });
    }

    // Create a global ScanEvent audit record
    await ScanEvent.create({
      packageId: updatedPkg._id,
      trackingCode: upperTrackingCode,
      scannedBy: req.user.id,
      scannerName: req.user.name,
      scannerRole: req.user.role,
      action: 'Confirm Warehouse Arrival',
      fromStatus: existing.status,
      toStatus: 'In Warehouse',
      notes: 'Scanned via QR Scanner module at warehouse arrival',
      isAdminOverride: req.user.role === 'admin'
    });

    // Emit live event to dispatchers and admins
    if (req.io) {
      req.io.to('role_dispatcher').to('role_admin').emit('package:warehouseArrived', updatedPkg);
    }

    res.json({ success: true, data: updatedPkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/packages/:id/request-verification
export const requestVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for verification is required.' });
    }

    const pkg = await Package.findById(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    // Allowed if package is complete but not verified
    if (pkg.deliveryVerificationStatus === 'Verified') {
      return res.status(400).json({ success: false, message: 'Package is already verified.' });
    }

    pkg.deliveryVerificationStatus = 'Pending';
    pkg.verificationStartedAt = new Date();

    const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);
    pkg.timeline.push({
      time: ts,
      status: 'Verification Requested',
      message: `Verification requested by ${req.user.role}. Reason: ${reason}`,
      user: req.user.name,
      changes: [
        { field: 'deliveryVerificationStatus', before: pkg.deliveryVerificationStatus || null, after: 'Pending' }
      ]
    });

    await pkg.save();

    // Notify admins
    if (req.io) {
      req.io.to('admins').emit('notification', {
        title: 'Verification Requested',
        message: `Verification requested for package ${pkg.trackingCode} by ${req.user.name}.`,
        type: 'warning'
      });
    }

    res.json({ success: true, message: 'Verification requested successfully.', data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
