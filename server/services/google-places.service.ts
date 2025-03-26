import axios, { AxiosError } from 'axios';
import { PlaceDetails, PlaceSearchResult } from '../types/place.types';

export class GooglePlacesService {
  private readonly apiKey: string;
  private readonly maxRetries = 3;
  private readonly timeout = 10000; // 10 seconds
  private readonly fields = [
    // Basic Info with phone explicitly listed
    'name,place_id,formatted_address,formatted_phone_number,international_phone_number',
    // Hours & Status
    'current_opening_hours,opening_hours,business_status,price_level',
    // Reviews & Ratings
    'rating,user_ratings_total,reviews',
    // Features
    'dine_in,takeout,delivery,serves_beer,serves_wine,serves_breakfast',
    'serves_lunch,serves_dinner,reservable,outdoor_seating,wheelchair_accessible_entrance',
    // Photos & Types
    'photos,types',
    // Editorial
    'editorial_summary'
  ].join(',');

  // Add Maps API endpoints
  private readonly MAPS_API_BASE = 'https://maps.googleapis.com/maps/api';
  private readonly PLACES_API = `${this.MAPS_API_BASE}/place`;
  private readonly GEOCODING_API = `${this.MAPS_API_BASE}/geocode`;
  private readonly DIRECTIONS_API = `${this.MAPS_API_BASE}/directions`;

  constructor() {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY environment variable is required');
    }
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  private async makeRequest(url: string, params: any): Promise<any> {
    try {
      const proxyUrl = process.env.PROXY_URL || 'http://localhost:5050/google-api';
      
      const response = await axios.post(proxyUrl, {
        url,
        params
      }, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async findPlace(query: string): Promise<PlaceSearchResult | null> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
        params: {
          input: query,
          inputtype: 'textquery',
          fields: 'place_id,name,formatted_address',
          key: this.apiKey
        }
      });

      if (response.data.candidates?.[0]) {
        return response.data.candidates[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding place:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      console.log('\n🔍 PLACE DETAILS REQUEST:', { placeId });

      const data = await this.makeRequest(`${this.PLACES_API}/details/json`, {
        place_id: placeId,
        fields: this.fields,
        language: 'en'
      });

      if (data.status === 'OK' && data.result) {
        return {
          ...data.result,
          maps_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
          directions_url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.result.formatted_address)}`
        };
      }

      console.error('API returned no results:', data);
      return null;
    } catch (error) {
      console.error('\n❌ API ERROR:', error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error);
      throw error;
    }
  }

  // Remove getLocationDetails and getPlaceWithLocation methods as they're redundant
  // The Place Details API already provides all the location information we need
}
