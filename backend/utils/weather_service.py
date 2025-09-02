import httpx
import os
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHER_API_KEY", "demo_key")
        self.base_url = "https://api.openweathermap.org/data/2.5"
    
    async def get_weather_data(self, latitude: float, longitude: float) -> Optional[Dict]:
        """
        Get weather data for location (simplified for demo)
        """
        try:
            # For demo purposes, return simulated weather data
            # In production, integrate with actual weather API
            
            # Simulate weather patterns based on latitude
            abs_lat = abs(latitude)
            
            if abs_lat < 30:  # Tropical/subtropical
                weather_data = {
                    "cloud_cover": 0.4,
                    "temperature": 28,
                    "high_humidity": True,
                    "high_wind": False
                }
            elif abs_lat < 50:  # Temperate
                weather_data = {
                    "cloud_cover": 0.5,
                    "temperature": 15,
                    "high_humidity": False,
                    "high_wind": False
                }
            else:  # High latitude
                weather_data = {
                    "cloud_cover": 0.6,
                    "temperature": 5,
                    "high_humidity": False,
                    "high_wind": True
                }
            
            return weather_data
            
        except Exception as e:
            logger.error(f"Error fetching weather data: {str(e)}")
            return None
    
    async def get_real_weather_data(self, latitude: float, longitude: float) -> Optional[Dict]:
        """
        Get real weather data from OpenWeatherMap API
        (Enable this when you have an API key)
        """
        if self.api_key == "demo_key":
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/weather",
                    params={
                        "lat": latitude,
                        "lon": longitude,
                        "appid": self.api_key,
                        "units": "metric"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "cloud_cover": data.get("clouds", {}).get("all", 0) / 100,
                        "temperature": data.get("main", {}).get("temp", 20),
                        "high_humidity": data.get("main", {}).get("humidity", 50) > 70,
                        "high_wind": data.get("wind", {}).get("speed", 0) > 10
                    }
                
        except Exception as e:
            logger.error(f"Error fetching real weather data: {str(e)}")
        
        return None
