const express = require('express');
const cors = require('cors');
const env = require('./config/environment');
const placesRoutes = require('./routes/placesRoutes');
const axios = require('axios');
const aiRoutes = require('./routes/aiRoutes');
const apiRoutes = require('./routes/api');
const path = require('path');
const app = express();
// Define allowed origins, including both Render and Vercel domains
const corsOrigins = env.CORS_ORIGIN ? 
  env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
  ['http://localhost:3000', 'https://locally-frontend.vercel.app', 'https://locally-frontend-43pth6cnj-the-marketing-teams-projects.vercel.app'];

console.log('🔒 Configured CORS origins:', corsOrigins);

// Update CORS configuration
app.use(cors({
  origin: '*', // Allow all origins temporarily to fix the issue
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Add OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Add better CORS preflight handling
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.sendStatus(200);
});

app.use(express.json());

// Debug logging for routes
app.use((req, res, next) => {
  console.log(`📌 ${req.method} request received for: ${req.url}`);
  next();
});

// Add environment check endpoint
app.get('/api/env-check', (req, res) => {
  res.json({
    hasGoogleMapsApiKey: !!process.env.GOOGLE_MAPS_API_KEY,
    environment: process.env.NODE_ENV,
    serverTime: new Date().toISOString()
  });
});

// Mount all routes
app.use('/api/places', placesRoutes);
app.use('/api', apiRoutes);  // Generic API routes
app.use('/api', aiRoutes);   // AI-specific routes - this will handle /api/ai-chat

// Add this test endpoint to check CORS configuration
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is correctly configured',
    timestamp: new Date().toISOString(),
    cors: {
      allowed_origins: corsOrigins,
      request_origin: req.headers.origin || 'No origin header',
      env_cors_origin: env.CORS_ORIGIN
    },
    headers_received: {
      origin: req.headers.origin,
      host: req.headers.host,
      referer: req.headers.referer
    }
  });
});

/**
 * Map image proxy endpoint - keeps API keys secure server-side
 */
app.get('/api/map-image', async (req, res) => {
  const { lat, lng, zoom = 15, width = 280, height = 150, scale = 1 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing latitude or longitude parameters' });
  }
  
  try {
    // Use server-side API key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    // Create the Google Maps Static API URL
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&scale=${scale}&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
    
    // Fetch the image using axios
    const response = await axios.get(mapUrl, { responseType: 'arraybuffer' });
    
    // Set the appropriate headers
    res.set('Content-Type', response.headers['content-type']);
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error('Error fetching map image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch map image'
    });
  }
});

// Add the query endpoint that your frontend is using
app.get('/api/query', async (req, res) => {
  try {
    const { lat, lng, query } = req.query;
    console.log(`Query request received: lat=${lat}, lng=${lng}, query=${query}`);
    
    // Create a simple mock response for testing
    const mockBusinesses = [
      {
        place_id: "test123",
        name: "Test Pizza Shop",
        address: "123 Main St, Cape Town",
        phone: "+27 21 555 1234",
        website: "https://example.com",
        rating: 4.5,
        aggregatedReviews: 120,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        distance: 0.5
      },
      {
        place_id: "test456",
        name: "Pizza Express",
        address: "456 High St, Cape Town",
        phone: "+27 21 555 5678",
        website: "https://example2.com",
        rating: 4.2,
        aggregatedReviews: 86,
        latitude: parseFloat(lat) + 0.002,
        longitude: parseFloat(lng) - 0.003,
        distance: 1.2
      }
    ];
    
    // Return mock data
    res.json({
      success: true,
      businesses: mockBusinesses
    });
  } catch (error) {
    console.error('Error in query endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search endpoint for real business data
 */
// Add mock data generator function
const generateEnhancedMockData = (query, lat, lng) => {
  const categories = ['Restaurant', 'Cafe', 'Shop', 'Service', 'Store'];
  const adjectives = ['Premium', 'Elite', 'Best', 'Local', 'Popular'];
  
  return Array(5).fill(null).map((_, i) => ({
    place_id: `mock-${Date.now()}-${i}`,
    name: `${adjectives[i % adjectives.length]} ${query} ${categories[i % categories.length]}`,
    address: `${100 + i} Main Street, Business District`,
    latitude: parseFloat(lat) + (Math.random() - 0.5) * 0.01,
    longitude: parseFloat(lng) + (Math.random() - 0.5) * 0.01,
    rating: (3 + Math.random() * 2).toFixed(1),
    aggregatedReviews: Math.floor(50 + Math.random() * 200),
    distance: (0.2 + Math.random() * 2).toFixed(2),
    formatted_phone_number: `+27 21 555 ${1000 + i}`, // Changed from phone to formatted_phone_number
    phone: `+27215551${1000 + i}`, // Add raw phone number
    email: `info@${query.toLowerCase().replace(/\s+/g, '')}${i + 1}.com`, // Add email
    logo: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/generic_business-71.png',
    isMock: true
  }));
};

// Update search endpoint
app.get('/api/search', async (req, res) => {
  const { query, lat, lng } = req.query;
  
  console.log('\n🔍 Search Request:', {
    endpoint: '/api/search',
    query,
    lat,
    lng,
    timestamp: new Date().toISOString()
  });
  
  if (!query || !lat || !lng) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required parameters: query, lat, lng' 
    });
  }
  
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('API key missing - using enhanced mock data');
      return res.json({
        businesses: generateEnhancedMockData(query, lat, lng),
        meta: {
          isMockData: true,
          reason: 'API key not configured',
          timestamp: new Date().toISOString()
        }
      });
    }

    // First, get the nearby places
    const radius = 5000;
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
    
    const response = await axios.get(placesUrl);
    
    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error(`[Server] Google Places API error: ${response.data.status}`);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch places', 
        details: response.data.status
      });
    }
    
    // Get detailed information for each place
    const detailedBusinesses = await Promise.all(
      response.data.results.map(async (place, index) => {
        try {
          console.log(`\n📍 Fetching details for business ${index + 1}/${response.data.results.length}: ${place.name}`);
          
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,international_phone_number,formatted_address,website,url,rating,user_ratings_total,geometry,type&key=${apiKey}`;
          const detailsResponse = await axios.get(detailsUrl);
          const details = detailsResponse.data.result;

          console.log('📱 Contact Info:', {
            business: place.name,
            formatted_phone: details.formatted_phone_number || 'none',
            international_phone: details.international_phone_number || 'none',
            website: details.website || 'none'
          });

          // Calculate distance...
          const R = 6371;
          const dLat = (place.geometry.location.lat - lat) * Math.PI / 180;
          const dLon = (place.geometry.location.lng - lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(place.geometry.location.lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          // Update the business mapping
          return {
            place_id: place.place_id,
            name: place.name,
            address: place.vicinity || details.formatted_address,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: place.rating || 'No rating',
            aggregatedReviews: place.user_ratings_total || 0,
            distance: distance.toFixed(2),
            // Update these fields to ensure phone numbers are captured
            formatted_phone_number: details.formatted_phone_number || null,
            phone: details.international_phone_number || details.formatted_phone_number || null,
            email: details.email || null,
            website: details.website || null,
            google_maps_url: details.url || null,
            logo: place.icon || '',
            photos: place.photos ? place.photos.map(photo => ({
              photo_reference: photo.photo_reference,
              width: photo.width,
              height: photo.height
            })) : []
          };
        } catch (detailsError) {
          console.error(`❌ Details fetch failed for ${place.name}:`, detailsError.message);
          // Return basic place info if details fetch fails
          return {
            place_id: place.place_id,
            name: place.name,
            address: place.vicinity,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: place.rating || 'No rating',
            aggregatedReviews: place.user_ratings_total || 0,
            distance: distance.toFixed(2),
            logo: place.icon || '',
            photos: place.photos ? place.photos.map(photo => ({
              photo_reference: photo.photo_reference,
              width: photo.width,
              height: photo.height
            })) : []
          };
        }
      })
    );

    console.log(`\n✅ Search completed: Found ${detailedBusinesses.length} businesses`);
    console.log('📊 First business preview:', {
      name: detailedBusinesses[0]?.name,
      hasPhone: Boolean(detailedBusinesses[0]?.formatted_phone_number),
      phone: detailedBusinesses[0]?.formatted_phone_number
    });

    res.json({ businesses: detailedBusinesses });
  } catch (error) {
    console.error('❌ Search error:', error);
    // Fallback to mock data on error
    return res.json({
      businesses: generateEnhancedMockData(query, lat, lng),
      meta: {
        isMockData: true,
        reason: 'API error fallback',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Place photo proxy endpoint
 */
app.get('/api/place-photo', async (req, res) => {
  const { photo_reference } = req.query;
  
  if (!photo_reference) {
    return res.status(400).json({ error: 'Missing photo_reference parameter' });
  }
  
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo_reference}&key=${apiKey}`;
    
    const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
    
    res.set('Content-Type', response.headers['content-type']);
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error('Error fetching place photo:', error);
    res.status(500).json({ error: 'Failed to fetch place photo' });
  }
});

// Remove duplicate health endpoints and standardize them
app.get(['/health', '/health'], (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    endpoints: {
      health: ['/health', '/health'],
      places: '/api/places/*',
      search: '/api/search',
      test: '/api/test'
    }
  };

  console.log('Health check requested:', {
    timestamp: healthData.timestamp,
    origin: req.headers.origin || 'No origin'
  });

  res.json(healthData);
});

// Add API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Any route that doesn't match API routes should serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });

  console.log('Running in production mode - serving static files from client/build');
} else {
  console.log('Running in development mode');
}

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

module.exports = app;