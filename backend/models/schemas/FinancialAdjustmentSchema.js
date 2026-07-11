import mongoose from 'mongoose';

const financialAdjustmentSchema = new mongoose.Schema({
  originalAmount: { type: Number, required: true },
  adjustedAmount: { type: Number, required: true },
  difference: { type: Number, required: true },
  reason: { type: String, required: true },
  adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adjustedByName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default financialAdjustmentSchema;
