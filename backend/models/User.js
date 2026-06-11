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
    lastActive: {
      type: Date,
      default: Date.now,
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

export default mongoose.model('User', userSchema);
