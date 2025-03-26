// Minimal API server for Render deployment
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors({ origin: '*' }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    request: {
      path: req.path,
      query: req.query,
      headers: {
        origin: req.headers.origin,
        host: req.headers.host
      }
    }
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test endpoint',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Search endpoint with mock data
app.get('/api/search', (req, res) => {
  const { query, lat, lng } = req.query;
  
  if (!query || !lat || !lng) {
    return res.status(400).json({ 
      error: 'Missing required parameters: query, lat, lng' 
    });
  }
  
  // Mock data for testing
  const businesses = [
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
  
  return res.json({ businesses });
});

// Home page with instructions
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>LOCALLY API Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2196F3; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>LOCALLY API Server</h1>
        <p>Current time: ${new Date().toISOString()}</p>
        
        <h2>Available Endpoints:</h2>
        
        <div class="endpoint">
          <h3>Health Check:</h3>
          <p><a href="/health">GET /health</a></p>
        </div>
        
        <div class="endpoint">
          <h3>Test API:</h3>
          <p><a href="/api/test">GET /api/test</a></p>
        </div>
        
        <div class="endpoint">
          <h3>CORS Test:</h3>
          <p><a href="/api/cors-test">GET /api/cors-test</a></p>
        </div>
        
        <div class="endpoint">
          <h3>Search:</h3>
          <p><a href="/api/search?query=coffee&lat=-33.9&lng=18.5">GET /api/search?query=coffee&lat=-33.9&lng=18.5</a></p>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Current time: ${new Date().toISOString()}`);
});