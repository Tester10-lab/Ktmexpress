import mongoose from 'mongoose';

const pickupRequestSchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'completed'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

pickupRequestSchema.index({ vendorId: 1, status: 1 });
pickupRequestSchema.index({ assignedRiderId: 1 });

export default mongoose.model('PickupRequest', pickupRequestSchema);
