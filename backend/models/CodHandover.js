import mongoose from 'mongoose';

const codHandoverSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    packageIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    }],
    status: {
      type: String,
      enum: ['Pending Verification', 'Verified', 'Rejected'],
      default: 'Pending Verification',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast lookups
codHandoverSchema.index({ riderId: 1, status: 1 });
codHandoverSchema.index({ riderId: 1, createdAt: -1 });
codHandoverSchema.index({ status: 1, createdAt: -1 });
codHandoverSchema.index({ createdAt: -1 });

const CodHandover = mongoose.model('CodHandover', codHandoverSchema);
export default CodHandover;
