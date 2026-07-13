import mongoose from 'mongoose';

const verificationAuditSchema = new mongoose.Schema({
  riderSubmission: {
    status: { type: String },
    amount: { type: Number },
    comments: { type: String },
    newDate: { type: Date },
    submittedAt: { type: Date }
  },
  previousAmount: { type: Number },
  updatedAmount: { type: Number },
  difference: { type: Number },
  previousStatus: { type: String },
  updatedStatus: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedByName: { type: String },
  editTime: { type: Date },
  verificationTime: { type: Date, default: Date.now },
  reason: { type: String },
  customRemarks: { type: String },
  action: { type: String, required: true }, // 'Verify', 'Save Draft', 'Reopen', 'Edit & Verify'
  ipAddress: { type: String },
  device: { type: String },
  browser: { type: String }
});

export default verificationAuditSchema;
