// Load environment variables
require('dotenv').config();

// Export the serverless function
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  // Send a simple response
  res.status(200).json({
    message: 'LOCALLY API is running!',
    endpoints: [
      {
        path: '/api/query',
        method: 'POST',
        description: 'Search for businesses based on a query'
      },
      {
        path: '/api/images/:placeId',
        method: 'GET',
        description: 'Get images for a specific place'
      }
    ]
  });
};
