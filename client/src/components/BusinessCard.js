import React, { useState, useEffect } from "react";
import { FaStar, FaRegStar, FaPhoneAlt, FaWhatsapp, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import styled from "styled-components";

// Styled components for direct styling
const Card = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
  transition: transform 0.2s ease-in-out;
  text-align: left;
  width: 320px;
  height: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid #ddd;
  margin: 10px;
  overflow: hidden;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const Logo = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 8px;
`;

const BusinessName = styled.h2`
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BusinessInfo = styled.p`
  font-size: 14px;
  margin: 5px 0;
  color: #555;
  max-height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContactLink = styled.a`
  display: inline-block;
  color: #3498db;
  text-decoration: none;
  font-weight: bold;
  margin-right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const WhatsappLink = styled(ContactLink)`
  color: #25D366;
`;

const DirectionsButton = styled.a`
  display: inline-block;
  background-color: #2196F3;
  color: white !important;
  padding: 10px 14px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.3s ease;
  text-align: center;
  width: 100%;
  border: none;
  margin-top: 15px;
  
  &:hover {
    background-color: #1976D2;
    color: white;
  }
`;

const MapContainer = styled.div`
  margin-top: 15px;
  width: 100%;
  position: relative;
`;

const MapImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 150px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Coordinates = styled.div`
  font-size: 12px;
  color: #777;
  margin-top: 5px;
  text-align: right;
`;

const ViewImagesButton = styled.button`
  background-color: #2196F3;
  color: white;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
  text-align: center;
  transition: background 0.3s ease;
  border: none;
  margin-top: 10px;
  
  &:hover {
    background-color: #1976D2;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
  text-align: center;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 15px;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #555;
  
  &:hover {
    color: red;
  }
`;

const ModalImage = styled.img`
  max-width: 100%;
  border-radius: 8px;
  margin-top: 10px;
`;

const ResultsContainer = styled.div`
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
`;

const ResultsTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
`;

const ResultsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
`;

const BusinessCard = ({ biz }) => {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);

  useEffect(() => {
    console.log("[BusinessCard] Received business data:", biz);
    
    if (!biz || !biz.place_id) {
      console.warn("[BusinessCard] Missing critical business data:", biz);
    }
  }, [biz]);

  const toggleAccordion = () => setExpanded(!expanded);
  
  const toggleBookmark = () => {
    console.log("[BusinessCard] Toggling bookmark state:", !bookmarked);
    setBookmarked(!bookmarked);
  };
  
  const toggleModal = async () => {
    console.log("[BusinessCard] Toggle modal, current state:", showModal);
    if (!showModal) {
      console.log("[BusinessCard] Modal opening, fetching images...");
      await fetchImages();
    }
    setShowModal(!showModal);
  };

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) {
      console.warn("[BusinessCard] Attempt to format undefined phone number");
      return "";
    }
    const formatted = phone.replace(/\D/g, "");
    console.log("[BusinessCard] Formatted phone for WhatsApp:", formatted);
    return formatted;
  };

  // Function to fetch images dynamically
  const fetchImages = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      console.log("[BusinessCard] Fetching images from:", `${API_URL}/images?place_id=${biz.place_id}`);
      
      const start = performance.now();
      const response = await fetch(`${API_URL}/images?place_id=${biz.place_id}`);
      const responseTime = performance.now() - start;
      
      console.log(`[BusinessCard] Image API response time: ${responseTime.toFixed(2)}ms`);
      
      if (!response.ok) {
        console.error(`[BusinessCard] API error: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log("[BusinessCard] Image API response data:", data);
  
      if (data.imageUrls && data.imageUrls.length > 0) {
        console.log(`[BusinessCard] Found ${data.imageUrls.length} images for business`);
        setImageUrls(data.imageUrls);
      } else {
        console.log("[BusinessCard] No images found for this business");
      }
    } catch (error) {
      console.error("[BusinessCard] Error fetching images:", error);
      setImageUrls([]);
    }
  };

  // Function to get the map image URL through our secure proxy
  const getMapImageUrl = (lat, lng) => {
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    return `${API_URL}/api/map-image?lat=${lat}&lng=${lng}&width=280&height=150`;
  };

  console.log("[BusinessCard] Rendering for business:", biz?.name);

  return (
    <Card>
      {/* Business Logo */}
      {biz.logo && (
        <Logo
          src={biz.logo}
          alt={`${biz.name} logo`}
          onLoad={() => console.log("[BusinessCard] Logo image loaded")}
          onError={(e) => console.warn("[BusinessCard] Error loading logo:", e.target.src)}
        />
      )}

      {/* Bookmark Icon */}
      <div style={{ float: 'right', cursor: 'pointer' }} onClick={toggleBookmark}>
        {bookmarked ? <FaStar color="#f39c12" /> : <FaRegStar color="#ccc" />}
      </div>

      <BusinessName>{biz.name}</BusinessName>
      <BusinessInfo>
        ⭐ {biz.aggregatedReviews ? biz.aggregatedReviews : "No"} reviews &nbsp;
        ({biz.rating ? biz.rating : "No rating"})
      </BusinessInfo>

      {/* Distance Handling with validation */}
      {(() => {
        if (biz.distance && !isNaN(biz.distance)) {
          console.log("[BusinessCard] Valid distance:", biz.distance);
          return (
            <BusinessInfo>
              <strong>Distance:</strong> {parseFloat(biz.distance).toFixed(2)} km
            </BusinessInfo>
          );
        } else {
          console.warn("[BusinessCard] Invalid distance value:", biz.distance);
          return (
            <BusinessInfo>
              <strong>Distance:</strong> N/A
            </BusinessInfo>
          );
        }
      })()}

      <BusinessInfo>{biz.address}</BusinessInfo>

      {/* Contact & Website */}
      <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {biz.phone && (
          <ContactLink 
            href={`tel:${biz.phone}`} 
            onClick={() => console.log("[BusinessCard] Phone call initiated:", biz.phone)}
          >
            <FaPhoneAlt /> {biz.phone}
          </ContactLink>
        )}
        {biz.phone && (
          <WhatsappLink
            href={`https://wa.me/${formatPhoneForWhatsApp(biz.phone)}?text=Hi, I saw your listing on Local Service Finder`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => console.log("[BusinessCard] WhatsApp link clicked:", biz.phone)}
          >
            <FaWhatsapp /> WhatsApp
          </WhatsappLink>
        )}
        {biz.website && (
          <ContactLink 
            href={biz.website} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => console.log("[BusinessCard] Website link clicked:", biz.website)}
          >
            🌐 Visit Website
          </ContactLink>
        )}
      </div>

      {/* Show button only if images exist */}
      {imageUrls.length > 0 && (
        <div>
          <ViewImagesButton onClick={toggleModal}>
            📸 View Images ({imageUrls.length})
          </ViewImagesButton>
        </div>
      )}

      {/* Get Directions Button */}
      <div>
        {biz.latitude && biz.longitude ? (
          <DirectionsButton
            href={`https://www.google.com/maps/dir/?api=1&destination=${biz.latitude},${biz.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => console.log("[BusinessCard] Directions requested for:", {lat: biz.latitude, lng: biz.longitude})}
          >
            📍 Get Directions
          </DirectionsButton>
        ) : (
          <span style={{ color: '#999', display: 'block', marginTop: '10px' }}>
            No location data available for directions
          </span>
        )}
      </div>

      {/* Mini Map - SECURE IMPLEMENTATION */}
      {biz.latitude && biz.longitude ? (
        <MapContainer>
          <MapImage
            src={getMapImageUrl(biz.latitude, biz.longitude)}
            alt="Mini Map"
            onLoad={() => console.log("[BusinessCard] Static map loaded")}
            onError={(e) => {
              console.error("[BusinessCard] Error loading static map:", e);
              e.target.parentElement.innerHTML = `
                <div style="width:100%; background-color:#f3f4f6; height:150px; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                  <p style="color:#6b7280; text-align:center;">
                    📍 Location at ${Number(biz.latitude).toFixed(4)}, ${Number(biz.longitude).toFixed(4)}
                  </p>
                </div>
              `;
            }}
          />
          <Coordinates>
            Coordinates: {biz.latitude}, {biz.longitude}
          </Coordinates>
        </MapContainer>
      ) : (
        <BusinessInfo style={{ marginTop: '10px' }}>Map data not available</BusinessInfo>
      )}

      {/* Modal for Viewing Images */}
      {showModal && (
        <Modal>
          <ModalContent>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Images for {biz.name}</h2>
            <CloseButton 
              onClick={toggleModal}
              aria-label="Close modal"
            >
              ✖
            </CloseButton>
            {imageUrls.length > 0 ? (
              <>
                <p style={{ marginBottom: '10px', fontSize: '14px', color: '#555' }}>Showing {imageUrls.length} images</p>
                {imageUrls.map((url, index) => (
                  <ModalImage 
                    key={index} 
                    src={url} 
                    alt={`${biz.name} - Image ${index + 1}`} 
                    onLoad={() => console.log(`[BusinessCard] Modal image ${index + 1} loaded`)}
                    onError={() => console.error(`[BusinessCard] Modal image ${index + 1} failed to load:`, url)}
                  />
                ))}
              </>
            ) : (
              <p>No images available.</p>
            )}
          </ModalContent>
        </Modal>
      )}
    </Card>
  );
};

const BusinessCards = ({ businesses }) => {
  console.log("[BusinessCards] Rendering with businesses:", businesses);
  
  useEffect(() => {
    if (businesses && businesses.length > 0) {
      console.log("[BusinessCards] First business data structure:", businesses[0]);
      console.log(`[BusinessCards] Received ${businesses.length} businesses`);
    } else {
      console.warn("[BusinessCards] No businesses received or empty array");
    }
  }, [businesses]);

  if (!businesses || businesses.length === 0) {
    console.log("[BusinessCards] No results to display");
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ color: '#555', fontSize: '18px', marginBottom: '15px' }}>No results found.</p>
        <p style={{ color: '#999', fontSize: '14px' }}>
          Try adjusting your search criteria or checking your network connection.
        </p>
        {/* Debug info for developers */}
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', display: 'inline-block', textAlign: 'left' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Debug Info:</h3>
          <p style={{ fontSize: '12px', color: '#666' }}>Timestamp: {new Date().toISOString()}</p>
          <p style={{ fontSize: '12px', color: '#666' }}>Businesses: {businesses ? 'Array(empty)' : 'null/undefined'}</p>
          <button 
            onClick={() => console.log('Current business data:', businesses)}
            style={{ fontSize: '12px', color: '#3498db', marginTop: '8px', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Log Data to Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <ResultsContainer>
      <ResultsTitle>
        🔎 Search Results ({businesses.length})
      </ResultsTitle>
      <ResultsGrid>
        {businesses.map((biz, index) => (
          <BusinessCard key={index} biz={biz} />
        ))}
      </ResultsGrid>
    </ResultsContainer>
  );
};

export default BusinessCards;