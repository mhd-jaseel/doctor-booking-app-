const mongoose = require('mongoose');

const healthcareServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Healthcare service name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: 'medical',
      trim: true,
    },
    facilityType: {
      type: String,
      default: null,
      trim: true,
    },
    mode: {
      type: String,
      default: null,
      trim: true,
    },
    color: {
      type: String,
      default: '#2F65CB',
    },
    bgColor: {
      type: String,
      default: '#EFF6FF',
    },
    borderColor: {
      type: String,
      default: '#BFDBFE',
    },
    displayOrder: {
      type: Number,
      default: 1,
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

healthcareServiceSchema.index({ displayOrder: 1, createdAt: 1 });
// slug has unique:true in the field definition — no duplicate index needed
healthcareServiceSchema.index({ isActive: 1 });

module.exports = mongoose.model('HealthcareService', healthcareServiceSchema);
