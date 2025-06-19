const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');
const auth = require('../middleware/auth');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');

// Get all listings with filters
router.get('/', async (req, res) => {
  try {
    const { search, minPrice, maxPrice, location, checkIn, checkOut } = req.query;
    console.log('Received query params:', req.query);
    
    const query = {};

    // Handle search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Handle price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Handle location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    // Get all listings matching the basic filters
    let listings = await Listing.find(query)
      .populate('host', 'name email')
      .sort({ createdAt: -1 });

    console.log('Found listings before date filter:', listings.length);

    // If date filters are provided, filter by availability
    if (checkIn && checkOut) {
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      if (startDate > endDate) {
        return res.status(400).json({ error: 'Check-in date must be before check-out date' });
      }

      // Get all bookings that overlap with the selected dates
      const overlappingBookings = await Booking.find({
        $or: [
          // Booking starts during the selected period
          {
            checkIn: { $gte: startDate, $lt: endDate }
          },
          // Booking ends during the selected period
          {
            checkOut: { $gt: startDate, $lte: endDate }
          },
          // Booking spans the entire selected period
          {
            checkIn: { $lte: startDate },
            checkOut: { $gte: endDate }
          }
        ]
      });

      // Get the IDs of listings that are already booked
      const bookedListingIds = overlappingBookings.map(booking => booking.listing.toString());

      // Filter out listings that are already booked
      listings = listings.filter(listing => !bookedListingIds.includes(listing._id.toString()));
  
    }

    // Send response
    res.json(listings);
  } catch (error) {
    console.error('Error in listings route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get listings by authenticated host
router.get('/my-listings', auth, async (req, res) => {
  try {
    console.log('Fetching listings for user ID:', req.user.id);
    const listings = await Listing.find({ host: req.user.id })
      .populate('host', 'name email')
      .sort({ createdAt: -1 });
    console.log('Fetched listings:', listings);
    res.json(listings);
  } catch (error) {
    console.log(error);
    console.error('Error fetching my listings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('host', 'name email')
      .populate('reviews.user', 'name');
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new listing with image upload
router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    const imageUrls = req.files.map(file => file.path);
    
    const listingData = {
      ...req.body,
      images: imageUrls,
      host: req.user.id
    };

    const listing = new Listing(listingData);
    await listing.save();

    res.status(201).json(listing);
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Error creating listing' });
  }
});

// Update a listing
router.put('/:id', auth, upload.array('images', 10), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const updateData = { ...req.body };
    delete updateData.host; // Prevent host from being updated
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedListing);
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a listing
router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 