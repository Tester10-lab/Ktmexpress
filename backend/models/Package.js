import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    status: { type: String, required: true },
    message: { type: String, default: '' },
    user: { type: String, default: 'System' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    scanEventId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { _id: false }
);

const lineItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: '' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const packageSchema = new mongoose.Schema(
  {
    trackingCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    invoiceId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
    },
    address: {
      type: String,
      required: [true, 'Delivery address is required'],
    },
    outOfValley: {
      type: Boolean,
      default: false,
    },
    city: {
      type: String,
      default: '',
    },
    weight: {
      type: Number,
      default: 0.5,
      min: 0.05,
    },
    packageAccess: {
      type: String,
      enum: ['sealed', 'open'],
      default: 'sealed',
    },
    items: [lineItemSchema],
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Pick Up Requested',
        'Picked Up',
        'In Warehouse',
        'Sorted',
        'Out for Delivery',
        'Delivered',
        'Postponed',
        'Cancelled',
        'Returned',
        'Returned to Vendor',
      ],
      default: 'Pending',
    },
    comments: {
      type: String,
      default: '',
    },
    qrCodeUrl: {
      type: String,
      default: '',
    },
    barcodeUrl: {
      type: String,
      default: '',
    },
    timeline: [timelineEntrySchema],
    rtvSignoff: {
      riderReturned: { type: Boolean, default: false },
      vendorReceived: { type: Boolean, default: false },
    },
    cashReconciled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
packageSchema.index({ vendorId: 1, status: 1 });
packageSchema.index({ riderId: 1, status: 1 });
// trackingCode index is created automatically by unique:true above

export default mongoose.model('Package', packageSchema);
