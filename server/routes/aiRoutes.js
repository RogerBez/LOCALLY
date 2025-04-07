const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// Log when this module is loaded
console.log('🔄 Loading aiRoutes.js module...');

// Debug logging middleware for all AI routes
router.use((req, res, next) => {
  console.log(`🤖 AI Route accessed: ${req.method} ${req.path}`);
  next();
});

// Special CORS handling for OPTIONS requests
router.options('/ai-chat', (req, res) => {
  console.log('🔄 OPTIONS request for /ai-chat');
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

// AI Chat endpoint
router.post('/ai-chat', async (req, res) => {
  console.log('📩 POST request for /ai-chat received');
  console.log('Request body:', req.body); // Log the request body

  if (!req.body) {
    console.error('❌ Request body is missing');
    return res.status(400).json({ error: 'Request body is missing' });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      console.error('❌ Invalid message:', message);
      return res.status(400).json({ error: 'Message must be a string' });
    }

    const response = {
      message: `You said: "${message}". How can I assist you further?`,
      options: ["Hotels", "Restaurants", "Services"],
    };

    console.log('📤 Response:', response);
    return res.json(response);
  } catch (error) {
    console.error('❌ AI Chat error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add a simple test endpoint that doesn't use geminiService
router.get('/ai-test', (req, res) => {
  console.log('📩 GET request for /ai-test');
  res.json({
    message: 'AI routes are working',
    timestamp: new Date().toISOString(),
    route: '/api/ai-test'
  });
});

// Add a backup basic AI chat endpoint
router.post('/ai-chat-backup', async (req, res) => {
  console.log('📩 Backup AI Chat endpoint hit');
  
  try {
    const { message } = req.body;
    
    // Simple fallback response
    const response = {
      message: `I received your message: "${message}". What would you like to search for?`,
      options: ["Restaurants", "Hotels", "Services"],
      needsConfirmation: false
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Backup AI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fallback route for /simple-ai-chat
router.post('/simple-ai-chat', async (req, res) => {
  console.log('📩 POST request for /simple-ai-chat with body:', req.body);

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message must be a string' });
    }

    const response = {
      message: `Simple AI received your message: "${message}".`,
      options: ["Option 1", "Option 2", "Option 3"],
    };

    return res.json(response);
  } catch (error) {
    console.error('❌ Error in /simple-ai-chat:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Fallback route for /direct-ai-chat
router.post('/direct-ai-chat', async (req, res) => {
  console.log('📩 POST request for /direct-ai-chat with body:', req.body);

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message must be a string' });
    }

    const response = {
      message: `Direct AI received your message: "${message}".`,
      options: ["Option A", "Option B", "Option C"],
    };

    return res.json(response);
  } catch (error) {
    console.error('❌ Error in /direct-ai-chat:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add direct debug endpoint
router.get('/debug', (req, res) => {
  console.log('📩 GET request for /debug');
  res.json({
    message: 'AI routes debug endpoint',
    routes: router.stack.map(r => r.route ? `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}` : 'middleware'),
    timestamp: new Date().toISOString()
  });
});

// Add a test endpoint to confirm the router is mounted
router.get('/test', (req, res) => {
  console.log('📩 AI Routes test endpoint hit');
  res.json({ message: 'AI Routes are working' });
});

// Explicitly confirm this module loaded
console.log('✅ aiRoutes.js loaded successfully. Routes registered:');
router.stack.forEach(r => {
  if (r.route) {
    console.log(`   - ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
  }
});

module.exports = router;