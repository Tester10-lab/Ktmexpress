import Package from '../models/Package.js';

// Helper: get timestamp string
function nowStr() {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

// GET /api/rider/deliveries
export const getMyDeliveries = async (req, res) => {
  try {
    const riderId = req.user._id;
    const { type, status } = req.query; // 'pickup' or 'delivery' or 'all'

    let filter = { riderId };

    if (status && status !== 'all') {
      filter.status = status;
    } else if (type === 'pickup') {
      filter.status = { $in: ['Pick Up Requested', 'Picked Up'] };
    } else if (type === 'delivery') {
      filter.status = { $nin: ['Pick Up Requested', 'Picked Up', 'Pending'] }; // all deliveries
    } else if (type === 'active_delivery') {
      filter.status = { $in: ['Out for Delivery', 'Postponed'] };
    }

    const packages = await Package.find(filter)
      .populate('vendorId', 'name vendorMeta')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/rider/update-status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { packageId, action, comment, cashCollected, newDate } = req.body;
    const riderId = req.user._id;

    const pkg = await Package.findOne({ _id: packageId, riderId });
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found or not assigned to you.',
      });
    }

    const ts = nowStr();

    switch (action) {
      case 'deliver':
        pkg.status = 'Delivered';
        pkg.cashReconciled = false;
        pkg.comments = comment || '';
        pkg.timeline.push({
          time: ts,
          status: 'Delivered',
          message: `Delivery completed. Collected Rs. ${cashCollected || pkg.amount} COD.`,
          user: req.user.name,
        });
        break;

      case 'postpone':
        pkg.status = 'Postponed';
        pkg.comments = comment || '';
        pkg.timeline.push({
          time: ts,
          status: 'Postponed',
          message: `Delivery postponed. Reason: ${comment}. New date: ${newDate || 'TBD'}`,
          user: req.user.name,
        });
        break;

      case 'cancel':
        pkg.status = 'Cancelled';
        pkg.comments = comment || '';
        pkg.timeline.push({
          time: ts,
          status: 'Cancelled',
          message: `Delivery failed: ${comment}`,
          user: req.user.name,
        });
        break;

      case 'return':
        pkg.status = 'Returned';
        pkg.comments = comment || '';
        pkg.timeline.push({
          time: ts,
          status: 'Returned',
          message: `Package marked for return. Reason: ${comment}`,
          user: req.user.name,
        });
        break;

      case 'pickup_complete':
        pkg.status = 'Picked Up';
        pkg.timeline.push({
          time: ts,
          status: 'Picked Up',
          message: `Rider ${req.user.name} picked up package from vendor`,
          user: req.user.name,
        });
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    await pkg.save();

    if (action === 'deliver' && req.io) {
      req.io.to(`user_${pkg.vendorId}`).emit('notification', {
        title: 'Package Delivered!',
        message: `Your package ${pkg.trackingCode} has been successfully delivered.`,
        type: 'package_delivered'
      });
    }

    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/rider/bulk-pickup
export const bulkMarkPickedUp = async (req, res) => {
  try {
    const { packageIds } = req.body;
    const riderId = req.user._id;
    const ts = nowStr();

    if (!packageIds?.length) {
      return res.status(400).json({ success: false, message: 'No packages selected.' });
    }

    const updated = [];
    for (const id of packageIds) {
      const pkg = await Package.findOne({ _id: id, riderId });
      if (!pkg || pkg.status !== 'Pick Up Requested') continue;

      pkg.status = 'Picked Up';
      pkg.timeline.push({
        time: ts,
        status: 'Picked Up',
        message: `Rider ${req.user.name} picked up package`,
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

// GET /api/rider/summary
export const getRiderSummary = async (req, res) => {
  try {
    const riderId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [delivered, pending, postponed, cancelled] = await Promise.all([
      Package.countDocuments({ riderId, status: 'Delivered' }),
      Package.countDocuments({ riderId, status: 'Out for Delivery' }),
      Package.countDocuments({ riderId, status: 'Postponed' }),
      Package.countDocuments({ riderId, status: 'Cancelled' }),
    ]);

    // COD wallet
    const codAgg = await Package.aggregate([
      { $match: { riderId: req.user._id, status: 'Delivered', cashReconciled: false } },
      { $group: { _id: null, totalCOD: { $sum: '$amount' } } },
    ]);

    const totalCOD = codAgg[0]?.totalCOD || 0;

    res.json({
      success: true,
      data: { delivered, pending, postponed, cancelled, totalCOD },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/rider/bulk-pickup
export const bulkPickup = async (req, res) => {
  try {
    const { packageIds } = req.body;
    const riderId = req.user._id;

    if (!Array.isArray(packageIds) || packageIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid package list' });
    }

    const ts = nowStr();
    
    // Process one by one to ensure history logs
    const updated = [];
    for (const pkgId of packageIds) {
      const pkg = await Package.findOne({ _id: pkgId, riderId, status: 'Pick Up Requested' });
      if (pkg) {
        pkg.status = 'Picked Up';
        pkg.timeline.push({
          time: ts,
          status: 'Picked Up',
          message: `Rider ${req.user.name} picked up package from vendor (Bulk)`,
          user: req.user.name,
        });
        await pkg.save();
        updated.push(pkgId);
      }
    }

    res.json({ success: true, data: updated, message: `Picked up ${updated.length} packages.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
