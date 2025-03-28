const express = require('express');
const router = express.Router();

// AI Chat endpoint
router.post('/ai-chat', async (req, res) => {
  try {
    const { message, isConfirmation, context } = req.body;
    
    // Copy your AI chat logic here from server.js
    // This will be a backup route in case the main one fails

    console.log('AI Route hit:', {
      message,
      isConfirmation,
      hasContext: !!context
    });

    res.json({
      message: "Hello! How can I help you today?",
      options: ["Restaurants", "Services", "Shopping"],
      needsConfirmation: false
    });
  } catch (error) {
    console.error('AI Route Error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

module.exports = router;