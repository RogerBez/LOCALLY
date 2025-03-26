// Simple API test server
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors({ origin: '*' }));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: '2025-03-26 15:55:04',
    user: 'RogerBez'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API test server running on port ${PORT}`);
});