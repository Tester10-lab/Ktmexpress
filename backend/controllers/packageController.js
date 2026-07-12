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
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
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
    const { amount, address, comments, deliveryDate, status } = req.body;

    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (amount !== undefined) pkg.amount = amount;
    if (address !== undefined) pkg.address = address;
    if (comments !== undefined) pkg.comments = comments;
    if (status !== undefined) pkg.status = status;

    pkg.timeline.push({
      time: ts,
      status: 'Admin Override',
      message: `Package details updated by admin. ${comments || ''}`,
      user: req.user.name,
    });

    await pkg.save();
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
