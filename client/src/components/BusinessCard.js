import React, { useState, useEffect } from "react";
import { FaStar, FaRegStar, FaPhoneAlt, FaWhatsapp, FaEnvelope, FaGlobe, FaExternalLinkAlt } from "react-icons/fa";
import Search from './Search';  // Add this import
import './BusinessCard.css';

const BusinessCard = ({ biz, userLocation }) => {  // Add userLocation prop
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = (error) => {
    console.log('Image loading error:', {
      businessName: biz.name,
      photoReference: biz.photos?.[0]?.photo_reference || 'No photo reference',
      hasPhotosArray: Boolean(biz.photos),
      photosLength: biz.photos?.length || 0,
      errorType: error.type,
      errorMessage: error.message || 'No error message available'
    });
    setImageError(true);
    setImageLoading(false);
  };

  const renderBusinessImage = () => {
    if (!biz.photos?.[0]?.photo_reference) {
      return (
        <div className="business-photo-fallback">
          <span className="business-photo-initial">{biz.name[0]}</span>
          <span className="business-photo-error">No image available</span>
        </div>
      );
    }

    return !imageError ? (
      <img
        src={`${process.env.REACT_APP_API_URL}/api/place-photo?photo_reference=${biz.photos[0].photo_reference}`}
        alt={biz.name}
        className={`business-photo ${imageLoading ? 'loading' : ''}`}
        onError={handleImageError}
        onLoad={() => setImageLoading(false)}
      />
    ) : (
      <div className="business-photo-fallback">
        <span className="business-photo-initial">{biz.name[0]}</span>
        <span className="business-photo-error">Failed to load image</span>
      </div>
    );
  };

  const formatWebsiteUrl = (url) => {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname.replace(/\/$/, '');
    } catch (e) {
      console.error('Invalid URL:', url, e);
      return url;
    }
  };

  const formatWhatsAppNumber = (phone) => {
    if (!phone) return null;
    return phone.replace(/\D/g, '');
  };

  const calculateDistance = () => {
    if (!userLocation || !biz.latitude || !biz.longitude) return null;
    
    // Use Haversine formula to calculate actual distance from current location
    const R = 6371; // Radius of earth in kilometers
    const dLat = (biz.latitude - userLocation.lat) * Math.PI / 180;
    const dLon = (biz.longitude - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(biz.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  useEffect(() => {
    console.group(`📇 Business Card Data: ${biz.name}`);
    console.log('Phone Numbers:', {
      formatted: biz.formatted_phone_number,
      raw: biz.phone,
      hasPhone: Boolean(biz.formatted_phone_number || biz.phone)
    });
    console.log('Contact Info:', {
      email: biz.email || 'none',
      website: biz.website || 'none',
      address: biz.address || 'none'
    });
    console.log('Location:', {
      lat: biz.latitude,
      lng: biz.longitude,
      distance: biz.distance
    });
    console.groupEnd();
  }, [biz]);

  console.log('Business data received:', {
    name: biz.name,
    phone: biz.phone || 'Not provided',
    email: biz.email || 'Not provided',
    hasPhotos: Boolean(biz.photos?.length)
  });

  console.log('Business contact details:', {
    name: biz.name,
    formatted_phone: biz.formatted_phone_number,
    raw_phone: biz.phone,
    hasPhone: Boolean(biz.formatted_phone_number || biz.phone)
  });

  return (
    <div className="business-card">
      <div className="business-card__header">
        <div className="business-header-content">
          <h2 className="business-name">
            <div className="business-name-text" title={biz.name}>
              {biz.name}
            </div>
          </h2>
          <div className="business-rating">⭐ {biz.rating || 'N/A'}</div>
          <div className="business-contact-info">
            {(biz.formatted_phone_number || biz.phone) && (
              <div className="business-phone">
                <FaPhoneAlt className="contact-icon" />
                <a 
                  href={`tel:${biz.phone || biz.formatted_phone_number}`} 
                  className="contact-link"
                >
                  {biz.formatted_phone_number || biz.phone}
                </a>
              </div>
            )}

            {(biz.formatted_phone_number || biz.phone) && (
              <div className="business-whatsapp">
                <FaWhatsapp className="contact-icon whatsapp-icon" />
                <a 
                  href={`https://wa.me/${formatWhatsAppNumber(biz.phone || biz.formatted_phone_number)}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link whatsapp-link"
                >
                  WhatsApp
                </a>
              </div>
            )}
            
            {biz.website && (
              <div className="business-website">
                <FaGlobe className="contact-icon" />
                <a 
                  href={biz.website}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="contact-link website-link"
                >
                  {formatWebsiteUrl(biz.website)}
                </a>
              </div>
            )}
          </div>
        </div>
        {biz.logo && (
          <img
            src={biz.logo}
            alt={`${biz.name} logo`}
            className="business-logo"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
      </div>

      <div className="business-image-container">
        {renderBusinessImage()}
        {imageLoading && (
          <div className="business-photo-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>

      <div className="business-info">
        <p>{biz.address}</p>
        <p>{calculateDistance()} km away</p>
      </div>

      {biz.latitude && biz.longitude && (
        <div className="map-container">
          <img
            src={`${process.env.REACT_APP_API_URL}/api/map-image?lat=${biz.latitude}&lng=${biz.longitude}&zoom=15&width=400&height=200`}
            alt="Location Map"
            className="map-image"
            onError={(e) => {
              e.target.parentElement.innerHTML = `
                <div class="map-fallback">
                  📍 ${biz.address}<br>
                  (${biz.latitude.toFixed(6)}, ${biz.longitude.toFixed(6)})
                </div>
              `;
            }}
          />
        </div>
      )}

      <div className="action-buttons">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${biz.latitude},${biz.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="primary-button"
        >
          Get Directions
        </a>
      </div>
    </div>
  );
};

const BusinessCards = ({ businesses, userLocation, onSearch, searchQuery }) => {
  const [sortedBusinesses, setSortedBusinesses] = useState(businesses);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setSortedBusinesses(businesses);
  }, [businesses]);

  const handleSort = (sortType) => {
    let sorted = [...businesses];
    switch (sortType) {
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
        sorted.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        break;
      case 'reviews':
        sorted.sort((a, b) => b.aggregatedReviews - a.aggregatedReviews);
        break;
      default:
        sorted = [...businesses];
    }
    setSortedBusinesses(sorted);
  };

  return (
    <div className="outer-container">
      <div className="business-cards-container">
        <div className="business-cards-header">
          <h2>Local Businesses Found</h2>
          <p>Showing {businesses.length} results in your area</p>
        </div>
        <div className="business-cards-grid">
          {sortedBusinesses.map(biz => (
            <BusinessCard 
              key={biz.place_id} 
              biz={biz} 
              userLocation={userLocation}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessCards;
