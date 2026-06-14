import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
      unique: true, // Only one return request per package
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'Customer Refused',
        'Customer Not Available',
        'Address Not Found',
        'Wrong Item Sent',
        'Damaged Item',
        'Other'
      ]
    },
    notes: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '', // Optional supporting image
    },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'In Transit', 'Returned To Vendor'],
      default: 'Requested',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

returnRequestSchema.index({ vendorId: 1, status: 1 });
returnRequestSchema.index({ packageId: 1 });

// Soft delete query middleware
const excludeSoftDeleted = function(next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
};
returnRequestSchema.pre('find', excludeSoftDeleted);
returnRequestSchema.pre('findOne', excludeSoftDeleted);
returnRequestSchema.pre('findOneAndUpdate', excludeSoftDeleted);
returnRequestSchema.pre('countDocuments', excludeSoftDeleted);

export default mongoose.model('ReturnRequest', returnRequestSchema);
