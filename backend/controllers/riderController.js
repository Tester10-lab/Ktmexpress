import { appendTimelineEvent } from '../utils/timelineHelper.js';
import Package from '../models/Package.js';
import CodHandover from '../models/CodHandover.js';
import Expense from '../models/Expense.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { canTransition } from '../services/packageTransitions.js';
import eventBus from '../services/eventBus.js';
import { nowStr, escapeRegex } from '../utils/helpers.js';

// GET /api/rider/deliveries
export const getMyDeliveries = async (req, res) => {
  try {
    const riderId = new mongoose.Types.ObjectId(req.user._id);
    const { type, status, search } = req.query; // 'pickup' or 'delivery' or 'all'

    let filter = { riderId };
    let andConditions = [];

    if (status && status !== 'all') {
      filter.status = status;
    } else if (type === 'pickup') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      andConditions.push({
        $or: [
          { status: 'Pick Up Requested' },
          { status: 'Picked Up', updatedAt: { $gte: today } }
        ]
      });
    } else if (type === 'delivery') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      andConditions.push({
        $or: [
          { status: { $in: ['Out for Delivery', 'Out of Delivery', 'Postponed'] } },
          { 
            status: { $in: ['Delivered', 'Cancelled', 'Returned', 'Exchanged', 'Exchange'] },
            cashReconciled: false,
            $or: [
              { deliveryVerificationStatus: { $in: ['Pending', 'Reopened'] } },
              { updatedAt: { $gte: today } },
              { verifiedAt: { $gte: today } }
            ]
          }
        ]
      });
    } else if (type === 'active_delivery') {
      filter.status = { $in: ['Out for Delivery', 'Out of Delivery', 'Postponed'] };
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

      andConditions.push({
        $or: [
          { trackingCode: { $regex: escapedSearch, $options: 'i' } },
          { customerName: { $regex: escapedSearch, $options: 'i' } },
          { invoiceId: { $regex: escapedSearch, $options: 'i' } },
          { customerPhone: { $regex: escapedSearch, $options: 'i' } },
          { vendorId: { $in: vendorIds } }
        ]
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
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
    const prevStatus = pkg.status;

    const ACTION_TO_STATUS = {
      deliver: 'Delivered',
      postpone: 'Postponed',
      cancel: 'Cancelled',
      return: 'Returned',
      exchange: 'Exchanged',
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

    if (comment && comment.trim()) {
      if (!Array.isArray(pkg.comments)) pkg.comments = [];
      pkg.comments.push({
        text: comment.trim(),
        user: req.user.name || 'Rider',
        role: 'Rider',
        createdAt: new Date()
      });
    }

    switch (action) {
      case 'deliver':
        pkg.status = 'Delivered';
        pkg.cashReconciled = false;
        pkg.riderSubmission = {
          status: 'Delivered',
          amount: cashCollected !== undefined ? Number(cashCollected) : pkg.amount,
          comments: comment || '',
          submittedAt: new Date()
        };
        appendTimelineEvent(pkg, {
          time: ts,
          status: 'Delivered',
          message: `Delivery completed. Collected Rs. ${cashCollected || pkg.amount} COD.`,
          user: req.user.name,
          type: 'RIDER_SUBMITTED',
          changes: [
            { field: 'status', before: prevStatus, after: 'Delivered' }
          ]
        });
        break;

      case 'postpone':
        pkg.status = 'Postponed';
        pkg.riderSubmission = {
          status: 'Postponed',
          amount: pkg.amount,
          comments: comment || '',
          newDate: newDate ? new Date(newDate) : null,
          submittedAt: new Date()
        };
        appendTimelineEvent(pkg, {
          time: ts,
          status: 'Postponed',
          message: `Delivery postponed. Reason: ${comment || 'No reason provided'}. New date: ${newDate || 'TBD'}.`,
          user: req.user.name,
          type: 'RIDER_SUBMITTED',
          changes: [
            { field: 'status', before: prevStatus, after: 'Postponed' }
          ]
        });
        break;

      case 'cancel':
        pkg.status = 'Cancelled';
        appendTimelineEvent(pkg, {
          time: ts,
          status: 'Cancelled',
          message: `Delivery failed: ${comment || 'No reason provided'}`,
          user: req.user.name,
        });
        break;

      case 'return':
        pkg.status = 'Returned';
        appendTimelineEvent(pkg, {
          time: ts,
          status: 'Returned',
          message: `Package marked for return. Reason: ${comment || 'No reason provided'}`,
          user: req.user.name,
        });
        break;

      case 'exchange':
        pkg.status = 'Exchanged';
        appendTimelineEvent(pkg, {
          time: ts,
          status: 'Exchanged',
          message: `Package marked for exchange. Reason: ${comment || 'No reason provided'}`,
          user: req.user.name,
        });
        break;

      case 'pickup_complete':
        pkg.status = 'Picked Up';
        appendTimelineEvent(pkg, {
          time: ts,
          status: 'Picked Up',
          message: `Rider ${req.user.name} picked up package from vendor`,
          user: req.user.name,
        });
        break;
    }

    await pkg.save();

    // Emit event on Event Bus for verification / status alerts
    if (['deliver', 'postpone', 'cancel', 'return', 'exchange'].includes(action)) {
      eventBus.emit('package.rider_submitted', { pkg, reqUser: req.user, io: req.io, action, comment });
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

    // Calculate rider's approved/pending expenses for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const expensesList = await Expense.find({
      riderId: req.user._id,
      status: { $in: ['Approved', 'Pending'] },
      deletedAt: null,
      date: { $gte: todayStart }
    }).select('amount').lean();
    const todayExpenses = expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Check active pending handovers
    const pendingHandovers = await CodHandover.find({
      riderId: req.user._id,
      status: 'Pending Verification'
    }).lean();

    const pendingPackageIds = new Set(
      pendingHandovers.flatMap(h => (h.packageIds || []).map(id => id.toString()))
    );

    const pendingHandoverTotal = pendingHandovers.reduce((sum, h) => sum + (h.amount || 0), 0);

    // Filter unsubmitted packages (delivered, not reconciled, and not already in pending handover)
    const unsubmittedPackages = await Package.find({
      riderId,
      status: 'Delivered',
      cashReconciled: false,
      _id: { $nin: Array.from(pendingPackageIds) }
    }).select('amount').lean();

    const unsubmittedGross = unsubmittedPackages.reduce((sum, p) => sum + (p.amount || 0), 0);
    const unsubmittedNet = Math.max(0, unsubmittedGross - todayExpenses);

    const delivered = result.delivered[0]?.count || 0;
    const pending = result.pending[0]?.count || 0;
    const postponed = result.postponed[0]?.count || 0;
    const cancelled = result.cancelled[0]?.count || 0;
    const deliveredThisMonth = result.deliveredThisMonth[0]?.count || 0;
    const monthlyTarget = req.user.riderMeta?.monthlyTarget || 0;

    res.json({
      success: true,
      data: { 
        delivered, 
        pending, 
        postponed, 
        cancelled, 
        totalCOD: unsubmittedNet, 
        grossCOD: unsubmittedGross,
        unsubmittedPackageCount: unsubmittedPackages.length,
        hasPendingHandover: pendingHandovers.length > 0,
        pendingHandoverTotal,
        pendingHandoversCount: pendingHandovers.length,
        totalExpenses: todayExpenses, 
        deliveredThisMonth, 
        monthlyTarget 
      },
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
      appendTimelineEvent(pkg, {
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
    const { packageIds, cashAmount, onlineAmount, onlineReference, remarks } = req.body;

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

    const grossCOD = packages.reduce((sum, pkg) => sum + (pkg.amount || 0), 0);

    // Fetch rider expenses for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const expensesList = await Expense.find({
      riderId: req.user._id,
      status: { $in: ['Approved', 'Pending'] },
      deletedAt: null,
      date: { $gte: todayStart }
    }).select('amount').lean();
    const expenseDeduction = expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

    const netHandoverAmount = Math.max(0, grossCOD - expenseDeduction);

    let parsedCash = Number(cashAmount);
    let parsedOnline = Number(onlineAmount);

    // Default to all cash if neither is specified
    if (isNaN(parsedCash) && isNaN(parsedOnline)) {
      parsedCash = netHandoverAmount;
      parsedOnline = 0;
    } else {
      parsedCash = isNaN(parsedCash) ? 0 : Math.max(0, parsedCash);
      parsedOnline = isNaN(parsedOnline) ? 0 : Math.max(0, parsedOnline);
    }

    const handover = await CodHandover.create({
      riderId,
      amount: netHandoverAmount,
      grossCOD,
      expenseDeduction,
      cashAmount: parsedCash,
      onlineAmount: parsedOnline,
      onlineReference: onlineReference || '',
      packageIds,
      status: 'Pending Verification',
      remarks: remarks || '',
    });

    if (req.io) {
      req.io.to(`user_${riderId}`).emit('notification', {
        id: `handover_${handover._id}`,
        title: 'COD Handover Submitted',
        message: `Your COD handover of Rs. ${netHandoverAmount.toLocaleString()} has been submitted.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        path: '/rider/wallet',
        type: 'info'
      });
      req.io.to('role_dispatcher').to('role_admin').emit('notification', {
        id: `handover_${handover._id}`,
        title: 'New COD Handover',
        message: `${req.user.name || 'A rider'} submitted COD handover of Rs. ${netHandoverAmount.toLocaleString()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        path: '/dispatcher/handovers',
        type: 'info'
      });
    }

    res.status(201).json({ success: true, data: handover, message: 'Handover request submitted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/rider/cod-handovers
export const getRiderCodHandovers = async (req, res) => {
  try {
    const riderId = req.user._id;
    const handovers = await CodHandover.find({ riderId })
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ success: true, data: handovers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
