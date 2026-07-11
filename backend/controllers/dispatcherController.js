import Package from '../models/Package.js';
import PickupRequest from '../models/PickupRequest.js';
import User from '../models/User.js';
import CodHandover from '../models/CodHandover.js';

// Helper: get timestamp string
function nowStr() {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

// GET /api/dispatcher/pickups
export const getPickupRequests = async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ status: { $in: ['pending', 'assigned'] } })
      .populate('packageId', 'trackingCode customerName address vendorId')
      .populate('vendorId', 'name vendorMeta')
      .populate('assignedRiderId', 'name')
      .sort({ requestedAt: -1 });

    res.json({ success: true, data: pickups });
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
      pkg.timeline.push({
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

    pkg.status = 'In Warehouse';
    pkg.timeline.push({
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

    const rider = await User.findOne({ _id: riderId, role: 'rider', status: 'Active' });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found.' });
    }

    pkg.riderId = riderId;
    pkg.status = 'Out for Delivery';
    pkg.timeline.push({
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

    const updated = [];
    for (const id of packageIds) {
      const pkg = await Package.findById(id);
      if (!pkg || pkg.status !== 'In Warehouse') continue;

      pkg.riderId = riderId;
      pkg.status = 'Out for Delivery';
      pkg.timeline.push({
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
      pkg.timeline.push({
        time: nowStr(),
        status: 'Rider Return Confirmed',
        message: 'Dispatcher confirmed physical return from rider',
        user: req.user.name,
      });
    } else if (type === 'vendor') {
      pkg.rtvSignoff.vendorReceived = true;
      pkg.status = 'Returned to Vendor';
      pkg.timeline.push({
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
    if (search) filter.$or = [
      { trackingCode: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
    ];

    const packages = await Package.find(filter)
      .populate('vendorId', 'name email')
      .populate('riderId', 'name contact')
      .sort({ createdAt: -1 })
      .limit(500);

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
      .sort({ createdAt: -1 });

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

    // Base filter matching any package this rider has ever touched (assigned, timelines, etc.)
    const baseFilter = {
      $or: [
        { riderId: id },
        { 'timeline.user': rider.name },
        { 'timeline.message': { $regex: new RegExp(rider.name, 'i') } }
      ]
    };

    // Calculate absolute lifetime KPIs
    const allPkgs = await Package.find(baseFilter).lean();

    const lifetimeStats = {
      totalHandled: allPkgs.length,
      totalPickedUp: allPkgs.filter(p => ['Picked Up', 'Out for Delivery', 'Delivered', 'Postponed', 'Cancelled', 'Returned', 'Returned to Vendor'].includes(p.status) || p.timeline.some(t => t.status === 'Picked Up')).length,
      totalDelivered: allPkgs.filter(p => p.status === 'Delivered').length,
      totalFailedReturned: allPkgs.filter(p => ['Cancelled', 'Returned', 'Returned to Vendor'].includes(p.status)).length,
      totalCODCollected: allPkgs.filter(p => p.status === 'Delivered').reduce((sum, p) => sum + (p.riderSubmission?.amount !== undefined ? p.riderSubmission.amount : p.amount || 0), 0),
      currentAssigned: allPkgs.filter(p => p.riderId?.toString() === id.toString() && ['Out for Delivery', 'Picked Up'].includes(p.status)).length
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
      if (startDate) {
        filteredQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filteredQuery.createdAt.$lte = end;
      }
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


