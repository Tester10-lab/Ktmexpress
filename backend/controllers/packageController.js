import mongoose from 'mongoose';
import { appendTimelineEvent } from '../utils/timelineHelper.js';
import Package from '../models/Package.js';
import User from '../models/User.js';
import ScanEvent from '../models/ScanEvent.js';
import { uniqueTrackingCode, generateInvoiceId, escapeRegex } from '../utils/helpers.js';
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
      const escapedSearch = escapeRegex(search);
      const matchingVendors = await User.find({
        role: 'vendor',
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { 'vendorMeta.shopName': { $regex: escapedSearch, $options: 'i' } }
        ]
      }).select('_id').lean();
      const vendorIds = matchingVendors.map(v => v._id);

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { trackingCode: { $regex: escapedSearch, $options: 'i' } },
          { customerName: { $regex: escapedSearch, $options: 'i' } },
          { invoiceId: { $regex: escapedSearch, $options: 'i' } },
          { address: { $regex: escapedSearch, $options: 'i' } },
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

    if (changes.length > 0) {
      for (const change of changes) {
        appendTimelineEvent(pkg, {
          time: ts,
          status: 'Admin Override',
          message: `Admin updated ${change.field}: ${change.before} -> ${change.after}${reason ? `. Reason: ${reason}` : ''}`,
          user: req.user.name,
          changes: [change]
        });
      }
    } else if (reason) {
      appendTimelineEvent(pkg, {
        time: ts,
        status: 'Admin Override',
        message: `Package details updated by admin. Reason: ${reason}`,
        user: req.user.name,
        changes: []
      });
    }

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

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason for verification is required.' });
    }

    const pkg = mongoose.Types.ObjectId.isValid(id)
      ? await Package.findById(id)
      : await Package.findOne({ trackingCode: id });

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    // Allowed if package is not already verified
    if (pkg.deliveryVerificationStatus === 'Verified') {
      return res.status(400).json({ success: false, message: 'Package is already verified.' });
    }

    const cleanReason = reason.trim();

    let priority = 'Low';
    if (['COD amount mismatch', 'Customer dispute', 'Damaged package'].includes(cleanReason)) priority = 'High';
    else if (['Delivery charge correction', 'Wrong package status', 'Exchange issue', 'Return issue'].includes(cleanReason)) priority = 'Medium';

    const prevVerificationStatus = pkg.deliveryVerificationStatus || null;

    pkg.deliveryVerificationStatus = 'Pending';
    pkg.activeVerificationPriority = priority;
    if (!pkg.verificationStartedAt) {
      pkg.verificationStartedAt = new Date();
    }

    if (!Array.isArray(pkg.verificationRequests)) {
      pkg.verificationRequests = [];
    }

    const rawUserId = req.user?._id || req.user?.id;
    const userId = rawUserId && mongoose.Types.ObjectId.isValid(rawUserId) ? rawUserId : null;
    const userName = req.user?.name || 'User';
    const userRole = req.user?.role || 'user';

    pkg.verificationRequests.push({
      requestedBy: userId,
      requestedByName: userName,
      requestedRole: userRole,
      reason: cleanReason,
      priority,
      status: 'Pending'
    });

    const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);
    appendTimelineEvent(pkg, {
      time: ts,
      status: 'Verification Requested',
      message: `Verification requested by ${userRole}. Reason: ${cleanReason} (Priority: ${priority})`,
      user: userName,
      role: userRole,
      changes: [
        { field: 'deliveryVerificationStatus', before: prevVerificationStatus, after: 'Pending' }
      ]
    });

    await pkg.save();

    // Notify admins and dispatchers
    if (req.io) {
      req.io.to('role_admin').to('role_dispatcher').emit('notification', {
        title: 'Verification Requested',
        message: `Verification requested for package ${pkg.trackingCode} by ${userName}.`,
        type: 'warning',
        packageId: pkg._id,
        trackingCode: pkg.trackingCode
      });
    }

    res.json({ success: true, message: 'Verification requested successfully.', data: pkg });
  } catch (error) {
    console.error('Error in requestVerification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/packages/:id/comments — Add a user comment to package
export const addPackageComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const pkg = mongoose.Types.ObjectId.isValid(id)
      ? await Package.findById(id)
      : await Package.findOne({ trackingCode: id });

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const senderRole = req.user.role ? (req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)) : 'User';
    const senderName = req.user.vendorMeta?.shopName || req.user.name || 'User';

    // Append to timeline as Comment event
    appendTimelineEvent(pkg, {
      status: 'Comment',
      message: comment.trim(),
      user: senderName,
      role: senderRole,
      type: 'Comment'
    });

    if (!pkg.comments) pkg.comments = [];
    pkg.comments.push({
      text: comment.trim(),
      user: senderName,
      role: senderRole,
      createdAt: new Date()
    });

    await pkg.save();

    const updatedPkg = await Package.findById(pkg._id)
      .populate('vendorId', 'name email vendorMeta')
      .populate('riderId', 'name contact')
      .lean();

    // Broadcast real-time notification to all relevant roles/users
    if (req.io) {
      const notifPayload = {
        id: `comment_${pkg._id}_${Date.now()}`,
        title: `New Comment on ${pkg.trackingCode}`,
        message: `${senderName} (${senderRole}): "${comment.trim()}"`,
        type: 'info',
        module: 'Packages',
        packageId: pkg._id,
        trackingCode: pkg.trackingCode,
        user: senderName,
        role: senderRole,
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: '💬',
        read: false
      };

      const senderIdStr = (req.user._id || req.user.id || '').toString();

      if (pkg.vendorId && pkg.vendorId.toString() !== senderIdStr) {
        req.io.to(`user_${pkg.vendorId}`).emit('notification', notifPayload);
      }

      if (pkg.riderId && pkg.riderId.toString() !== senderIdStr) {
        req.io.to(`user_${pkg.riderId}`).emit('notification', notifPayload);
      }

      if (req.user.role !== 'admin') {
        req.io.to('role_admin').emit('notification', notifPayload);
      }

      if (req.user.role !== 'dispatcher') {
        req.io.to('role_dispatcher').emit('notification', notifPayload);
      }

      req.io.to(`user_${pkg.vendorId}`).to(`user_${pkg.riderId}`).to('role_admin').to('role_dispatcher').emit('package:comment', {
        packageId: pkg._id,
        trackingCode: pkg.trackingCode,
        comment: comment.trim(),
        user: senderName,
        role: senderRole,
        time: new Date().toISOString()
      });
    }

    res.json({ success: true, data: updatedPkg, message: 'Comment posted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
