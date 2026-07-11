import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'global',
    },
    logoUrl: {
      type: String,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('SystemSettings', systemSettingsSchema);
