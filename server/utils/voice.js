const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');

// Initialize with explicit credentials if needed
const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

const sttClient = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

const synthesizeSpeech = async (text) => {
  try {
    const request = {
      input: { text },
      voice: {
        languageCode: process.env.TTS_VOICE_LANGUAGE_CODE,
        name: process.env.TTS_VOICE_NAME,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: parseFloat(process.env.TTS_SPEAKING_RATE),
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    return response.audioContent;
  } catch (error) {
    console.error('TTS Error:', error);
    throw error;
  }
};

const transcribeSpeech = async (audioBuffer) => {
  try {
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };
    const request = {
      audio,
      config,
    };

    const [response] = await sttClient.recognize(request);
    return response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
  } catch (error) {
    console.error('STT Error:', error);
    throw error;
  }
};

module.exports = {
  synthesizeSpeech,
  transcribeSpeech
};
