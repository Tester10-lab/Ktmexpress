import Package from '../models/Package.js';
import ScanEvent from '../models/ScanEvent.js';

// ─── Status Transition Machine ───────────────────────────────────────────────
// Defines valid next statuses for each current status, per role
const TRANSITIONS = {
  dispatcher: {
    'Pick Up Requested': 'Picked Up',
    'Picked Up':         'In Warehouse',
    'In Warehouse':      'Sorted',
    'Returned':          'Returned to Vendor',
  },
  rider: {
    'Sorted':            'Out for Delivery',
    'Out for Delivery':  'Delivered',
  },
  // Riders can also return — separate from the main chain
};

// Riders can mark Out for Delivery → Returned
const RIDER_RETURN = {
  'Out for Delivery': 'Returned',
};

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

  const map = TRANSITIONS[role] || {};
  const expectedTo = map[currentStatus];

  if (role === 'rider' && action === 'Returned') {
    if (RIDER_RETURN[currentStatus]) return { allowed: true, toStatus: 'Returned' };
    return { allowed: false, reason: `Cannot mark Returned from "${currentStatus}"` };
  }

  if (!expectedTo) {
    return { allowed: false, reason: `Your role (${ROLE_LABELS[role]}) cannot scan packages with status "${currentStatus}"` };
  }
  return { allowed: true, toStatus: expectedTo };
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
    console.error('[SCAN ERROR]', err);
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

    const results = [];
    const errors  = [];

    for (const rawCode of trackingCodes) {
      const code = rawCode.trim().toUpperCase();
      try {
        const pkg = await Package.findOne({ trackingCode: code });
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
      .sort({ createdAt: -1 });
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
      .sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/scan/my-history ─────────────────────────────────────────────────
export const getMyScanHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [events, total] = await Promise.all([
      ScanEvent.find({ scannedBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ScanEvent.countDocuments({ scannedBy: req.user._id }),
    ]);
    res.json({
      success: true,
      data: events,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
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
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [events, total] = await Promise.all([
      ScanEvent.find(filter)
        .populate('scannedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ScanEvent.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: events,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
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
    const map = TRANSITIONS[role] || {};
    const nextStatus = map[pkg.status] || (role === 'rider' && RIDER_RETURN[pkg.status] ? 'Returned' : null);
    const canScan = !!nextStatus || role === 'admin';
    res.json({
      success: true,
      data: {
        package: pkg,
        canScan,
        nextStatus,
        allowedActions: role === 'rider' && pkg.status === 'Out for Delivery'
          ? ['Delivered', 'Returned']
          : nextStatus ? [nextStatus] : [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
