import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import BusinessCards from './components/BusinessCard';
import AIChat from './components/AIChat';
import AIAgentSelector from './components/AIAgentSelector';  // Moved to the top
import DebugAIChat from './components/DebugAIChat'; // Add this import
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

// MODIFIED: Updated search form to be more responsive
const SearchForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-top: 2rem;
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

function App() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [searchParams, setSearchParams] = useState({
    lat: null,
    lng: null,
    query: ''
  });
  
  // Add this for Step 6: AI Agent Style
  const [aiAgentStyle, setAIAgentStyle] = useState(
    localStorage.getItem('preferredAIAgent') || 'casual'
  );

  // Get user's geolocation on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchParams(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
      },
      (error) => {
        console.error('❌ Location error:', error);
        // Default to Cape Town coordinates if geolocation fails
        setSearchParams(prev => ({
          ...prev,
          lat: -33.882112,
          lng: 18.497536
        }));
      },
      { enableHighAccuracy: true }
    );
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
    
    try {
      // First check if the server is even running
      try {
        const healthCheck = await fetch(`${API_URL}/api/health`);
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
        if (data.businesses.length > 0) {
          setShowLanding(false);
        }
      } else if (Array.isArray(data)) {
        // Handle case where response is an array directly (for compatibility with old endpoint)
        setBusinesses(data);
        if (data.length > 0) {
          setShowLanding(false);
        }
      } else if (data.success && data.businesses) {
        // For the success:true format
        setBusinesses(data.businesses);
        if (data.businesses.length > 0) {
          setShowLanding(false);
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
          {/* Centered logo without text */}
          <Logo src={logo} alt="Local Service Agent Logo" />
          
          {/* MODIFIED: Restructured search form */}
          <SearchForm onSubmit={(e) => {
            e.preventDefault();
            handleLandingSearch(searchParams.query, "Current Location");
          }}>
            <SearchRow>
              <InputGroup>
                <InputIcon><FaSearch /></InputIcon>
                <Input 
                  type="text" 
                  placeholder="What are you looking for?" 
                  value={searchParams.query}
                  onChange={(e) => setSearchParams(prev => ({...prev, query: e.target.value}))}
                  required
                />
              </InputGroup>
              
              <InputGroup $locationField>
                <InputIcon><FaMapMarkerAlt /></InputIcon>
                <Input 
                  type="text" 
                  value="Current Location"
                  disabled
                  placeholder="Using your location" 
                />
              </InputGroup>
            </SearchRow>
            
            <Button type="submit" disabled={loading || !searchParams.lat}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </SearchForm>
          
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
          
          {!searchParams.lat && !error && (
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
          
          {/* Add Step 6: AI Agent Selector on the landing page */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Personalize Your Experience</h3>
            <AIAgentSelector 
              currentAgent={aiAgentStyle} 
              onSelect={setAIAgentStyle} 
            />
          </div>
        </Card>
      </PageContainer>
    );
  }
  
  return (
    <div>
      {/* Centered logo in header, removed text */}
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
        
        <div style={{ width: '100px' }}></div> {/* For spacing/balance */}
      </Header>
      
      {/* MODIFIED: Restructured search form for results page */}
      <div style={{ backgroundColor: '#f4f6f9', padding: '1rem' }}>
        <form onSubmit={handleSearch} style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <InputGroup style={{ flex: '2', minWidth: '250px' }}>
              <InputIcon><FaSearch /></InputIcon>
              <Input
                type="text"
                name="query"
                value={searchParams.query}
                onChange={handleInputChange}
                placeholder="Search for services..."
              />
            </InputGroup>
            
            <InputGroup $locationField style={{ flex: '1', minWidth: '150px' }}>
              <InputIcon><FaMapMarkerAlt /></InputIcon>
              <Input 
                type="text" 
                value="Current Location"
                disabled
                placeholder="Using your location" 
              />
            </InputGroup>
          </div>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </div>
      
      {/* Show current search query */}
      {!loading && searchParams.query && (
        <div style={{ 
          maxWidth: '800px', 
          margin: '1rem auto',
          textAlign: 'center',
          fontWeight: '500',
          color: '#555'
        }}>
          Showing results for: "{searchParams.query}"
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div style={{ 
          maxWidth: '800px', 
          margin: '1rem auto', 
          padding: '0.75rem', 
          backgroundColor: '#FFEBEE', 
          border: '1px solid #FFCDD2', 
          color: '#D32F2F',
          borderRadius: '8px' 
        }}>
          <p style={{ fontWeight: 'bold' }}>Error</p>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem', 
              color: '#D32F2F', 
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <LoadingContainer>
          <Spinner />
          <p style={{ marginTop: '1rem', color: '#666' }}>Searching for businesses...</p>
        </LoadingContainer>
      )}
      
      {/* Results */}
      {!loading && businesses.length > 0 && (
        <BusinessCards businesses={businesses} />
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
          <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '1rem' }}>No businesses found</p>
          <p style={{ color: '#888' }}>Try adjusting your search terms or location</p>
        </div>
      )}
      
      {/* Add this for Step 4: AI Chat */}
      {!loading && (
        // Comment out the original AIChat component
        // <AIChat 
        //   businesses={businesses} 
        //   onFilterBusinesses={handleFilterBusinesses}
        //   agentStyle={aiAgentStyle}
        // />
        
        // Add the debug version instead
        <DebugAIChat 
          businesses={businesses} 
        />
      )}
      
      {/* Debug indicator */}
      <div style={{ 
        position: 'fixed', 
        bottom: '0', 
        left: '0', 
        backgroundColor: 'rgba(33, 33, 33, 0.8)', 
        color: 'white', 
        padding: '0.5rem', 
        fontSize: '0.75rem',
        borderTopRightRadius: '8px' 
      }}>
        API: {process.env.REACT_APP_API_URL || 'http://localhost:5000'} | 
        ENV: {process.env.NODE_ENV} | 
        Last Updated: 2025-03-26 04:46:28 | 
        User: RogerBez | 
        Lat: {searchParams.lat?.toFixed(6)} Lng: {searchParams.lng?.toFixed(6)}
      </div>
    </div>
  );
}

export default App;