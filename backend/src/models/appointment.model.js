const mongoose = require('mongoose');
const { APPOINTMENT_STATUS } = require('../constants');

const patientSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Patient age is required'],
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age is invalid'],
    },
    gender: {
      type: String,
      required: [true, 'Patient gender is required'],
      enum: ['male', 'female', 'other'],
    },
    phone: {
      type: String,
      required: [true, 'Patient phone number is required'],
      trim: true,
    },
  },
  { _id: false }
);

// Represents an active or past booking for a patient.
const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital/Location reference is required'],
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
    sessionName: {
      type: String,
      trim: true,
      default: 'Consultation',
    },
    tokenNumber: {
      type: Number,
      required: [true, 'Token number is required'],
      min: 1,
    },
    date: {
      type: String,
      required: [true, 'Appointment date is required (YYYY-MM-DD)'],
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    patient: {
      type: patientSnapshotSchema,
      required: [true, 'Patient details are required'],
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.CONFIRMED,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL COMPOUND UNIQUE INDEX: Enforces race-condition protection per session & schedule
appointmentSchema.index(
  { schedule: 1, sessionId: 1, tokenNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { 
      status: { 
        $in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.IN_PROGRESS, APPOINTMENT_STATUS.COMPLETED] 
      } 
    },
  }
);

// Compound query index for user + doctor + date lookups & duplicate patient checks
appointmentSchema.index(
  {
    user: 1,
    doctor: 1,
    date: 1,
    'patient.name': 1,
    'patient.age': 1,
    'patient.phone': 1,
    status: 1,
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
