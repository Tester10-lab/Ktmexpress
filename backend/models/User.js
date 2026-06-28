import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'vendor', 'dispatcher', 'rider'],
      required: [true, 'Role is required'],
    },
    contact: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },
    vendorMeta: {
      shopName: { type: String, default: '' },
      defaultKtmRate: { type: Number, default: 150 },
      defaultOutsideRate: { type: Number, default: 200 },
      weightSurcharge: { type: Number, default: 50 },
      customFlatRate: { type: Number, default: null }, // If set, overrides all other rules
      useGlobalPricing: { type: Boolean, default: true }, // Whether to use global settings vs vendor overrides
    },
    riderMeta: {
      monthlyTarget: { type: Number, default: 0 },
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  // if lock expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  // increment
  const updates = { $inc: { loginAttempts: 1 } };
  // lock account if attempts >= 5
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // lock for 15 minutes
  }
  return this.updateOne(updates);
};

// Soft delete default query middleware
const excludeSoftDeleted = function(next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
};
userSchema.pre('find', excludeSoftDeleted);
userSchema.pre('findOne', excludeSoftDeleted);
userSchema.pre('findOneAndUpdate', excludeSoftDeleted);
userSchema.pre('countDocuments', excludeSoftDeleted);

userSchema.index({ role: 1 });
userSchema.index({ deletedAt: 1 });

const User = mongoose.model('User', userSchema);
export default User;
