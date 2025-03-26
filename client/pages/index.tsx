import { PlaceDetailsModal } from '../components/PlaceDetailsModal';
import { useState } from 'react';
import { PlaceDetails } from '../../server/types/place.types';

export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlaceClick = async (placeId: string) => {
    try {
      console.log('\n🔍 Fetching place details:', placeId);
      
      const response = await fetch(`/api/places/${placeId}`);
      const contentType = response.headers.get('content-type');
      console.log('Response headers:', {
        status: response.status,
        contentType
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${error}`);
      }

      const data = await response.json();
      console.log('\n📦 Place details received:', {
        name: data.name,
        hasPhone: !!data.formatted_phone_number,
        hasReviews: !!data.reviews?.length,
        fields: Object.keys(data)
      });

      setSelectedPlace(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('❌ Error fetching place details:', error);
    }
  };

  return (
    <>
      {/* ...existing code... */}
      
      <PlaceDetailsModal
        place={selectedPlace}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      {/* ...existing code... */}
    </>
  );
}