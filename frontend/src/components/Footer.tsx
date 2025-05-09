import React, { useState } from 'react';
import styled from 'styled-components';

interface FooterProps {
  // Add any props if needed
}

const FooterContainer = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: ${props => props.theme.colors.chart.background};
  border-top: 1px solid ${props => props.theme.colors.chart.grid};
  margin-top: auto;
  font-size: 0.9rem;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
`;

const SocialLink = styled.a`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const WhitepaperButton = styled.button`
  background-color: transparent;
  border: 1px solid ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.primary};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.chart.background};
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.colors.chart.background};
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  color: ${props => props.theme.colors.primary};
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.foreground};
`;

const WhitepaperSection = styled.div`
  margin-bottom: 1.5rem;
`;

const WhitepaperSectionTitle = styled.h3`
  color: ${props => props.theme.colors.accent};
`;

const Footer: React.FC<FooterProps> = () => {
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState(false);

  return (
    <FooterContainer>
      <div>
        © 2024 TradeStick - A gamified trading simulator
      </div>
      
      <WhitepaperButton onClick={() => setIsWhitepaperOpen(true)}>
        Whitepaper
      </WhitepaperButton>
      
      <SocialLinks>
        <SocialLink href="https://twitter.com/zfyl" target="_blank" rel="noopener noreferrer">
          @zfyl on Twitter
        </SocialLink>
        <SocialLink href="https://github.com/zfyl" target="_blank" rel="noopener noreferrer">
          @zfyl on GitHub
        </SocialLink>
      </SocialLinks>

      {isWhitepaperOpen && (
        <ModalOverlay onClick={() => setIsWhitepaperOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClick={() => setIsWhitepaperOpen(false)}>×</ModalCloseButton>
            <ModalTitle>TradeStick Whitepaper</ModalTitle>
            
            <WhitepaperSection>
              <WhitepaperSectionTitle>About TradeStick</WhitepaperSectionTitle>
              <p>
                TradeStick is a gamified trading simulator that I created for fun to explore the intersection of 
                gaming and trading. It combines real-time market simulation with gamepad controls to create an 
                immersive and enjoyable trading experience.
              </p>
            </WhitepaperSection>
            
            <WhitepaperSection>
              <WhitepaperSectionTitle>Vision</WhitepaperSectionTitle>
              <p>
                I'd like to make TradeStick much better! My vision is to evolve this project into a fully-featured 
                trading simulator that can be used for both entertainment and education. Eventually, I'd love to 
                integrate real cryptocurrency trading capabilities, allowing users to transition seamlessly from 
                simulation to actual trading.
              </p>
            </WhitepaperSection>
            
            <WhitepaperSection>
              <WhitepaperSectionTitle>Join the Development</WhitepaperSectionTitle>
              <p>
                TradeStick is an open-source project, and I'm looking for passionate developers, designers, and 
                trading enthusiasts to help make it even better. Whether you're interested in improving the UI, 
                enhancing the market simulation, or adding new features, your contributions are welcome!
              </p>
              <p>
                Visit the <a href="https://github.com/zfyl/tradestick" target="_blank" rel="noopener noreferrer">GitHub repository</a> to 
                get started, or reach out to me on <a href="https://twitter.com/zfyl" target="_blank" rel="noopener noreferrer">Twitter</a> 
                to discuss ideas and collaboration opportunities.
              </p>
            </WhitepaperSection>
            
            <WhitepaperSection>
              <WhitepaperSectionTitle>Future Roadmap</WhitepaperSectionTitle>
              <ul>
                <li>Enhanced market simulation with more realistic price movements</li>
                <li>Multiple asset support (various cryptocurrencies, stocks, forex)</li>
                <li>Advanced trading strategies and indicators</li>
                <li>Multiplayer trading competitions</li>
                <li>Integration with real cryptocurrency exchanges</li>
                <li>Mobile app version</li>
              </ul>
            </WhitepaperSection>
            
            <p>
              Help me turn this fun project into something amazing! Join me on this journey to create the best 
              gamified trading platform out there.
            </p>
          </ModalContent>
        </ModalOverlay>
      )}
    </FooterContainer>
  );
};

export default Footer;
