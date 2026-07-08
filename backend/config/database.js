const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_DEV_URI 
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/selva-tailor';
    
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB Connected');
  } catch (err) {
    console.error('✗ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
