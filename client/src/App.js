import React, { useState, useEffect } from 'react';
import axios from 'axios';
import locallyBanner from './Assets/LOCALLY BANNER.jpg';
import logo from './LOGO.png';  // Update import to match actual filename case
import './App.css';

// Update API URL configuration to handle environments correctly
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://locally-server.onrender.com/api'  // Production backend
  : 'http://localhost:5000/api';               // Local development

console.log("Environment:", process.env.NODE_ENV);
console.log("Backend URL:", API_URL);

// Add detailed environment logging
console.log("🔧 Environment Details:", {
  nodeEnv: process.env.NODE_ENV,
  apiUrl: API_URL,
  isProd: process.env.NODE_ENV === 'production'
});

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

// Define taglines outside of functions so it's available throughout the component
const taglines = [
  "Search far and wide.",
  "Find hidden gems.",
  "Explore more.",
  "Discover cool stuff."
];

// Update welcome message function to use the shared taglines array
const getWelcomeMessage = () => {
  const randomTagline = taglines[Math.floor(Math.random() * taglines.length)];
  return `${randomTagline} Tell me what you're searching for, and I'll find the best options near you!`;
};

function App() {
  const [businesses, setBusinesses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(null);
  const [sortOption, setSortOption] = useState("relevance");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [aiPersonality, setAiPersonality] = useState(localStorage.getItem('aiPersonality') || 'professional');
  const [searchHistory, setSearchHistory] = useState(JSON.parse(localStorage.getItem('searchHistory') || '[]'));
  const [currentPage, setCurrentPage] = useState(1);
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);

  // Removed unused chatEndRef

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log("📍 Location received:", loc);
          setLocation(loc);
        },
        (error) => {
          console.error("❌ Geolocation error:", {
            code: error.code,
            message: error.message
          });
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
    console.log("🚀 Starting search request:", {
      query: userInput,
      location: location,
      apiEndpoint: `${API_URL}/query`
    });

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
      console.log("📤 Sending request to server...");
      const res = await axios({
        method: 'post',
        url: `${API_URL}/query`,
        data: {
          query: userInput,
          latitude: location.latitude,
          longitude: location.longitude,
          aiPersonality,
          searchHistory
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000,
        validateStatus: (status) => status >= 200 && status < 500,
        withCredentials: true
      });

      // Enhanced response logging
      console.log("\n📥 Server Response Details:");
      console.log("---------------------------");
      console.log(`Status: ${res.status}`);
      console.log(`Total Results: ${res.data?.businesses?.length || 0}`);
      
      // Log first business details if available
      if (res.data?.businesses?.[0]) {
        const firstBusiness = res.data.businesses[0];
        console.log("\n🏪 First Business Details:");
        console.log("---------------------------");
        console.log(`Name: ${firstBusiness.name}`);
        console.log(`Address: ${firstBusiness.formatted_address || firstBusiness.vicinity}`);
        console.log(`Rating: ${firstBusiness.rating} (${firstBusiness.user_ratings_total} reviews)`);
        console.log(`Location: ${firstBusiness.latitude}, ${firstBusiness.longitude}`);
        console.log(`Open Now: ${firstBusiness.opening_hours?.open_now ? '✅' : '❌'}`);
        
        // Log available amenities - Fix duplicate declaration
        const amenities = [];
        if (firstBusiness.wheelchair_accessible) amenities.push('♿ Wheelchair Accessible');
        if (firstBusiness.outdoor_seating) amenities.push('🪑 Outdoor Seating');
        if (firstBusiness.delivery) amenities.push('🚚 Delivery');
        if (firstBusiness.takeout) amenities.push('📦 Takeout');
        
        if (amenities.length > 0) {
          console.log("\nAmenities Available:", amenities.join(', '));
        }
      }

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
      
      // Use the AI-generated message from the response
      setMessages((prev) => [
        ...prev, 
        { 
          sender: "agent", 
          text: res.data.message || generateConversationalResponse(userInput, sortedBusinesses)
        }
      ]);

      // Update search history
      const newHistory = [userInput, ...searchHistory].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      // Set follow-up question if one is returned
      if (res.data.followUpQuestion) {
        setFollowUpQuestion(res.data.followUpQuestion);
      }

    } catch (error) {
      console.error("\n❌ Request Failed:");
      console.error("---------------------------");
      if (error.response) {
        // Server responded with error
        console.error(`Status: ${error.response.status}`);
        console.error(`Message: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        // Request was made but no response
        console.error('Status: No Response');
        console.error('Message: Server is unreachable');
      } else {
        // Error in request setup
        console.error('Status: Request Failed');
      }
      console.error(`Endpoint: ${API_URL}/query`);

      setMessages((prev) => [
        ...prev,
        { 
          sender: "agent", 
          text: error.response?.data?.message || 
                "Sorry, I'm having trouble connecting to the server. Please try again in a moment." 
        }
      ]);
    } finally {
      // Hide typing indicator after search is complete
      setIsTyping(false);
    }
  };

  const handleFollowUpResponse = async (type, value) => {
    try {
        const response = await axios.post(`${API_URL}/query/follow-up`, {
            type,
            value,
            originalQuery: query,
            businesses
        });

        setBusinesses(response.data.businesses);
        setMessages(prev => [...prev, 
            { sender: 'user', text: `Yes, show me ${type === 'rating' ? `${value}+ star places` : type === 'distance' ? `places within ${value}km` : value === 'outdoor' ? 'places with outdoor seating' : 'more options'}` },
            { sender: 'agent', text: response.data.message }
        ]);
        setFollowUpQuestion(null);
    } catch (error) {
        console.error('Follow-up error:', error);
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

  // Business card component
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

  // Business Modal Component
  const BusinessModal = ({ business, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="business-details">
          <div className="detail-section left-column">
            <h2>{business.name}</h2>
            
            {business.photos?.[0] && (
              <img src={business.photos[0].url} alt={business.name} className="business-photo" />
            )}

            {/* Reviews Section Moved to Left Column */}
            {business.top_reviews && business.top_reviews.length > 0 ? (
              <div className="reviews-section">
                <h3>Reviews</h3>
                <div className="reviews-grid">
                  {business.top_reviews.map((review, index) => (
                    <div key={index} className="review-card">
                      <div className="review-header">
                        <span className="reviewer-name">{review.author_name}</span>
                        <span className="review-rating">{'★'.repeat(review.rating)}</span>
                      </div>
                      <p className="review-text">{review.text}</p>
                      <span className="review-time">{review.relative_time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No reviews available</p>
            )}
          </div>

          <div className="detail-section right-column">
            {/* Business Info Moved to Right Column */}
            <div className="action-buttons">
              <button 
                className="directions-button"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.name)}&query_place_id=${business.place_id}`, '_blank')}
              >
                Get Directions
              </button>
              {business.formatted_phone_number && (
                <button 
                  className="call-button"
                  onClick={() => window.open(`tel:${business.formatted_phone_number}`)}
                >
                  📞 Call Business
                </button>
              )}
            </div>

            <div className="business-meta">
              <p><strong>Address:</strong> {business.formatted_address || business.vicinity}</p>
              {business.formatted_phone_number && (
                <p><strong>Phone:</strong> {business.formatted_phone_number}</p>
              )}
              {business.website && (
                <p><strong>Website:</strong> <a href={business.website} target="_blank" rel="noopener noreferrer">Visit Website</a></p>
              )}
            </div>

            {business.opening_hours && (
              <div className="hours-info">
                <h3>Hours</h3>
                <p className={`status-indicator ${business.opening_hours.open_now ? '✅ Open now' : '❌ Closed'}`}>
                  {business.opening_hours.open_now ? '✅ Open now' : '❌ Closed'}
                </p>
                {business.opening_hours.weekday_text && (
                  <div className="hours-list">
                    {business.opening_hours.weekday_text.map((hours, idx) => (
                      <p key={idx}>{hours}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // New helper functions
  const loadMoreResults = async () => {
    setCurrentPage(prev => prev + 1);
    // Implement pagination logic here
  };

  // Add personality selection handler
  const handlePersonalityChange = (personality) => {
    setAiPersonality(personality);
    localStorage.setItem('aiPersonality', personality);
  };

  // Fix header layout
  return (
    <div className="App">
      <header className="header">
        <div className="logo-container">
          <img src={logo} alt="LOCALLY Logo" />
        </div>
        <form className="header-search" onSubmit={(e) => { e.preventDefault(); handleUserResponse(query); }}>
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
        <div className="ai-personality">
          <select 
            value={aiPersonality} 
            onChange={(e) => handlePersonalityChange(e.target.value)}
          >
            <option value="professional">Professional & Efficient</option>
            <option value="friendly">Friendly & Chatty</option>
            <option value="fun">Hyped & Fun</option>
          </select>
        </div>
      </header>

      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Show search history suggestions */}
      {searchHistory.length > 0 && !businesses.length && (
        <div className="search-history">
          <h3>Recent Searches:</h3>
          <div className="history-buttons">
            {searchHistory.map((search, index) => (
              <button 
                key={index} 
                onClick={() => handleUserResponse(search)}
                className="history-item"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Business sorting and listing */}
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
          <BusinessCard 
            key={business.place_id} 
            business={business} 
            onReadMore={openBusinessDetails} 
          />
        ))}
      </div>

      {/* Load more button */}
      {businesses.length > 0 && (
        <div className="load-more">
          <button onClick={loadMoreResults}>
            Load 20 More Results
          </button>
        </div>
      )}

      {/* Business details modal */}
      {selectedBusiness && (
        <BusinessModal 
          business={selectedBusiness} 
          onClose={closeBusinessDetails} 
        />
      )}
    </div>
  );
}

export default App;
