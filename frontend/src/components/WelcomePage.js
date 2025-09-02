import React from 'react';
import { useNavigate } from 'react-router-dom';
import LightRays from './LightRays';  // Fixed import
import SplashCursor from './SplashCursor';
import CardNav from './CardNav';
import StarBorder from './StarBorder';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleGetStarted = () => {
    navigate('/main');
  };

  return (
    <div className="welcome-page">
      <div className="light-rays-wrapper">
        <LightRays
          raysOrigin="top-center"
          raysColor={theme === 'dark' ? '#00ffff' : '#3b82f6'}
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="welcome-rays"
        />
      </div>
      
      <SplashCursor />
      <ThemeToggle />
      
      <CardNav onGetStarted={handleGetStarted} />
      
      <div className="welcome-content">
        <div className="hero-section">
          <h1 className="hero-title">
            Smart Solar Repositioning
          </h1>
          <p className="hero-subtitle">
            Optimize your solar panel positioning with intelligent analytics and real-time data
          </p>
        </div>

        <div className="cta-section">
          <StarBorder onClick={handleGetStarted}>
            <button className="get-started-btn">
              Get Started
            </button>
          </StarBorder>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
