const mongoose = require('mongoose');

const LeadV2Schema = new mongoose.Schema(
  {
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    contactType: {
      type: String,
      enum: ['email', 'telegram', 'whatsapp', 'other'],
      default: 'other',
    },
    ip: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
  },
  {
    timestamps: true,
    collection: 'leads_v2', // separate collection from V1
  }
);

module.exports = mongoose.model('LeadV2', LeadV2Schema);
