const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TIMEOUT = 15000;

export const apiService = {
  async healthCheck() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    try {
      // Updated endpoints order to try /health first
      const endpoints = [
        `${API_BASE.replace('/api', '')}/health`,  // Try root /health first
        `${API_BASE}/health`  // Fallback to /api/health
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { signal: controller.signal });
          if (response.ok) {
            clearTimeout(timeoutId);
            return await response.json();
          }
        } catch (error) {
          console.warn(`Health check failed for ${endpoint}:`, error);
        }
      }
      
      throw new Error('All health check endpoints failed');
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
