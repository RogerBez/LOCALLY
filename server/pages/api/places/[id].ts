import { NextApiRequest, NextApiResponse } from 'next';
import { GooglePlacesService } from '../../../services/google-places.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  console.log('\n📍 Place Details API Request:', { id, headers: req.headers });

  if (!id || typeof id !== 'string') {
    console.error('❌ Invalid place ID:', id);
    return res.status(400).json({ message: 'Invalid place ID' });
  }

  try {
    const placesService = new GooglePlacesService();
    console.log('🔍 Fetching place details from Google API');
    
    const placeDetails = await Promise.race([
      placesService.getPlaceDetails(id as string),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      )
    ]);

    console.log('\n✅ Google API Response:', {
      success: !!placeDetails,
      fields: placeDetails ? Object.keys(placeDetails) : [],
      phone: placeDetails?.formatted_phone_number,
      reviewCount: placeDetails?.reviews?.length
    });

    if (!placeDetails) {
      return res.status(404).json({ message: 'Place not found' });
    }

    res.status(200).json(placeDetails);
  } catch (error) {
    console.error('❌ API Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET')) {
        return res.status(503).json({ 
          message: 'Service temporarily unavailable. Please try again.',
          retryAfter: 5
        });
      }
      
      if (error.message === 'Request timeout') {
        return res.status(504).json({ 
          message: 'Request timed out. Please try again.' 
        });
      }
    }

    res.status(500).json({ 
      message: 'Error fetching place details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
