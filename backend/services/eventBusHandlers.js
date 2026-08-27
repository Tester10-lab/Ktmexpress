import eventBus from './eventBus.js';
import logger from '../utils/logger.js';

eventBus.on('package.rider_submitted', ({ pkg, reqUser, io }) => {
  logger.info(`Event: package.rider_submitted for package ${pkg.trackingCode} by rider ${reqUser.name}`);
  
  // Real-time socket notify to Vendor
  if (io && pkg.vendorId) {
    io.to(`user_${pkg.vendorId}`).emit('notification', {
      title: `Package ${pkg.riderSubmission.status}!`,
      message: `Rider ${reqUser.name} marked package ${pkg.trackingCode} as ${pkg.riderSubmission.status}. Pending Admin Verification.`,
      type: 'package_rider_submitted'
    });
  }
});

eventBus.on('package.verified', ({ pkg, reqUser, io, isAdjustment, originalRiderAmount, finalAmount, reason }) => {
  logger.info(`Event: package.verified for package ${pkg.trackingCode} by ${reqUser?.name || 'staff'}`);
  
  // Notify Rider of verification / edits
  if (io && pkg.riderId) {
    const riderTarget = pkg.riderId._id ? pkg.riderId._id.toString() : pkg.riderId.toString();
    let msg = `Your delivery for ${pkg.trackingCode} has been verified and accepted by ${reqUser?.name || 'Dispatcher'}.`;
    if (isAdjustment) {
      msg = `COD adjusted for ${pkg.trackingCode}: Rs. ${originalRiderAmount} -> Rs. ${finalAmount}. Reason: ${reason}`;
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
      createdAt: new Date().toISOString()
    });
  }

  // Notify Vendor that package is verified
  if (io && pkg.vendorId) {
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
      createdAt: new Date().toISOString()
    });
  }
});

eventBus.on('package.reopened', ({ pkg, reqUser, io }) => {
  logger.info(`Event: package.reopened for package ${pkg.trackingCode} by superadmin ${reqUser.name}`);
  
  // Notify Rider
  if (io && pkg.riderId) {
    io.to(`user_${pkg.riderId}`).emit('notification', {
      title: 'Verification Reopened',
      message: `Super Admin reopened verification for package ${pkg.trackingCode}. It is pending verification again.`,
      type: 'package_reopened'
    });
  }
});

eventBus.on('package.draft_saved', ({ pkg, reqUser, io }) => {
  logger.info(`Event: package.draft_saved for package ${pkg.trackingCode} by admin ${reqUser.name}`);
  
  // Notify Rider
  if (io && pkg.riderId) {
    io.to(`user_${pkg.riderId}`).emit('notification', {
      title: 'Verification Draft Updated',
      message: `Admin updated a verification draft for package ${pkg.trackingCode}.`,
      type: 'package_draft_saved'
    });
  }
});
