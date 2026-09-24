const mongoose = require('mongoose');
const { FACILITY_TYPES } = require('../constants');

// Stores healthcare facilities like hospitals or clinics.
const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital/Facility name is required'],
      trim: true,
    },
    facilityType: {
      type: String,
      required: [true, 'Facility type is required'],
      enum: Object.values(FACILITY_TYPES),
    },
    image: {
      type: String,
      default: '',
    },
    imageFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    workingHours: {
      type: String,
      default: '9:00 AM - 5:00 PM',
    },
    facilities: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

hospitalSchema.index({ name: 'text', city: 'text', facilityType: 'text' });
hospitalSchema.index({ facilityType: 1, isActive: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
