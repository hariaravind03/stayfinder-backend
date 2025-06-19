const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Listing = require('../models/Listing');

// @desc    Add listing to favorites
// @route   PUT /api/favorites/:id
// @access  Private
const addFavorite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const listingId = req.params.id;

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.favorites.includes(listingId)) {
    user.favorites.push(listingId);
    await user.save();
    res.json({ message: 'Listing added to favorites', favorites: user.favorites });
  } else {
    res.status(400);
    throw new Error('Listing already in favorites');
  }
});

// @desc    Remove listing from favorites
// @route   DELETE /api/favorites/:id
// @access  Private
const removeFavorite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const listingId = req.params.id;

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.favorites = user.favorites.filter(
    (fav) => fav.toString() !== listingId
  );
  await user.save();

  res.json({ message: 'Listing removed from favorites', favorites: user.favorites });
});

// @desc    Get all favorite listings for a user
// @route   GET /api/favorites
// @access  Private
const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('favorites');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user.favorites);
});

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
}; 