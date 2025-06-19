const express = require('express');
const protect = require('../middleware/auth');
const {
  addFavorite,
  removeFavorite,
  getFavorites,
} = require('../controllers/favoriteController');

const router = express.Router();

router.route('/:id').put(protect, addFavorite).delete(protect, removeFavorite);
router.route('/').get(protect, getFavorites);

module.exports = router; 