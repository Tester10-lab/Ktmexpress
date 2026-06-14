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
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
expenseSchema.index({ date: -1 });
expenseSchema.index({ riderId: 1 });
expenseSchema.index({ deletedAt: 1 });

// Soft delete query middleware
const excludeSoftDeleted = function(next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
};
expenseSchema.pre('find', excludeSoftDeleted);
expenseSchema.pre('findOne', excludeSoftDeleted);
expenseSchema.pre('findOneAndUpdate', excludeSoftDeleted);
expenseSchema.pre('countDocuments', excludeSoftDeleted);

export default mongoose.model('Expense', expenseSchema);
