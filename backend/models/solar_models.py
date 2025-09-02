from pydantic import BaseModel
from typing import List, Optional

class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    include_weather: Optional[bool] = False

class MonthlyData(BaseModel):
    month: str
    value: float
    irradiance: float
    temperature: Optional[float] = None

class SolarAnalysisResponse(BaseModel):
    latitude: float
    longitude: float
    optimal_tilt: float
    optimal_azimuth: float
    annual_irradiance: float
    efficiency_gain: float
    monthly_data: List[MonthlyData]
    tips: List[str]
    weather_adjusted: bool = False

class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[str] = None
