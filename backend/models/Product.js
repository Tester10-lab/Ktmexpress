import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  barcode: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  threshold: {
    type: Number,
    default: 5,
  },
  stockReceived: {
    type: Number,
    default: 0,
  },
  stockSold: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
