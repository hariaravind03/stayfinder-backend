const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  images: [{
    type: String,
    required: true,
  }],
  amenities: [{
    type: String,
  }],
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  maxGuests: {
    type: Number,
    required: true,
  },
  bedrooms: {
    type: Number,
    required: true,
  },
  bathrooms: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  bookings: [{
    checkIn: {
      type: Date,
      required: true
    },
    checkOut: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to check if a listing is available for given dates
listingSchema.methods.isAvailable = function(checkIn, checkOut) {
  // Convert dates to start of day for comparison
  const startDate = new Date(checkIn);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(checkOut);
  endDate.setHours(0, 0, 0, 0);

  // Check if there are any overlapping bookings
  return !this.bookings.some(booking => {
    if (booking.status === 'cancelled') return false;
    
    const bookingStart = new Date(booking.checkIn);
    bookingStart.setHours(0, 0, 0, 0);
    
    const bookingEnd = new Date(booking.checkOut);
    bookingEnd.setHours(0, 0, 0, 0);

    // Check for overlap
    return (
      (startDate <= bookingEnd && endDate >= bookingStart) ||
      (bookingStart <= endDate && bookingEnd >= startDate)
    );
  });
};

module.exports = mongoose.model('Listing', listingSchema);
