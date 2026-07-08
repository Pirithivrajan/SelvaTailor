const express = require('express');
const router = express.Router();
const Design = require('../models/Design');
const { verifyToken, getTailor } = require('../middleware/auth');

// Get All Designs
router.get('/', async (req, res) => {
  try {
    const designs = await Design.find({ isActive: true }).populate('tailor', 'fullName shopName');
    res.json({
      count: designs.length,
      designs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Tailor's Designs
router.get('/tailor/:tailorId', async (req, res) => {
  try {
    const designs = await Design.find({ 
      tailor: req.params.tailorId,
      isActive: true 
    });
    res.json({
      count: designs.length,
      designs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Design
router.get('/:id', async (req, res) => {
  try {
    const design = await Design.findById(req.params.id).populate('tailor', 'fullName shopName email phone');
    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }
    res.json({ design });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Design (Authenticated)
router.post('/', verifyToken, getTailor, async (req, res) => {
  try {
    const { title, description, price, category, daysToComplete, imageUrl, imageType } = req.body;
    
    if (!title || !description || !price || !daysToComplete) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const design = new Design({
      title,
      description,
      price,
      category,
      daysToComplete,
      imageUrl,
      imageType,
      tailor: req.tailor._id
    });
    
    await design.save();
    await design.populate('tailor', 'fullName shopName');
    
    res.status(201).json({
      message: 'Design created successfully',
      design
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Design (Authenticated)
router.put('/:id', verifyToken, getTailor, async (req, res) => {
  try {
    let design = await Design.findById(req.params.id);
    
    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }
    
    // Check if tailor owns this design
    if (design.tailor.toString() !== req.tailor._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this design' });
    }
    
    const { title, description, price, category, daysToComplete, imageUrl, imageType, isActive } = req.body;
    
    if (title) design.title = title;
    if (description) design.description = description;
    if (price) design.price = price;
    if (category) design.category = category;
    if (daysToComplete) design.daysToComplete = daysToComplete;
    if (imageUrl) design.imageUrl = imageUrl;
    if (imageType) design.imageType = imageType;
    if (isActive !== undefined) design.isActive = isActive;
    
    await design.save();
    
    res.json({
      message: 'Design updated successfully',
      design
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Design (Authenticated)
router.delete('/:id', verifyToken, getTailor, async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);
    
    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }
    
    // Check if tailor owns this design
    if (design.tailor.toString() !== req.tailor._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this design' });
    }
    
    await Design.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Design deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
