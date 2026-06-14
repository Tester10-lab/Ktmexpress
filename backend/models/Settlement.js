import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedAmount: {
    type: Number,
    required: true,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalCOD: {
    type: Number,
    default: 0,
  },
  totalFees: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
    default: 'Pending',
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  adminNotes: {
    type: String,
    default: '',
  },
  packageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
  }],
}, { timestamps: true });

settlementSchema.index({ vendorId: 1 });
settlementSchema.index({ status: 1 });
settlementSchema.index({ deletedAt: 1 });

// Soft delete query middleware
const excludeSoftDeleted = function(next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
};
settlementSchema.pre('find', excludeSoftDeleted);
settlementSchema.pre('findOne', excludeSoftDeleted);
settlementSchema.pre('findOneAndUpdate', excludeSoftDeleted);
settlementSchema.pre('countDocuments', excludeSoftDeleted);

export default mongoose.model('Settlement', settlementSchema);
