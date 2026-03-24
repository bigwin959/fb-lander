const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
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
    page: {
      type: String,
      default: 'cricket-lander',
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

module.exports = mongoose.model('Lead', LeadSchema);
