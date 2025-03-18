// Load environment variables first, before any other code
const path = require('path');

// Debug current location
console.log('\n📂 Current directory:', __dirname);

// Load environment variables with explicit path
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug loaded variables
console.log('\n🔑 Environment Check:');
console.log('1. .env file location:', path.join(__dirname, '.env'));
console.log('2. API Key value:', process.env.GOOGLE_MAPS_API_KEY ? '✅ Present' : '❌ Missing');
if (process.env.GOOGLE_MAPS_API_KEY) {
    console.log('3. Key preview:', process.env.GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-locally-app.vercel.app',
    'https://localserviceagent.onrender.com'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(bodyParser.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`\n🔸 ${req.method} ${req.url}`);
  console.log('📝 Request Body:', req.body);
  next();
});

// Preflight OPTIONS handler
app.options('*', cors());

// Test data
const sampleBusinesses = [
    {
        name: "Test Business",
        address: "123 Test St",
        latitude: 37.7749,
        longitude: -122.4194,
        rating: 4.5,
        phone: "555-0123"
    }
];

// Test routes
app.get('/', (req, res) => {
    res.json({ status: 'Server is running!' });
});

app.get('/api/businesses', (req, res) => {
    res.json(sampleBusinesses);
});

// Add a route to check API key
app.get('/check-api-key', (req, res) => {
  res.json({
    apiKeyPresent: !!process.env.GOOGLE_MAPS_API_KEY,
    apiKeyFirstChars: process.env.GOOGLE_MAPS_API_KEY ? 
      `${process.env.GOOGLE_MAPS_API_KEY.substring(0, 5)}...` : 'None'
  });
});

// Add query endpoint with logging
app.post('/query', async (req, res, next) => {
  try {
    const { query, latitude, longitude } = req.body;
    
    // Verify API key before making request
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('API key is not configured');
    }

    const apiUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'; // Changed to nearbysearch
    const params = {
      keyword: query,  // Using keyword instead of query
      location: `${latitude},${longitude}`,
      radius: 5000,
      type: 'establishment',  // Added type
      key: process.env.GOOGLE_MAPS_API_KEY.trim()
    };

    console.log('\n📍 Making Places API request:', {
      url: apiUrl,
      params: { ...params, key: 'HIDDEN' },
      clientIP: req.ip,
      origin: req.headers.origin || 'No origin'
    });

    const response = await axios.get(apiUrl, { 
      params,
      headers: {
        'User-Agent': 'LOCALLY-Service-Agent/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'http://localhost:5000',
        'Referer': 'http://localhost:5000/'
      }
    });
    
    // Better error handling
    if (response.data.status === 'REQUEST_DENIED') {
      console.error('API Request Denied:', response.data.error_message);
      throw new Error(`Places API request denied: ${response.data.error_message}`);
    }

    // Log raw response status and result count
    console.log('\n✅ API Response Status:', response.data.status);
    console.log('📊 Results found:', response.data.results?.length || 0);

    // Validate response
    if (!response.data.results) {
      throw new Error('Invalid response format from Google Places API');
    }

    const businesses = response.data.results.map(place => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || null,
      user_ratings_total: place.user_ratings_total || 0,
      photos: place.photos ? place.photos.map(photo => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      })) : [],
      place_id: place.place_id,
      geometry: {
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        }
      },
      types: place.types || [],
      vicinity: place.vicinity || place.formatted_address,
      opening_hours: place.opening_hours || null
    }));

    // Log first business for debugging
    if (businesses.length > 0) {
      console.log('📌 First result:', {
        name: businesses[0].name,
        address: businesses[0].address
      });
    }

    res.json({ businesses });
  } catch (error) {
    console.error('\n❌ Places API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      message: error.message
    });
    next(error);
  }
});

// 404 handler - place before error handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware - must be last
app.use((err, req, res, next) => {
  console.error('\n❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    response: err.response?.data
  });
  
  res.status(err.status || 500).json({ 
    message: 'Something went wrong!',
    error: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Add API health check function
const checkGoogleAPIs = async () => {
  const services = [
    {
      name: 'Places API',
      test: async () => {
        try {
          const placesUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
          const params = {
            location: '-33.8670522,151.1957362',
            radius: 1000,
            type: 'restaurant',
            key: process.env.GOOGLE_MAPS_API_KEY
          };

          console.log('\n🔍 Testing Places API:');
          console.log('URL:', placesUrl);
          console.log('Params:', { ...params, key: 'API_KEY_HIDDEN' });

          const response = await axios.get(placesUrl, { 
            params,
            headers: {
              'User-Agent': 'LOCALLY-Service-Agent/1.0',
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Origin': 'http://localhost:5000',
              'Referer': 'http://localhost:5000/'
            }
          });

          console.log('Places API Response:', {
            status: response.status,
            apiStatus: response.data.status,
            message: response.data.error_message || 'Success',
            results: response.data.results?.length || 0
          });

          return response.data.status === 'OK';
        } catch (error) {
          console.error('Places API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          return false;
        }
      }
    },
    {
      name: 'Static Maps API',
      test: async () => {
        try {
          const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?`
            + `center=-33.8670522,151.1957362&`
            + `zoom=13&`
            + `size=400x400&`
            + `key=${process.env.GOOGLE_MAPS_API_KEY}`;
          
          console.log('\n🗺️ Testing Static Maps API:');
          console.log('URL:', mapUrl.replace(process.env.GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));
          
          const response = await axios.get(mapUrl, {
            responseType: 'arraybuffer',
            validateStatus: false // Allow any status code
          });

          console.log('Response Status:', response.status);
          if (response.status !== 200) {
            const errorText = Buffer.from(response.data).toString('utf8');
            console.log('Error Details:', errorText);
          }

          return response.status === 200;
        } catch (error) {
          console.error('Static Maps Error:', {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data ? Buffer.from(error.response.data).toString('utf8') : null
          });
          return false;
        }
      }
    }
  ];

  console.log('\n🔍 Checking Google APIs:');
  
  for (const service of services) {
    try {
      const isWorking = await service.test();
      console.log(`${isWorking ? '✅' : '❌'} ${service.name}: ${isWorking ? 'Working' : 'Failed'}`);
    } catch (error) {
      console.log(`❌ ${service.name}: Error - ${error.response?.data?.error_message || error.message}`);
    }
  }
};

// Start server
const PORT = process.env.PORT || 5000;

try {
    const server = app.listen(PORT, async () => {
        console.clear(); // Clear console
        console.log('\n=================================');
        console.log(`✅ Server running on http://localhost:${PORT}`);
        
        // Check environment
        console.log('\n📂 Environment Check:');
        console.log('API Key:', process.env.GOOGLE_MAPS_API_KEY ? '✅ Present' : '❌ Missing');
        console.log('Node Environment:', process.env.NODE_ENV || 'development');
        
        // Check Google APIs
        await checkGoogleAPIs();
        
        console.log('\n📍 Available Endpoints:');
        console.log(`http://localhost:${PORT}/`);
        console.log(`http://localhost:${PORT}/api/businesses`);
        console.log(`http://localhost:${PORT}/check-api-key`);
        console.log('=================================\n');
    });

    // Handle server errors
    server.on('error', (error) => {
        console.error('Server error:', error);
    });

    // Handle process events
    process.on('SIGTERM', () => {
        console.log('Server shutting down...');
        server.close();
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
    });

} catch (error) {
    console.error('Failed to start server:', error);
}
