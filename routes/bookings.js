const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user.id })
      .populate('listing')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get host's bookings
router.get('/host-bookings', auth, async (req, res) => {
  try {
    const listings = await Listing.find({ host: req.user.id });
    const listingIds = listings.map(listing => listing._id);
    
    const bookings = await Booking.find({ listing: { $in: listingIds } })
      .populate('listing')
      .populate('guest', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const { listingId, checkIn, checkOut, guests } = req.body;
    console.log(req.user.id);
    console.log(req.body);
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if dates are available
    const existingBooking = await Booking.findOne({
      listing: listingId,
      $or: [
        {
          checkIn: { $lte: new Date(checkOut) },
          checkOut: { $gte: new Date(checkIn) }
        }
      ]
    });
    console.log('Existing booking:', existingBooking);

    if (existingBooking) {
      return res.status(400).json({ error: 'Dates are not available' });
    }

    // Calculate total price
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.price;

    const booking = new Booking({
      listing: listingId,
      guest: req.user.id,
      checkIn,
      checkOut,
      guests,
      totalPrice,
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.log(error);
  }
});

// Update booking status (host only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    console.log(status);
    const booking = await Booking.findById(req.params.id)
      .populate('listing');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.listing.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();
    
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.guest.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add after other routes
router.patch('/:id/cancel-request', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.guest.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    booking.cancelRequested = true;
    booking.cancelReason = reason;
    await booking.save();

    res.json({ message: 'Cancel request submitted', booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Host approves or rejects a cancellation request
router.patch('/:id/cancel-approval', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'approved' or 'rejected'
    const booking = await Booking.findById(req.params.id).populate('listing');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Only the host can approve/reject
    if (booking.listing.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (!booking.cancelRequested) {
      return res.status(400).json({ error: 'No cancellation requested' });
    }

    booking.cancelApprovalStatus = action;
    booking.cancelApprovalDate = new Date();

    // If approved, set booking status to 'cancelled'
    if (action === 'approved') {
      booking.status = 'cancelled';
    }

    await booking.save();
    res.json({ message: `Cancellation ${action}`, booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 