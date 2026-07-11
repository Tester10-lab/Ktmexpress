import mongoose from 'mongoose';

const riderSubmissionSchema = new mongoose.Schema({
  status: { type: String, required: true },
  amount: { type: Number, required: true },
  comments: { type: String, default: '' },
  newDate: { type: Date, default: null },
  submittedAt: { type: Date, default: Date.now }
}, { _id: false });

export default riderSubmissionSchema;
