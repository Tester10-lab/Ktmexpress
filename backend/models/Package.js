import mongoose from 'mongoose';
import RiderSubmissionSchema from './schemas/RiderSubmissionSchema.js';
import VerificationDraftSchema from './schemas/VerificationDraftSchema.js';
import VerificationAuditSchema from './schemas/VerificationAuditSchema.js';
import FinancialAdjustmentSchema from './schemas/FinancialAdjustmentSchema.js';
import TimelineEntrySchema from './schemas/TimelineEntrySchema.js';
import { PACKAGE_STATUSES } from '../constants/packageStatus.js';
import { VERIFICATION_STATUSES } from '../constants/verificationStatus.js';
import { SETTLEMENT_STATUSES } from '../constants/settlementStatus.js';
import { PAYMENT_METHODS } from '../constants/paymentMethod.js';

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
    // ─── Settlement Fields ──────────────────────────────────────────────
    vendorReceivable: {
      type: Number,
      default: 0,
    },

    codVerified: {
      type: Boolean,
      default: false,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    settlementStatus: {
      type: String,
      enum: SETTLEMENT_STATUSES,
      default: 'Pending',
    },
    // ─── Verification & Enterprise Fields ───────────────────────────────
    deliveryVerificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'Pending',
    },
    codVerificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Short', 'Excess'],
      default: 'Pending',
    },
    holdReason: {
      type: String,
      default: '',
    },
    rejectReason: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'Cash',
    },
    collectionType: {
      type: String,
      default: '',
    },
    riderSubmission: {
      type: RiderSubmissionSchema,
      default: null,
    },
    verificationDraft: {
      type: VerificationDraftSchema,
      default: null,
    },
    financialAdjustments: [FinancialAdjustmentSchema],
    verificationAudit: [VerificationAuditSchema],
    verificationStartedAt: {
      type: Date,
      default: null,
    },
    verificationCompletedAt: {
      type: Date,
      default: null,
    },
    verificationDuration: {
      type: Number,
      default: 0,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    hubId: {
      type: String,
      default: '',
    },
    zoneId: {
      type: String,
      default: '',
    },
    verificationDeletedAt: {
      type: Date,
      default: null,
    },
    verificationDeletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verificationDeleteReason: {
      type: String,
      default: '',
    },
    // ─── End Verification Fields ────────────────────────────────────────
    deliveryDate: {
      type: Date,
      default: null,
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
      enum: PACKAGE_STATUSES,
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
    timeline: [TimelineEntrySchema],
    rtvSignoff: {
      riderReturned: { type: Boolean, default: false },
      vendorReceived: { type: Boolean, default: false },
    },
    cashReconciled: {
      type: Boolean,
      default: false,
    },
    vendorPaid: {
      type: Boolean,
      default: false,
    },
    isSettling: {
      type: Boolean,
      default: false,
      index: true,
    },
    replacementPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null,
    },
    originalPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    originalValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
packageSchema.index({ vendorId: 1, status: 1 });
packageSchema.index({ riderId: 1, status: 1 });
packageSchema.index({ status: 1 });
packageSchema.index({ createdAt: -1 });
packageSchema.index({ invoiceId: 1 });
packageSchema.index({ deletedAt: 1 });
packageSchema.index({ status: 1, createdAt: -1 });
packageSchema.index({ trackingCode: 1, deletedAt: 1 });
// Analytics indexes
packageSchema.index({ status: 1, updatedAt: -1 });
packageSchema.index({ vendorId: 1, createdAt: -1, status: 1 });
packageSchema.index({ riderId: 1, status: 1, updatedAt: -1 });
// Settlement indexes
packageSchema.index({ settlementStatus: 1, vendorId: 1 });
packageSchema.index({ codVerified: 1, vendorPaid: 1 });
// Verification indexes
packageSchema.index({ deliveryVerificationStatus: 1 });
packageSchema.index({ codVerificationStatus: 1 });
packageSchema.index({ verifiedAt: -1 });

// Soft delete query middleware
const excludeSoftDeleted = function(next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
};
packageSchema.pre('find', excludeSoftDeleted);
packageSchema.pre('findOne', excludeSoftDeleted);
packageSchema.pre('findOneAndUpdate', excludeSoftDeleted);
packageSchema.pre('countDocuments', excludeSoftDeleted);

// Auto-calculate vendorReceivable whenever amount or deliveryCharge changes
packageSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('deliveryCharge') || this.isNew) {
    this.vendorReceivable = Math.max(0, (this.amount || 0) - (this.deliveryCharge || 0));
  }
  next();
});

const Package = mongoose.model('Package', packageSchema);
export default Package;
