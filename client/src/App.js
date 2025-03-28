import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import BusinessCards from './components/BusinessCard';
import AIAgent from './components/AIAgent';
import Search from './components/Search'; // Add this import
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa';
import logo from './Assets/logo.jpeg';

// Styled Components for Landing Page
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Card = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
  width: 100%;
  max-width: 700px;
  text-align: center;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const InputGroup = styled.div`
  position: relative;
  flex: 1;
  min-width: ${props => props.$locationField ? '180px' : '250px'};
  
  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const InputIcon = styled.span`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: #aaa;
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 2.5rem;
  border-radius: 10px;
  border: 2px solid #eee;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;

const Button = styled.button`
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  width: 100%;
  
  &:hover {
    background: #1976D2;
  }
`;

const Header = styled.header`
  background-color: #2196F3;
  color: white;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 50px;
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

// Logo styled component - Updated size
const Logo = styled.img`
  height: 80px; /* Increased size */
  margin: 0 auto; /* Center horizontally */
  display: block; /* Make it a block element to enable margin centering */
  
  @media (max-width: 768px) {
    height: 60px;
  }
`;

// Added for location debugging
const LocationInfoPanel = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  text-align: left;
`;

function App() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [searchParams, setSearchParams] = useState({
    lat: null,
    lng: null,
    query: '',
    locationName: 'Fetching location...' // Add this for display
  });
  
  // Add this to track location status
  const [locationStatus, setLocationStatus] = useState({
    isLoading: true,
    error: null,
    source: 'Detecting...' // 'GPS', 'IP', 'Default'
  });

  // Add a ref at the component level
  const locationRequestedRef = useRef(false);

  const [showFollowUp, setShowFollowUp] = useState(false);

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

  // Function to fetch businesses with better error handling
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
    const endpoint = `${API_URL}/api/search`; // Use the search endpoint
    
    // Build query string
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
      // First check if the server is even running
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
      
      console.log('📊 Received businesses:', {
        count: data.businesses?.length || 0,
        firstBusiness: data.businesses?.[0] ? {
          name: data.businesses[0].name,
          hasPhone: Boolean(data.businesses[0].formatted_phone_number),
          phone: data.businesses[0].formatted_phone_number
        } : null
      });
      
      // Update state with businesses - handle different response formats
      if (data.businesses && Array.isArray(data.businesses)) {
        setBusinesses(data.businesses);
        if (data.businesses.length > 0) {
          setShowLanding(false);
          setShowFollowUp(true); // Show follow-up after results
        }
      } else if (Array.isArray(data)) {
        // Handle case where response is an array directly (for compatibility with old endpoint)
        setBusinesses(data);
        if (data.length > 0) {
          setShowLanding(false);
          setShowFollowUp(true); // Show follow-up after results
        }
      } else if (data.success && data.businesses) {
        // For the success:true format
        setBusinesses(data.businesses);
        if (data.businesses.length > 0) {
          setShowLanding(false);
          setShowFollowUp(true); // Show follow-up after results
        }
      } else {
        console.warn('⚠️ Data format unexpected:', data);
        setBusinesses([]);
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError(`Error fetching data: ${error.message}`);
      setBusinesses([]);
    } finally {
      console.groupEnd();
      setLoading(false);
    }
  };
  
  // Add this for Step 4: Filter businesses based on AI recommendations
  const handleFilterBusinesses = (filterAction) => {
    if (!filterAction || !businesses.length) return;
    
    let filteredBusinesses = [...businesses];
    
    if (filterAction.type === 'sort') {
      filteredBusinesses.sort((a, b) => {
        if (filterAction.order === 'asc') {
          return a[filterAction.field] - b[filterAction.field];
        } else {
          return b[filterAction.field] - a[filterAction.field];
        }
      });
    } 
    else if (filterAction.type === 'filter') {
      filteredBusinesses = filteredBusinesses.filter(business => {
        const value = business[filterAction.field];
        
        switch(filterAction.operator) {
          case 'eq': return value === filterAction.value;
          case 'gt': return value > filterAction.value;
          case 'gte': return value >= filterAction.value;
          case 'lt': return value < filterAction.value;
          case 'lte': return value <= filterAction.value;
          default: return true;
        }
      });
    }
    
    setBusinesses(filteredBusinesses);
  };
  
  // Handle landing page search
  const handleLandingSearch = (query, location) => {
    // This function will be called from the landing page
    setSearchParams(prevParams => ({
      ...prevParams,
      query,
      locationName: location // Store the location name for display
    }));
    
    fetchBusinesses({
      ...searchParams,
      query
    });
  };
  
  // Search form handler for results page
  const handleSearch = (event) => {
    event.preventDefault();
    fetchBusinesses(searchParams);
  };
  
  // Update search parameters
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Reset to landing page
  const handleReset = () => {
    setShowLanding(true);
    setBusinesses([]);
  };
  
  if (showLanding) {
    return (
      <PageContainer>
        <Card>
          <Logo src={logo} alt="Local Service Agent Logo" />
          
          <Search 
            onSearch={(query) => handleLandingSearch(query, searchParams.locationName)}
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
            }}>
              <p>Acquiring your location...</p>
              <Spinner style={{ width: '25px', height: '25px', margin: '0.5rem auto' }} />
            </div>
          )}
          
          {/* Add location debug information */}
          {!locationStatus.isLoading && (
            <LocationInfoPanel
              style={{ 
                backgroundColor: locationStatus.error ? '#FFF8E1' : '#E8F5E9', 
                color: locationStatus.error ? '#F57C00' : '#2E7D32'
              }}
            >
              <p><strong>Location Info:</strong></p>
              <p>Location: {searchParams.locationName}</p>
              <p>Source: {locationStatus.source}</p>
              <p>Coordinates: {searchParams.lat?.toFixed(6)}, {searchParams.lng?.toFixed(6)}</p>
              {locationStatus.accuracy && <p>Accuracy: ~{Math.round(locationStatus.accuracy)}m</p>}
              {locationStatus.error && <p>Error: {locationStatus.error}</p>}
            </LocationInfoPanel>
          )}
        </Card>
      </PageContainer>
    );
  }
  
  return (
    <div>
      <Header>
        <BackButton onClick={handleReset}>
          ← New Search
        </BackButton>
        <Logo 
          src={logo} 
          alt="Local Service Agent Logo" 
          style={{ 
            height: '40px', 
            margin: '0 auto',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            filter: 'brightness(0) invert(1)' 
          }} 
        />
        <div style={{ width: '100px' }}></div>
      </Header>
      
      <div style={{ backgroundColor: '#f4f6f9', padding: '1rem' }}>
        <Search 
          onSearch={(query) => fetchBusinesses({ ...searchParams, query })}
          initialBusinesses={businesses}
        />
      </div>

      {/* Loading indicator */}
      {loading && (
        <LoadingContainer>
          <Spinner />
          <p style={{ marginTop: '1rem', color: '#666' }}>Searching for businesses...</p>
        </LoadingContainer>
      )}
      
      {/* Results */}
      {!loading && businesses.length > 0 && (
        <>
          <BusinessCards 
            businesses={businesses} 
            userLocation={{
              lat: searchParams.lat,
              lng: searchParams.lng
            }}
          />
          
          {/* Add follow-up AI conversation */}
          {showFollowUp && (
            <div className="follow-up-container" style={{
              maxWidth: '800px',
              margin: '2rem auto',
              padding: '1.5rem',
              backgroundColor: '#f0f7ff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginTop: 0, color: '#2563eb' }}>
                Need help with these results?
              </h3>
              <Search 
                onSearch={(query) => fetchBusinesses({ ...searchParams, query })}
                initialBusinesses={businesses}
                isFollowUp={true}
                searchQuery={searchParams.query}
              />
            </div>
          )}
        </>
      )}

      {/* No results state */}
      {!loading && !error && businesses.length === 0 && (
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
      
      {/* Debug info div */}
      <div style={{ 
  position: 'fixed', 
  bottom: '0', 
  left: '0', 
  backgroundColor: 'rgba(33, 33, 33, 0.9)', 
  color: 'white', 
  padding: '0.5rem', 
  fontSize: '0.75rem',
  borderTopRightRadius: '8px',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}}></div>
  API: {process.env.REACT_APP_API_URL || 'http://localhost:5000'} | 
  ENV: {process.env.NODE_ENV} | 
  Last Updated: 2025-03-26 05:56:15 | 
  User: RogerBez | 
  Location: {searchParams.locationName} ({locationStatus.source}) | 
  Navigation: {locationStatus.source === 'GPS' ? 'Using your current location' : 'Using default location'} |
  Lat: {searchParams.lat?.toFixed(6)} Lng: {searchParams.lng?.toFixed(6)}
  {locationStatus.accuracy && ` | Accuracy: ~${Math.round(locationStatus.accuracy)}m`}
</div>
  );
}

export default App;