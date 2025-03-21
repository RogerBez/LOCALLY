const { GoogleGenerativeAI } = require("@google/generative-ai");
const AI_CONFIG = require('../config/ai-config');

async function generateText(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: AI_CONFIG.model.name });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

const generateResponse = async (query, businesses) => {
  try {
    const prompt = `You are LOCALLY, an AI assistant helping users find local businesses.
    Query: "${query}"
    Number of businesses found: ${businesses.length}
    ${businesses.length > 0 ? `
    Top rated business: "${businesses[0].name}"
    Closest business: "${businesses.sort((a, b) => (a.distance || 99999) - (b.distance || 99999))[0].name}"
    ` : ''}`;

    return await generateText(prompt);
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (error.message.includes('not found')) {
      // Try fallback model
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: AI_CONFIG.model.fallback });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }
    return generateFallbackResponse(query, businesses);
  }
};

const generateFollowUpQuestion = async (query, businesses, aiPersonality = 'professional') => {
    try {
        const prompt = `As an AI assistant helping users find local businesses, generate a follow-up question based on this context:
        User's search: "${query}"
        Number of results: ${businesses.length}
        Business types found: ${businesses.map(b => b.types).flat().slice(0, 5).join(', ')}

        Based on their search, suggest ONE of these types of follow-up questions:
        1. If they might want to filter by rating (e.g., "Would you like to see only places rated 4+ stars?")
        2. If they might want to expand distance (e.g., "Would you like to see places further away?")
        3. If they might want specific features (e.g., for restaurants: "Do you prefer places with outdoor seating?")
        4. If they might want to load more results (e.g., "Would you like to see 20 more options?")

        Personality style: ${aiPersonality}
        - Professional: Clear and efficient
        - Friendly: Casual and warm
        - Fun: Energetic and emoji-friendly

        Return ONLY the follow-up question, no other text.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful local business finder. Keep responses short and natural."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating follow-up:', error);
        return null;
    }
};

// Fallback to template responses if AI fails
const generateFallbackResponse = (query, businesses) => {
    // ...existing code from generateConversationalResponse function...
};

module.exports = { 
    generateResponse,
    generateFollowUpQuestion 
};
