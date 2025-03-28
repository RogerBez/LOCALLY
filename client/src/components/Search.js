import React, { useState, useEffect } from 'react';
import { FaSearch, FaRobot } from 'react-icons/fa';
import './Search.css';

const Search = ({ onSearch, initialBusinesses = [], isFollowUp = false, searchQuery = null }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState({
    message: isFollowUp 
      ? `I found some results for "${searchQuery}". Would you like to refine your search or have any questions about the results?`
      : "Hi! I'm your AI assistant. What kind of business are you looking for?",
    options: isFollowUp 
      ? ["Show higher rated places", "Find places closer to me", "Different type of business"] 
      : [],
    searchQuery: searchQuery || null,
    isConfirming: false,
    previousQuery: searchQuery || null
  });

  // Update the initial message when the component receives new props
  useEffect(() => {
    if (isFollowUp && searchQuery) {
      setAiResponse(prev => ({
        ...prev,
        message: `I found ${initialBusinesses.length} results for "${searchQuery}". Would you like to refine your search or ask about these places?`,
        options: ["Show higher rated places", "Find places closer to me", "Different type of business"],
        searchQuery: searchQuery,
        previousQuery: searchQuery
      }));
    }
  }, [isFollowUp, searchQuery, initialBusinesses.length]);

  const handleAIChat = async (userMessage, isConfirmation = false) => {
    setIsLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('🤖 Sending AI request to:', `${API_URL}/api/ai-chat`);

      // Add timestamp for debugging
      const requestStartTime = Date.now();

      // Include the previous query information for context
      const requestBody = {
        message: userMessage.trim(),
        isConfirmation,
        context: {
          businesses: initialBusinesses,
          previousQuery: aiResponse.searchQuery || aiResponse.previousQuery
        }
      };
      
      console.log('🤖 Request payload:', requestBody);

      const response = await fetch(`${API_URL}/api/ai-chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`🕒 AI request took ${Date.now() - requestStartTime}ms, status: ${response.status}`);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error('❌ Non-JSON response received:', contentType);
        
        // Try to get the raw response text for debugging
        const rawText = await response.text();
        console.error('❌ Response body (text):', rawText);
        
        throw new Error(`Server returned non-JSON response: ${contentType || 'unknown'}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error response:', data);
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      console.log('🤖 AI Response:', data);

      // Preserve previous query information
      setAiResponse(prev => ({
        ...prev,
        ...data,
        isConfirming: data.needsConfirmation,
        previousQuery: data.previousQuery || prev.previousQuery || data.searchQuery
      }));

      // Important change: Check for confirmedSearch OR perform direct search if isConfirmation is true
      if (data.confirmedSearch) {
        console.log('🔍 Performing search with confirmedSearch:', data.confirmedSearch);
        await onSearch(data.confirmedSearch);
      } else if (isConfirmation && data.searchQuery) {
        // Direct search if this is a confirmation and there's a search query
        console.log('🔍 Performing direct search with:', data.searchQuery);
        await onSearch(data.searchQuery);
      }
    } catch (err) {
      console.error('❌ AI Chat error:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });

      // Set a more descriptive error message in the UI
      setAiResponse(prev => ({
        ...prev,
        message: `Sorry, there was an error communicating with the AI: ${err.message}`,
        options: ["Try again", "Help"],
        isConfirming: false
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    const userMessage = query;
    setQuery('');
    handleAIChat(userMessage);
  };

  const handleOptionClick = (option) => {
    setQuery('');
    // Check if this is a "Yes, search now" option
    if (option.toLowerCase().includes('yes') || option.toLowerCase().includes('search now')) {
      // Directly trigger search with the stored query
      const searchQuery = aiResponse.searchQuery || aiResponse.previousQuery;
      if (searchQuery) {
        console.log('🔍 Direct search from option click:', searchQuery);
        onSearch(searchQuery);
        return;
      }
    }
    handleAIChat(option, true);
  };

  return (
    <div className="unified-search-container">
      <div className={`ai-conversation ${isFollowUp ? 'ai-conversation-follow-up' : ''}`}>
        <div className="ai-message">
          <FaRobot className="ai-icon" />
          <p>{aiResponse.message}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="unified-search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isFollowUp ? "Ask me about these results or refine your search..." : "Type your response here..."}
            className="unified-search-input"
            disabled={isLoading}
          />
          <button 
            type="submit"
            className="unified-search-button"
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? 'Thinking...' : <FaSearch />}
          </button>
        </div>
        
        {aiResponse.options && aiResponse.options.length > 0 && (
          <div className="suggestion-chips">
            {aiResponse.options.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleOptionClick(option)}
                className="suggestion-chip"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default Search;
