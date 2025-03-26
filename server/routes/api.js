const express = require('express');
const router = express.Router();
const axios = require('axios');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Place details endpoint
router.get('/place-details', async (req, res) => {
  const { placeId } = req.query;
  
  if (!placeId) {
    return res.status(400).json({ error: 'Missing required parameter: placeId' });
  }
  
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Missing Google Maps API key in server environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,opening_hours,formatted_address,photo,url&key=${apiKey}`;
    
    const response = await axios.get(detailsUrl);
    
    if (response.data.status !== 'OK') {
      console.error(`[Server] Google Places API error: ${response.data.status}`);
      return res.status(500).json({ 
        error: 'Failed to fetch place details', 
        details: response.data.status
      });
    }
    
    const placeDetails = response.data.result;
    
    // Format the response to match your app's needs
    const details = {
      name: placeDetails.name,
      phone: placeDetails.formatted_phone_number || '',
      website: placeDetails.website || '',
      address: placeDetails.formatted_address,
      hours: placeDetails.opening_hours ? placeDetails.opening_hours.weekday_text : [],
      url: placeDetails.url,
    };
    
    res.json(details);
  } catch (error) {
    console.error('Error fetching place details:', error.message);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

module.exports = router;