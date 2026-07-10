import mongoose from 'mongoose';
import User from '../models/User.js';
import Package from '../models/Package.js';

export const getRiderHistory = async (req, res) => {
  try {
    const { id: riderId } = req.params;
    const { 
      page = 1, 
      limit = 10,
      startDate,
      endDate,
      status,
      vendorSearch,
      packageType // 'inside', 'outside'
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Verify rider exists
    const rider = await User.findOne({ _id: riderId, role: 'rider' }).select('-password');
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found.' });
    }

    // Base match for packages where this rider was ever involved
    const baseMatch = {
      $or: [
        { riderId: new mongoose.Types.ObjectId(riderId) },
        { 'timeline.riderId': new mongoose.Types.ObjectId(riderId) }
      ]
    };

    // Advanced Filters
    if (startDate || endDate) {
      baseMatch.createdAt = {};
      if (startDate) baseMatch.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        baseMatch.createdAt.$lte = end;
      }
    }
    if (status) {
      baseMatch.status = status;
    }
    if (packageType) {
      baseMatch.outOfValley = packageType === 'outside';
    }
    if (vendorSearch) {
      const vendorUsers = await User.find({
        role: 'vendor',
        $or: [
          { name: { $regex: vendorSearch, $options: 'i' } },
          { email: { $regex: vendorSearch, $options: 'i' } },
          { 'vendorMeta.shopName': { $regex: vendorSearch, $options: 'i' } }
        ]
      }).select('_id');
      const vendorIds = vendorUsers.map(v => v._id);
      baseMatch.vendorId = { $in: vendorIds };
    }

    // 1. Fetch historical packages
    const totalPackages = await Package.countDocuments(baseMatch);
    
    // Package list for the table (paginated)
    const packages = await Package.find(baseMatch)
      .populate('vendorId', 'name email phone vendorMeta')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // 2. Compute Statistics
    const allInvolvedPackages = await Package.find({
      $or: [
        { riderId: new mongoose.Types.ObjectId(riderId) },
        { 'timeline.riderId': new mongoose.Types.ObjectId(riderId) }
      ]
    });

    let stats = {
      totalAssigned: 0,
      totalPickups: 0,
      totalDeliveries: 0,
      insideValleyDeliveries: 0,
      outsideValleyDeliveries: 0,
      totalReturned: 0,
      totalFailed: 0,
      totalCodCollected: 0,
      totalCodSettled: 0,
      activePackages: 0,
      successRate: 0,
      averageDeliveryTime: 0,
    };

    let totalDeliveryTimeMs = 0;
    let deliveryCountWithTime = 0;

    for (const pkg of allInvolvedPackages) {
      stats.totalAssigned += 1;
      
      const riderTimeline = pkg.timeline.filter(t => 
        (t.riderId && t.riderId.toString() === riderId) ||
        (t.user === rider.name)
      );

      const hasPickup = riderTimeline.some(t => t.status === 'Picked Up');
      if (hasPickup) stats.totalPickups += 1;

      const hasDelivery = riderTimeline.some(t => t.status === 'Delivered');
      if (hasDelivery) {
        stats.totalDeliveries += 1;
        if (pkg.outOfValley) stats.outsideValleyDeliveries += 1;
        else stats.insideValleyDeliveries += 1;

        if (pkg.codCollected) stats.totalCodCollected += pkg.amount;
        if (pkg.vendorPaid) stats.totalCodSettled += pkg.amount;

        // Calculate delivery time
        const assignedEvent = riderTimeline.find(t => t.status === 'Sent to Delivery' || t.status === 'Sent for Delivery');
        const deliveryEvent = riderTimeline.find(t => t.status === 'Delivered');
        if (assignedEvent && deliveryEvent) {
          const assignedTime = new Date(assignedEvent.time);
          const deliveredTime = new Date(deliveryEvent.time);
          if (!isNaN(assignedTime) && !isNaN(deliveredTime)) {
             totalDeliveryTimeMs += (deliveredTime - assignedTime);
             deliveryCountWithTime += 1;
          }
        }
      }

      const hasReturn = riderTimeline.some(t => t.status === 'Returned' || t.status === 'Returned to Vendor');
      if (hasReturn) stats.totalReturned += 1;

      const hasFail = riderTimeline.some(t => t.status === 'Cancelled');
      if (hasFail) stats.totalFailed += 1;

      if (['Pick Up Requested', 'Out for Delivery', 'Postponed'].includes(pkg.status) && pkg.riderId && pkg.riderId.toString() === riderId) {
        stats.activePackages += 1;
      }
    }

    if (stats.totalDeliveries + stats.totalFailed > 0) {
       stats.successRate = (stats.totalDeliveries / (stats.totalDeliveries + stats.totalFailed)) * 100;
    }

    if (deliveryCountWithTime > 0) {
       const avgMs = totalDeliveryTimeMs / deliveryCountWithTime;
       stats.averageDeliveryTime = (avgMs / (1000 * 60 * 60)).toFixed(1); // Hours
    }

    // 3. Compile Activity Timeline
    let timelineEntries = [];
    packages.forEach(pkg => {
      const riderTimeline = pkg.timeline.filter(t => 
        (t.riderId && t.riderId.toString() === riderId) || 
        (t.user === rider.name)
      );
      
      riderTimeline.forEach(entry => {
        timelineEntries.push({
          time: entry.time,
          status: entry.status,
          message: entry.message,
          trackingCode: pkg.trackingCode,
          vendorShopName: getVendorDisplayName(pkg.vendorId, "") || 'Unknown',
          customerName: pkg.customerName,
          amount: pkg.amount,
        });
      });
    });

    timelineEntries.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      success: true,
      data: {
        rider,
        stats,
        packages,
        timeline: timelineEntries,
        totalPages: Math.ceil(totalPackages / limitNumber),
        currentPage: pageNumber,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
