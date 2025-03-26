export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  website?: string;
  current_opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
  price_level?: number;
  rating?: number;
  user_ratings_total?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
  }>;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types?: string[];
  url?: string;
  
  // Additional features
  dine_in?: boolean;
  takeout?: boolean;
  delivery?: boolean;
  serves_beer?: boolean;
  serves_wine?: boolean;
  serves_breakfast?: boolean;
  serves_lunch?: boolean;
  serves_dinner?: boolean;
  reservable?: boolean;
  outdoor_seating?: boolean;
  wheelchair_accessible_entrance?: boolean;
  
  // Icons and visual elements
  icon?: string;
  icon_background_color?: string;
  icon_mask_base_uri?: string;
  
  // Timezone
  utc_offset_minutes?: number;
  
  // Editorial content
  editorial_summary?: {
    language: string;
    overview: string;
  };
  
  // Social
  social_networking_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  
  // Payment & Services
  payment_options?: {
    credit_cards?: boolean;
    debit_cards?: boolean;
    nfc_mobile_payments?: boolean;
  };
  
  // Parking
  parking?: {
    free_street?: boolean;
    garage?: boolean;
    lot?: boolean;
    valet?: boolean;
  };
  
  // Crowd & Planning
  crowd?: {
    lgbtq_friendly?: boolean;
    transgender_safespace?: boolean;
  };
  planning?: {
    quick_visit?: boolean;
    reservation_recommended?: boolean;
  };
  
  // Enhanced location details
  location_details?: {
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    plus_code?: {
      compound_code: string;
      global_code: string;
    };
    viewport?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  maps_url?: string;
  directions_url?: string;
}
