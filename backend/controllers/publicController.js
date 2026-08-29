import Package from '../models/Package.js';
import SystemSettings from '../models/SystemSettings.js';

// GET /api/public/track/:code
export const trackPackage = async (req, res) => {
  try {
    // Sanitize: allow only alphanumeric and hyphens, max length 20
    let rawCode = (req.params.code || '').trim();
    if (!rawCode) {
      return res.status(400).json({ success: false, message: 'Invalid tracking code or invoice ID.' });
    }

    if (rawCode.includes('http://') || rawCode.includes('https://') || rawCode.includes('code=')) {
      const matchQuery = rawCode.match(/[?&]code=([^&]+)/i);
      if (matchQuery && matchQuery[1]) {
        rawCode = decodeURIComponent(matchQuery[1]).trim();
      } else {
        const matchPath = rawCode.match(/\/track\/([a-zA-Z0-9-]+)/i);
        if (matchPath && matchPath[1]) {
          rawCode = matchPath[1].trim();
        }
      }
    }

    const cleanCode = rawCode.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();

    const pkg = await Package.findOne({
      $or: [
        { trackingCode: cleanCode },
        { trackingCode: rawCode.toUpperCase() },
        { invoiceId: rawCode },
        { invoiceId: { $regex: `^${rawCode.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, $options: 'i' } }
      ]
    }).populate('vendorId', 'name contact vendorMeta');
      
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found for the given tracking code or invoice ID.' });
    }

    // Sanitize the package data for public consumption
    const publicData = {
      trackingCode: pkg.trackingCode,
      invoiceId: pkg.invoiceId || '',
      status: pkg.status,
      customerName: pkg.customerName,
      customerPhone: pkg.customerPhone || '',
      address: pkg.address,
      city: pkg.city,
      outOfValley: pkg.outOfValley,
      weight: pkg.weight,
      packageAccess: pkg.packageAccess,
      items: pkg.items || [],
      amount: pkg.amount,
      paymentMethod: pkg.paymentMethod || 'Cash',
      deliveryCharge: pkg.deliveryCharge || 0,
      vendorId: pkg.vendorId,
      qrCodeUrl: pkg.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&data=${encodeURIComponent(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/track?code=${pkg.trackingCode}`)}`,
      barcodeUrl: pkg.barcodeUrl || `https://barcodeapi.org/api/128/${pkg.trackingCode}`,
      timeline: (pkg.timeline || []).map(t => ({
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
