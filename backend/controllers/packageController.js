import Package from '../models/Package.js';
import ScanEvent from '../models/ScanEvent.js';
import { uniqueTrackingCode, generateInvoiceId } from '../utils/helpers.js';
import { generateLabelUrls } from '../services/labelService.js';

// GET /api/packages
export const getAllPackages = async (req, res) => {
  try {
    const { status, search, vendor, rider, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (vendor) filter.vendorId = vendor;
    if (rider) filter.riderId = rider;
    if (search) {
      filter.$or = [
        { trackingCode: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { invoiceId: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
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

// GET /api/packages/:code
export const getPackageByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const pkg = await Package.findOne({
      $or: [
        { trackingCode: code.toUpperCase() },
        { invoiceId: code.toUpperCase() },
      ],
    })
      .populate('vendorId', 'name vendorMeta')
      .populate('riderId', 'name contact')
      .lean();

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: `No package found with code "${code}".`,
      });
    }

    res.json({ success: true, data: pkg });
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

// POST /api/packages
export const createPackage = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      address,
      outOfValley,
      city,
      weight,
      packageAccess,
      items,
      amount,
      deliveryCharge,
    } = req.body;

    // Generate unique tracking code
    const trackingCode = await uniqueTrackingCode();
    const labelUrls = generateLabelUrls(trackingCode);

    // Generate concurrency-safe invoice ID
    const invoiceId = generateInvoiceId();

    const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const pkg = await Package.create({
      trackingCode,
      invoiceId,
      customerName,
      customerPhone,
      address,
      outOfValley: outOfValley || false,
      city: city || '',
      weight: weight || 0.5,
      packageAccess: packageAccess || 'sealed',
      items: items || [],
      amount,
      deliveryCharge: deliveryCharge || 0,
      vendorId: req.user._id,
      ...labelUrls,
      status: 'Pending',
      timeline: [
        {
          time: ts,
          status: 'Invoice Created',
          message: `Vendor created package invoice ${invoiceId}`,
          user: req.user.name,
        },
      ],
    });

    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/packages/track/:trackingCode
export const trackPackage = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    
    // Validate tracking code format (basic check to ensure it's not arbitrary garbage)
    if (!trackingCode || trackingCode.length < 5) {
      return res.status(400).json({ success: false, message: 'Invalid tracking code format.' });
    }

    const pkg = await Package.findOne({ trackingCode: trackingCode.toUpperCase() })
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
    const { trackingCode } = req.params;

    if (!trackingCode || trackingCode.length < 5) {
      return res.status(400).json({ success: false, message: 'Invalid tracking code format.' });
    }

    const upperTrackingCode = trackingCode.toUpperCase();
    
    // Check if already in warehouse first (for idempotent success)
    const existing = await Package.findOne({ trackingCode: upperTrackingCode });
    
    if (!existing) {
      return res.status(404).json({ success: false, message: `No package found with tracking code ${trackingCode}.` });
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
    const validPredecessors = ['Pending', 'Pick Up Requested', 'Picked Up'];

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
