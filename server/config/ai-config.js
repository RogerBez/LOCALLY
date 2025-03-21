const AI_CONFIG = {
    // Default model settings
    model: {
        provider: 'gemini',  // Could be 'gemini', 'gpt4', etc.
        name: 'gemini-1.5-pro-001', // Updated to latest model
        fallback: 'gemini-1.5-flash-001',
        temperature: 0.7,
        maxTokens: 150
    },
    
    // Personality settings
    personalities: {
        professional: { temperature: 0.3 },
        friendly: { temperature: 0.7 },
        fun: { temperature: 0.9 }
    }
};

module.exports = AI_CONFIG;
