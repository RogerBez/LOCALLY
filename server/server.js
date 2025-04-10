const express = require('express');
const cors = require('cors');
const env = require('./config/environment');
const placesRoutes = require('./routes/placesRoutes');
const axios = require('axios');
const apiRoutes = require('./routes/api');
const path = require('path');
const geminiService = require('./services/geminiService'); // Get geminiService
const aiRoutes = require('./routes/aiRoutes'); // Import aiRoutes
const app = express();

// Ensure this is before route definitions
app.use(express.json());

// Define allowed origins, including both Render and Vercel domains
const corsOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'https://locally-frontend.vercel.app', 'https://locally-frontend-43pth6cnj-the-marketing-teams-projects.vercel.app'];

console.log('🔒 Configured CORS origins:', corsOrigins);

// Update CORS configuration to handle origins properly
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        console.log('✅ Allowing request with no origin');
        return callback(null, true);
      }

      if (corsOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        console.log(`✅ CORS allowed for origin: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`❌ Origin ${origin} not allowed by CORS`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    maxAge: 86400,
  })
);

// Add better CORS preflight handling
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.sendStatus(200);
});

// Debug logging for all incoming requests
app.use((req, res, next) => {
  console.log(`📌 ${req.method} request received for: ${req.url}`);
  next();
});

// Add environment check endpoint
app.get('/api/env-check', (req, res) => {
  res.json({
    hasGoogleMapsApiKey: !!process.env.GOOGLE_MAPS_API_KEY,
    environment: process.env.NODE_ENV,
    serverTime: new Date().toISOString(),
  });
});

// Mount all routes
app.use('/api/places', placesRoutes);
app.use('/api', apiRoutes); // Generic API routes
app.use('/api', aiRoutes); // Mount aiRoutes under /api

// Add a diagnostic endpoint to list all registered routes
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
      });
    } else if (middleware.name === 'router') {
      // Routes added via router
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
          });
        }
      });
    }
  });

  res.json({ routes });
});

// Add this test endpoint to check CORS configuration
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is correctly configured',
    timestamp: new Date().toISOString(),
    cors: {
      allowed_origins: corsOrigins,
      request_origin: req.headers.origin || 'No origin header',
      env_cors_origin: env.CORS_ORIGIN,
    },
    headers_received: {
      origin: req.headers.origin,
      host: req.headers.host,
      referer: req.headers.referer,
    },
  });
});

// Add this test endpoint to check if the API key works
app.get('/api/maps-test', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    res.json({
      keyExists: !!apiKey,
      keyFirstChars: apiKey ? `${apiKey.substring(0, 5)}...` : null,
      googleApiUrl: `https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=1&size=100x100&key=${apiKey}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Ensure this is after all API routes
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
} else {
  console.log('Running in development mode');
}

const PORT = env.PORT || 5000; // Default to 5000 if PORT is not set

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;