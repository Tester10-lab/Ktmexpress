import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

commentSchema.index({ packageId: 1, createdAt: -1 });

// Soft delete query middleware
const excludeSoftDeleted = function(next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
};
commentSchema.pre('find', excludeSoftDeleted);
commentSchema.pre('findOne', excludeSoftDeleted);
commentSchema.pre('findOneAndUpdate', excludeSoftDeleted);
commentSchema.pre('countDocuments', excludeSoftDeleted);

export default mongoose.model('Comment', commentSchema);
