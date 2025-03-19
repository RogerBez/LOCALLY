import React, { useState, useEffect } from 'react';
import axios from 'axios';
import locallyBanner from './Assets/LOCALLY BANNER.jpg';
import './App.css';

// Update API URL configuration to handle environments correctly
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://locally-server.onrender.com/api'  // Production backend
  : 'http://localhost:5000/api';               // Local development

console.log("Environment:", process.env.NODE_ENV);
console.log("Backend URL:", API_URL);

// Helper function to calculate distance between two coordinates
const computeDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (angle) => (Math.PI * angle) / 180;
  const R = 6371; // Radius of Earth in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lat1 - lon1);
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
  const [sortOption, setSortOption] = useState("relevance");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  // Removed unused chatEndRef

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
      console.log("Fetching businesses from:", `${API_URL}/query`);
      // Set a conversational welcome message
      setMessages([{ 
        sender: "agent", 
        text: getWelcomeMessage()
      }]);
    }
  }, []);

  // Enhanced scroll behavior
  useEffect(() => {
    const chatWindow = document.querySelector('.chat-window');
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }, [messages, isTyping]); // Scroll on new messages or typing indicator changes

  // Update axios request with proper headers
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
      const res = await axios.post(`${API_URL}/query`, {  // /api/query in development
        query: userInput,
        latitude: location.latitude,
        longitude: location.longitude
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
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

  const handleSort = (e) => {
    const option = e.target.value;
    setSortOption(option);
    
    let sortedData = [...businesses];
    
    switch(option) {
      case 'rating':
        sortedData.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'reviews':
        sortedData.sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0));
        break;
      case 'name':
        sortedData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // Keep original order for 'relevance'
        break;
    }
    
    setBusinesses(sortedData);
  };

  // Add modal handlers
  const openBusinessDetails = (business) => {
    setSelectedBusiness(business);
  };

  const closeBusinessDetails = () => {
    setSelectedBusiness(null);
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

  // Business card component - Keep it simple
  const BusinessCard = ({ business, onReadMore }) => (
    <div className="business-card">
      <div className="business-image">
        {business.photos && business.photos[0] && (
          <img
            src={business.photos[0].url}
            alt={business.name}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
            }}
          />
        )}
      </div>
      <div className="business-info">
        <h2>{business.name}</h2>
        {business.rating && (
          <div className="business-rating">
            <span className="stars">{'★'.repeat(Math.round(business.rating))}</span>
            <span className="rating-count">({business.user_ratings_total} reviews)</span>
          </div>
        )}
        <button className="directions-button" onClick={() => onReadMore(business)}>
          Read More
        </button>
      </div>
    </div>
  );

  // Business modal - Show all available details
  const BusinessModal = ({ business, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="business-details">
          <div className="detail-section">
            <h2>{business.name}</h2>
            {business.photos?.[0] && (
              <img src={business.photos[0].url} alt={business.name} />
            )}
            {business.rating && (
              <div className="business-rating">
                <span className="stars">{'★'.repeat(Math.round(business.rating))}</span>
                <span className="rating-count">({business.user_ratings_total} reviews)</span>
                {business.price_level && (
                  <span className="price-level">{'$'.repeat(business.price_level)}</span>
                )}
              </div>
            )}
          </div>
          <div className="detail-section">
            <h3>Business Details</h3>
            <p><strong>Address:</strong> {business.formatted_address || business.vicinity}</p>
            {business.business_status && (
              <p><strong>Status:</strong> {business.business_status.replace(/_/g, ' ')}</p>
            )}
            {business.opening_hours && (
              <p><strong>Hours:</strong> {business.opening_hours.open_now ? '✅ Open now' : '❌ Closed'}</p>
            )}
            {business.types && (
              <p><strong>Categories:</strong> {business.types.map(t => t.replace(/_/g, ' ')).join(', ')}</p>
            )}
            <div className="action-buttons">
              <button 
                className="directions-button"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.name)}&query_place_id=${business.place_id}`, '_blank')}
              >
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="header">
        <img src={locallyBanner} alt="LOCALLY" style={{ maxWidth: '100%', height: 'auto' }} />
      </header>
      
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isTyping && <TypingIndicator />}
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); handleUserResponse(query); }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find restaurants, coffee shops, hotels..."
          disabled={isTyping}
        />
        <button type="submit" disabled={isTyping}>
          {isTyping ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {businesses.length > 0 && (
        <div className="sort-options">
          <label htmlFor="sort">Sort by: </label>
          <select id="sort" value={sortOption} onChange={handleSort}>
            <option value="relevance">Relevance</option>
            <option value="rating">Rating</option>
            <option value="reviews">Number of Reviews</option>
            <option value="name">Name</option>
          </select>
        </div>
      )}
      
      <div className="business-list">
        {businesses.map((business) => (
          <BusinessCard key={business.place_id} business={business} onReadMore={openBusinessDetails} />
        ))}
      </div>

      {selectedBusiness && <BusinessModal business={selectedBusiness} onClose={closeBusinessDetails} />}
    </div>
  );
}

export default App;
