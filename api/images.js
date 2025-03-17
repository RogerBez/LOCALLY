// Import required modules
const axios = require('axios');

// Load environment variables
require('dotenv').config();

// Get API key from environment variables
const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Export the serverless function
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  // Get place ID from URL
  const { placeId } = req.query;
  
  if (!placeId) {
    res.status(400).json({ message: 'Place ID is required' });
    return;
  }

  try {
    // Make request to Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'photos',
        key: apiKey,
      },
    });
    
    // Process the response
    if (response.data.result && response.data.result.photos) {
      const photoUrls = response.data.result.photos.map(photo => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
      );
      res.status(200).json({ photoUrls });
    } else {
      res.status(200).json({ photoUrls: [] });
    }
  } catch (error) {
    // Handle errors
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Failed to fetch images' });
  }
};
