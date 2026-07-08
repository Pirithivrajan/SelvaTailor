const jwt = require('jsonwebtoken');
const Tailor = require('../models/Tailor');

// Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.tailorId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Get Tailor from Token
const getTailor = async (req, res, next) => {
  try {
    const tailor = await Tailor.findById(req.tailorId);
    if (!tailor) {
      return res.status(404).json({ error: 'Tailor not found' });
    }
    req.tailor = tailor;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { verifyToken, getTailor };
