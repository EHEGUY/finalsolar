import React, { useRef, useEffect } from 'react';
import '../styles/StarBorder.css';

const StarBorder = ({ children, onClick }) => {
  const borderRef = useRef(null);

  useEffect(() => {
    const border = borderRef.current;
    if (!border) return;

    const handleMouseMove = (e) => {
      const rect = border.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      border.style.setProperty('--mouse-x', `${x}px`);
      border.style.setProperty('--mouse-y', `${y}px`);
    };

    border.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      border.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div 
      className="star-border-container"
      ref={borderRef}
      onClick={onClick}
    >
      <div className="star-border-glow" />
      <div className="star-border-content">
        {children}
      </div>
      <div className="star-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="star-particle" />
        ))}
      </div>
    </div>
  );
};

export default StarBorder;
