const { GooglePlacesService } = require('../services/google-places.service');

class PlacesController {
  constructor() {
    this.placesService = new GooglePlacesService();
  }

  async searchPlaces(req, res) {
    try {
      const { lat, lng, query } = req.method === 'POST' ? req.body : req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
      }

      const places = await this.placesService.findPlace(query);
      res.json(places || []);
    } catch (error) {
      console.error('Search error:', error.message);
      res.status(500).json({ error: 'Failed to fetch places' });
    }
  }

  async getPlaceDetails(req, res) {
    try {
      const { id } = req.params;
      const details = await this.placesService.getPlaceDetails(id);
      
      if (!details) {
        return res.status(404).json({ message: 'Place not found' });
      }
      
      res.json(details);
    } catch (error) {
      console.error('Details error:', error.message);
      res.status(500).json({ error: 'Failed to fetch place details' });
    }
  }
}

module.exports = new PlacesController();
