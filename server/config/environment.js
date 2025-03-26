require('dotenv').config();

const environment = {
  PORT: process.env.PORT || 5000,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '15000', 10)
};

module.exports = environment;