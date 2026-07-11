import mongoose from 'mongoose';

const changeSchema = new mongoose.Schema({
  field: { type: String, required: true },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const timelineEntrySchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    status: { type: String, required: true },
    message: { type: String, default: '' },
    user: { type: String, default: 'System' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    scanEventId: { type: mongoose.Schema.Types.ObjectId, default: null },
    type: { type: String, default: 'System' },
    changes: [changeSchema]
  },
  { _id: false }
);

export default timelineEntrySchema;
