import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ChatContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 350px;
  max-height: 500px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.2);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  
  ${props => props.$minimized && `
    height: 60px;
    width: 60px;
    border-radius: 50%;
  `}
`;

const ChatHeader = styled.div`
  background-color: #2196F3;
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const ChatTitle = styled.div`
  font-weight: 600;
  ${props => props.$minimized && 'display: none;'}
`;

const ChatIcon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 18px;
    height: 18px;
    fill: #2196F3;
  }
`;

const ChatMessages = styled.div`
  padding: 15px;
  height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  ${props => props.$minimized && 'display: none;'}
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
  ${props => props.$minimized && 'display: none;'}
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
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1976D2;
  }
  
  &:disabled {
    background-color: #BDBDBD;
    cursor: not-allowed;
  }
`;

const ThinkingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 10px 15px;
  align-self: flex-start;
  
  span {
    width: 8px;
    height: 8px;
    background-color: #BDBDBD;
    border-radius: 50%;
    animation: thinking 1.4s infinite ease-in-out both;
    
    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
  
  @keyframes thinking {
    0%, 80%, 100% { 
      transform: scale(0);
    } 
    40% { 
      transform: scale(1);
    }
  }
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
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #BBDEFB;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const AIChat = ({ businesses, onFilterBusinesses }) => {
  const [minimized, setMinimized] = useState(false);
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
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const toggleMinimize = () => {
    setMinimized(!minimized);
  };
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSendMessage();
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = { text: inputValue, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);
    
    try {
      // Send to backend AI service
      const response = await fetchAIResponse(inputValue, businesses);
      setIsThinking(false);
      
      // Add AI response
      setMessages(prev => [...prev, response]);
      
      // If the response includes filtering instructions, apply them
      if (response.filterAction) {
        onFilterBusinesses(response.filterAction);
      }
      
    } catch (error) {
      console.error('AI chat error:', error);
      setIsThinking(false);
      setMessages(prev => [...prev, { 
        text: "I'm having trouble connecting. Please try again in a moment.", 
        isUser: false 
      }]);
    }
  };
  
  const handleOptionClick = async (option) => {
    // Add the option as if user typed it
    const userMessage = { text: option, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    
    try {
      // Send to backend AI service
      const response = await fetchAIResponse(option, businesses);
      setIsThinking(false);
      
      // Add AI response
      setMessages(prev => [...prev, response]);
      
      // If the response includes filtering instructions, apply them
      if (response.filterAction) {
        onFilterBusinesses(response.filterAction);
      }
      
    } catch (error) {
      console.error('AI chat error:', error);
      setIsThinking(false);
      setMessages(prev => [...prev, { 
        text: "I'm having trouble connecting. Please try again in a moment.", 
        isUser: false 
      }]);
    }
  };
  
  const fetchAIResponse = async (message, businesses) => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${API_URL}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        businesses: businesses || [],
        context: messages.map(m => ({
          role: m.isUser ? 'user' : 'assistant',
          content: m.text
        }))
      }),
    });
    
    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }
    
    const data = await response.json();
    return {
      text: data.message,
      isUser: false,
      options: data.options || [],
      filterAction: data.filterAction
    };
  };
  
  return (
    <ChatContainer $minimized={minimized}>
      <ChatHeader onClick={toggleMinimize}>
        <ChatIcon>
          <svg viewBox="0 0 24 24">
            <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 20c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"/>
            <path d="M12 6.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0 9c-.83 0-1.5-.67-1.5-1.5v-4c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5z"/>
          </svg>
        </ChatIcon>
        <ChatTitle $minimized={minimized}>AI Assistant</ChatTitle>
      </ChatHeader>
      
      <ChatMessages $minimized={minimized}>
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
          </React.Fragment>
        ))}
        
        {isThinking && (
          <ThinkingIndicator>
            <span></span>
            <span></span>
            <span></span>
          </ThinkingIndicator>
        )}
        
        <div ref={messagesEndRef} />
      </ChatMessages>
      
      <ChatInput $minimized={minimized}>
        <Input 
          type="text"
          placeholder="Type a message..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isThinking}
        />
        <SendButton 
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isThinking}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
          </svg>
        </SendButton>
      </ChatInput>
    </ChatContainer>
  );
};

export default AIChat;