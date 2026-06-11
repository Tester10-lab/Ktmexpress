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
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
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

export default mongoose.model('Settlement', settlementSchema);
