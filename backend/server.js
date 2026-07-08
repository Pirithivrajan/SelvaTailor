const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selva-tailor')
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => console.error('✗ MongoDB Connection Error:', err));

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/designs', require('./routes/design.routes'));
app.use('/api/v1/bookings', require('./routes/booking.routes'));
app.use('/api/v1/tailors', require('./routes/tailor.routes'));

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'SelvaTailor Backend API is running'
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  console.log(`✓ API Documentation: http://localhost:${PORT}/api/v1/docs\n`);
});

module.exports = app;
