const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// Special CORS handling for OPTIONS requests
router.options('/ai-chat', (req, res) => {
  // Set specific origin instead of wildcard
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
  // Set specific origin instead of wildcard
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  console.log('📩 AI Chat endpoint hit in aiRoutes.js:', {
    body: req.body,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
  
  try {
    const { message, isConfirmation, context } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string',
        received: message
      });
    }

    // Process the message using Gemini AI service
    const response = await geminiService.processChat(message, {
      ...context,
      isConfirmation
    });

    // Log the response
    console.log('📤 AI Response prepared:', response);
    
    // Return the response
    return res.json(response);
    
  } catch (error) {
    console.error('❌ AI Chat error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
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

module.exports = router;