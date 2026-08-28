import eventBus from './eventBus.js';
import logger from '../utils/logger.js';

eventBus.on('package.rider_submitted', ({ pkg, reqUser, io, action, comment }) => {
  logger.info(`Event: package.rider_submitted for package ${pkg.trackingCode} by rider ${reqUser?.name || 'Rider'}`);
  
  if (!io) return;
  const statusName = pkg.riderSubmission?.status || pkg.status;
  const riderName = reqUser?.name || 'Rider';
  const notifPayload = {
    id: `rider_sub_${pkg._id}_${Date.now()}`,
    title: `Pending Verification: ${pkg.trackingCode}`,
    message: `Rider ${riderName} submitted "${statusName}" for ${pkg.trackingCode}. Pending Verification.`,
    type: 'warning',
    packageId: pkg._id,
    trackingCode: pkg.trackingCode,
    status: statusName,
    path: '/dispatcher',
    createdAt: new Date().toISOString()
  };

  // 1. Notify Admins & Dispatchers
  io.to('role_admin').to('role_dispatcher').emit('notification', notifPayload);

  // 2. Real-time socket notify to Vendor
  if (pkg.vendorId) {
    const vId = pkg.vendorId._id ? pkg.vendorId._id.toString() : pkg.vendorId.toString();
    io.to(`user_${vId}`).emit('notification', {
      id: `rider_sub_vendor_${pkg._id}_${Date.now()}`,
      title: `Package ${statusName}: ${pkg.trackingCode}`,
      message: `Rider ${riderName} marked package ${pkg.trackingCode} as ${statusName}. Pending Verification.`,
      type: 'info',
      packageId: pkg._id,
      trackingCode: pkg.trackingCode,
      status: statusName,
      path: '/vendor/history',
      createdAt: new Date().toISOString()
    });
  }
});

eventBus.on('package.verified', ({ pkg, reqUser, io, isAdjustment, originalRiderAmount, finalAmount, reason }) => {
  logger.info(`Event: package.verified for package ${pkg.trackingCode} by ${reqUser?.name || 'staff'}`);
  
  if (!io) return;

  // 1. Notify Rider of verification / edits
  if (pkg.riderId) {
    const riderTarget = pkg.riderId._id ? pkg.riderId._id.toString() : pkg.riderId.toString();
    let msg = `Your delivery for ${pkg.trackingCode} has been verified and accepted by ${reqUser?.name || 'Dispatcher'}.`;
    if (isAdjustment) {
      msg = `COD adjusted for ${pkg.trackingCode}: Rs. ${originalRiderAmount} -> Rs. ${finalAmount}. Reason: ${reason || 'Correction'}`;
    }
    io.to(`user_${riderTarget}`).emit('notification', {
      id: `package_verified_${pkg._id}_${Date.now()}`,
      title: 'Delivery Verified & Accepted',
      message: msg,
      type: 'package_verified',
      packageId: pkg._id,
      trackingCode: pkg.trackingCode,
      deliveryVerificationStatus: 'Verified',
      status: pkg.status,
      path: '/rider/deliveries',
      createdAt: new Date().toISOString()
    });
  }

  // 2. Notify Vendor that package is verified
  if (pkg.vendorId) {
    const vendorTarget = pkg.vendorId._id ? pkg.vendorId._id.toString() : pkg.vendorId.toString();
    io.to(`user_${vendorTarget}`).emit('notification', {
      id: `package_verified_vendor_${pkg._id}_${Date.now()}`,
      title: 'Delivery Verified',
      message: `Package ${pkg.trackingCode} is verified as ${pkg.status}. COD: Rs. ${pkg.amount}.`,
      type: 'package_verified_vendor',
      packageId: pkg._id,
      trackingCode: pkg.trackingCode,
      deliveryVerificationStatus: 'Verified',
      status: pkg.status,
      path: '/vendor/history',
      createdAt: new Date().toISOString()
    });
  }

  // 3. Notify Admin and Dispatcher channels
  io.to('role_admin').to('role_dispatcher').emit('notification', {
    id: `verified_broadcast_${pkg._id}_${Date.now()}`,
    title: 'Package Verified',
    message: `${reqUser?.name || 'Staff'} verified package ${pkg.trackingCode} (${pkg.status}).`,
    type: 'success',
    packageId: pkg._id,
    trackingCode: pkg.trackingCode,
    deliveryVerificationStatus: 'Verified',
    status: pkg.status,
    path: '/dispatcher',
    createdAt: new Date().toISOString()
  });
});

eventBus.on('package.reopened', ({ pkg, reqUser, io }) => {
  logger.info(`Event: package.reopened for package ${pkg.trackingCode} by superadmin ${reqUser?.name || 'admin'}`);
  
  if (!io) return;
  const notifPayload = {
    id: `reopened_${pkg._id}_${Date.now()}`,
    title: 'Verification Reopened',
    message: `Verification for package ${pkg.trackingCode} has been reopened by ${reqUser?.name || 'Admin'}.`,
    type: 'warning',
    packageId: pkg._id,
    trackingCode: pkg.trackingCode,
    deliveryVerificationStatus: 'Pending',
    createdAt: new Date().toISOString()
  };

  io.to('role_admin').to('role_dispatcher').emit('notification', notifPayload);

  if (pkg.riderId) {
    const rId = pkg.riderId._id ? pkg.riderId._id.toString() : pkg.riderId.toString();
    io.to(`user_${rId}`).emit('notification', notifPayload);
  }
});

eventBus.on('package.draft_saved', ({ pkg, reqUser, io }) => {
  logger.info(`Event: package.draft_saved for package ${pkg.trackingCode} by admin ${reqUser?.name || 'admin'}`);
  
  if (!io) return;
  if (pkg.riderId) {
    const rId = pkg.riderId._id ? pkg.riderId._id.toString() : pkg.riderId.toString();
    io.to(`user_${rId}`).emit('notification', {
      id: `draft_saved_${pkg._id}_${Date.now()}`,
      title: 'Verification Draft Updated',
      message: `Admin updated verification draft for package ${pkg.trackingCode}.`,
      type: 'package_draft_saved',
      packageId: pkg._id,
      trackingCode: pkg.trackingCode,
      createdAt: new Date().toISOString()
    });
  }
});
