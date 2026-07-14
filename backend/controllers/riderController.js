import Package from '../models/Package.js';
import CodHandover from '../models/CodHandover.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { canTransition } from '../services/packageTransitions.js';
import eventBus from '../services/eventBus.js';
import { nowStr } from '../utils/helpers.js';

// GET /api/rider/deliveries
export const getMyDeliveries = async (req, res) => {
  try {
    const riderId = new mongoose.Types.ObjectId(req.user._id);
    const { type, status } = req.query; // 'pickup' or 'delivery' or 'all'

    let filter = { riderId };

    if (status && status !== 'all') {
      filter.status = status;
    } else if (type === 'pickup') {
      filter.status = { $in: ['Pick Up Requested', 'Picked Up'] };
    } else if (type === 'delivery') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.$or = [
        { status: { $in: ['Out for Delivery', 'Postponed'] } },
        { 
          status: { $in: ['Delivered', 'Cancelled', 'Returned', 'Exchanged'] },
          $or: [
            { deliveryVerificationStatus: { $in: ['Pending', 'Reopened'] } },
            { updatedAt: { $gte: today } }
          ]
        }
      ];
    } else if (type === 'active_delivery') {
      filter.status = { $in: ['Out for Delivery', 'Postponed'] };
    }

    const packages = await Package.find(filter)
      .populate('vendorId', 'name vendorMeta')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/rider/update-status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { packageId, action, comment, cashCollected, newDate } = req.body;
    const riderId = new mongoose.Types.ObjectId(req.user._id);

    const pkg = await Package.findOne({ _id: packageId, riderId });
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found or not assigned to you.',
      });
    }

    const ts = nowStr();

    const ACTION_TO_STATUS = {
      deliver: 'Delivered',
      postpone: 'Postponed',
      cancel: 'Cancelled',
      return: 'Returned',
      pickup_complete: 'Picked Up'
    };

    const targetStatus = ACTION_TO_STATUS[action];
    if (!targetStatus) {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    const transition = canTransition(pkg.status, targetStatus, req.user.role);
    if (!transition.allowed) {
      return res.status(400).json({ success: false, message: transition.reason });
    }

    switch (action) {
      case 'deliver':
        pkg.status = 'Delivered';
        pkg.cashReconciled = false;
        pkg.comments = comment || '';
        pkg.riderSubmission = {
          status: 'Delivered',
          amount: cashCollected !== undefined ? Number(cashCollected) : pkg.amount,
          comments: comment || '',
          submittedAt: new Date()
        };
        pkg.timeline.push({
          time: ts,
          status: 'Delivered',
          message: `Delivery completed. Collected Rs. ${cashCollected || pkg.amount} COD.`,
          user: req.user.name,
          type: 'RIDER_SUBMITTED',
          changes: [
            { field: 'status', before: pkg.status, after: 'Delivered' }
          ]
        });
        break;

      case 'postpone':
        pkg.status = 'Postponed';
        pkg.comments = comment || '';
        pkg.riderSubmission = {
          status: 'Postponed',
          amount: pkg.amount,
          comments: comment || '',
          newDate: newDate ? new Date(newDate) : null,
          submittedAt: new Date()
        };
        pkg.timeline.push({
          time: ts,
          status: 'Postponed',
          message: `Delivery postponed. Reason: ${comment}. New date: ${newDate || 'TBD'}.`,
          user: req.user.name,
          type: 'RIDER_SUBMITTED',
          changes: [
            { field: 'status', before: pkg.status, after: 'Postponed' }
          ]
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

      case 'exchange':
        pkg.status = 'Exchanged';
        pkg.comments = comment || '';
        pkg.timeline.push({
          time: ts,
          status: 'Exchanged',
          message: `Package marked for exchange. Reason: ${comment}`,
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
    }

    await pkg.save();

    // Emit event on Event Bus
    if (action === 'deliver' || action === 'postpone') {
      eventBus.emit('package.rider_submitted', { pkg, reqUser: req.user, io: req.io });
    }

    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/rider/summary — single $facet aggregation instead of 6 separate queries
export const getRiderSummary = async (req, res) => {
  try {
    const riderId = new mongoose.Types.ObjectId(req.user._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [result] = await Package.aggregate([
      { $match: { riderId, deletedAt: null } },
      {
        $facet: {
          delivered: [
            { $match: { status: 'Delivered' } },
            { $count: 'count' },
          ],
          pending: [
            { $match: { status: 'Out for Delivery' } },
            { $count: 'count' },
          ],
          postponed: [
            { $match: { status: 'Postponed' } },
            { $count: 'count' },
          ],
          cancelled: [
            { $match: { status: 'Cancelled' } },
            { $count: 'count' },
          ],
          deliveredThisMonth: [
            { $match: { status: 'Delivered', updatedAt: { $gte: startOfMonth } } },
            { $count: 'count' },
          ],
          totalCOD: [
            { $match: { status: 'Delivered', cashReconciled: false } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
        },
      },
    ]);

    const delivered = result.delivered[0]?.count || 0;
    const pending = result.pending[0]?.count || 0;
    const postponed = result.postponed[0]?.count || 0;
    const cancelled = result.cancelled[0]?.count || 0;
    const deliveredThisMonth = result.deliveredThisMonth[0]?.count || 0;
    const totalCOD = result.totalCOD[0]?.total || 0;
    const monthlyTarget = req.user.riderMeta?.monthlyTarget || 0;

    res.json({
      success: true,
      data: { delivered, pending, postponed, cancelled, totalCOD, deliveredThisMonth, monthlyTarget },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/rider/bulk-pickup — batch query instead of N individual findOne calls
export const bulkPickup = async (req, res) => {
  try {
    const { packageIds } = req.body;
    const riderId = new mongoose.Types.ObjectId(req.user._id);

    if (!Array.isArray(packageIds) || packageIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid package list' });
    }

    const ts = nowStr();

    // Batch fetch all eligible packages in one query
    const packages = await Package.find({
      _id: { $in: packageIds },
      riderId,
      status: 'Pick Up Requested',
    });
    
    const updated = [];
    for (const pkg of packages) {
      pkg.status = 'Picked Up';
      pkg.timeline.push({
        time: ts,
        status: 'Picked Up',
        message: `Rider ${req.user.name} picked up package from vendor (Bulk)`,
        user: req.user.name,
      });
      await pkg.save();
      updated.push(pkg._id);
    }

    res.json({ success: true, data: updated, message: `Picked up ${updated.length} packages.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/rider/cod-handover
export const submitCodHandover = async (req, res) => {
  try {
    const riderId = new mongoose.Types.ObjectId(req.user._id);
    const { packageIds } = req.body;

    if (!packageIds || !packageIds.length) {
      return res.status(400).json({ success: false, message: 'No packages selected for handover.' });
    }

    const existing = await CodHandover.findOne({
      status: 'Pending Verification',
      packageIds: { $in: packageIds },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'One or more packages are already pending verification.' });
    }

    const packages = await Package.find({
      _id: { $in: packageIds },
      riderId,
      status: 'Delivered',
      cashReconciled: false
    });

    if (packages.length !== packageIds.length) {
      return res.status(400).json({ success: false, message: 'Invalid packages selected or already reconciled.' });
    }

    const amount = packages.reduce((sum, pkg) => sum + pkg.amount, 0);

    const handover = await CodHandover.create({
      riderId,
      amount,
      packageIds,
      status: 'Pending Verification',
    });

    res.status(201).json({ success: true, data: handover, message: 'Handover request submitted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
