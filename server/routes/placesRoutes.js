const express = require('express');
const router = express.Router();
const placesController = require('../controllers/placesController');

router.get('/search', placesController.searchPlaces.bind(placesController));
router.post('/search', placesController.searchPlaces.bind(placesController));
router.get('/:id', placesController.getPlaceDetails.bind(placesController));

module.exports = router;
