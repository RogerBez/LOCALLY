require('dotenv').config();
const axios = require('axios');

const testPlace = async (placeId) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: [
          // Basic Info
          'name,place_id,rating,user_ratings_total,formatted_phone_number,formatted_address',
          // Hours & Status
          'current_opening_hours,opening_hours,business_status,price_level',
          // Accessibility
          'wheelchair_accessible_entrance,wheelchair_accessible_parking,wheelchair_accessible_restroom',
          // Amenities & Services
          'serves_beer,serves_wine,serves_breakfast,serves_lunch,serves_dinner,serves_vegetarian_food',
          'delivery,dine_in,takeout,curbside_pickup,reservable,outdoor_seating',
          'restroom,parking,free_parking',
          // Contact & Additional Info
          'website,email,phone,international_phone_number',
          // Reviews & Photos
          'reviews,photos,editorial_summary',
          // Payment Options
          'payment_options'
        ].join(','),
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'en'
      }
    });

    const place = response.data.result;
    
    // Pretty print the results
    console.log('\n====================');
    console.log('📍 PLACE DETAILS');
    console.log('====================\n');

    // Basic Info
    console.log('📌 Basic Information:');
    console.log(`Name: ${place.name}`);
    console.log(`Address: ${place.formatted_address}`);
    console.log(`Rating: ${place.rating} (${place.user_ratings_total} reviews)`);
    console.log(`Price Level: ${place.price_level ? '💰'.repeat(place.price_level) : 'Not available'}`);
    console.log(`Status: ${place.business_status?.toLowerCase().replace(/_/g, ' ')}`);

    // Contact
    if (place.formatted_phone_number || place.website) {
      console.log('\n📞 Contact Information:');
      if (place.formatted_phone_number) console.log(`Phone: ${place.formatted_phone_number}`);
      if (place.website) console.log(`Website: ${place.website}`);
    }

    // Hours
    if (place.current_opening_hours || place.opening_hours) {
      console.log('\n⏰ Hours:');
      console.log(`Currently: ${place.current_opening_hours?.open_now ? '✅ Open' : '❌ Closed'}`);
      if (place.current_opening_hours?.weekday_text) {
        console.log('Schedule:');
        place.current_opening_hours.weekday_text.forEach(day => console.log(`  ${day}`));
      }
    }

    // Amenities
    console.log('\n🏪 Amenities & Services:');
    const amenities = {
      'Wheelchair Accessible': place.wheelchair_accessible_entrance,
      'Wheelchair Parking': place.wheelchair_accessible_parking,
      'Accessible Restroom': place.wheelchair_accessible_restroom,
      'Outdoor Seating': place.outdoor_seating,
      'Dine-in': place.dine_in,
      'Takeout': place.takeout,
      'Delivery': place.delivery,
      'Reservations': place.reservable,
      'Parking Available': place.parking,
      'Free Parking': place.free_parking,
      'Public Restroom': place.restroom
    };
    Object.entries(amenities)
      .filter(([_, value]) => value)
      .forEach(([key]) => console.log(`✓ ${key}`));

    // Food & Drinks
    const foodOptions = {
      'Serves Breakfast': place.serves_breakfast,
      'Serves Lunch': place.serves_lunch,
      'Serves Dinner': place.serves_dinner,
      'Serves Beer': place.serves_beer,
      'Serves Wine': place.serves_wine,
      'Vegetarian Options': place.serves_vegetarian_food
    };
    const availableFoodOptions = Object.entries(foodOptions).filter(([_, value]) => value);
    if (availableFoodOptions.length > 0) {
      console.log('\n🍽️ Food & Drinks:');
      availableFoodOptions.forEach(([key]) => console.log(`✓ ${key}`));
    }

    // Reviews
    if (place.reviews?.length > 0) {
      console.log('\n⭐ Top Reviews:');
      place.reviews
        .filter(review => review.rating >= 4)
        .slice(0, 3)
        .forEach(review => {
          console.log(`\n${review.author_name} - ${review.rating}⭐`);
          console.log(`"${review.text.slice(0, 150)}${review.text.length > 150 ? '...' : ''}"`);
          console.log(`Posted: ${review.relative_time_description}`);
        });
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

// Usage example with The Apollo Restaurant from your search results
const placeId = process.argv[2] || 'ChIJRdF6BXOuEmsRoh8iEUNUc8g';
testPlace(placeId);
