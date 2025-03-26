import React, { useState } from 'react';

const AIAgent = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="ai-agent">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me about local businesses..."
        />
        <button type="submit">Search</button>
      </form>
    </div>
  );
};

export default AIAgent;
