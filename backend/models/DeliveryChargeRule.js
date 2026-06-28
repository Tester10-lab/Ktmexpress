import mongoose from 'mongoose';

/**
 * DeliveryChargeRule — Branch-to-branch + weight-based pricing rules.
 * Admin creates rules; the calculation endpoint uses them to auto-price deliveries.
 *
 * Calculation:  charge = baseCharge + max(0, weight - weightLimit) * perKgCharge
 */
const deliveryChargeRuleSchema = new mongoose.Schema(
  {
    fromBranch: {
      type: String,
      required: true,
      trim: true,
    },
    toBranch: {
      type: String,
      required: true,
      trim: true,
    },
    baseCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    perKgCharge: {
      type: Number,
      min: 0,
      default: 0,
    },
    weightLimit: {
      // Weight (kg) included in base charge. Extra weight above this is charged per kg.
      type: Number,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index: ensure no duplicate active rule for the same route
deliveryChargeRuleSchema.index({ fromBranch: 1, toBranch: 1 });

export default mongoose.model('DeliveryChargeRule', deliveryChargeRuleSchema);
