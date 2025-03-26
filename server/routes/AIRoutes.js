const express = require('express');
const router = express.Router();
const axios = require('axios');

// AI Chat endpoint
router.post('/ai-chat', async (req, res) => {
  try {
    const { message, businesses, context, agentStyle = 'casual' } = req.body;
    
    // Basic validation
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('Missing Gemini API key');
      return res.status(500).json({ error: 'Server configuration error' });
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
    
    // Prepare the prompt for Gemini
    const prompt = `
You are an AI assistant for a local service finder app. ${personality}

${businessContext}

Please respond conversationally and provide helpful suggestions based on the user's query. 
If they're asking for filtering or specific information about the businesses, include a "filterAction" object in your response.

Example filterActions:
- For sorting by rating: { "type": "sort", "field": "rating", "order": "desc" }
- For filtering to minimum rating: { "type": "filter", "field": "rating", "operator": "gte", "value": 4 }
- For sorting by distance: { "type": "sort", "field": "distance", "order": "asc" }
- For filtering by price range: { "type": "filter", "field": "price_level", "operator": "lte", "value": 2 }

Also, suggest 2-3 follow-up questions or actions the user might want to take as options in this format:
- "Option text here"

User message: ${message}
`;
    
    // Make API request to Gemini
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.AI_MODEL_NAME}:generateContent`;
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    };
    
    const response = await axios.post(
      `${geminiEndpoint}?key=${apiKey}`,
      requestData
    );
    
    // Process Gemini response
    let aiResponse = '';
    let filterAction = null;
    let options = [];
    
    if (response.data.candidates && response.data.candidates.length > 0) {
      const content = response.data.candidates[0].content;
      aiResponse = content.parts[0].text;
      
      // Try to extract filterAction JSON if it exists
      try {
        const filterActionMatch = aiResponse.match(/\{[\s\S]*"type"[\s\S]*\}/);
        if (filterActionMatch) {
          const jsonStr = filterActionMatch[0];
          filterAction = JSON.parse(jsonStr);
          // Remove the JSON from the response
          aiResponse = aiResponse.replace(filterActionMatch[0], '');
        }
      } catch (e) {
        console.error('Error parsing filter action:', e);
      }
      
      // Extract suggested options from the response
      const optionMatches = aiResponse.match(/- "([^"]+)"/g);
      if (optionMatches) {
        options = optionMatches.map(match => match.replace(/- "([^"]+)"/, '$1'));
        // Remove the options from the response
        aiResponse = aiResponse.replace(/- "([^"]+)"/g, '');
      }
      
      // Clean up the response
      aiResponse = aiResponse
        .replace(/filterAction:[\s\S]*?\}/g, '')
        .replace(/Options:[\s\S]*?$/g, '')
        .replace(/\n\n+/g, '\n\n')
        .trim();
    }
    
    // Generate default options based on agent style if none were found
    if (options.length === 0) {
      switch (agentStyle) {
        case 'professional':
          options = [
            "Show highest rated establishments",
            "Sort by proximity",
            "View detailed comparison"
          ];
          break;
        case 'enthusiastic':
          options = [
            "Show me the BEST places! 🌟",
            "What's closest to me? 📍",
            "Any hidden gems? 💎"
          ];
          break;
        case 'analytical':
          options = [
            "Compare top-rated (4.5+) options",
            "Show nearest 3 businesses",
            "Find businesses with >100 reviews"
          ];
          break;
        case 'casual':
        default:
          options = [
            "Show highest rated places",
            "Sort by distance",
            "Any good deals?"
          ];
          break;
      }
    }
    
    res.json({
      message: aiResponse,
      filterAction,
      options
    });
  } catch (error) {
    console.error('AI chat error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message
    });
  }
});

module.exports = router;