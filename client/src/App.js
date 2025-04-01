import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import BusinessCards from './components/BusinessCard';
import Search from './components/Search';
import { FaChevronUp } from 'react-icons/fa';
import logo from './Assets/logo.jpeg';

// Styled Components for Unified Page
const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background-color: rgba(33, 150, 243, 0.95);
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  transition: all 0.5s ease;
`;

const ChatSection = styled.section`
  width: 100%;
  max-width: 800px;
  margin-bottom: ${props => props.$hasResults ? '2rem' : '0'};
  transition: all 0.5s ease;
`;

const ResultsSection = styled.section`
  width: 100%;
  max-width: 1200px;
  opacity: ${props => props.$visible ? '1' : '0'};
  max-height: ${props => props.$visible ? '5000px' : '0'};
  overflow: hidden;
  transition: all 0.5s ease;
`;

const Logo = styled.img`
  height: 50px;
  transition: all 0.3s ease;
  filter: ${props => props.$invert ? 'brightness(0) invert(1)' : 'none'};
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 2rem;
  margin: 2rem 0;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #2196F3;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 2s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const BackToTopButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: #2196F3;
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.$visible ? '1' : '0'};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.5)'};
  pointer-events: ${props => props.$visible ? 'all' : 'none'};
  
  &:hover {
    background-color: #1976D2;
    transform: ${props => props.$visible ? 'scale(1.1)' : 'scale(0.5)'};
  }
`;

function App() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasResults, setHasResults] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchParams, setSearchParams] = useState({
    lat: null,
    lng: null,
    query: '',
    locationName: 'Fetching location...'
  });
  
  const [locationStatus, setLocationStatus] = useState({
    isLoading: true,
    error: null,
    source: 'Detecting...'
  });

  const locationRequestedRef = useRef(false);
  const chatSectionRef = useRef(null);
  const resultsRef = useRef(null);

  // Get user's geolocation on mount
  useEffect(() => {
    // Use the ref declared outside the effect
    if (locationRequestedRef.current) return;
    locationRequestedRef.current = true;

    setLocationStatus({ isLoading: true, error: null, source: 'Detecting...' });
    
    const geoSuccess = async (position) => {
      console.log('🌍 GPS Location acquired:', position.coords);
      const { latitude, longitude, accuracy } = position.coords;
      
      // Get human-readable location name
      const geocodeResult = await reverseGeocode(latitude, longitude);
      const locationName = geocodeResult.displayName || 'Current Location';
      
      setSearchParams(prev => ({
        ...prev,
        lat: latitude,
        lng: longitude,
        locationName: locationName
      }));
      
      setLocationStatus({ 
        isLoading: false, 
        error: null, 
        source: 'GPS',
        accuracy: accuracy,
        addressInfo: geocodeResult.fullData
      });
    };
    
    const geoError = async (error) => {
      console.error('❌ Location error:', error);
      
      // Fall back to default coordinates (Cape Town)
      const defaultLat = -33.882112;
      const defaultLng = 18.497536;
      
      console.log('⚠️ Falling back to default location (Cape Town)');
      
      // Get human-readable location name for default coordinates
      const geocodeResult = await reverseGeocode(defaultLat, defaultLng);
      const locationName = geocodeResult.displayName || 'Cape Town, South Africa';
      
      setSearchParams(prev => ({
        ...prev,
        lat: defaultLat,
        lng: defaultLng,
        locationName: `${locationName} (Default)`
      }));
      
      setLocationStatus({ 
        isLoading: false, 
        error: error.message, 
        source: 'Default',
        fallback: 'Cape Town',
        addressInfo: geocodeResult.fullData
      });
    };
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        geoSuccess,
        geoError,
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationStatus({ 
        isLoading: false, 
        error: 'Geolocation not supported', 
        source: 'Unavailable' 
      });
      
      // Use default location
      setSearchParams(prev => ({
        ...prev,
        lat: -33.882112,
        lng: 18.497536,
        locationName: 'Cape Town, South Africa (Default)'
      }));
    }
  }, []);

  // Add scroll listener for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to reverse geocode coordinates to human-readable address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('🗺️ Reverse geocoding result:', data);
      
      // Format the location nicely
      let locationName = 'Unknown Location';
      
      if (data.address) {
        const address = data.address;
        
        const cityComponents = [
          address.city,
          address.town,
          address.village,
          address.hamlet,
          address.suburb
        ].filter(Boolean);
        
        const regionComponents = [
          address.state,
          address.county,
          address.region
        ].filter(Boolean);
        
        const city = cityComponents[0] || 'Unknown City';
        const region = regionComponents[0] || '';
        const country = address.country || '';
        
        if (city && country) {
          locationName = region 
            ? `${city}, ${region}, ${country}`
            : `${city}, ${country}`;
        } else if (city) {
          locationName = city;
        } else if (country) {
          locationName = country;
        }
      }
      
      return {
        displayName: locationName,
        fullData: data
      };
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
      return {
        displayName: 'Location unavailable',
        error: error.message
      };
    }
  };

  // Function to fetch businesses
  const fetchBusinesses = async (params) => {
    if (!params.query) {
      setError('Please enter a search query');
      return;
    }
    
    if (!params.lat || !params.lng) {
      setError('Location not available. Please allow location access or enter coordinates manually.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const endpoint = `${API_URL}/api/search`;
    
    const queryString = new URLSearchParams({
      query: params.query,
      lat: params.lat,
      lng: params.lng
    }).toString();
    
    const url = `${endpoint}?${queryString}`;
    
    console.log('🔍 Fetching from:', url);
    
    console.group('🔍 Business Search');
    console.log('Search params:', params);
    
    try {
      // First check if the server is running
      try {
        const healthCheck = await fetch(`${API_URL}/health`);
        if (!healthCheck.ok) {
          throw new Error('Server health check failed');
        }
        console.log('✅ Server health check passed');
      } catch (healthError) {
        console.error('❌ Server health check failed:', healthError);
        setError('Server appears to be offline. Please check that your backend is running.');
        setLoading(false);
        return;
      }
      
      // Make the actual API request
      const response = await fetch(url);
      
      // Log response details for debugging
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Handle non-200 responses
      if (!response.ok) {
        // Try to get error details if available
        let errorDetails;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorDetails = await response.json();
          console.error('📡 Error response body (JSON):', errorDetails);
        } else {
          errorDetails = await response.text();
          console.error('📡 Error response body (text):', errorDetails);
        }
        
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Check content type to avoid parsing errors
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('📡 Unexpected content type:', contentType);
        const text = await response.text();
        console.error('📡 Response text:', text);
        throw new Error('Server did not return JSON data');
      }
      
      // Parse JSON response
      const data = await response.json();
      console.log('📊 Received data:', data);
      
      // Update state with businesses - handle different response formats
      if (data.businesses && Array.isArray(data.businesses)) {
        setBusinesses(data.businesses);
        setHasResults(data.businesses.length > 0);
      } else if (Array.isArray(data)) {
        setBusinesses(data);
        setHasResults(data.length > 0);
      } else if (data.success && data.businesses) {
        setBusinesses(data.businesses);
        setHasResults(data.businesses.length > 0);
      } else {
        console.warn('⚠️ Data format unexpected:', data);
        setBusinesses([]);
        setHasResults(false);
      }
      
      // Scroll to results if we have them
      if (hasResults && resultsRef.current) {
        setTimeout(() => {
          resultsRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
        }, 500);
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError(`Error fetching data: ${error.message}`);
      setBusinesses([]);
      setHasResults(false);
    } finally {
      console.groupEnd();
      setLoading(false);
    }
  };
  
  // Handle search from the AI Chat interface
  const handleSearch = (query) => {
    setSearchParams(prevParams => ({
      ...prevParams,
      query
    }));
    
    fetchBusinesses({
      ...searchParams,
      query
    });
  };
  
  // Handle back to top button click
  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AppContainer>
      <Header>
        <Logo 
          src={logo} 
          alt="Local Service Agent Logo" 
          $invert={true}
        />
      </Header>

      <MainContent>
        {/* AI Chat Section - Always visible */}
        <ChatSection ref={chatSectionRef} $hasResults={hasResults}>
          <Search 
            onSearch={handleSearch}
            initialBusinesses={businesses}
            isFollowUp={hasResults}
            searchQuery={searchParams.query}
            locationName={searchParams.locationName}
          />
          
          {error && (
            <div style={{ 
              backgroundColor: '#FFEBEE', 
              color: '#D32F2F', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginTop: '1rem',
              textAlign: 'left'
            }}>
              <p style={{ fontWeight: 'bold' }}>Error</p>
              <p>{error}</p>
            </div>
          )}
          
          {locationStatus.isLoading && (
            <div style={{ 
              marginTop: '1rem',
              backgroundColor: '#E3F2FD', 
              color: '#1976D2', 
              padding: '0.5rem', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p>Acquiring your location...</p>
              <Spinner style={{ width: '25px', height: '25px', margin: '0.5rem auto' }} />
            </div>
          )}
        </ChatSection>

        {/* Loading indicator */}
        {loading && (
          <LoadingContainer>
            <Spinner />
            <p style={{ marginTop: '1rem', color: '#fff' }}>Searching for businesses...</p>
          </LoadingContainer>
        )}
        
        {/* Results Section - Conditionally visible */}
        <ResultsSection ref={resultsRef} $visible={hasResults}>
          {businesses.length > 0 && (
            <BusinessCards 
              businesses={businesses} 
              userLocation={{
                lat: searchParams.lat,
                lng: searchParams.lng,
                locationName: searchParams.locationName
              }}
            />
          )}

          {/* No results state */}
          {!loading && !error && hasResults && businesses.length === 0 && (
            <div style={{ 
              maxWidth: '600px', 
              margin: '2rem auto', 
              textAlign: 'center', 
              padding: '2rem',
              backgroundColor: '#FAFAFA', 
              borderRadius: '12px' 
            }}>
              <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '1rem' }}>No results found</p>
              <p style={{ color: '#888' }}>Try a different search term</p>
            </div>
          )}
        </ResultsSection>
      </MainContent>

      {/* Back to top button */}
      <BackToTopButton 
        onClick={handleBackToTop} 
        $visible={showBackToTop}
        aria-label="Back to top"
      >
        <FaChevronUp />
      </BackToTopButton>
    </AppContainer>
  );
}

export default App;