const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Tailor = require('../models/Tailor');
const { verifyToken } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register New Tailor
router.post('/register', async (req, res) => {
  try {
    const { loginId, password, fullName, email, phone } = req.body;
    
    // Validation
    if (!loginId || !password || !fullName || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if tailor already exists
    const existingTailor = await Tailor.findOne({ 
      $or: [{ loginId }, { email }] 
    });
    
    if (existingTailor) {
      return res.status(409).json({ error: 'Tailor with this login ID or email already exists' });
    }
    
    // Create new tailor
    const tailor = new Tailor({
      loginId,
      password,
      fullName,
      email,
      phone
    });
    
    await tailor.save();
    
    const token = generateToken(tailor._id);
    
    res.status(201).json({
      message: 'Tailor registered successfully',
      token,
      tailor: tailor.getPublicProfile()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Tailor
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Login ID and password are required' });
    }
    
    // Find tailor and include password field
    const tailor = await Tailor.findOne({ loginId }).select('+password');
    
    if (!tailor) {
      return res.status(401).json({ error: 'Invalid Login ID or Password' });
    }
    
    // Check password
    const isPasswordValid = await tailor.matchPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid Login ID or Password' });
    }
    
    if (!tailor.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }
    
    const token = generateToken(tailor._id);
    
    res.json({
      message: 'Login successful',
      token,
      tailor: tailor.getPublicProfile()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current Tailor
router.get('/me', verifyToken, async (req, res) => {
  try {
    const tailor = await Tailor.findById(req.tailorId);
    res.json({ tailor: tailor.getPublicProfile() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout (frontend can clear token)
router.post('/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
