require('dotenv').config();  // Ensure dotenv is loaded first
console.log('dotenv loaded:', require('dotenv').config());  // Debugging line (optional)

const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY; // Update the variable name
console.log('API Key:', apiKey);  // This should log the key if it's loaded correctly

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(cors());  // Allow requests from any origin during development
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.post('/query', async (req, res) => {
  const userQuery = req.body.query;
  console.log('User query received:', userQuery);

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: userQuery,
        key: apiKey,
      },
    });

    // Log the full response for debugging
    console.log('Full Google Places Response:', response.data);

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

// Add a route to get images for a specific place
app.get('/images/:placeId', async (req, res) => {
  const { placeId } = req.params;
  
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
