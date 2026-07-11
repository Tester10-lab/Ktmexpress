import mongoose from 'mongoose';

/**
 * ScanEvent — Immutable audit record for every QR/Barcode scan action.
 * Documents are never updated after creation; each scan creates a new document.
 */
const scanEventSchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    trackingCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scannerName: {
      type: String,
      required: true,
    },
    scannerRole: {
      type: String,
      required: true,
      enum: ['admin', 'vendor', 'dispatcher', 'rider'],
    },
    action: {
      type: String,
      required: true,
    },
    fromStatus: {
      type: String,
      required: true,
    },
    toStatus: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    deviceInfo: {
      type: String,
      default: '',
    },
    // For admin overrides — captures override reason
    isAdminOverride: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Prevent any document updates — enforce immutability at schema level
    strict: true,
  }
);

// Indexes for fast querying
scanEventSchema.index({ packageId: 1, createdAt: -1 });
scanEventSchema.index({ scannedBy: 1, createdAt: -1 });
scanEventSchema.index({ action: 1, createdAt: -1 });
scanEventSchema.index({ scannerRole: 1, createdAt: -1 });
scanEventSchema.index({ createdAt: -1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export default mongoose.model('ScanEvent', scanEventSchema);
