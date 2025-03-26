import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { targetUrl, params, method = 'GET' } = req.body;

  // Create cache key from request details
  const cacheKey = JSON.stringify({ targetUrl, params });

  try {
    // Check cache first
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      console.log('📦 Returning cached response');
      return res.json(cachedResponse);
    }

    // Make the actual request
    const response = await axios({
      method,
      url: targetUrl,
      params,
      headers: {
        'Accept-Encoding': 'gzip',
        'User-Agent': 'LocalServiceAgent/1.0'
      }
    });

    // Cache the response
    cache.set(cacheKey, response.data);
    setTimeout(() => cache.delete(cacheKey), CACHE_DURATION);

    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      message: 'Proxy error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
