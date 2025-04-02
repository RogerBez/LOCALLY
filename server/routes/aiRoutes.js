const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const aiRoutes = require('./routes/aiRoutes');
// Special CORS handling for OPTIONS requests
// Special CORS handling for OPTIONS requests
router.options('/ai-chat', (req, res) => {rd
  // Set specific origin instead of wildcard
  const origin = req.headers.origin;
  if (origin) {'Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Origin', origin);
  } else {ader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  }es.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');ted-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});
// AI Chat endpoint
// AI Chat endpointat', async (req, res) => {
router.post('/ai-chat', async (req, res) => {
  // Set specific origin instead of wildcard
  const origin = req.headers.origin;
  if (origin) {'Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Origin', origin);
  } else {ader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  }es.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');ted-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  console.log('📩 AI Chat endpoint hit in aiRoutes.js:', {
  console.log('📩 AI Chat endpoint hit in aiRoutes.js:', {
    body: req.body,
    url: req.url,w Date().toISOString(),
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
  try {
  try {st { message, isConfirmation, context } = req.body;
    const { message, isConfirmation, context } = req.body;
    if (!message || typeof message !== 'string') {
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ and must be a string',
        error: 'Message is required and must be a string',
        received: message
      });
    }
    // Process the message using Gemini AI service
    // Process the message using Gemini AI serviceat(message, {
    const response = await geminiService.processChat(message, {
      ...context,ion
      isConfirmation
    });
    // Log the response
    // Log the responseResponse prepared:', response);
    console.log('📤 AI Response prepared:', response);
    // Return the response
    // Return the responsese);
    return res.json(response);
    catch (error) {
  } catch (error) {❌ AI Chat error:', error);
    console.error('❌ AI Chat error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});
// Add a backup basic AI chat endpoint
// Add a backup basic AI chat endpointreq, res) => {
router.post('/ai-chat-backup', async (req, res) => {
  console.log('📩 Backup AI Chat endpoint hit');
  try {
  try {st { message } = req.body;
    const { message } = req.body;
    // Simple fallback response
    // Simple fallback response
    const response = {ived your message: "${message}". What would you like to search for?`,
      message: `I received your message: "${message}". What would you like to search for?`,
      options: ["Restaurants", "Hotels", "Services"],
      needsConfirmation: false
    };
    res.json(response);
    res.json(response);
  } catch (error) {❌ Backup AI error:', error);
    console.error('❌ Backup AI error:', error); });
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;// Add a simple test endpoint that doesn't use geminiService
router.get('/ai-test', (req, res) => {
  res.json({
    message: 'AI routes are working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;