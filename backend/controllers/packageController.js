import Package from '../models/Package.js';
import { uniqueTrackingCode, generateInvoiceId } from '../utils/helpers.js';
import { generateLabelUrls } from '../services/labelService.js';

// GET /api/packages
export const getAllPackages = async (req, res) => {
  try {
    const { status, search, vendor, rider, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (vendor) filter.vendorId = vendor;
    if (rider) filter.riderId = rider;
    if (search) {
      filter.$or = [
        { trackingCode: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { invoiceId: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [packages, total] = await Promise.all([
      Package.find(filter)
        .populate('vendorId', 'name vendorMeta')
        .populate('riderId', 'name contact')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Package.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: packages,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/packages/:code
export const getPackageByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const pkg = await Package.findOne({
      $or: [
        { trackingCode: code.toUpperCase() },
        { invoiceId: code.toUpperCase() },
      ],
    })
      .populate('vendorId', 'name vendorMeta')
      .populate('riderId', 'name contact')
      .lean();

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: `No package found with code "${code}".`,
      });
    }

    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/packages/:id
export const updatePackage = async (req, res) => {
  try {
    const { amount, address, comments, deliveryDate, status } = req.body;

    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (amount !== undefined) pkg.amount = amount;
    if (address !== undefined) pkg.address = address;
    if (comments !== undefined) pkg.comments = comments;
    if (status !== undefined) pkg.status = status;

    pkg.timeline.push({
      time: ts,
      status: 'Admin Override',
      message: `Package details updated by admin. ${comments || ''}`,
      user: req.user.name,
    });

    await pkg.save();
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/packages
export const createPackage = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      address,
      outOfValley,
      city,
      weight,
      packageAccess,
      items,
      amount,
      deliveryCharge,
    } = req.body;

    // Generate unique tracking code
    const trackingCode = await uniqueTrackingCode();
    const labelUrls = generateLabelUrls(trackingCode);

    // Generate concurrency-safe invoice ID
    const invoiceId = generateInvoiceId();

    const ts = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const pkg = await Package.create({
      trackingCode,
      invoiceId,
      customerName,
      customerPhone,
      address,
      outOfValley: outOfValley || false,
      city: city || '',
      weight: weight || 0.5,
      packageAccess: packageAccess || 'sealed',
      items: items || [],
      amount,
      deliveryCharge: deliveryCharge || 0,
      vendorId: req.user._id,
      ...labelUrls,
      status: 'Pending',
      timeline: [
        {
          time: ts,
          status: 'Invoice Created',
          message: `Vendor created package invoice ${invoiceId}`,
          user: req.user.name,
        },
      ],
    });

    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
