import React, { useState, useEffect } from 'react';
import SolarMap from './SolarMap';
import ThemeToggle from './ThemeToggle';
import { MapPin, Sun, Compass, TrendingUp, Cloud, Info, Thermometer } from 'lucide-react';
import { solarAPI } from '../api'; // Import your API file
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/MainPage.css';

const MainPage = () => {
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [solarData, setSolarData] = useState(null);
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format numbers for display
  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toFixed(1);
    }
    return num || '-';
  };

  // Sync manual inputs with coordinates when map is clicked
  useEffect(() => {
    if (coordinates.lat && coordinates.lng) {
      setManualCoords({
        lat: coordinates.lat.toFixed(6),
        lng: coordinates.lng.toFixed(6)
      });
    }
  }, [coordinates]);

  const handleLocationSelect = (lat, lng) => {
    // Add validation before setting coordinates and making API call
    if (lat !== null && lng !== null && 
        typeof lat === 'number' && typeof lng === 'number' &&
        !isNaN(lat) && !isNaN(lng) &&
        lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setCoordinates({ lat, lng });
      fetchSolarData(lat, lng);
    } else {
      // Clear coordinates and data when invalid location is selected
      setCoordinates({ lat: null, lng: null });
      setSolarData(null);
      setError(null);
      console.log('Invalid coordinates received:', lat, lng);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCoords.lat && manualCoords.lng) {
      const lat = parseFloat(manualCoords.lat);
      const lng = parseFloat(manualCoords.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        handleLocationSelect(lat, lng);
      } else {
        setError('Please enter valid coordinates (Lat: -90 to 90, Lng: -180 to 180)');
      }
    } else {
      setError('Please enter both latitude and longitude');
    }
  };

  const handleGetMyLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationSelect(latitude, longitude);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please check your browser settings.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const fetchSolarData = async (lat, lng) => {
    // Validate coordinates before making API call
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number' ||
        isNaN(lat) || isNaN(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Please select a valid location on the map or enter valid coordinates.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Making API call with coords: ${lat}, ${lng}, weather: ${weatherEnabled}`);
      
      // Use your new API file instead of axios
      const locationData = {
        latitude: lat,
        longitude: lng,
        include_weather: weatherEnabled
      };

      const response = await solarAPI.getSolarData(locationData);
      
      console.log('API response received:', response);
      setSolarData(response);
      setError(null); // Clear any previous errors
      
    } catch (error) {
      console.error('Full API Error:', error);
      
      let errorMessage = 'An unexpected error occurred while analyzing solar data.';
      
      // Handle different error types
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.message.includes('HTTP error')) {
        errorMessage = `Server error: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-page">
      <ThemeToggle />
      
      <div className="main-content">
        <motion.header 
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Solar Positioning Analysis</h1>
          <p>Optimize your solar panels with precise positioning data and real-time weather information</p>
        </motion.header>

        <motion.div 
          className="control-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="input-section">
            <form onSubmit={handleManualSubmit} className="manual-coords">
              <div className="coord-inputs">
                <motion.input
                  type="number"
                  placeholder="Latitude"
                  value={manualCoords.lat}
                  onChange={(e) => setManualCoords({...manualCoords, lat: e.target.value})}
                  step="any"
                  min="-90"
                  max="90"
                  whileFocus={{ scale: 1.02 }}
                />
                <motion.input
                  type="number"
                  placeholder="Longitude"
                  value={manualCoords.lng}
                  onChange={(e) => setManualCoords({...manualCoords, lng: e.target.value})}
                  step="any"
                  min="-180"
                  max="180"
                  whileFocus={{ scale: 1.02 }}
                />
                <motion.button 
                  type="submit" 
                  className="analyze-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                >
                  <Compass size={16} />
                  {loading ? 'Analyzing...' : 'Analyze'}
                </motion.button>
              </div>
            </form>
            
            <div className="location-controls">
              <motion.button 
                onClick={handleGetMyLocation}
                className="location-btn"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MapPin size={16} />
                Get My Location
              </motion.button>
              
              <motion.label 
                className="weather-toggle"
                whileHover={{ scale: 1.05 }}
              >
                <input
                  type="checkbox"
                  checked={weatherEnabled}
                  onChange={(e) => setWeatherEnabled(e.target.checked)}
                />
                <Cloud size={16} />
                Include Weather Data
              </motion.label>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="content-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="map-section">
            <SolarMap 
              onLocationSelect={handleLocationSelect}
              coordinates={coordinates}
            />
          </div>

          <AnimatePresence>
            {solarData && (
              <motion.div 
                className="results-section"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="results-grid">
                  {/* Optimal Settings Card */}
                  <motion.div 
                    className="result-card primary"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <div className="card-header">
                      <Sun className="card-icon" />
                      <h3>Optimal Settings</h3>
                    </div>
                    <div className="card-content">
                      <div className="metric">
                        <span className="metric-label">Tilt Angle</span>
                        <span className="metric-value">{formatNumber(solarData.optimal_tilt)}°</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Azimuth</span>
                        <span className="metric-value">{formatNumber(solarData.optimal_azimuth)}°</span>
                      </div>
                      {solarData.orientation_text && (
                        <div className="orientation-text">
                          <Info size={14} />
                          <span>{solarData.orientation_text}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Weather Data Card */}
                  {solarData.weather_data && (
                    <motion.div 
                      className="result-card weather-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                    >
                      <div className="card-header">
                        <Thermometer className="card-icon" />
                        <h3>Current Weather</h3>
                      </div>
                      <div className="card-content">
                        <div className="weather-grid">
                          <div className="weather-item">
                            <span className="weather-label">Temperature</span>
                            <span className="weather-value">{solarData.weather_data.temperature}°C</span>
                          </div>
                          <div className="weather-item">
                            <span className="weather-label">Humidity</span>
                            <span className="weather-value">{solarData.weather_data.humidity}%</span>
                          </div>
                          <div className="weather-item">
                            <span className="weather-label">Cloud Cover</span>
                            <span className="weather-value">{solarData.weather_data.cloud_cover}%</span>
                          </div>
                          <div className="weather-item">
                            <span className="weather-label">Wind Speed</span>
                            <span className="weather-value">{solarData.weather_data.wind_speed} km/h</span>
                          </div>
                        </div>
                        <div className="weather-description">
                          <img 
                            src={`https://openweathermap.org/img/wn/${solarData.weather_data.weather_icon}@2x.png`}
                            alt={solarData.weather_data.weather_description}
                            className="weather-icon"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <span>{solarData.weather_data.weather_description}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Annual Performance Chart */}
                  <motion.div 
                    className="result-card performance-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <div className="card-header">
                      <TrendingUp className="card-icon" />
                      <h3>Annual Performance</h3>
                    </div>
                    <div className="card-content">
                      <div className="performance-chart">
                        {solarData.monthly_data && solarData.monthly_data.length === 12 ? (
                          (() => {
                            const maxValue = Math.max(...solarData.monthly_data.map(m => m.value || 0));
                            console.log('Chart rendering - Max value:', maxValue);
                            
                            return solarData.monthly_data.map((month, index) => {
                              const height = maxValue > 0 ? (month.value / maxValue) * 100 : 0;
                              const isSmallBar = height < 35;
                              
                              return (
                                <motion.div 
                                  key={index} 
                                  className="month-bar"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                  <motion.div 
                                    className="bar-fill"
                                    initial={{ height: '0%' }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ 
                                      duration: 0.8, 
                                      delay: 0.3 + index * 0.05,
                                      ease: "easeOut"
                                    }}
                                    title={`${month.month}: ${formatNumber(month.value)} kWh/m²`}
                                    style={{ 
                                      backgroundColor: '#3b82f6',
                                      minHeight: '20px',
                                      position: 'relative',
                                      display: 'flex',
                                      alignItems: isSmallBar ? 'flex-start' : 'center',
                                      justifyContent: 'center',
                                      overflow: 'visible'
                                    }}
                                  >
                                    {/* Value text inside/outside bar */}
                                    <motion.span
                                      className="bar-value"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.4, delay: 0.8 + index * 0.05 }}
                                      style={{
                                        color: isSmallBar ? 'var(--text-primary)' : 'white',
                                        fontWeight: '600',
                                        fontSize: '0.65rem',
                                        textShadow: isSmallBar ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                                        transform: isSmallBar ? 'translateY(-18px)' : 'none',
                                        position: isSmallBar ? 'absolute' : 'static',
                                        top: isSmallBar ? '-2px' : 'auto',
                                        whiteSpace: 'nowrap',
                                        zIndex: 10
                                      }}
                                    >
                                      {formatNumber(month.value)}
                                    </motion.span>
                                  </motion.div>
                                  <span className="month-label">{month.month}</span>
                                </motion.div>
                              );
                            });
                          })()
                        ) : (
                          <div className="no-data">
                            <p>Loading monthly data...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Enhanced Summary & Tips */}
                  <motion.div 
                    className="result-card summary"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <div className="card-header">
                      <h3>Summary & Tips</h3>
                    </div>
                    <div className="card-content">
                      <div className="summary-stats">
                        <motion.div 
                          className="stat"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          <span className="stat-value">{formatNumber(solarData.annual_irradiance)}</span>
                          <span className="stat-label">kWh/m²/year</span>
                        </motion.div>
                        <motion.div 
                          className="stat"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.6 }}
                        >
                          <span className="stat-value">{formatNumber(solarData.efficiency_gain)}%</span>
                          <span className="stat-label">Efficiency Gain</span>
                        </motion.div>
                      </div>

                      {/* Full Summary Text */}
                      {solarData.summary_text && (
                        <motion.div 
                          className="summary-description"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                        >
                          <p>{solarData.summary_text}</p>
                        </motion.div>
                      )}
                      
                      {/* Optimization Tips */}
                      <div className="tips">
                        <h4>Optimization Tips:</h4>
                        <div className="tips-container">
                          {solarData.tips && solarData.tips.length > 0 ? (
                            <ul className="tips-list">
                              {solarData.tips.map((tip, index) => (
                                <motion.li 
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                                >
                                  {tip}
                                </motion.li>
                              ))}
                            </ul>
                          ) : (
                            <p className="no-tips">No optimization tips available</p>
                          )}
                        </div>
                      </div>

                      {/* Peak/Low months info */}
                      {solarData.peak_month && solarData.low_month && (
                        <motion.div 
                          className="seasonal-info"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 1.0 }}
                        >
                          <p><strong>Peak Month:</strong> {solarData.peak_month}</p>
                          <p><strong>Lowest Month:</strong> {solarData.low_month}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="loading-spinner"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Sun className="spinning-sun" size={32} />
              <p>Analyzing solar data{weatherEnabled ? ' with weather conditions' : ''}...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainPage;
