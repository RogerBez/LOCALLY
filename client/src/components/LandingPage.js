import React, { useState } from 'react';
import styled from 'styled-components';
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Card = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
  width: 100%;
  max-width: 700px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
`;

const SearchForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const InputGroup = styled.div`
  position: relative;
  flex: 1;
`;

const InputIcon = styled.span`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: #aaa;
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 2.5rem;
  border-radius: 10px;
  border: 2px solid #eee;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;

const Button = styled.button`
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: #1976D2;
  }
  
  @media (min-width: 768px) {
    width: auto;
  }
`;

const FeaturesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
`;

const FeatureCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  max-width: 250px;
  text-align: center;
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  color: #2196F3;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #333;
`;

const FeatureDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
`;

const LandingPage = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query && location) {
      onSearch(query, location);
    }
  };
  
  return (
    <PageContainer>
      <Card>
        <Title>Find Local Services</Title>
        <Subtitle>Discover top-rated businesses near you</Subtitle>
        
        <SearchForm onSubmit={handleSubmit}>
          <InputGroup>
            <InputIcon><FaSearch /></InputIcon>
            <Input 
              type="text" 
              placeholder="What are you looking for?" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              required
            />
          </InputGroup>
          
          <InputGroup>
            <InputIcon><FaMapMarkerAlt /></InputIcon>
            <Input 
              type="text" 
              placeholder="Location" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              required
            />
          </InputGroup>
          
          <Button type="submit">Search</Button>
        </SearchForm>
        
        <FeaturesContainer>
          <FeatureCard>
            <FeatureIcon>🏆</FeatureIcon>
            <FeatureTitle>Top Rated</FeatureTitle>
            <FeatureDescription>Find the highest-rated local businesses with verified reviews.</FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>🔍</FeatureIcon>
            <FeatureTitle>Discover</FeatureTitle>
            <FeatureDescription>Explore new services and hidden gems in your neighborhood.</FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>📱</FeatureIcon>
            <FeatureTitle>Connect</FeatureTitle>
            <FeatureDescription>Easily contact businesses through phone, WhatsApp, or their website.</FeatureDescription>
          </FeatureCard>
        </FeaturesContainer>
      </Card>
    </PageContainer>
  );
};

export default LandingPage;