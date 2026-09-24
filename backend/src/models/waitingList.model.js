const mongoose = require('mongoose');
const { WAITING_LIST_STATUS } = require('../constants');

const waitingListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorSchedule',
      required: [true, 'Schedule reference is required'],
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    patient: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      gender: { type: String, required: true },
      phone: { type: String, required: true },
    },
    position: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    status: {
      type: String,
      enum: Object.values(WAITING_LIST_STATUS),
      default: WAITING_LIST_STATUS.WAITING,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active waiting list entry for same user, schedule and session
waitingListSchema.index(
  { user: 1, schedule: 1, sessionId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: WAITING_LIST_STATUS.WAITING },
  }
);

waitingListSchema.index({ schedule: 1, sessionId: 1, position: 1, status: 1 });

module.exports = mongoose.model('WaitingList', waitingListSchema);
