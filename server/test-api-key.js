// test-api-key.js
const axios = require('axios');

// Direct test with your API key
const API_KEY = 'AIzaSyCuNG7tLLBn97JBccV3HifTnCLFhQ0g8qw'; // Replace with your key

async function testApiKey() {
  try {
    console.log('Testing Google Places API key...');
    
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const params = {
      query: 'pizza',
      location: '-33.9397424,18.515235',
      radius: 5000,
      key: API_KEY
    };
    
    console.log('Making request with params:', {
      ...params,
      key: 'HIDDEN' // Hide key in logs
    });
    
    const response = await axios.get(url, { params });
    
    console.log('Response status:', response.data.status);
    
    if (response.data.status === 'OK') {
      console.log('✅ API key is working!');
      console.log(`Found ${response.data.results.length} results`);
    } else {
      console.log('❌ API key test failed!');
      console.log('Error message:', response.data.error_message);
    }
  } catch (error) {
    console.error('Error testing API key:', error.message);
  }
}

testApiKey();