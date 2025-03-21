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
const { generateResponse } = require('./utils/agent');
const { synthesizeSpeech, transcribeSpeech } = require('./utils/voice');

const app = express();

// Define allowed origins first
const allowedOrigins = [
  'https://locally-frontend.vercel.app',
  'https://locally-frontend-172s1h0pa-the-marketing-teams-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000'
];

// CORS configuration - must be first middleware
app.use(cors({
  origin: function(origin, callback) {
    console.log('🔍 Incoming request from origin:', origin);
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('⛔ Blocked origin:', origin);
    callback(new Error('CORS policy violation'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Access-Control-Allow-Origin']
}));

// 2. OPTIONS preflight handler
app.options('*', cors());

// 3. CORS debug logging (after CORS middleware)
app.use((req, res, next) => {
  console.log('\n🔒 CORS Debug:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    allowed: !req.headers.origin || allowedOrigins.includes(req.headers.origin),
    headers: {
      'access-control-allow-origin': res.getHeader('access-control-allow-origin'),
      'access-control-allow-credentials': res.getHeader('access-control-allow-credentials')
    }
  });
  next();
});

app.use(bodyParser.json());

// Add better JSON parsing error handling
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parse Error:', {
      message: err.message,
      body: err.body,
      type: err.type
    });
    return res.status(400).json({ 
      error: 'Invalid JSON',
      details: err.message,
      help: 'Please check that your request body is valid JSON'
    });
  }
  next();
});

// Add logging middleware
app.use((req, res, next) => {
  console.log(`\n🔸 ${req.method} ${req.url}`);
  console.log('📝 Request Body:', req.body);
  next();
});

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

// Add before your routes
app.get('/api/check-ip', (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log('🌐 Client IP:', clientIp);
  res.json({ 
    ip: clientIp,
    headers: req.headers
  });
});

// Update routes to use /api prefix
app.get('/api/', (req, res) => {
    res.json({ status: 'LOCALLY API is running!' });
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

// Update route to match client request
app.post('/api/query', async (req, res, next) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n🔍 [${requestId}] Incoming request:`, {
    timestamp: new Date().toISOString(),
    query: req.body.query,
    location: `${req.body.latitude},${req.body.longitude}`,
    origin: req.headers.origin,
    environment: process.env.NODE_ENV
  });

  try {
    const apiUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const params = {
      keyword: req.body.query,
      location: `${req.body.latitude},${req.body.longitude}`,
      radius: 5000,
      type: 'establishment',
      key: process.env.GOOGLE_MAPS_API_KEY.trim()
    };

    console.log(`\n📤 [${requestId}] Google Places API request:`, {
      url: apiUrl,
      params: { ...params, key: 'HIDDEN' }
    });

    const response = await axios.get(apiUrl, { params });

    console.log(`\n📥 [${requestId}] Google Places API response:`, {
      status: response.data.status,
      resultsCount: response.data.results?.length || 0,
      firstResult: response.data.results?.[0] ? {
        name: response.data.results[0].name,
        vicinity: response.data.results[0].vicinity,
        
        // Status
        business_status: response.data.results[0].business_status,
        opening_hours: response.data.results[0].opening_hours,
        
        // Categories & Details
        types: response.data.results[0].types,
        icon: response.data.results[0].icon,
        
        // Photos
        photos: response.data.results[0].photos?.length || 0,
        
        // Place details
        place_id: response.data.results[0].place_id,
        plus_code: response.data.results[0].plus_code,
        
        // Additional fields if any
        ...Object.keys(response.data.results[0])
          .filter(key => !['name', 'rating', 'user_ratings_total', 'price_level', 'vicinity', 
                         'formatted_address', 'business_status', 'opening_hours', 'types', 
                         'icon', 'photos', 'place_id', 'plus_code'].includes(key))
          .reduce((obj, key) => ({ ...obj, [key]: typeof response.data.results[0][key] }), {})
      } : null
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

    // Get additional details for each place
    const businesses = await Promise.all(response.data.results.map(async place => {
      // Get detailed information for each place
      const detailsResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: place.place_id,
            fields: [
              // Basic info
              'name,place_id,rating,formatted_phone_number,formatted_address,international_phone_number',
              // Hours & Status
              'current_opening_hours,opening_hours,business_status,price_level,user_ratings_total',
              // Contact & Website
              'website,email,formatted_phone_number',
              // Accessibility & Amenities
              'wheelchair_accessible_entrance,wheelchair_accessible_parking,wheelchair_accessible_restroom',
              'restroom,serves_beer,serves_wine,serves_breakfast,serves_lunch,serves_dinner',
              'delivery,dine_in,takeout,curbside_pickup,reservable,outdoor_seating',
              // Reviews & Photos
              'reviews,photos,price_level',
              // Additional Features
              'payment_options,parking,serves_vegetarian_food'
            ].join(','),
            key: process.env.GOOGLE_MAPS_API_KEY,
            language: 'en' // Ensure English responses
          }
        }
      );

      const details = detailsResponse.data.result;
      
      console.log(`\n📍 Place Details for ${place.name}:`, {
        hasDetails: !!details,
        amenities: {
          wheelchair: details?.wheelchair_accessible_entrance,
          outdoor: details?.outdoor_seating,
          delivery: details?.delivery,
          takeout: details?.takeout,
          reservable: details?.reservable,
          dineIn: details?.dine_in
        },
        dining: {
          servesBeer: details?.serves_beer,
          servesWine: details?.serves_wine,
          servesVegetarian: details?.serves_vegetarian_food
        }
      });

      // Process top reviews
      const topReviews = details?.reviews
        ?.filter(review => review.rating >= 4)
        .sort((a, b) => b.rating - a.rating || b.time - a.time)
        .slice(0, 5)
        .map(review => ({
          author_name: review.author_name,
          rating: review.rating,
          text: review.text,
          time: review.time,
          relative_time: review.relative_time_description
        })) || [];

      return {
        // Basic data
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        
        // Add geometry data
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        
        // Add full opening hours
        opening_hours: {
          open_now: details?.current_opening_hours?.open_now || place.opening_hours?.open_now,
          weekday_text: details?.current_opening_hours?.weekday_text || details?.opening_hours?.weekday_text,
          periods: details?.current_opening_hours?.periods || details?.opening_hours?.periods
        },
        
        photos: place.photos?.map(photo => ({
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        })) || [],
        
        // Location & Contact
        place_id: place.place_id,
        formatted_address: details?.formatted_address || place.vicinity,
        formatted_phone_number: details?.formatted_phone_number || null,
        international_phone_number: details?.international_phone_number || null,
        website: details?.website,
        
        // Business Status
        business_status: place.business_status?.toLowerCase().replace(/_/g, ' '),
        price_level: details?.price_level || place.price_level,
        
        // Accessibility
        wheelchair_accessible: details?.wheelchair_accessible_entrance || false,
        wheelchair_parking: details?.wheelchair_accessible_parking || false,
        wheelchair_restroom: details?.wheelchair_accessible_restroom || false,
        
        // Amenities
        restroom: details?.restroom || false,
        public_transport: details?.public_transport || false,
        parking_available: details?.parking || false,
        free_parking: details?.free_parking || false,
        
        // Family Features
        good_for_children: details?.good_for_children || false,
        family_friendly: details?.family_friendly || false,
        
        // Top Reviews
        top_reviews: topReviews,
        
        // Amenities & Features
        outdoor_seating: details?.outdoor_seating || false,
        takeout: details?.takeout || false,
        delivery: details?.delivery || false,
        dine_in: details?.dine_in || false,
        reservable: details?.reservable || false,
        accepts_credit_cards: details?.accepts_credit_cards || false,
        
        // Dining Options
        serves_beer: details?.serves_beer || false,
        serves_wine: details?.serves_wine || false,
        serves_vegetarian: details?.serves_vegetarian_food || false,
        
        // Meal service
        serves_meals: {
          breakfast: details?.serves_breakfast || false,
          lunch: details?.serves_lunch || false,
          dinner: details?.serves_dinner || false,
          vegetarian: details?.serves_vegetarian_food || false,
          beer: details?.serves_beer || false,
          wine: details?.serves_wine || false
        },

        // Service options
        service_options: {
          dine_in: details?.dine_in || false,
          takeout: details?.takeout || false,
          delivery: details?.delivery || false,
          curbside_pickup: details?.curbside_pickup || false,
          reservable: details?.reservable || false
        },

        // Payment options
        payment_options: {
          credit_cards: details?.payment_options?.credit_card || false,
          debit_cards: details?.payment_options?.debit_card || false,
          nfc_mobile: details?.payment_options?.nfc_mobile_pay || false
        },
        
        // Categories
        types: place.types,
        
        // Additional fields
        plus_code: place.plus_code,
        compound_code: place.plus_code?.compound_code,
        icon_background_color: place.icon_background_color,
        icon_mask_base_uri: place.icon_mask_base_uri,
        icon: place.icon
      };
    }));

    // Log the processed results
    console.log(`\n✅ [${requestId}] Sending response:`, {
      businessCount: businesses.length,
      firstBusiness: businesses[0] ? {
        name: businesses[0].name,
        vicinity: businesses[0].vicinity
      } : null
    });

    // Log first business for debugging
    if (businesses.length > 0) {
      console.log('📌 First result:', {
        name: businesses[0].name,
        address: businesses[0].address
      });
    }

    // Generate AI response
    const aiResponse = await generateResponse(req.body.query, businesses);
    
    res.json({ 
        businesses,
        message: aiResponse
    });

  } catch (error) {
    console.error(`\n❌ [${requestId}] Error:`, {
      message: error.message,
      googleApiStatus: error.response?.data?.status,
      googleApiError: error.response?.data?.error_message
    });
    next(error);
  }
});

// Add new routes for voice features
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const audioContent = await synthesizeSpeech(text);
    res.set('Content-Type', 'audio/mp3');
    res.send(audioContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stt', async (req, res) => {
  try {
    const audioBuffer = Buffer.from(req.body.audio, 'base64');
    const transcript = await transcribeSpeech(audioBuffer);
    res.json({ transcript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add static file serving for production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '../client/build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
    });
}

// 404 handler - place before error handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Update error handling middleware
app.use((err, req, res, next) => {
  console.error('\n❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Add API health check function
const checkGoogleAPIs = async () => {
  // Validate API key first
  if (!process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY.length < 20) {
    console.error('❌ Invalid Google Maps API key configuration');
    return false;
  }

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
            key: process.env.GOOGLE_MAPS_API_KEY.trim()
          };

          const response = await axios.get(placesUrl, { 
            params,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            validateStatus: (status) => status < 500
          });

          if (response.data.status === 'REQUEST_DENIED') {
            throw new Error(response.data.error_message || 'API key invalid or unauthorized');
          }

          return response.data.status === 'OK';
        } catch (error) {
          console.error('Places API Error:', {
            message: error.message,
            response: error.response?.data
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

// Add API validation function
const validateGoogleAPIKey = async () => {
  try {
    const testUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const response = await axios.get(testUrl, {
      params: {
        place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4', // Test place ID
        fields: 'name',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'REQUEST_DENIED') {
      throw new Error(`Google API Error: ${response.data.error_message}`);
    }

    return true;
  } catch (error) {
    console.error('API Key Validation Failed:', error.message);
    return false;
  }
};

// Add IP check during startup
const checkIP = async () => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    console.log('\n🌐 Current IP Address:', response.data.ip);
    console.log('Add this IP to Google Cloud Console API key restrictions if needed');
  } catch (error) {
    console.error('Could not fetch IP:', error.message);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Check IP first
    await checkIP();
    
    // Validate API key before starting server
    const isValidAPI = await validateGoogleAPIKey();
    if (!isValidAPI) {
      throw new Error('Invalid or unauthorized Google Maps API key');
    }

    // Start server
    await new Promise((resolve, reject) => {
      const server = app.listen(PORT, () => {
        console.log(`\n✅ Server running on http://localhost:${PORT}`);
        resolve();
      });
      
      server.on('error', reject);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
