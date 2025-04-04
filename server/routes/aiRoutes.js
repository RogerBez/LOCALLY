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
  console.log('📩 POST request for /ai-chat with body:', req.body);
  // Set CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Verify the body is properly parsed
  if (!req.body) {
    console.error('❌ Request body is empty or not parsed');
    return res.status(400).json({
      error: 'Request body is missing',
      headers: req.headers
    });
  }
  
  try {
    const { message, isConfirmation, context } = req.body;
    
    if (!message || typeof message !== 'string') {
      console.error('❌ Invalid message received:', message);
      return res.status(400).json({
        error: 'Message is required and must be a string',
        received: message
      });
    }

    // Use try-catch for Gemini service
    let response;
    try {
      // Process the message using Gemini AI service
      response = await geminiService.processChat(message, {
        ...context,
        isConfirmation
      });
      console.log('📤 AI Response prepared:', response);
    } catch (geminiError) {
      console.error('❌ Gemini service error:', geminiError);
      // Provide a fallback response instead of failing
      response = {
        message: `I'm sorry, I encountered a problem processing your request. Let me provide a simple response instead. How can I help you find local businesses?`,
        options: ["Restaurants", "Hotels", "Services"],
        needsConfirmation: false
      };
    }
    
    // Return the response
    return res.json(response);
    
  } catch (error) {
    console.error('❌ AI Chat error:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
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

// Add direct debug endpoint
router.get('/debug', (req, res) => {
  console.log('📩 GET request for /debug');
  res.json({
    message: 'AI routes debug endpoint',
    routes: router.stack.map(r => r.route ? `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}` : 'middleware'),
    timestamp: new Date().toISOString()
  });
});

// Explicitly confirm this module loaded
console.log('✅ aiRoutes.js loaded successfully. Routes registered:');
router.stack.forEach(r => {
  if (r.route) {
    console.log(`   - ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
  }
});

module.exports = router;