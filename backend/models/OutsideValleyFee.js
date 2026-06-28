import mongoose from 'mongoose';

const outsideValleyFeeSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, 'City name is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    fee: {
      type: Number,
      required: [true, 'Fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// city index is created automatically by unique:true above

export default mongoose.model('OutsideValleyFee', outsideValleyFeeSchema);
