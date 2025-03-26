const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const TIMEOUT = 15000;

export const apiService = {
  async healthCheck() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    try {
      const response = await fetch(`${API_BASE}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Server health check failed');
    }
  },

  async searchPlaces(lat, lng, query) {
    const response = await fetch(`${API_BASE}/places/search?lat=${lat}&lng=${lng}&query=${query}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },

  async getPlaceDetails(placeId) {
    const response = await fetch(`${API_BASE}/places/${placeId}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  }
};
