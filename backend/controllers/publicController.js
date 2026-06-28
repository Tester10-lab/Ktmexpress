import Package from '../models/Package.js';

// GET /api/public/track/:code
export const trackPackage = async (req, res) => {
  try {
    const trackingCode = req.params.code.toUpperCase();
    
    // We populate the rider info but only select what's safe for public view
    const pkg = await Package.findOne({ trackingCode })
      .populate('riderId', 'name contact');
      
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Tracking code not found.' });
    }

    // Sanitize the package data for public consumption
    const publicData = {
      trackingCode: pkg.trackingCode,
      status: pkg.status,
      customerName: pkg.customerName.replace(/.(?=.{2})/g, '*'), // Mask part of name for privacy
      city: pkg.city,
      timeline: pkg.timeline.map(t => ({
        time: t.time,
        status: t.status,
        message: t.message ? t.message.replace(/by\s+[A-Za-z0-9\s_-]+/gi, '').trim() : '', // Strip "by AdminName" details
        location: t.location || ''
      })),
      rider: pkg.status === 'Out for Delivery' && pkg.riderId ? {
        name: pkg.riderId.name,
        contact: pkg.riderId.contact
      } : null,
      updatedAt: pkg.updatedAt
    };

    res.json({ success: true, data: publicData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
