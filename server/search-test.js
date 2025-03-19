require('dotenv').config();
const axios = require('axios');

const searchPlaces = async (query, location) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        keyword: query,
        location: location,
        radius: 5000,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    console.log('\nSearch Results:');
    response.data.results.forEach(place => {
      console.log(`\nName: ${place.name}`);
      console.log(`Place ID: ${place.place_id}`);
      console.log(`Address: ${place.vicinity}`);
      console.log(`Rating: ${place.rating}`);
      console.log('------------------------');
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

// Usage: node search-test.js "search term" "latitude,longitude"
const query = process.argv[2] || 'restaurant';
const location = process.argv[3] || '-33.8670522,151.1957362';

searchPlaces(query, location);
