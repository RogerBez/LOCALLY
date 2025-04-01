import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaRobot, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import './Search.css';

const Search = ({ onSearch, initialBusinesses = [], isFollowUp = false, searchQuery = null, onSort }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
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
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize conversation with AI greeting
  useEffect(() => {
    setConversation([{
      type: 'ai',
      message: aiResponse.message,
      options: aiResponse.options
    }]);
  }, []);

  // Scroll to bottom of messages when conversation updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Update the initial message when receiving new props
  useEffect(() => {
    if (isFollowUp && searchQuery && initialBusinesses.length > 0) {
      const initialMessage = `I found ${initialBusinesses.length} results for "${searchQuery}". Would you like to refine your search or ask about these places?`;
      
      // Only update if this is a new message
      if (conversation.length <= 1 || conversation[0].message !== initialMessage) {
        setConversation([{
          type: 'ai',
          message: initialMessage,
          options: ["Show higher rated places", "Find places closer to me", "Different type of business"]
        }]);
        
        setAiResponse({
          message: initialMessage,
          options: ["Show higher rated places", "Find places closer to me", "Different type of business"],
          searchQuery: searchQuery,
          previousQuery: searchQuery
        });
      }
    }
  }, [isFollowUp, searchQuery, initialBusinesses.length]);

  const handleAIChat = async (userMessage, isConfirmation = false) => {
    setIsLoading(true);
    
    // Add user message to conversation
    setConversation(prev => [...prev, {
      type: 'user',
      message: userMessage
    }]);
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('🤖 Sending AI request to:', `${API_URL}/api/ai-chat`);

      // Add "thinking" indicator with personality
      const thinkingMessages = [
        "Hmm, let me think about that...",
        "Looking into that for you...",
        "Checking local options...",
        "Searching my knowledge..."
      ];
      const randomThinking = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
      
      setConversation(prev => [...prev, {
        type: 'thinking',
        message: randomThinking
      }]);

      // Include chat history for better context
      const chatHistory = conversation
        .filter(msg => msg.type === 'user' || msg.type === 'ai')
        .slice(-6) // Last 6 messages for context
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.message
        }));
      
      // Include the previous query information for context
      const requestBody = {
        message: userMessage.trim(),
        isConfirmation,
        context: {
          businesses: initialBusinesses,
          previousQuery: aiResponse.searchQuery || aiResponse.previousQuery,
          chatHistory: chatHistory
        }
      };
      
      console.log('🤖 Request payload:', requestBody);

      const response = await fetch(`${API_URL}/api/ai-chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        mode: 'cors'
      });

      // Remove thinking message
      setConversation(prev => prev.filter(msg => msg.type !== 'thinking'));

      // Process response
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned non-JSON response: ${contentType || 'unknown'}`);
      }

      const data = await response.json();
      console.log('🤖 AI Response:', data);

      // Add AI response to conversation
      setConversation(prev => [...prev, {
        type: 'ai',
        message: data.message,
        options: data.options || []
      }]);
      
      // Update AI response state
      setAiResponse(prev => ({
        ...prev,
        ...data,
        isConfirming: data.needsConfirmation,
        previousQuery: data.previousQuery || prev.previousQuery || data.searchQuery
      }));

      // Handle search actions
      if (data.confirmedSearch) {
        console.log('🔍 Performing search with confirmedSearch:', data.confirmedSearch);
        await onSearch(data.confirmedSearch);
      } else if (isConfirmation && data.searchQuery) {
        console.log('🔍 Performing direct search with:', data.searchQuery);
        await onSearch(data.searchQuery);
      }

      // Handle sorting if needed
      if (data.action === 'sort' && data.sortBy && onSort) {
        onSort(data.sortBy);
      }
    } catch (err) {
      console.error('❌ AI Chat error:', err);
      
      // Remove thinking message
      setConversation(prev => prev.filter(msg => msg.type !== 'thinking'));
      
      // Add error message to conversation
      setConversation(prev => [...prev, {
        type: 'error',
        message: `Sorry, I encountered an error: ${err.message}`,
        options: ["Try again"]
      }]);
      
    } finally {
      setIsLoading(false);
      // Focus back on input after response
      setTimeout(() => inputRef.current?.focus(), 100);
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
    // First add this as if the user typed it
    setConversation(prev => [...prev, {
      type: 'user',
      message: option
    }]);
    
    // Reset query and process the option
    setQuery('');
    
    // Check if this is a direct search option
    if (option.toLowerCase().includes('yes') || option.toLowerCase().includes('search now')) {
      const searchQuery = aiResponse.searchQuery || aiResponse.previousQuery;
      if (searchQuery) {
        console.log('🔍 Direct search from option click:', searchQuery);
        
        // Add message that we're searching
        setConversation(prev => [...prev, {
          type: 'ai',
          message: `Searching for "${searchQuery}" in your area...`,
          options: []
        }]);
        
        onSearch(searchQuery);
        return;
      }
    }
    
    handleAIChat(option, true);
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {conversation.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-message ${msg.type}-message`}
          >
            {msg.type === 'ai' && <FaRobot className="chat-icon ai-icon" />}
            {msg.type === 'thinking' ? (
              <div className="thinking-indicator">
                <FaSpinner className="spinning-icon" />
                <span>{msg.message}</span>
              </div>
            ) : (
              <div className="message-content">{msg.message}</div>
            )}
            
            {msg.options && msg.options.length > 0 && (
              <div className="chat-options">
                {msg.options.map((option, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleOptionClick(option)}
                    className="chat-option-button"
                    disabled={isLoading}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isLoading ? "Thinking..." : "Type your message here..."}
          className="chat-input"
          disabled={isLoading}
          ref={inputRef}
        />
        <button 
          type="submit"
          className="chat-submit-button"
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? <FaSpinner className="spinning-icon" /> : <FaPaperPlane />}
        </button>
      </form>
    </div>
  );
};

export default Search;
