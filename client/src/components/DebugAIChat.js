import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ChatContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 350px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.2);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  background-color: #2196F3;
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatTitle = styled.div`
  font-weight: 600;
`;

const ChatMessages = styled.div`
  padding: 15px;
  height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Message = styled.div`
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  
  ${props => props.$isUser ? `
    background-color: #E3F2FD;
    color: #1565C0;
    align-self: flex-end;
    border-bottom-right-radius: 5px;
  ` : `
    background-color: #F5F5F5;
    color: #333;
    align-self: flex-start;
    border-bottom-left-radius: 5px;
  `}
`;

const ChatInput = styled.div`
  display: flex;
  padding: 10px 15px;
  border-top: 1px solid #eee;
`;

const Input = styled.input`
  flex: 1;
  border: none;
  padding: 10px 15px;
  border-radius: 20px;
  background-color: #F5F5F5;
  font-size: 14px;
  outline: none;
  
  &:focus {
    background-color: #E3F2FD;
  }
`;

const SendButton = styled.button`
  background-color: #2196F3;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-left: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActionButton = styled.button`
  background-color: #E3F2FD;
  color: #1976D2;
  border: none;
  border-radius: 16px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  margin-right: 6px;
  margin-bottom: 6px;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const ErrorMessage = styled.div`
  background-color: #FFEBEE;
  color: #D32F2F;
  padding: 10px;
  margin-top: 10px;
  border-radius: 8px;
  font-size: 12px;
`;

const StatusMessage = styled.div`
  font-size: 12px;
  padding: 5px 10px;
  color: #555;
  text-align: center;
  background-color: #F5F5F5;
  border-top: 1px solid #eee;
`;

const DebugAIChat = ({ businesses }) => {
  const [messages, setMessages] = useState([
    { 
      text: "Hi there! I'm your local services AI assistant. How can I help you find the perfect business today?",
      isUser: false,
      options: [
        "Show affordable options",
        "Highly rated places only",
        "Closest to me"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorLog, setErrorLog] = useState([]);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = { text: inputValue, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Direct fetch with error handling
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          businesses: businesses || [],
          agentStyle: 'casual'
        }),
      });
      
      // Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check for non-200 response
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
        } catch (e) {
          errorDetails = await response.text();
        }
        
        const error = new Error(`Server returned ${response.status}`);
        error.details = errorDetails;
        throw error;
      }
      
      // Parse the response
      const data = await response.json();
      console.log('AI response data:', data);
      
      // Add AI response
      setMessages(prev => [...prev, { 
        text: data.message || "Sorry, I couldn't generate a response",
        isUser: false,
        options: data.options || []
      }]);
    } catch (error) {
      console.error('Debug AI chat error:', error);
      
      // Log errors
      setErrorLog(prev => [...prev, {
        time: new Date().toISOString(),
        message: error.message,
        details: error.details || 'No details available'
      }]);
      
      // Add error message
      setMessages(prev => [...prev, { 
        text: "I'm having trouble connecting to the server. Please check the console for details.",
        isUser: false,
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSendMessage();
    }
  };
  
  const handleOptionClick = async (option) => {
    // Add the option as if user typed it
    const userMessage = { text: option, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Direct fetch with error handling
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: option,
          businesses: businesses || [],
          agentStyle: 'casual'
        }),
      });
      
      // Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check for non-200 response
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
        } catch (e) {
          errorDetails = await response.text();
        }
        
        const error = new Error(`Server returned ${response.status}`);
        error.details = errorDetails;
        throw error;
      }
      
      // Parse the response
      const data = await response.json();
      console.log('AI response data:', data);
      
      // Add AI response
      setMessages(prev => [...prev, { 
        text: data.message || "Sorry, I couldn't generate a response",
        isUser: false,
        options: data.options || []
      }]);
    } catch (error) {
      console.error('Debug AI chat error:', error);
      
      // Log errors
      setErrorLog(prev => [...prev, {
        time: new Date().toISOString(),
        message: error.message,
        details: error.details || 'No details available'
      }]);
      
      // Add error message
      setMessages(prev => [...prev, { 
        text: "I'm having trouble connecting to the server. Please check the console for details.",
        isUser: false,
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ChatContainer>
      <ChatHeader>
        <ChatTitle>AI Assistant (Debug Mode)</ChatTitle>
      </ChatHeader>
      
      <ChatMessages>
        {messages.map((message, index) => (
          <React.Fragment key={index}>
            <Message $isUser={message.isUser}>
              {message.text}
            </Message>
            
            {!message.isUser && message.options && message.options.length > 0 && (
              <ActionButtons>
                {message.options.map((option, i) => (
                  <ActionButton key={i} onClick={() => handleOptionClick(option)}>
                    {option}
                  </ActionButton>
                ))}
              </ActionButtons>
            )}
            
            {message.error && (
              <ErrorMessage>
                Error connecting to AI service. See console for details.
              </ErrorMessage>
            )}
          </React.Fragment>
        ))}
        
        {isLoading && (
          <Message $isUser={false}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#aaa', animation: 'pulse 1s infinite' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#aaa', animation: 'pulse 1s infinite 0.2s' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#aaa', animation: 'pulse 1s infinite 0.4s' }}></div>
            </div>
          </Message>
        )}
      </ChatMessages>
      
      <ChatInput>
        <Input 
          type="text"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <SendButton onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
          </svg>
        </SendButton>
      </ChatInput>
      
      <StatusMessage>
        {errorLog.length > 0 ? `${errorLog.length} errors logged` : 'Debug mode'}
      </StatusMessage>
    </ChatContainer>
  );
};

export default DebugAIChat;