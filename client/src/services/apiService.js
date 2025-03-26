const API_BASE = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-url.onrender.com/api'
    : 'http://localhost:5000/api');
const TIMEOUT = 15000;

export const apiService = {
  // Add error logging
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) throw new Error('Health check failed');
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw new Error('Server health check failed');
    }
  },

  async searchPlaces(lat, lng, query) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    try {
      const response = await fetch(
        `${API_BASE}/places/search?lat=${lat}&lng=${lng}&query=${query}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  },

  async getPlaceDetails(placeId) {
    const response = await fetch(`${API_BASE}/places/${placeId}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  }
};
