const mongoose = require('mongoose');

const consultationSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Consultation',
    },
    startTime: {
      type: String,
      required: [true, 'Session start time is required (e.g. 10:00 AM)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'Session end time is required (e.g. 01:00 PM)'],
      trim: true,
    },
    totalTokens: {
      type: Number,
      required: [true, 'Total tokens for session is required'],
      min: [1, 'Session must have at least 1 token'],
      max: [100, 'Session tokens cannot exceed 100'],
      default: 10,
    },
    consultationFee: {
      type: Number,
      default: 350,
      min: [0, 'Consultation fee cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// Manages token capacity and availability for a doctor on a given date.
const doctorScheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Location/Hospital reference is required'],
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for deterministic queries & indexes
      required: [true, 'Schedule date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must follow YYYY-MM-DD format'],
    },
    sessions: {
      type: [consultationSessionSchema],
      default: [],
    },
    // Top-level schedule backward-compatible aggregate fields
    totalTokens: {
      type: Number,
      min: [1, 'Total tokens must be at least 1'],
      max: [500, 'Total tokens cannot exceed 500'],
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    consultationFee: {
      type: Number,
      default: 350,
      min: [0, 'Consultation fee cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: compute top-level aggregations from sessions if sessions exist
doctorScheduleSchema.pre('save', function (next) {
  if (this.sessions && this.sessions.length > 0) {
    this.totalTokens = this.sessions.reduce((acc, s) => acc + (s.totalTokens || 0), 0);
    this.startTime = this.sessions[0]?.startTime || this.startTime;
    this.endTime = this.sessions[this.sessions.length - 1]?.endTime || this.endTime;
    if (this.sessions[0]?.consultationFee !== undefined) {
      this.consultationFee = this.sessions[0].consultationFee;
    }
  }
  next();
});

// CRITICAL INDEX: A doctor cannot have duplicate schedules for the exact same date and location
doctorScheduleSchema.index({ doctor: 1, location: 1, date: 1 }, { unique: true });
doctorScheduleSchema.index({ date: 1, isAvailable: 1 });

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
