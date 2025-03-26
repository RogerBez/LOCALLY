const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TIMEOUT = 15000;

export const apiService = {
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
