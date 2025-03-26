const axios = require('axios');
const env = require('../config/environment');

class GooglePlacesService {
  constructor() {
    this.apiKey = env.GOOGLE_MAPS_API_KEY;
    this.maxRetries = 3;
    this.timeout = env.API_TIMEOUT;
    this.fields = [
      'name,place_id,formatted_address,formatted_phone_number',
      'geometry,website,current_opening_hours,business_status',
      'rating,user_ratings_total,reviews,photos,types,url'
    ].join(',');
  }

  async makeRequest(url, params) {
    try {
      const response = await axios.get(url, {
        params: { ...params, key: this.apiKey },
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async findPlace(query) {
    try {
      const response = await this.makeRequest(
        'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
        {
          input: query,
          inputtype: 'textquery',
          fields: 'place_id,name,formatted_address'
        }
      );

      return response.candidates || [];
    } catch (error) {
      console.error('Error finding place:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId) {
    try {
      const response = await this.makeRequest(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          place_id: placeId,
          fields: this.fields,
          language: 'en'
        }
      );

      if (response.status === 'OK' && response.result) {
        return {
          ...response.result,
          maps_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
          directions_url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(response.result.formatted_address)}`
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }
}

module.exports = { GooglePlacesService };
