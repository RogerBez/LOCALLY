const express = require('express');
const router = express.Router();

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

    const keywords = message.toLowerCase().trim();
    let response = {
      message: '',
      options: [],
      searchQuery: null,
      needsConfirmation: false
    };

    // Check if this is a follow-up refinement
    const hasResults = context?.businesses && context.businesses.length > 0;
    const previousQuery = context?.previousQuery;

    // Enhanced conversation logic with follow-up capabilities
    if (hasResults) {
      // Handle follow-up conversation for existing results
      if (keywords.includes('higher rated') || keywords.includes('better rating')) {
        response = {
          message: `I'll search for higher-rated ${previousQuery || 'businesses'} for you.`,
          confirmedSearch: `best rated ${previousQuery || 'businesses'}`,
          searchQuery: `best rated ${previousQuery || 'businesses'}`,
          options: []
        };
      } else if (keywords.includes('closer') || keywords.includes('nearby') || keywords.includes('near me')) {
        response = {
          message: `I'll find ${previousQuery || 'businesses'} closer to your location.`,
          confirmedSearch: `${previousQuery || 'businesses'} very close to me`,
          searchQuery: `${previousQuery || 'businesses'} very close to me`,
          options: []
        };
      } else if (keywords.includes('different') || keywords.includes('something else')) {
        response = {
          message: "What type of business would you like to search for instead?",
          options: ["Restaurants", "Services", "Shopping"],
          needsConfirmation: false
        };
      } else if (keywords.includes('more info') || keywords.includes('details') || keywords.includes('tell me about')) {
        response = {
          message: `I've shown you the best ${previousQuery || 'businesses'} in your area. You can tap on any business card to see more details like contact information, ratings, and location.`,
          options: ["Show higher rated places", "Find places closer to me", "Different type of business"],
          needsConfirmation: false
        };
      } else {
        // Regular search logic
        if (isConfirmation) {
          if (keywords.includes('yes') || keywords.includes('search now')) {
            const originalQuery = context?.previousQuery || context?.searchQuery || message;
            response = {
              message: `Searching for "${originalQuery}"...`,
              confirmedSearch: originalQuery,
              searchQuery: originalQuery,
              options: []
            };
          } else if (keywords.includes('plumber') || keywords.includes('electrician') || 
                    keywords.includes('mechanic') || keywords.includes('cleaning')) {
            response = {
              message: `Searching for "${message}" in your area...`,
              confirmedSearch: message,
              searchQuery: message,
              options: []
            };
          } else {
            response = {
              message: "Okay, what would you like to search for instead?",
              options: ["Restaurants", "Services", "Shopping"],
              needsConfirmation: false
            };
          }
        } else if (keywords.includes('help') || keywords.includes('hi') || keywords.includes('hello')) {
          response = {
            message: "Hi! I can help you find local businesses. What are you looking for?",
            options: ["Restaurants", "Services", "Shopping"],
            needsConfirmation: false
          };
        } else if (keywords.includes('restaurant') || keywords.includes('food')) {
          response = {
            message: "What kind of food are you interested in?",
            options: ["Italian", "Chinese", "Fast Food", "Indian"],
            needsConfirmation: true
          };
        } else if (keywords.includes('service') || keywords.includes('plumber') || keywords.includes('electrician')) {
          if (keywords.includes('plumber') || keywords.includes('electrician') || 
              keywords.includes('mechanic') || keywords.includes('cleaning')) {
            response = {
              message: `Searching for "${message}" in your area...`,
              confirmedSearch: message,
              searchQuery: message,
              options: []
            };
          } else {
            response = {
              message: "What type of service do you need?",
              options: ["Plumber", "Electrician", "Mechanic", "Cleaning"],
              needsConfirmation: true,
              searchQuery: "services"
            };
          }
        } else {
          response = {
            message: `Would you like me to search for "${message}"?`,
            options: ["Yes, search now", "No, let me rephrase"],
            searchQuery: message,
            needsConfirmation: true,
            previousQuery: message
          };
        }
      }
    } else {
      // First time search logic
      if (isConfirmation) {
        if (keywords.includes('yes') || keywords.includes('search now')) {
          const originalQuery = context?.previousQuery || context?.searchQuery || message;
          response = {
            message: `Searching for "${originalQuery}"...`,
            confirmedSearch: originalQuery,
            searchQuery: originalQuery,
            options: []
          };
        } else if (keywords.includes('plumber') || keywords.includes('electrician') || 
                  keywords.includes('mechanic') || keywords.includes('cleaning')) {
          response = {
            message: `Searching for "${message}" in your area...`,
            confirmedSearch: message,
            searchQuery: message,
            options: []
          };
        } else {
          response = {
            message: "Okay, what would you like to search for instead?",
            options: ["Restaurants", "Services", "Shopping"],
            needsConfirmation: false
          };
        }
      } else if (keywords.includes('help') || keywords.includes('hi') || keywords.includes('hello')) {
        response = {
          message: "Hi! I can help you find local businesses. What are you looking for?",
          options: ["Restaurants", "Services", "Shopping"],
          needsConfirmation: false
        };
      } else if (keywords.includes('restaurant') || keywords.includes('food')) {
        response = {
          message: "What kind of food are you interested in?",
          options: ["Italian", "Chinese", "Fast Food", "Indian"],
          needsConfirmation: true
        };
      } else if (keywords.includes('service') || keywords.includes('plumber') || keywords.includes('electrician')) {
        if (keywords.includes('plumber') || keywords.includes('electrician') || 
            keywords.includes('mechanic') || keywords.includes('cleaning')) {
          response = {
            message: `Searching for "${message}" in your area...`,
            confirmedSearch: message,
            searchQuery: message,
            options: []
          };
        } else {
          response = {
            message: "What type of service do you need?",
            options: ["Plumber", "Electrician", "Mechanic", "Cleaning"],
            needsConfirmation: true,
            searchQuery: "services"
          };
        }
      } else {
        response = {
          message: `Would you like me to search for "${message}"?`,
          options: ["Yes, search now", "No, let me rephrase"],
          searchQuery: message,
          needsConfirmation: true,
          previousQuery: message
        };
      }
    }

    console.log('📤 AI Response prepared:', response);
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