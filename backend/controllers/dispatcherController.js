import { appendTimelineEvent } from '../utils/timelineHelper.js';
import Package from '../models/Package.js';
import User from '../models/User.js';
import PickupRequest from '../models/PickupRequest.js';
import CodHandover from '../models/CodHandover.js';
import mongoose from 'mongoose';
import { canTransition } from '../services/packageTransitions.js';
import { nowStr } from '../utils/helpers.js';

// GET /api/dispatcher/pickups
export const getPickupRequests = async (req, res) => {
  try {
    const { status, vendorId, search } = req.query;
    const query = {};

    if (status) query.status = status;
    else query.status = { $in: ['pending', 'assigned'] };

    if (vendorId) query.vendorId = vendorId;

    const assignedPickups = await PickupRequest.find(query)
      .populate('packageId', 'trackingCode customerName address vendorId')
      .populate('vendorId', 'name vendorMeta')
      .populate('assignedRiderId', 'name')
      .sort({ requestedAt: -1 })
      .lean();

    res.json({ success: true, data: assignedPickups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/dispatcher/assign-pickup
export const assignRiderToPickup = async (req, res) => {
  try {
    const { pickupId, riderId } = req.body;

    const pickup = await PickupRequest.findById(pickupId);
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found.' });
    }

    const rider = await User.findOne({ _id: riderId, role: 'rider', status: 'Active' });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Active rider not found.' });
    }

    pickup.assignedRiderId = riderId;
    pickup.status = 'assigned';
    await pickup.save();

    // Update package
    const pkg = await Package.findById(pickup.packageId);
    if (pkg) {
      pkg.riderId = riderId;
      appendTimelineEvent(pkg, {
        time: nowStr(),
        status: 'Pickup Assigned',
        message: `Rider ${rider.name} assigned for pickup`,
        user: req.user.name,
      });
      await pkg.save();
    }

    if (req.io) {
      req.io.to(`user_${riderId}`).emit('notification', {
        title: 'New Pickup Assigned',
        message: `You have been assigned a new pickup request.`,
        type: 'new_order'
      });
    }

    res.json({ success: true, data: pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/dispatcher/confirm-warehouse
export const confirmWarehouseArrival = async (req, res) => {
  try {
    const { packageId } = req.body;

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const transition = canTransition(pkg.status, 'In Warehouse', req.user.role);
    if (!transition.allowed) {
      return res.status(400).json({ success: false, message: transition.reason });
    }

    pkg.status = 'In Warehouse';
    appendTimelineEvent(pkg, {
      time: nowStr(),
      status: 'Arrived in Warehouse',
      message: 'Inbound scanned at central hub',
      user: req.user.name,
    });
    await pkg.save();

    // Update all active pickup requests for this package to prevent stuck duplicates
    await PickupRequest.updateMany(
      { packageId: pkg._id, status: { $in: ['pending', 'assigned'] } },
      { status: 'completed', completedAt: new Date() }
    );

    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/dispatcher/assign-delivery
export const assignRiderForDelivery = async (req, res) => {
  try {
    const { packageId, riderId } = req.body;

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const transition = canTransition(pkg.status, 'Out for Delivery', req.user.role);
    if (!transition.allowed) {
      return res.status(400).json({ success: false, message: transition.reason });
    }

    const rider = await User.findOne({ _id: riderId, role: 'rider', status: 'Active' });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found.' });
    }

    pkg.riderId = riderId;
    pkg.status = 'Out for Delivery';
    appendTimelineEvent(pkg, {
      time: nowStr(),
      status: 'Sent to Delivery',
      message: `Assigned to Rider ${rider.name} for delivery route`,
      user: req.user.name,
    });
    await pkg.save();

    if (req.io) {
      req.io.to(`user_${riderId}`).emit('notification', {
        title: 'Delivery Assigned',
        message: `Package ${pkg.trackingCode} assigned to you for delivery.`,
        type: 'new_order'
      });
    }

    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/dispatcher/bulk-assign
export const bulkAssignPackages = async (req, res) => {
  try {
    const { packageIds, riderId } = req.body;

    if (!packageIds?.length) {
      return res.status(400).json({ success: false, message: 'No packages selected.' });
    }

    const rider = await User.findOne({ _id: riderId, role: 'rider', status: 'Active' });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found.' });
    }

    // Batch fetch all eligible packages in one query
    const packages = await Package.find({
      _id: { $in: packageIds },
      status: { $in: ['In Warehouse', 'Sorted', 'Postponed'] },
    });

    const updated = [];
    for (const pkg of packages) {
      pkg.riderId = riderId;
      pkg.status = 'Out for Delivery';
      appendTimelineEvent(pkg, {
        time: nowStr(),
        status: 'Sent to Delivery',
        message: `Bulk assigned to Rider ${rider.name}`,
        user: req.user.name,
      });
      await pkg.save();
      updated.push(pkg.trackingCode);
    }

    if (updated.length > 0 && req.io) {
      req.io.to(`user_${riderId}`).emit('notification', {
        title: 'Bulk Delivery Assigned',
        message: `You have been assigned ${updated.length} new packages for delivery.`,
        type: 'new_order'
      });
    }

    res.json({ success: true, data: { count: updated.length, trackingCodes: updated } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/dispatcher/confirm-return
export const confirmReturn = async (req, res) => {
  try {
    const { packageId, type } = req.body; // type: 'rider' or 'vendor'

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    if (type === 'rider') {
      pkg.rtvSignoff.riderReturned = true;
      appendTimelineEvent(pkg, {
        time: nowStr(),
        status: 'Rider Return Confirmed',
        message: 'Dispatcher confirmed physical return from rider',
        user: req.user.name,
      });
    } else if (type === 'vendor') {
      pkg.rtvSignoff.vendorReceived = true;
      pkg.status = 'Returned to Vendor';
      appendTimelineEvent(pkg, {
        time: nowStr(),
        status: 'Returned to Vendor',
        message: 'Package returned to vendor. RTV complete.',
        user: req.user.name,
      });
    }

    await pkg.save();
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/dispatcher/bulk-vendor-handover
export const bulkVendorHandover = async (req, res) => {
  try {
    const { packageIds } = req.body;

    if (!packageIds?.length) {
      return res.status(400).json({ success: false, message: 'No packages selected.' });
    }

    // Batch fetch all packages in one query
    const packages = await Package.find({ _id: { $in: packageIds } });

    const updated = [];
    for (const pkg of packages) {
      // Ensure it was physically returned by the rider first before handing to vendor
      if (!pkg.rtvSignoff?.riderReturned) continue;
      if (pkg.rtvSignoff?.vendorReceived) continue;

      pkg.rtvSignoff.vendorReceived = true;
      pkg.status = 'Returned to Vendor';
      appendTimelineEvent(pkg, {
        time: nowStr(),
        status: 'Returned to Vendor',
        message: 'Package returned to vendor. RTV complete.',
        user: req.user.name,
      });

      await pkg.save();
      updated.push(pkg.trackingCode);
    }

    res.json({ success: true, data: { count: updated.length, trackingCodes: updated } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/dispatcher/bulk-status-update
export const bulkStatusUpdate = async (req, res) => {
  try {
    const { packageIds, status } = req.body;

    const validStatuses = ['In Warehouse', 'Out for Delivery', 'Delivered'];
    if (!packageIds?.length) {
      return res.status(400).json({ success: false, message: 'No packages selected.' });
    }
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const packages = await Package.find({ _id: { $in: packageIds } });
    if (!packages.length) {
      return res.status(404).json({ success: false, message: 'No matching packages found.' });
    }

    const updatedTrackingCodes = [];

    for (const pkg of packages) {
      pkg.status = status;

      let timelineStatus = status;
      let timelineMsg = `Status changed to "${status}" via bulk dispatcher action`;

      if (status === 'In Warehouse') {
        timelineStatus = 'Arrived in Warehouse';
        timelineMsg = `Bulk status update to In Warehouse`;
      } else if (status === 'Out for Delivery') {
        timelineStatus = 'Out for Delivery';
        timelineMsg = `Bulk status update to Out for Delivery (Dispatched)`;
      } else if (status === 'Delivered') {
        timelineStatus = 'Delivered';
        timelineMsg = `Bulk status update to Delivered`;
      }

      appendTimelineEvent(pkg, {
        time: nowStr(),
        status: timelineStatus,
        message: timelineMsg,
        user: req.user.name || 'Dispatcher',
      });

      await pkg.save();
      updatedTrackingCodes.push(pkg.trackingCode);

      if (['In Warehouse', 'Delivered'].includes(status)) {
        await PickupRequest.updateMany(
          { packageId: pkg._id, status: { $in: ['pending', 'assigned'] } },
          { status: 'completed', completedAt: new Date() }
        );
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedTrackingCodes.length} package(s) to ${status}`,
      data: { count: updatedTrackingCodes.length, trackingCodes: updatedTrackingCodes },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dispatcher/dashboard
export const getDispatcherDashboard = async (req, res) => {
  try {
    const [pickupsPending, inWarehouse, outForDelivery, returnedPending, activeRiders, unassigned] = await Promise.all([
      PickupRequest.countDocuments({ status: 'pending' }),
      Package.countDocuments({ status: 'In Warehouse' }),
      Package.countDocuments({ status: 'Out for Delivery' }),
      Package.countDocuments({ status: { $in: ['Returned', 'Returned to Vendor'] } }),
      User.countDocuments({ role: 'rider', status: 'Active' }),
      Package.countDocuments({ status: 'In Warehouse', riderId: null }),
    ]);

    res.json({
      success: true,
      data: { pickupsPending, inWarehouse, outForDelivery, returnedPending, activeRiders, unassigned },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dispatcher/packages
export const getAllPackagesForDispatcher = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      // Support comma-separated statuses
      const statuses = status.split(',');
      filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
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

      filter.$or = [
        { trackingCode: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { vendorId: { $in: vendorIds } }
      ];
    }

    const packages = await Package.find(filter)
      .populate('vendorId', 'name email vendorMeta')
      .populate('riderId', 'name contact')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dispatcher/riders
export const getAvailableRiders = async (req, res) => {
  try {
    const riders = await User.find({ role: 'rider', status: 'Active' })
      .select('name email contact')
      .sort({ name: 1 })
      .lean();

    const codAgg = await Package.aggregate([
      { $match: { status: 'Delivered', cashReconciled: false, deletedAt: null, riderId: { $in: riders.map(r => r._id) } } },
      { $group: { _id: '$riderId', totalCOD: { $sum: '$amount' } } }
    ]);

    const codMap = {};
    codAgg.forEach(c => codMap[c._id.toString()] = c.totalCOD);

    riders.forEach(r => {
      r.totalCOD = codMap[r._id.toString()] || 0;
    });

    res.json({ success: true, data: riders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dispatcher/cod-handovers
export const getCodHandovers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const handovers = await CodHandover.find(filter)
      .populate('riderId', 'name contact')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: handovers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/dispatcher/cod-handovers/:id/verify
export const verifyCodHandover = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const handover = await CodHandover.findById(id);
    if (!handover) return res.status(404).json({ success: false, message: 'Handover not found.' });

    if (handover.status !== 'Pending Verification') {
      return res.status(400).json({ success: false, message: 'Handover already processed.' });
    }

    handover.status = status; // 'Verified' or 'Rejected'
    handover.remarks = remarks || handover.remarks;
    handover.verifiedBy = req.user._id;
    handover.verifiedAt = new Date();

    await handover.save();

    if (status === 'Verified') {
      await Package.updateMany(
        { _id: { $in: handover.packageIds } },
        { $set: { cashReconciled: true } }
      );
    }

    res.json({ success: true, data: handover, message: `Handover ${status.toLowerCase()} successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dispatcher/riders/:id/history
export const getRiderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, vendorId, valley, startDate, endDate } = req.query;

    const rider = await User.findOne({ _id: id, role: 'rider' });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found.' });
    }

    const ridObjId = new mongoose.Types.ObjectId(id);

    // Base filter matching any package this rider has ever touched (assigned, timelines, etc.)
    const baseFilter = {
      $or: [
        { riderId: ridObjId },
        { 'timeline.user': rider.name },
        { 'timeline.message': { $regex: new RegExp(rider.name, 'i') } }
      ]
    };

    // Calculate absolute lifetime KPIs via aggregation (avoids loading all documents)
    const [statsResult] = await Package.aggregate([
      { $match: { ...baseFilter, deletedAt: null } },
      {
        $facet: {
          totalHandled: [{ $count: 'count' }],
          totalDelivered: [
            { $match: { status: 'Delivered' } },
            { $count: 'count' },
          ],
          totalFailedReturned: [
            { $match: { status: { $in: ['Cancelled', 'Returned', 'Returned to Vendor'] } } },
            { $count: 'count' },
          ],
          totalCODCollected: [
            { $match: { status: 'Delivered' } },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$riderSubmission.amount', '$amount'] } } } },
          ],
          currentAssigned: [
            { $match: { riderId: ridObjId, status: { $in: ['Out for Delivery', 'Picked Up'] } } },
            { $count: 'count' },
          ],
          totalPickedUp: [
            { $match: { $or: [
              { status: { $in: ['Picked Up', 'Out for Delivery', 'Delivered', 'Postponed', 'Cancelled', 'Returned', 'Returned to Vendor'] } },
              { 'timeline.status': 'Picked Up' }
            ] } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const lifetimeStats = {
      totalHandled: statsResult.totalHandled[0]?.count || 0,
      totalPickedUp: statsResult.totalPickedUp[0]?.count || 0,
      totalDelivered: statsResult.totalDelivered[0]?.count || 0,
      totalFailedReturned: statsResult.totalFailedReturned[0]?.count || 0,
      totalCODCollected: statsResult.totalCODCollected[0]?.total || 0,
      currentAssigned: statsResult.currentAssigned[0]?.count || 0,
    };

    // Apply filtering query
    const filteredQuery = { ...baseFilter };

    if (status && status !== 'all') {
      filteredQuery.status = status;
    }

    if (vendorId && vendorId !== 'all') {
      filteredQuery.vendorId = vendorId;
    }

    if (valley === 'inside') {
      filteredQuery.outOfValley = false;
    } else if (valley === 'outside') {
      filteredQuery.outOfValley = true;
    }

    if (startDate || endDate) {
      filteredQuery.createdAt = {};
      if (startDate) { filteredQuery.createdAt.$gte = new Date(`${startDate}T00:00:00+05:45`); }
      if (endDate) { filteredQuery.createdAt.$lte = new Date(`${endDate}T23:59:59+05:45`); }
    }

    const packagesList = await Package.find(filteredQuery)
      .populate('vendorId', 'name vendorMeta')
      .populate('riderId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        rider: {
          id: rider._id,
          name: rider.name,
          email: rider.email,
          contact: rider.contact,
        },
        stats: lifetimeStats,
        packages: packagesList
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


