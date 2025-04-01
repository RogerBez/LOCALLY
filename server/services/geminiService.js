const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('⚠️ Gemini API key is missing');
      this.isConfigured = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: process.env.AI_MODEL_NAME || 'gemini-1.0-pro-latest'
      });
      this.isConfigured = true;
      console.log('✅ Gemini AI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Process user chat message with Gemini AI
   * @param {string} message - User's message
   * @param {Object} context - Conversation context including businesses and previous queries
   * @returns {Promise<Object>} AI response with message, options, etc.
   */
  async processChat(message, context = {}) {
    if (!this.isConfigured) {
      console.warn('⚠️ Gemini service not configured, using fallback logic');
      return this.fallbackProcessing(message, context);
    }

    try {
      // Create a system prompt with context for the AI
      const businesses = context.businesses || [];
      const previousQuery = context.previousQuery || '';
      const isFollowUp = businesses.length > 0;

      // Build a more conversational, personality-rich prompt
      let prompt = `You are Locally, a helpful and friendly AI assistant for finding local businesses. You have a warm, conversational personality and speak like a knowledgeable local friend. Your goal is to help users discover great local businesses.

      Use a casual, friendly tone and include personal touches like "I'd recommend" or "I've found" to make your responses feel more human-like and less robotic.
      
      ${isFollowUp ? `The user previously searched for "${previousQuery}" and I found ${businesses.length} results for them.` : ''}
      
      ${businesses.length > 0 ? `
      Here are some of the places I found for them:
      ${businesses.slice(0, 3).map(b => `- ${b.name} (${b.address}), rated ${b.rating}/5 stars`).join('\n')}
      ` : ''}
      
      The user says: "${message}"
      
      Based on what they said, have a natural conversation while helping them find what they need.
      If they're asking directly about businesses, help with that search.
      If they're asking general questions, chat naturally but gently guide them toward discovering local places.
      If they're making small talk, respond warmly but try to learn what they might be looking for.
      
      Respond in JSON format with this structure:
      {
        "message": "Your friendly, conversational response that sounds like a helpful local friend",
        "options": ["2-4 natural follow-up suggestions"],
        "searchQuery": "If they want to search for businesses, include the search term here, otherwise null",
        "needsConfirmation": boolean (true if you're suggesting a search that needs confirmation),
        "confirmedSearch": "Only include this if user has confirmed they want to search",
        "previousQuery": "Keep track of what they're talking about for context"
      }`;

      // Call the Gemini API
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse the JSON response from Gemini
      try {
        const parsedResponse = JSON.parse(text);
        console.log('🤖 Gemini response parsed successfully:', parsedResponse);
        return parsedResponse;
      } catch (parseError) {
        console.error('❌ Failed to parse Gemini response as JSON:', text);
        console.error('Parse error:', parseError);
        // Fall back to rule-based system
        return this.fallbackProcessing(message, context);
      }
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      return this.fallbackProcessing(message, context);
    }
  }

  /**
   * Fallback rule-based processing when Gemini is unavailable
   * @param {string} message - User's message
   * @param {Object} context - Conversation context 
   * @returns {Object} AI response with message, options, etc.
   */
  fallbackProcessing(message, context = {}) {
    const keywords = message.toLowerCase().trim();
    const hasResults = context?.businesses && context.businesses.length > 0;
    const previousQuery = context?.previousQuery;
    
    // Make fallback responses more conversational too
    if (hasResults) {
      // Handling follow-up questions about existing results
      if (keywords.includes('higher rated') || keywords.includes('better') || keywords.includes('top rated')) {
        return {
          message: `I'd be happy to find better-rated ${previousQuery || 'places'} for you! Let me see what's got the best reviews in your area.`,
          confirmedSearch: `best rated ${previousQuery || 'businesses'}`,
          searchQuery: `best rated ${previousQuery || 'businesses'}`,
          options: ["What about places with outdoor seating?", "Any hidden gems?", "Places with good reviews"]
        };
      } else if (keywords.includes('closer') || keywords.includes('nearby') || keywords.includes('near me')) {
        return {
          message: `Let me find some ${previousQuery || 'places'} that are closer to you. Sometimes the best spots are just around the corner!`,
          confirmedSearch: `${previousQuery || 'businesses'} very close to me`,
          searchQuery: `${previousQuery || 'businesses'} very close to me`,
          options: ["Are there any good deals nearby?", "Any popular spots?", "Places within walking distance"]
        };
      } else if (keywords.includes('different') || keywords.includes('something else')) {
        return {
          message: "I'd be happy to help you find something different! What kind of place are you looking for today?",
          options: ["Coffee shops", "Restaurants", "Shopping", "Entertainment"],
          needsConfirmation: false
        };
      } else if (keywords.includes('recommend') || keywords.includes('suggestion')) {
        return {
          message: `Based on the ${previousQuery || 'places'} we found, I'd personally recommend checking out the highest-rated ones first. People seem to love them! Would you like me to highlight the top-rated options?`,
          options: ["Yes, show the best ones", "Any with special offers?", "Find something different"],
          needsConfirmation: true
        };
      }
    }
    
    // General conversation starters and queries
    if (keywords.includes('hello') || keywords.includes('hi') || keywords.includes('hey')) {
      return {
        message: "Hey there! I'm your local business guide. How can I help you today? Looking for a great place to eat, shop, or hang out?",
        options: ["Find restaurants nearby", "Best coffee shops", "Things to do today", "Shopping options"],
        needsConfirmation: false
      };
    } else if (keywords.includes('how are you') || keywords.includes('how\'s it going')) {
      return {
        message: "I'm doing great, thanks for asking! I'm always excited to help people discover amazing local spots. What are you in the mood for today?",
        options: ["Food recommendations", "Activities nearby", "Best local shops"],
        needsConfirmation: false
      };
    } else if (keywords.includes('thank')) {
      return {
        message: "You're very welcome! I'm happy I could help. Anything else you'd like to know about local places?",
        options: ["Find another type of business", "More details about these places", "That's all for now"],
        needsConfirmation: false
      };
    }
    
    // Default response - make it conversational
    return {
      message: `That sounds interesting! Would you like me to search for "${message}" in your area? I can help you find great local options.`,
      options: ["Yes, find that for me", "No, let me rephrase", "What else can you help with?"],
      searchQuery: message,
      needsConfirmation: true,
      previousQuery: message
    };
  }
}

module.exports = new GeminiService();
