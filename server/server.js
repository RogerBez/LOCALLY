const express = require('express');
const cors = require('cors');
const env = require('./config/environment');
const placesRoutes = require('./routes/placesRoutes');
const axios = require('axios');
const aiRoutes = require('./routes/aiRoutes');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Mount all your routes
app.use('/api/places', placesRoutes);
app.use('/api', apiRoutes);  // Generic API routes
app.use('/api', aiRoutes);   // AI-specific routes

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
app.get('/api/search', async (req, res) => {
  const { query, lat, lng } = req.query;
  
  if (!query || !lat || !lng) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required parameters: query, lat, lng' 
    });
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
        },
        {
          place_id: 'mock-place-3',
          name: `${query} Elite`,
          address: '789 Plaza Ave, Downtown',
          latitude: parseFloat(lat) + 0.002,
          longitude: parseFloat(lng) + 0.003,
          rating: 4.8,
          aggregatedReviews: 210,
          distance: 0.8,
          phone: '+27215559012',
          website: 'https://example3.com',
          logo: 'https://via.placeholder.com/60',
        }
      ];
      
      return res.json({ businesses: mockBusinesses });
    }
    
    // Real Google Places API implementation
    const radius = 5000; // 5km radius
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
    
    console.log(`[Server] Searching for "${query}" near ${lat},${lng}`);
    
    // Fetch places from Google API
    const response = await axios.get(placesUrl);
    
    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error(`[Server] Google Places API error: ${response.data.status}`);
      return res.status(500).json({ 
        success: false,
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

// Also fix the health endpoint your frontend might be checking
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Add a direct /api/ai-chat endpoint as a fallback
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message, businesses, context, agentStyle = 'casual' } = req.body;
    
    // Basic validation
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('Missing Gemini API key');
      // Return a mock response for testing
      return res.json({
        message: "I don't have access to the AI service right now, but I can help you find what you're looking for. What kind of business are you interested in?",
        options: [
          "Show highest rated places",
          "Sort by distance",
          "Budget-friendly options"
        ]
      });
    }
    
    // Prepare conversation context
    const conversationContext = context || [];
    
    // Add business information for context
    let businessContext = '';
    if (businesses && businesses.length > 0) {
      businessContext = `Here are the current search results (${businesses.length} businesses): \n`;
      businesses.forEach((business, index) => {
        businessContext += `${index + 1}. ${business.name} - Rating: ${business.rating}, Reviews: ${business.aggregatedReviews}, Distance: ${business.distance}km\n`;
      });
    } else {
      businessContext = 'There are currently no search results.';
    }
    
    // Define personality traits based on agent style
    let personality = '';
    switch (agentStyle) {
      case 'professional':
        personality = 'You are professional, formal, and efficient. Use business-appropriate language and focus on delivering value efficiently.';
        break;
      case 'enthusiastic':
        personality = 'You are very enthusiastic and upbeat! Use exclamation points and emoji frequently. Show excitement about helping the user!';
        break;
      case 'analytical':
        personality = 'You are analytical and data-driven. Provide specific metrics and comparisons when discussing businesses. Use numbers and percentages when appropriate.';
        break;
      case 'casual':
      default:
        personality = 'You are friendly, casual, and conversational. Use relaxed language as if talking to a friend.';
        break;
    }
    
    // Mock response for testing
    res.json({
      message: `[${agentStyle} style] I can help you find great local businesses! What are you looking for specifically?`,
      options: [
        "Show highest rated places",
        "Sort by distance",
        "Price options"
      ]
    });
    
  } catch (error) {
    console.error('AI chat error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message
    });
  }
});
// Direct AI chat endpoint to bypass aiRoutes.js completely
app.post('/api/ai-chat', (req, res) => {
  console.log('Direct AI chat endpoint called');
  try {
    // Log request body (sanitized)
    console.log('Request body:', JSON.stringify({
      message: req.body?.message || '[missing]',
      hasBusinesses: !!req.body?.businesses,
      businessCount: req.body?.businesses?.length || 0,
      agentStyle: req.body?.agentStyle || 'casual'
    }));
    
    // Simple mock response
    const response = {
      message: "I'm a simple AI assistant. I can help you find local businesses. What are you looking for?",
      options: [
        "Show highest rated places",
        "Sort by distance",
        "Compare prices"
      ]
    };
    
    // Log success
    console.log('Sending response:', JSON.stringify(response));
    
    // Send the response
    return res.json(response);
  } catch (error) {
    // Log detailed error
    console.error('Error in direct AI chat endpoint:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Send error response
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'The server encountered an error processing your request.'
    });
  }
});
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

module.exports = app;