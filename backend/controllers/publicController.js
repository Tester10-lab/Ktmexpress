import Package from '../models/Package.js';
import SystemSettings from '../models/SystemSettings.js';

// GET /api/public/track/:code
export const trackPackage = async (req, res) => {
  try {
    // Sanitize: allow only alphanumeric and hyphens, max length 20
    const rawCode = req.params.code || '';
    const trackingCode = rawCode.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().trim();
    
    if (!trackingCode) {
      return res.status(400).json({ success: false, message: 'Invalid tracking code format.' });
    }

    // We don't populate rider info for public view to protect privacy
    const pkg = await Package.findOne({ trackingCode });
      
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Tracking code not found.' });
    }

    // Sanitize the package data for public consumption
    const publicData = {
      trackingCode: pkg.trackingCode,
      status: pkg.status,
      timeline: pkg.timeline.map(t => ({
        time: t.time,
        status: t.status,
        message: t.message ? t.message.replace(/by\s+[A-Za-z0-9\s_-]+/gi, '').trim() : '', // Strip "by AdminName" details
        location: t.location || ''
      })),
      updatedAt: pkg.updatedAt
    };

    res.json({ success: true, data: publicData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/public/settings
export const getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findById('global');
    res.json({ success: true, data: settings || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};
