const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Please provide customer name']
  },
  customerPhone: {
    type: String,
    required: [true, 'Please provide phone number']
  },
  customerEmail: {
    type: String,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  customerAddress: {
    type: String,
    required: true
  },
  design: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design',
    required: true
  },
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tailor',
    required: true
  },
  bookingDate: {
    type: Date,
    required: [true, 'Please provide booking date']
  },
  bookingTime: {
    type: String,
    required: [true, 'Please provide booking time'],
    enum: [
      '10:00 AM', '11:00 AM', '12:00 PM',
      '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ]
  },
  status: {
    type: String,
    enum: ['confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  notes: {
    type: String,
    default: null
  },
  estimatedDelivery: {
    type: Date,
    default: null
  },
  totalPrice: {
    type: Number,
    default: 0
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

// Calculate estimated delivery before saving
bookingSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    const design = await mongoose.model('Design').findById(this.design);
    if (design) {
      const deliveryDate = new Date(this.bookingDate);
      deliveryDate.setDate(deliveryDate.getDate() + design.daysToComplete);
      this.estimatedDelivery = deliveryDate;
      this.totalPrice = design.price;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
