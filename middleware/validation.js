const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Login validation
exports.loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validate
];

// Registration validation
exports.registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
    .escape(),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter'),
  validate
];

// Listing validation
exports.listingValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .escape(),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
    .escape(),
  body('location')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location must be between 3 and 200 characters')
    .escape(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('maxGuests')
    .isInt({ min: 1 })
    .withMessage('Maximum guests must be at least 1'),
  body('bedrooms')
    .isInt({ min: 1 })
    .withMessage('Number of bedrooms must be at least 1'),
  body('bathrooms')
    .isFloat({ min: 0.5 })
    .withMessage('Number of bathrooms must be at least 0.5'),
  body('images')
    .isArray()
    .withMessage('Images must be an array')
    .custom((images) => {
      if (!images.every(url => url.match(/^https?:\/\/.+/))) {
        throw new Error('All images must be valid URLs');
      }
      return true;
    }),
  body('amenities')
    .isArray()
    .withMessage('Amenities must be an array'),
  validate
];

// Booking validation
exports.bookingValidation = [
  body('checkIn')
    .isISO8601()
    .withMessage('Invalid check-in date'),
  body('checkOut')
    .isISO8601()
    .withMessage('Invalid check-out date')
    .custom((checkOut, { req }) => {
      if (new Date(checkOut) <= new Date(req.body.checkIn)) {
        throw new Error('Check-out date must be after check-in date');
      }
      return true;
    }),
  body('guests')
    .isInt({ min: 1 })
    .withMessage('Number of guests must be at least 1'),
  validate
]; 