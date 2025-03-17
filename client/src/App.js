import React, { useState, useEffect } from 'react';
import axios from 'axios';
import locallyBanner from './Assets/LOCALLY BANNER.jpg';

// Define the API URL directly if environment variable is not loading
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log("Backend URL:", API_URL);

// Helper function to calculate distance between two coordinates
const computeDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (angle) => (Math.PI * angle) / 180;
  const R = 6371; // Radius of Earth in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2); // Distance in km, rounded to 2 decimal places
};

// Generate conversational responses based on query and results
const generateConversationalResponse = (query, businesses) => {
  // No results found
  if (businesses.length === 0) {
    const noResultsResponses = [
      `I've looked everywhere, but I couldn't find any matches for "${query}". Maybe try a different search term?`,
      `Hmm, I don't see any businesses matching "${query}" in your area. Would you like to try something else?`,
      `I searched high and low, but couldn't find any "${query}" nearby. Perhaps try a broader search term?`,
      `Sorry, I couldn't find any results for "${query}". Is there something else you're interested in finding?`
    ];
    return noResultsResponses[Math.floor(Math.random() * noResultsResponses.length)];
  }

  // Results found
  const businessType = query.toLowerCase();
  const count = businesses.length;
  const topRated = businesses[0].name;
  const closest = [...businesses].sort((a, b) => (a.distance || 99999) - (b.distance || 99999))[0].name;

  const successResponses = [
    `Great news! I found ${count} ${businessType} options near you. ${topRated} is highly rated, and ${closest} is the closest to you. Take a look below!`,
    `I've discovered ${count} ${businessType} places in your area! If you're looking for quality, check out ${topRated}. Need something close by? ${closest} might be your best bet.`,
    `Found ${count} great ${businessType} options for you! People seem to love ${topRated}, and ${closest} is just a short distance away. Let me know if any catch your eye!`,
    `Success! Here are ${count} ${businessType} places near you. I'd recommend checking out ${topRated} based on ratings, or ${closest} if you're in a hurry. Hope these help!`
  ];

  return successResponses[Math.floor(Math.random() * successResponses.length)];
};

// Welcome messages for initial load
const getWelcomeMessage = () => {
  const welcomeMessages = [
    "Hi there! I'm your LOCALLY assistant. How can I help you find businesses in your area today?",
    "Welcome to LOCALLY! I'm here to help you discover great local businesses. What are you looking for?",
    "Hello! I'm your personal LOCALLY guide. Tell me what you're searching for, and I'll find the best options near you!",
    "Hey there! Ready to explore local businesses? Just let me know what you're interested in finding!"
  ];
  return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
};

function App() {
  const [businesses, setBusinesses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(null);
  const [sortOption, setSortOption] = useState("rating");
  const [isTyping, setIsTyping] = useState(false);

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          console.log("Location set:", position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setMessages((prev) => [
            ...prev,
            { sender: "agent", text: "I need access to your location to find nearby businesses. Could you please enable location services so I can help you better?" }
          ]);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: "It looks like your browser doesn't support geolocation. To get the best experience, could you try using a different browser like Chrome or Firefox?" }
      ]);
    }
  }, []);

  // Fetch initial businesses
  useEffect(() => {
    // Only try to fetch businesses if we have a valid API URL
    if (API_URL) {
      console.log("Fetching businesses from:", `${API_URL}/api/query`);
      // Set a conversational welcome message
      setMessages([{ 
        sender: "agent", 
        text: getWelcomeMessage()
      }]);
    }
  }, []);

  const handleUserResponse = async (userInput) => {
    if (!userInput.trim()) return;
    
    setMessages((prev) => [...prev, { sender: "user", text: userInput }]);
    setQuery("");

    if (!location) {
      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: "I'd love to help you find that, but I'll need your location first. Could you please enable location access in your browser settings?" }
      ]);
      return;
    }

    // Show typing indicator during the entire search process
    setIsTyping(true);

    try {
      // Make API request to search for businesses
      // Update the endpoint to use /api/query instead of /query
      const res = await axios.post(`${API_URL}/api/query`, {
        query: userInput,
        latitude: location.latitude,
        longitude: location.longitude
      });

      let businessesWithDistance = res.data.businesses.map((biz) => ({
        ...biz,
        distance: biz.latitude && biz.longitude 
          ? computeDistance(location.latitude, location.longitude, parseFloat(biz.latitude), parseFloat(biz.longitude)) 
          : 99999
      }));

      let sortedBusinesses = [...businessesWithDistance];
      if (sortOption === "rating") {
        sortedBusinesses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortOption === "distance") {
        sortedBusinesses.sort((a, b) => (a.distance || 99999) - (b.distance || 99999));
      }

      setBusinesses(sortedBusinesses);
      
      // Add a conversational response based on the query and results
      setMessages((prev) => [
        ...prev, 
        { 
          sender: "agent", 
          text: generateConversationalResponse(userInput, sortedBusinesses)
        }
      ]);
    } catch (error) {
      console.error("❌ Error fetching businesses:", error);
      setMessages((prev) => [
        ...prev,
        { 
          sender: "agent", 
          text: "Oops! Something went wrong on my end. Could you try again in a moment? I'm really sorry for the inconvenience!" 
        }
      ]);
    } finally {
      // Hide typing indicator after search is complete
      setIsTyping(false);
    }
  };

  // Function to open Google Maps directions
  const openDirections = (business) => {
    if (business.latitude && business.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}&destination_place_id=${business.place_id}`;
      window.open(url, '_blank');
    } else {
      alert('Location information is not available for this business.');
    }
  };

  // Function to get more images for a business
  const getMoreImages = async (placeId) => {
    try {
      const res = await axios.get(`${API_URL}/api/images/${placeId}`);
      return res.data.photoUrls;
    } catch (error) {
      console.error("Error fetching images:", error);
      return [];
    }
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div 
      style={{
        padding: '8px 12px',
        margin: '8px 0',
        borderRadius: '8px',
        maxWidth: '80%',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div style={{ marginRight: '8px' }}><b>Agent:</b></div>
      <div className="typing-indicator" style={{ display: 'flex', alignItems: 'center' }}>
        <div 
          style={{ 
            height: '8px', 
            width: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#888', 
            margin: '0 2px',
            animation: 'typing-dot 1.4s infinite ease-in-out both',
            animationDelay: '0s'
          }} 
        />
        <div 
          style={{ 
            height: '8px', 
            width: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#888', 
            margin: '0 2px',
            animation: 'typing-dot 1.4s infinite ease-in-out both',
            animationDelay: '0.2s'
          }} 
        />
        <div 
          style={{ 
            height: '8px', 
            width: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#888', 
            margin: '0 2px',
            animation: 'typing-dot 1.4s infinite ease-in-out both',
            animationDelay: '0.4s'
          }} 
        />
      </div>
      <style>
        {`
          @keyframes typing-dot {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header with Logo and Tagline */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        backgroundColor: '#4285F4',
        padding: '0',
        color: 'white'
      }}>
        {/* Image first */}
        <img 
          src={locallyBanner} 
          alt="LOCALLY Banner" 
          style={{ 
            width: '100%', 
            maxHeight: '200px', 
            objectFit: 'cover'
          }} 
        />
        
        {/* Header and tagline after the image */}
        <div style={{ padding: '20px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            margin: '0',
            fontWeight: 'bold',
            letterSpacing: '2px'
          }}>
            LOCALLY
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            margin: '5px 0 0 0',
            fontStyle: 'italic'
          }}>
            Supporting business LOCALLY
          </p>
        </div>
      </div>
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '15px',
        marginBottom: '20px',
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.length > 0 ? (
          <>
            {messages.map((message, index) => (
              <div 
                key={index} 
                style={{
                  padding: '8px 12px',
                  margin: '8px 0',
                  borderRadius: '8px',
                  maxWidth: '80%',
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: message.sender === 'user' ? '#dcf8c6' : '#fff',
                  marginLeft: message.sender === 'user' ? 'auto' : '0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <b>{message.sender === 'user' ? 'You' : 'Agent'}:</b> {message.text}
              </div>
            ))}
            {isTyping && <TypingIndicator />}
          </>
        ) : (
          <p style={{ textAlign: 'center', color: '#888' }}>No messages yet</p>
        )}
      </div>
      
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <input
          style={{ 
            flex: 1, 
            padding: '10px', 
            borderRadius: '4px 0 0 4px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question or search for businesses..."
          onKeyPress={(e) => e.key === 'Enter' && handleUserResponse(query)}
        />
        <button 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          onClick={() => handleUserResponse(query)}
        >
          Send
        </button>
      </div>
      
      {businesses.length > 0 && (
        <div>
          <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Results</h2>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <button 
              style={{ 
                marginRight: '10px',
                padding: '5px 10px',
                backgroundColor: sortOption === 'rating' ? '#4CAF50' : '#f1f1f1',
                color: sortOption === 'rating' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => setSortOption('rating')}
            >
              Sort by Rating
            </button>
            <button 
              style={{ 
                padding: '5px 10px',
                backgroundColor: sortOption === 'distance' ? '#4CAF50' : '#f1f1f1',
                color: sortOption === 'distance' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => setSortOption('distance')}
            >
              Sort by Distance
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {businesses.map((business, index) => (
              <div 
                key={index} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '15px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {business.photo && (
                  <img 
                    src={business.photo} 
                    alt={business.name} 
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      objectFit: 'cover', 
                      borderRadius: '4px', 
                      marginBottom: '10px' 
                    }} 
                  />
                )}
                <h3 style={{ margin: '0 0 10px 0' }}>{business.name}</h3>
                <p style={{ margin: '5px 0', color: '#666' }}>{business.address}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span>⭐ {business.rating || 'N/A'}</span>
                  <span>📍 {business.distance} km</span>
                </div>
                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#4285F4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      width: '100%'
                    }}
                    onClick={() => openDirections(business)}
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
