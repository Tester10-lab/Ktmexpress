import mongoose from 'mongoose';

const allowanceSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dailyAllowance: {
      type: Number,
      default: 500,
      min: 0,
    },
    weeklyAllowance: {
      type: Number,
      default: 3000,
      min: 0,
    },
    monthlyAllowance: {
      type: Number,
      default: 12000,
      min: 0,
    },
    period: {
      type: String,
      default: 'standard',
    },
  },
  { timestamps: true }
);

allowanceSchema.index({ riderId: 1 }, { unique: true });

export default mongoose.model('Allowance', allowanceSchema);
