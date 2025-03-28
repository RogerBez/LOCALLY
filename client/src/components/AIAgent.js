import React, { useState, useEffect } from 'react';
import './AIAgent.css';

const AIAgent = ({ onSearch, businesses }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          businesses: businesses,
          agentStyle: 'casual'
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'AI request failed');
      
      setAiResponse(data);
      if (data.searchQuery) {
        onSearch(data.searchQuery);
      }
    } catch (err) {
      console.error('AI Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-agent-container">
      {/* Search Input Area */}
      <div className="ai-input-area">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me about local businesses..."
          className="ai-input"
          disabled={isLoading}
        />
        <button 
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="ai-submit-button"
        >
          {isLoading ? 'Thinking...' : 'Ask AI'}
        </button>
      </div>

      {/* AI Response Area */}
      {(error || aiResponse) && (
        <div className="ai-response-area">
          {error && <div className="ai-error">{error}</div>}
          {aiResponse && (
            <div className="ai-message">
              <p>{aiResponse.message}</p>
              {aiResponse.options && (
                <div className="ai-options">
                  {aiResponse.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(option)}
                      className="ai-option-button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAgent;
