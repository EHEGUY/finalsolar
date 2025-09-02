import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/CardNav.css';

const CardNav = ({ onGetStarted }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const items = [
    {
      label: "Solutions",
      bgColor: theme === 'dark' ? "#1e293b" : "#f1f5f9",
      textColor: theme === 'dark' ? "#f1f5f9" : "#1e293b",
      links: [
        { label: "Solar Analysis" },
        { label: "Positioning" },
        { label: "Weather Data" }
      ]
    },
    {
      label: "Features", 
      bgColor: theme === 'dark' ? "#2563eb" : "#3b82f6",
      textColor: "#ffffff",
      links: [
        { label: "Real-time Data" },
        { label: "Smart Analytics" },
        { label: "Performance" }
      ]
    },
    {
      label: "Resources",
      bgColor: theme === 'dark' ? "#7c3aed" : "#8b5cf6", 
      textColor: "#ffffff",
      links: [
        { label: "Documentation" },
        { label: "API Reference" },
        { label: "Support" }
      ]
    }
  ];

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Initialize GSAP timeline
    gsap.set(nav, { height: 60 });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(nav, { height: 260, duration: 0.4, ease: "power3.out" })
      .to(cardsRef.current, { 
        y: 0, 
        opacity: 1, 
        duration: 0.3, 
        stagger: 0.1,
        ease: "power3.out"
      }, "-=0.2");

    tlRef.current = tl;

    return () => tl.kill();
  }, [theme]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;

    if (!isOpen) {
      setIsOpen(true);
      tl.play();
    } else {
      setIsOpen(false);
      tl.reverse();
    }
  };

  const setCardRef = (index) => (el) => {
    if (el) cardsRef.current[index] = el;
  };

  return (
    <div className="card-nav-container">
      <nav ref={navRef} className={`card-nav ${isOpen ? 'open' : ''}`}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isOpen ? 'open' : ''}`}
            onClick={toggleMenu}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>
          
          <div className="logo-container">
            <span>☀️ Solar Positioning</span>
          </div>
          
          <button
            className="card-nav-cta-button"
            onClick={() => {
              if (onGetStarted) onGetStarted();
              if (isOpen) toggleMenu();
            }}
          >
            Get Started
          </button>
        </div>
        
        <div className="card-nav-content">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links.map((link, i) => (
                  <a key={i} className="nav-card-link" href="#">
                    <GoArrowUpRight className="nav-card-link-icon" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
