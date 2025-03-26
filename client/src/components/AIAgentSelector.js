import React, { useState } from 'react';
import styled from 'styled-components';

const SelectorContainer = styled.div`
  padding: 15px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 600px;
  margin: 0 auto;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
`;

const AgentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
`;

const AgentCard = styled.div`
  border: 2px solid ${props => props.$selected ? '#2196F3' : '#e0e0e0'};
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  ${props => props.$selected && `
    background-color: #E3F2FD;
    box-shadow: 0 5px 15px rgba(33, 150, 243, 0.2);
  `}
`;

const AgentIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${props => props.$color || '#f5f5f5'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-size: 24px;
`;

const AgentName = styled.h4`
  margin: 0;
  text-align: center;
  font-weight: 600;
`;

const AgentDescription = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  color: #666;
  text-align: center;
`;

const SaveButton = styled.button`
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  margin-top: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1976D2;
  }
`;

const agents = [
  {
    id: 'casual',
    name: 'Casual Casey',
    icon: '😊',
    color: '#FFECB3',
    description: 'Friendly and conversational, uses casual language'
  },
  {
    id: 'professional',
    name: 'Professional Pat',
    icon: '👔',
    color: '#C8E6C9',
    description: 'Formal and business-like, focused on efficiency'
  },
  {
    id: 'enthusiastic',
    name: 'Energetic Ellie',
    icon: '🎉',
    color: '#BBDEFB',
    description: 'Upbeat, enthusiastic and uses emoji frequently'
  },
  {
    id: 'analytical',
    name: 'Analytical Alex',
    icon: '🔍',
    color: '#D1C4E9',
    description: 'Data-driven, provides detailed comparisons'
  },
];

const AIAgentSelector = ({ onSelect, currentAgent }) => {
  const [selectedAgent, setSelectedAgent] = useState(currentAgent || 'casual');
  
  const handleSelect = (agentId) => {
    setSelectedAgent(agentId);
  };
  
  const handleSave = () => {
    onSelect(selectedAgent);
    // Store preference in localStorage
    localStorage.setItem('preferredAIAgent', selectedAgent);
  };
  
  return (
    <SelectorContainer>
      <Title>Choose your AI assistant style</Title>
      <AgentGrid>
        {agents.map(agent => (
          <AgentCard 
            key={agent.id}
            $selected={selectedAgent === agent.id}
            onClick={() => handleSelect(agent.id)}
          >
            <AgentIcon $color={agent.color}>{agent.icon}</AgentIcon>
            <AgentName>{agent.name}</AgentName>
            <AgentDescription>{agent.description}</AgentDescription>
          </AgentCard>
        ))}
      </AgentGrid>
      <SaveButton onClick={handleSave}>Save Preference</SaveButton>
    </SelectorContainer>
  );
};

export default AIAgentSelector;