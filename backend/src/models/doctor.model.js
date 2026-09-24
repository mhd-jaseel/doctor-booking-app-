const mongoose = require('mongoose');

// Stores doctor profiles and handles facility relationships.
const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'male',
    },
    image: {
      type: String,
      default: '',
    },
    imageFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: 0,
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: 0,
    },
    about: {
      type: String,
      default: '',
    },

    // Doctor can practice in multiple facilities (hospitals/clinics)
    hospitals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
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

doctorSchema.index({ name: 'text', specialization: 'text' });
doctorSchema.index({ isActive: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
