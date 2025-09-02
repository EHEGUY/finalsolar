import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import math

class SolarCalculator:
    def __init__(self):
        self.months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ]
    
    async def calculate_optimal_positioning(self, latitude: float, longitude: float) -> Dict:
        """
        Calculate optimal solar panel positioning for a given location
        """
        # Calculate optimal tilt angle (typically close to latitude)
        optimal_tilt = self._calculate_optimal_tilt(latitude)
        
        # Calculate optimal azimuth (typically south = 180°)
        optimal_azimuth = self._calculate_optimal_azimuth(latitude)
        
        # Calculate annual irradiance
        annual_irradiance = self._calculate_annual_irradiance(latitude, longitude)
        
        # Calculate monthly data
        monthly_data = self._calculate_monthly_irradiance(latitude, longitude, optimal_tilt)
        
        # Calculate efficiency gain
        efficiency_gain = self._calculate_efficiency_gain(latitude, optimal_tilt)
        
        # Generate tips
        tips = self._generate_optimization_tips(latitude, optimal_tilt, optimal_azimuth)
        
        return {
            "latitude": latitude,
            "longitude": longitude,
            "optimal_tilt": round(optimal_tilt, 1),
            "optimal_azimuth": round(optimal_azimuth, 1),
            "annual_irradiance": round(annual_irradiance, 1),
            "efficiency_gain": round(efficiency_gain, 1),
            "monthly_data": monthly_data,
            "tips": tips,
            "weather_adjusted": False
        }
    
    def _calculate_optimal_tilt(self, latitude: float) -> float:
        """
        Calculate optimal tilt angle based on latitude
        """
        # For fixed installations, optimal tilt is approximately latitude
        # With slight adjustments for seasonal optimization
        abs_lat = abs(latitude)
        
        if abs_lat <= 25:
            # Low latitudes: slight tilt for better cleaning and performance
            return abs_lat + 5
        elif abs_lat <= 50:
            # Mid latitudes: close to latitude
            return abs_lat
        else:
            # High latitudes: slightly less than latitude for winter optimization
            return abs_lat - 5
    
    def _calculate_optimal_azimuth(self, latitude: float) -> float:
        """
        Calculate optimal azimuth angle
        """
        # For most locations, south-facing (180°) is optimal
        # Northern hemisphere: 180° (south)
        # Southern hemisphere: 0° (north)
        if latitude >= 0:
            return 180.0  # South
        else:
            return 0.0    # North
    
    def _calculate_annual_irradiance(self, latitude: float, longitude: float) -> float:
        """
        Estimate annual solar irradiance based on location
        """
        # Simplified model based on latitude and climate zones
        abs_lat = abs(latitude)
        
        # Base irradiance decreases with latitude
        base_irradiance = 2000 - (abs_lat * 15)
        
        # Adjust for climate zones (simplified)
        if 23.5 <= abs_lat <= 35:  # Subtropical zones
            climate_factor = 1.1
        elif abs_lat <= 23.5:     # Tropical zones
            climate_factor = 1.2
        elif 35 < abs_lat <= 60:  # Temperate zones
            climate_factor = 0.9
        else:                     # Polar zones
            climate_factor = 0.7
        
        return max(800, base_irradiance * climate_factor)
    
    def _calculate_monthly_irradiance(self, latitude: float, longitude: float, tilt: float) -> List[Dict]:
        """
        Calculate monthly solar irradiance values
        """
        annual_irradiance = self._calculate_annual_irradiance(latitude, longitude)
        monthly_data = []
        
        # Seasonal variation factors (simplified)
        if latitude >= 0:  # Northern hemisphere
            seasonal_factors = [0.6, 0.7, 0.85, 1.0, 1.15, 1.2, 1.2, 1.1, 0.95, 0.8, 0.65, 0.55]
        else:  # Southern hemisphere (seasons reversed)
            seasonal_factors = [1.2, 1.15, 1.0, 0.85, 0.7, 0.6, 0.55, 0.65, 0.8, 0.95, 1.1, 1.2]
        
        for i, month in enumerate(self.months):
            monthly_value = (annual_irradiance / 12) * seasonal_factors[i]
            monthly_data.append({
                "month": month,
                "value": round(monthly_value, 1),
                "irradiance": round(monthly_value, 1)
            })
        
        return monthly_data
    
    def _calculate_efficiency_gain(self, latitude: float, optimal_tilt: float) -> float:
        """
        Calculate efficiency gain from optimal positioning vs. flat installation
        """
        # Efficiency gain depends on latitude and tilt optimization
        abs_lat = abs(latitude)
        
        # Base efficiency gain increases with latitude
        if abs_lat <= 15:
            base_gain = 8
        elif abs_lat <= 30:
            base_gain = 12
        elif abs_lat <= 45:
            base_gain = 18
        else:
            base_gain = 25
        
        # Additional gain from optimal tilt
        tilt_factor = min(1.0, optimal_tilt / 45)
        tilt_gain = base_gain * tilt_factor
        
        return min(35, base_gain + tilt_gain * 0.3)
    
    def _generate_optimization_tips(self, latitude: float, tilt: float, azimuth: float) -> List[str]:
        """
        Generate location-specific optimization tips
        """
        tips = []
        abs_lat = abs(latitude)
        
        # Tilt-related tips
        if tilt > 30:
            tips.append(f"Steep tilt angle ({tilt}°) is optimal for your latitude - helps with snow shedding and seasonal sun angles")
        elif tilt < 15:
            tips.append(f"Low tilt angle ({tilt}°) reduces wind loads and is easier to install")
        
        # Latitude-specific tips
        if abs_lat < 23.5:
            tips.append("Your tropical location receives consistent solar irradiance year-round")
            tips.append("Consider tracking systems for maximum efficiency due to high sun angles")
        elif abs_lat < 40:
            tips.append("Seasonal adjustment of tilt angle can increase annual energy yield by 3-5%")
            tips.append("Consider east-west orientation to reduce afternoon overheating")
        else:
            tips.append("Winter snow can significantly impact performance - ensure easy cleaning access")
            tips.append("Consider higher mounting to maximize winter sun exposure")
        
        # General tips
        tips.append("Regular cleaning improves efficiency by 2-5%")
        tips.append("Avoid shading between 10 AM - 2 PM for optimal performance")
        
        if len(tips) > 5:
            tips = tips[:5]  # Limit to 5 tips
        
        return tips
    
    def combine_solar_weather_data(self, solar_data: Dict, weather_data: Optional[Dict]) -> Dict:
        """
        Combine solar calculations with weather data adjustments
        """
        if weather_data is None:
            return solar_data
        
        # Adjust irradiance based on weather patterns
        if "cloud_cover" in weather_data:
            cloud_factor = 1.0 - (weather_data["cloud_cover"] * 0.3)
            solar_data["annual_irradiance"] *= cloud_factor
            
            # Adjust monthly data
            for month_data in solar_data["monthly_data"]:
                month_data["value"] *= cloud_factor
                month_data["irradiance"] *= cloud_factor
                if "temperature" in weather_data:
                    month_data["temperature"] = weather_data["temperature"]
        
        solar_data["weather_adjusted"] = True
        
        # Add weather-based tips
        if weather_data.get("high_wind", False):
            solar_data["tips"].append("High wind area detected - ensure robust mounting systems")
        
        if weather_data.get("high_humidity", False):
            solar_data["tips"].append("High humidity area - use corrosion-resistant components")
        
        return solar_data
