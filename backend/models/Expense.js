import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['fuel', 'food', 'misc'],
      required: [true, 'Expense category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ riderId: 1, date: -1 });
expenseSchema.index({ riderId: 1, category: 1 });

export default mongoose.model('Expense', expenseSchema);
