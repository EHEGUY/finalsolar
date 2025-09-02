from fastapi import APIRouter, HTTPException, Depends
from models.solar_models import LocationRequest, SolarAnalysisResponse, ErrorResponse
from utils.solar_calculations import SolarCalculator
from utils.weather_service import WeatherService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

solar_calculator = SolarCalculator()
weather_service = WeatherService()

@router.post("/solar-data", response_model=SolarAnalysisResponse)
async def get_solar_data(request: LocationRequest):
    """
    Get comprehensive solar analysis data for a given location
    """
    try:
        # Validate coordinates
        if not (-90 <= request.latitude <= 90):
            raise HTTPException(status_code=400, detail="Invalid latitude. Must be between -90 and 90.")
        if not (-180 <= request.longitude <= 180):
            raise HTTPException(status_code=400, detail="Invalid longitude. Must be between -180 and 180.")
        
        # Calculate solar data
        solar_data = await solar_calculator.calculate_optimal_positioning(
            request.latitude, 
            request.longitude
        )
        
        # Get weather data if requested
        weather_data = None
        if request.include_weather:
            try:
                weather_data = await weather_service.get_weather_data(
                    request.latitude, 
                    request.longitude
                )
            except Exception as e:
                logger.warning(f"Weather data unavailable: {str(e)}")
        
        # Combine and adjust data
        result = solar_calculator.combine_solar_weather_data(solar_data, weather_data)
        
        return SolarAnalysisResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing solar data request: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/solar-data/location/{lat}/{lng}")
async def get_solar_data_by_coords(lat: float, lng: float, include_weather: bool = False):
    """
    Get solar data using URL parameters
    """
    request = LocationRequest(
        latitude=lat, 
        longitude=lng, 
        include_weather=include_weather
    )
    return await get_solar_data(request)

@router.get("/test")
async def test_endpoint():
    """
    Test endpoint to verify API is working
    """
    return {
        "message": "Solar API is working!",
        "endpoints": {
            "solar_data": "/api/solar-data",
            "location_data": "/api/solar-data/location/{lat}/{lng}",
            "health": "/health"
        }
    }
