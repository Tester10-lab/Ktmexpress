import Package from '../models/Package.js';
import ScanEvent from '../models/ScanEvent.js';
import logger from '../utils/logger.js';

import { canTransition, getDefaultNextStatus, getAllowedActions } from '../services/packageTransitions.js';

// Label map for UI display
const ROLE_LABELS = {
  dispatcher: 'Warehouse Staff',
  rider:      'Delivery Rider',
  admin:      'Admin',
  vendor:     'Vendor',
};

// ─── Helper: resolve next status from action ─────────────────────────────────
function resolveTransition(currentStatus, role, action) {
  if (role === 'admin') return { allowed: true, toStatus: action }; // admin can set any

  let toStatus = action;
  if (!toStatus) {
    toStatus = getDefaultNextStatus(currentStatus, role);
    if (!toStatus) {
      return { allowed: false, reason: `Your role (${ROLE_LABELS[role]}) cannot scan packages with status "${currentStatus}"` };
    }
  }

  const result = canTransition(currentStatus, toStatus, role);
  if (!result.allowed) {
    // If the error message didn't use role labels, we could inject it here, but the default generic is fine
    return { allowed: false, reason: result.reason || `Your role (${ROLE_LABELS[role]}) cannot perform this scan.` };
  }
  
  return { allowed: true, toStatus };
}

// ─── POST /api/scan ───────────────────────────────────────────────────────────
export const scanPackage = async (req, res) => {
  try {
    const { trackingCode, action, location = '', notes = '' } = req.body;
    const user = req.user;
    const role = user.role;

    if (!trackingCode) {
      return res.status(400).json({ success: false, message: 'Tracking code is required.' });
    }

    const pkg = await Package.findOne({ trackingCode: trackingCode.trim().toUpperCase() })
      .populate('vendorId', 'name')
      .populate('riderId', 'name');

    if (!pkg) {
      return res.status(404).json({ success: false, message: `No package found with tracking code "${trackingCode}".` });
    }

    // Determine toStatus
    let toStatus;
    if (role === 'admin') {
      // Admin override — action IS the target status
      if (!action) return res.status(400).json({ success: false, message: 'Admin override requires a target status.' });
      toStatus = action;
    } else {
      // Derive toStatus from the current status transition map
      const resolved = resolveTransition(pkg.status, role, action);
      if (!resolved.allowed) {
        return res.status(409).json({ success: false, message: resolved.reason });
      }
      toStatus = resolved.toStatus;
    }

    const fromStatus = pkg.status;
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const deviceInfo = req.headers['user-agent']?.substring(0, 200) || '';

    // Create immutable ScanEvent
    const scanEvent = await ScanEvent.create({
      packageId:    pkg._id,
      trackingCode: pkg.trackingCode,
      scannedBy:    user._id,
      scannerName:  user.name,
      scannerRole:  role,
      action:       toStatus,
      fromStatus,
      toStatus,
      location,
      notes,
      deviceInfo,
      isAdminOverride: role === 'admin',
    });

    // Update package status + append timeline entry
    pkg.status = toStatus;
    pkg.timeline.push({
      time:        ts,
      status:      toStatus,
      message:     notes || `Package scanned by ${ROLE_LABELS[role] || role}${location ? ` at ${location}` : ''}`,
      user:        user.name,
      role:        ROLE_LABELS[role] || role,
      location:    location,
      scannedBy:   user._id,
      scanEventId: scanEvent._id,
    });

    // Auto-assign rider for "Out for Delivery" if not already assigned
    if (toStatus === 'Out for Delivery' && !pkg.riderId) {
      pkg.riderId = user._id;
    }

    await pkg.save();

    return res.json({
      success: true,
      message: `✓ Package "${pkg.trackingCode}" status updated to "${toStatus}"`,
      data: {
        package:   pkg,
        scanEvent: scanEvent,
      },
    });
  } catch (err) {
    logger.error('[SCAN ERROR]', { stack: err.stack, error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/scan/bulk ─────────────────────────────────────────────────────
export const bulkScan = async (req, res) => {
  try {
    const { trackingCodes, action, location = '', notes = '' } = req.body;
    const user = req.user;
    const role = user.role;

    if (!Array.isArray(trackingCodes) || trackingCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'trackingCodes array is required.' });
    }

    // Normalize codes and batch-fetch all packages in one query
    const normalizedCodes = trackingCodes.map(c => c.trim().toUpperCase());
    const packages = await Package.find({ trackingCode: { $in: normalizedCodes } });
    const pkgMap = new Map(packages.map(p => [p.trackingCode, p]));

    const results = [];
    const errors  = [];

    for (const code of normalizedCodes) {
      try {
        const pkg = pkgMap.get(code);
        if (!pkg) {
          errors.push({ code, error: 'Not found' });
          continue;
        }

        let toStatus;
        if (role === 'admin') {
          toStatus = action;
        } else {
          const resolved = resolveTransition(pkg.status, role, action);
          if (!resolved.allowed) {
            errors.push({ code, error: resolved.reason });
            continue;
          }
          toStatus = resolved.toStatus;
        }

        const fromStatus = pkg.status;
        const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const deviceInfo = req.headers['user-agent']?.substring(0, 200) || '';

        const scanEvent = await ScanEvent.create({
          packageId:    pkg._id,
          trackingCode: pkg.trackingCode,
          scannedBy:    user._id,
          scannerName:  user.name,
          scannerRole:  role,
          action:       toStatus,
          fromStatus,
          toStatus,
          location,
          notes,
          deviceInfo,
          isAdminOverride: role === 'admin',
        });

        pkg.status = toStatus;
        pkg.timeline.push({
          time:        ts,
          status:      toStatus,
          message:     notes || `Bulk scan by ${ROLE_LABELS[role] || role}${location ? ` at ${location}` : ''}`,
          user:        user.name,
          role:        ROLE_LABELS[role] || role,
          location,
          scannedBy:   user._id,
          scanEventId: scanEvent._id,
        });

        if (toStatus === 'Out for Delivery' && !pkg.riderId) {
          pkg.riderId = user._id;
        }

        await pkg.save();
        results.push({ code, toStatus, packageId: pkg._id });
      } catch (err) {
        errors.push({ code, error: err.message });
      }
    }

    res.json({
      success: true,
      data: { processed: results.length, failed: errors.length, results, errors },
      message: `Processed ${results.length} packages, ${errors.length} failed.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/scan/history/:packageId ────────────────────────────────────────
export const getScanHistory = async (req, res) => {
  try {
    const { packageId } = req.params;
    const events = await ScanEvent.find({ packageId })
      .populate('scannedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/scan/history-by-code/:trackingCode ─────────────────────────────
export const getScanHistoryByCode = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const events = await ScanEvent.find({ trackingCode: trackingCode.toUpperCase() })
      .populate('scannedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/scan/my-history ─────────────────────────────────────────────────
export const getMyScanHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const [events, total] = await Promise.all([
      ScanEvent.find({ scannedBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ScanEvent.countDocuments({ scannedBy: req.user._id }),
    ]);
    res.json({
      success: true,
      data: events,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/scan/all (admin only) ─────────────────────────────────────────
export const getAllScanHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, role, trackingCode, from, to } = req.query;
    const filter = {};
    if (role) filter.scannerRole = role;
    if (trackingCode) filter.trackingCode = trackingCode.toUpperCase();
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to + 'T23:59:59Z');
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const [events, total] = await Promise.all([
      ScanEvent.find(filter)
        .populate('scannedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ScanEvent.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: events,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/scan/lookup/:code (resolve a scanned code to package info) ────
export const lookupPackage = async (req, res) => {
  try {
    const code = req.params.code?.trim().toUpperCase();
    const pkg = await Package.findOne({ trackingCode: code })
      .populate('vendorId', 'name')
      .populate('riderId', 'name contact');
    if (!pkg) {
      return res.status(404).json({ success: false, message: `Package "${code}" not found.` });
    }
    // Also return what action this user's role can take
    const role = req.user.role;
    const allowedActions = getAllowedActions(pkg.status, role);
    const nextStatus = allowedActions.length > 0 ? allowedActions[0] : null;
    const canScan = allowedActions.length > 0;
    res.json({
      success: true,
      data: {
        package: pkg,
        canScan,
        nextStatus,
        allowedActions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
