// Load environment variables (with error handling)
try {
  require('dotenv').config();
  console.log('dotenv loaded:', { parsed: process.env.GOOGLE_MAPS_API_KEY ? 'API key found' : 'API key not found' });
} catch (error) {
  console.log('dotenv loaded: Error loading .env file, using environment variables');
}

// Get API key from environment variables
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
console.log('API Key:', apiKey ? 'API key found' : 'API key not found');

// Import required modules
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('LOCALLY API is running!');
});

// Query endpoint
app.post('/query', async (req, res) => {
  const userQuery = req.body.query;
  console.log('User query received:', userQuery);

  if (!apiKey) {
    return res.status(500).json({ message: 'API key not configured. Please set the GOOGLE_MAPS_API_KEY environment variable.' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: userQuery,
        key: apiKey,
      },
    });

    // Process the response
    const businesses = response.data.results.map(biz => {
      // Get photo URL if available
      let photoUrl = null;
      if (biz.photos && biz.photos.length > 0) {
        const photoReference = biz.photos[0].photo_reference;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;
      }

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

    res.json({ businesses });
  } catch (error) {
    console.error('Error fetching data from Google Places:', error);
    res.status(500).json({ message: 'Failed to fetch data' });
  }
});

// Images endpoint
app.get('/images/:placeId', async (req, res) => {
  const { placeId } = req.params;
  
  if (!apiKey) {
    return res.status(500).json({ message: 'API key not configured. Please set the GOOGLE_MAPS_API_KEY environment variable.' });
  }
  
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'photos',
        key: apiKey,
      },
    });
    
    if (response.data.result && response.data.result.photos) {
      const photoUrls = response.data.result.photos.map(photo => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
      );
      res.json({ photoUrls });
    } else {
      res.json({ photoUrls: [] });
    }
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Failed to fetch images' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // Handle any requests that don't match the ones above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
