// Complete API file for Solar Panel App
const API_BASE_URL = 'https://finalsolar.onrender.com';

export const solarAPI = {
  // Health check
  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Get solar analysis data
  getSolarData: async (locationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/solar-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Solar data fetch failed:', error);
      throw error;
    }
  },

  // Get weather data
  getWeather: async (lat, lon) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/${lat}/${lon}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Weather data fetch failed:', error);
      throw error;
    }
  },

  // Generic API call helper
  apiCall: async (endpoint, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (data) {
        config.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
};

// Export individual functions for easier importing
export const { checkHealth, getSolarData, getWeather, apiCall } = solarAPI;

// Default export
export default solarAPI;

