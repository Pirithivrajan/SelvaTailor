const express = require('express');
const router = express.Router();
const Tailor = require('../models/Tailor');
const { verifyToken, getTailor } = require('../middleware/auth');

// Get Tailor Profile
router.get('/profile/:id', async (req, res) => {
  try {
    const tailor = await Tailor.findById(req.params.id).select('-password');
    if (!tailor) {
      return res.status(404).json({ error: 'Tailor not found' });
    }
    res.json({ tailor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Tailor Profile (Authenticated)
router.put('/profile/update', verifyToken, getTailor, async (req, res) => {
  try {
    const { fullName, email, phone, shopName, address } = req.body;
    
    let tailor = req.tailor;
    
    if (fullName) tailor.fullName = fullName;
    if (phone) tailor.phone = phone;
    if (shopName) tailor.shopName = shopName;
    if (address) tailor.address = address;
    
    // Email can't be changed via this endpoint for security
    // Implement separate email verification flow if needed
    
    await tailor.save();
    
    res.json({
      message: 'Profile updated successfully',
      tailor: tailor.getPublicProfile()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Tailor's Dashboard Stats
router.get('/stats/dashboard', verifyToken, getTailor, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const Design = require('../models/Design');
    
    const totalBookings = await Booking.countDocuments({ tailor: req.tailor._id });
    const totalDesigns = await Design.countDocuments({ tailor: req.tailor._id });
    const totalRevenue = await Booking.aggregate([
      { $match: { tailor: require('mongoose').Types.ObjectId(req.tailor._id) } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    const recentBookings = await Booking.find({ tailor: req.tailor._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('design', 'title');
    
    res.json({
      stats: {
        totalBookings,
        totalDesigns,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentBookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List All Public Tailors
router.get('/', async (req, res) => {
  try {
    const tailors = await Tailor.find({ isActive: true }).select('-password');
    res.json({
      count: tailors.length,
      tailors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
