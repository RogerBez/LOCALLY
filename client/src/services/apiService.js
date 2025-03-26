const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_PREFIX = '/api';
const TIMEOUT = 15000;

export const apiService = {
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw new Error('Server health check failed');
    }
  },

  async searchPlaces(lat, lng, query) {
    const response = await fetch(`${API_BASE}${API_PREFIX}/places/search?lat=${lat}&lng=${lng}&query=${query}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },

  async getPlaceDetails(placeId) {
    const response = await fetch(`${API_BASE}${API_PREFIX}/places/${placeId}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  }
};
