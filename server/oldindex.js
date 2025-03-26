require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
// Fix: Use process.env instead of ENV
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Keep your existing query endpoint
app.all('/api/query', async (req, res) => {
  try {
    const { lat, lng, query } = req.method === 'POST' ? req.body : req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    console.log('📍 Search request:', { method: req.method, lat, lng, query });

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${lat},${lng}`,
          radius: '5000',
          keyword: query || '',
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );

    console.log(`✅ Found ${response.data.results?.length || 0} businesses`);
    res.json(response.data.results || []);
  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// Add the new search endpoint
app.get('/api/search', async (req, res) => {
  const { query, lat, lng } = req.query;
  
  if (!query || !lat || !lng) {
    return res.status(400).json({ error: 'Missing required parameters: query, lat, lng' });
  }
  
  try {
    // Use the Google Places API key from environment variables
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Missing Google Maps API key in server environment');
      console.log('Falling back to mock data since API key is missing');
      
      // Return mock data when API key is missing
      const mockBusinesses = [
        {
          place_id: 'mock-place-1',
          name: `${query} Service`,
          address: '123 Main St, Business District',
          latitude: parseFloat(lat) + 0.001,
          longitude: parseFloat(lng) + 0.001,
          rating: 4.5,
          aggregatedReviews: 120,
          distance: 0.5,
          phone: '+27215551234',
          website: 'https://example.com',
          logo: 'https://via.placeholder.com/60',
        },
        {
          place_id: 'mock-place-2',
          name: `Premium ${query}`,
          address: '456 Oak St, Town Center',
          latitude: parseFloat(lat) - 0.001,
          longitude: parseFloat(lng) - 0.002,
          rating: 4.2,
          aggregatedReviews: 85,
          distance: 1.2,
          phone: '+27215557890',
          website: 'https://example2.com',
          logo: 'https://via.placeholder.com/60',
        }
      ];
      
      return res.json({ businesses: mockBusinesses });
    }
    
    // Construct the Google Places API URL for real data
    const radius = 5000; // 5km radius
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
    
    console.log(`[Server] Searching for "${query}" near ${lat},${lng}`);
    
    // Fetch places from Google API
    const response = await axios.get(placesUrl);
    
    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error(`[Server] Google Places API error: ${response.data.status}`);
      return res.status(500).json({ 
        error: 'Failed to fetch places', 
        details: response.data.status
      });
    }
    
    // Transform data to match your app's format
    const businesses = response.data.results.map(place => {
      // Calculate distance (approximate)
      const R = 6371; // Earth's radius in km
      const dLat = (place.geometry.location.lat - lat) * Math.PI / 180;
      const dLon = (place.geometry.location.lng - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(place.geometry.location.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return {
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating || 'No rating',
        aggregatedReviews: place.user_ratings_total || 0,
        distance: distance.toFixed(2),
        phone: place.formatted_phone_number || '',
        website: place.website || '',
        logo: place.icon || '',
      };
    });
    
    console.log(`[Server] Found ${businesses.length} businesses matching "${query}"`);
    
    res.json({ businesses });
  } catch (error) {
    console.error('Error searching for businesses:', error.message);
    res.status(500).json({ error: 'Failed to search businesses' });
  }
});

// Add place details endpoint
app.get('/api/place-details', async (req, res) => {
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

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🔑 Google Maps API Key ${process.env.GOOGLE_MAPS_API_KEY ? 'is set' : 'is NOT set'}`);
});