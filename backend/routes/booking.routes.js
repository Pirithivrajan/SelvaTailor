const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Design = require('../models/Design');
const { verifyToken, getTailor } = require('../middleware/auth');

// Get All Bookings for Tailor
router.get('/', verifyToken, getTailor, async (req, res) => {
  try {
    const bookings = await Booking.find({ tailor: req.tailor._id })
      .populate('design', 'title price')
      .sort({ bookingDate: -1 });
    
    res.json({
      count: bookings.length,
      bookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Booking
router.get('/:id', verifyToken, getTailor, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('design')
      .populate('tailor', 'fullName shopName');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check authorization
    if (booking.tailor._id.toString() !== req.tailor._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Booking (Public)
router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, customerEmail, designId, bookingDate, bookingTime } = req.body;
    
    if (!customerName || !customerPhone || !customerAddress || !designId || !bookingDate || !bookingTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find design
    const design = await Design.findById(designId);
    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }
    
    // Check for time slot availability
    const existingBooking = await Booking.findOne({
      tailor: design.tailor,
      bookingDate,
      bookingTime,
      status: { $ne: 'cancelled' }
    });
    
    if (existingBooking) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }
    
    // Create booking
    const booking = new Booking({
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      design: designId,
      tailor: design.tailor,
      bookingDate,
      bookingTime
    });
    
    await booking.save();
    await booking.populate('design', 'title price');
    
    res.status(201).json({
      message: 'Booking confirmed successfully',
      booking
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Booking Status (Tailor Only)
router.put('/:id/status', verifyToken, getTailor, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    let booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check authorization
    if (booking.tailor.toString() !== req.tailor._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    booking.status = status;
    await booking.save();
    
    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Bookings by Date Range
router.get('/analytics/date-range', verifyToken, getTailor, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const bookings = await Booking.find({
      tailor: req.tailor._id,
      bookingDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('design', 'title price');
    
    const stats = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.totalPrice, 0),
      byStatus: {}
    };
    
    bookings.forEach(b => {
      stats.byStatus[b.status] = (stats.byStatus[b.status] || 0) + 1;
    });
    
    res.json({ stats, bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
