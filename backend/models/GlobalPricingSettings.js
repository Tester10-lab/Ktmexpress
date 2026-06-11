import mongoose from 'mongoose';

const globalPricingSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'global',
    },
    ktmBaseRate: {
      type: Number,
      required: true,
      default: 150,
      min: 0,
    },
    weightSurchargePerKg: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('GlobalPricingSettings', globalPricingSettingsSchema);
