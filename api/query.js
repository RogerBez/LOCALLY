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

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  // Get query from request body
  const userQuery = req.body.query;
  console.log('User query received:', userQuery);

  try {
    // Make request to Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: userQuery,
        key: apiKey,
      },
    });

    // Log the full response for debugging
    console.log('Full Google Places Response:', response.data);

    // Process the response
    const businesses = response.data.results.map(biz => {
      // Get photo URL if available
      let photoUrl = null;
      if (biz.photos && biz.photos.length > 0) {
        const photoReference = biz.photos[0].photo_reference;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;
      }

      // Return business data
      return {
        name: biz.name,
        address: biz.formatted_address,
        rating: biz.rating || 'No rating',
        latitude: biz.geometry?.location?.lat,
        longitude: biz.geometry?.location?.lng,
        photo: photoUrl,
        place_id: biz.place_id,
        types: biz.types,
        opening_hours: biz.opening_hours?.open_now ? 'Open now' : 'Closed',
      };
    });

    // Send response
    res.status(200).json({ businesses });
  } catch (error) {
    // Handle errors
    console.error('Error fetching data from Google Places:', error);
    res.status(500).json({ message: 'Failed to fetch data' });
  }
};
