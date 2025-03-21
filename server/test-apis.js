require('dotenv').config();
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AI_CONFIG = require('./config/ai-config');

async function testAPIs() {
  console.log('\n🔍 Testing Google Cloud APIs...');
  
  try {
    // 1. Test Text-to-Speech
    console.log('\nTesting Text-to-Speech API...');
    const ttsClient = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT
    });
    
    const ttsRequest = {
      input: { text: 'Hello, this is a test.' },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
    console.log('✅ Text-to-Speech API working');

    // 2. Test Speech-to-Text
    console.log('\nTesting Speech-to-Text API...');
    const sttClient = new speech.SpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT
    });
    
    console.log('✅ Speech-to-Text client initialized');

    // 3. Test Gemini API
    console.log('\nTesting Gemini API...');
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.model.name });
    
    console.log('Using Gemini model:', AI_CONFIG.model.name);
    console.log('Sending test prompt...');
    
    const prompt = "Tell me a short greeting message.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log('✅ Gemini API working');
    console.log('Sample response:', response.text());
    
  } catch (error) {
    console.error('\n❌ Error testing APIs:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.response?.data || error.details || 'No additional details'
    });
  }
}

testAPIs();
