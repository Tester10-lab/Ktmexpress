import mongoose from 'mongoose';

const verificationDraftSchema = new mongoose.Schema({
  status: { type: String },
  amount: { type: Number },
  deliveryCharge: { type: Number },
  comments: { type: String },
  receiverName: { type: String },
  receiverPhone: { type: String },
  deliveryDate: { type: Date },
  holdReason: { type: String },
  rejectReason: { type: String },
  paymentMethod: { type: String },
  collectionType: { type: String },
  savedAt: { type: Date, default: Date.now },
  savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

export default verificationDraftSchema;
