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

// Update CORS configuration with all possible frontend URLs
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://locally.vercel.app',
  'https://locally-frontend.vercel.app',
  'https://locally-frontend-4zt1fc4w8-the-marketing-teams-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Add CORS preflight handler
app.options('*', cors());

// Add explicit headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || origin?.endsWith('.vercel.app')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

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
        location: response.data.results[0].geometry?.location
      } : null
    });

    // Enhanced logging of first result to see all available fields
    if (response.data.results?.[0]) {
      console.log('\n📍 Available Business Data Fields:');
      const sampleBusiness = response.data.results[0];
      console.log(JSON.stringify({
        // Basic info
        name: sampleBusiness.name,
        rating: sampleBusiness.rating,
        user_ratings_total: sampleBusiness.user_ratings_total,
        price_level: sampleBusiness.price_level,
        
        // Location
        vicinity: sampleBusiness.vicinity,
        formatted_address: sampleBusiness.formatted_address,
        
        // Status
        business_status: sampleBusiness.business_status,
        opening_hours: sampleBusiness.opening_hours,
        
        // Categories & Details
        types: sampleBusiness.types,
        icon: sampleBusiness.icon,
        
        // Photos
        photos: sampleBusiness.photos?.length || 0,
        
        // Place details
        place_id: sampleBusiness.place_id,
        plus_code: sampleBusiness.plus_code,
        
        // Additional fields if any
        ...Object.keys(sampleBusiness)
          .filter(key => !['name', 'rating', 'user_ratings_total', 'price_level', 'vicinity', 
                         'formatted_address', 'business_status', 'opening_hours', 'types', 
                         'icon', 'photos', 'place_id', 'plus_code'].includes(key))
          .reduce((obj, key) => ({ ...obj, [key]: typeof sampleBusiness[key] }), {})
      }, null, 2));
    }

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

    res.json({ businesses });
  } catch (error) {
    console.error(`\n❌ [${requestId}] Error:`, {
      message: error.message,
      googleApiStatus: error.response?.data?.status,
      googleApiError: error.response?.data?.error_message
    });
    next(error);
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
