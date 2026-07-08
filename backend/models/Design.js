const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide design title'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide price'],
    min: 0
  },
  category: {
    type: String,
    enum: ['Suit', 'Dress', 'Traditional', 'Alteration', 'Casual', 'Other'],
    default: 'Other'
  },
  daysToComplete: {
    type: Number,
    required: true,
    default: 14
  },
  imageUrl: {
    type: String,
    default: null
  },
  imageType: {
    type: String,
    enum: ['suit', 'dress', 'fabric', 'measuring', 'other'],
    default: 'other'
  },
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tailor',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Design', designSchema);
