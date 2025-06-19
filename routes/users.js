const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Become host request
router.post('/become-host', auth, async (req, res) => {
  try {
    const { name, email, phone, address, reason } = req.body;
    
    // Check if user already has a pending request
    const user = await User.findById(req.user.id);
    if (user.role === 'pending_host' && user.hostDetails?.status === 'pending') {
      return res.status(400).json({ 
        error: 'You already have a pending host request. Please wait for it to be reviewed.' 
      });
    }

    if (user.role === 'host') {
      return res.status(400).json({ 
        error: 'You are already a host.' 
      });
    }
    
    // Update user role to pending_host
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        role: 'pending_host',
        hostDetails: {
          name,
          email,
          phone,
          address,
          reason,
          status: 'pending',
          submittedAt: new Date()
        }
      },
      { new: true }
    ).select('-password');

    res.json({ message: 'Host request submitted successfully', user: updatedUser });
  } catch (error) {
    console.error('Become host error:', error);
    res.status(500).json({ error: 'Error submitting host request' });
  }
});

module.exports = router; 