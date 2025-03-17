require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test data
const sampleBusinesses = [
    {
        name: "Test Business",
        address: "123 Test St",
        latitude: 37.7749,
        longitude: -122.4194,
        rating: 4.5,
        phone: "555-0123"
    }
];

// Test routes
app.get('/', (req, res) => {
    res.json({ status: 'Server is running!' });
});

app.get('/api/businesses', (req, res) => {
    res.json(sampleBusinesses);
});

// Start server
const PORT = process.env.PORT || 5000;

try {
    const server = app.listen(PORT, () => {
        console.clear(); // Clear console
        console.log('\n=================================');
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log('Try these endpoints:');
        console.log(`📍 http://localhost:${PORT}/`);
        console.log(`📍 http://localhost:${PORT}/api/businesses`);
        console.log('=================================\n');
    });

    // Handle server errors
    server.on('error', (error) => {
        console.error('Server error:', error);
    });

    // Handle process events
    process.on('SIGTERM', () => {
        console.log('Server shutting down...');
        server.close();
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
    });

} catch (error) {
    console.error('Failed to start server:', error);
}
