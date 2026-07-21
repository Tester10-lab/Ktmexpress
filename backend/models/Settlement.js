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
  paidAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Partially Paid', 'Rejected'],
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
  paidAt: {
    type: Date,
    default: null,
  },
  reference: {
    type: String,
    default: '',
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cash', 'Cheque', 'Other', ''],
    default: '',
  },
}, { timestamps: true });

settlementSchema.index({ vendorId: 1, createdAt: -1 });
settlementSchema.index({ status: 1, createdAt: -1 });
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
