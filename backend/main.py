from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import math
import numpy as np
import requests
from datetime import datetime

app = FastAPI(title="Smart Solar Repositioning API", version="3.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SolarRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    include_weather: Optional[bool] = False

def _get_weather_description_and_icon(wmo_code: int, is_day: int):
    """Maps WMO weather code to a description and an icon code."""
    day_night = "d" if is_day == 1 else "n"
    
    if wmo_code == 0:
        return "Clear sky", f"01{day_night}"
    elif wmo_code in [1, 2, 3]:
        return "Partly cloudy", f"02{day_night}"
    elif wmo_code in [45, 48]:
        return "Fog", "50d"
    elif wmo_code in [51, 53, 55, 56, 57]:
        return "Drizzle", f"09{day_night}"
    elif wmo_code in [61, 63, 65, 66, 67]:
        return "Rain", f"10{day_night}"
    elif wmo_code in [71, 73, 75, 77]:
        return "Snow", f"13{day_night}"
    elif wmo_code in [80, 81, 82, 85, 86]:
        return "Rain showers", f"09{day_night}"
    elif wmo_code in [95, 96, 99]:
        return "Thunderstorm", f"11{day_night}"
    else:
        return "Unknown", f"01{day_night}"

async def get_weather_data(lat: float, lng: float):
    """Fetch weather data from the Open-Meteo API."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
        "hourly": "temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weather_code,pressure_msl,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,evapotranspiration,et0_fao_evapotranspiration,vapour_pressure_deficit,wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,wind_gusts_10m,temperature_80m,temperature_120m,temperature_180m",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration",
        "temperature_unit": "celsius",
        "wind_speed_unit": "kmh",
        "precipitation_unit": "mm",
        "timezone": "auto"
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        current = data.get("current", {})
        if not current:
            return None
        wmo_code = current.get("weather_code", 0)
        is_day = current.get("is_day", 1)
        description, icon = _get_weather_description_and_icon(wmo_code, is_day)
        return {
            "temperature": round(current.get("temperature_2m"), 1),
            "humidity": round(current.get("relative_humidity_2m")),
            "cloud_cover": round(current.get("cloud_cover")),
            "weather_description": description,
            "wind_speed": round(current.get("wind_speed_10m"), 1),
            "visibility": 10.0,
            "weather_icon": icon,
            "raw_data": data
        }
    except requests.exceptions.RequestException as e:
        print(f"Open-Meteo API error: {e}")
        return None

def _calculate_realistic_annual_poa(latitude: float, longitude: float, tilt: float) -> float:
    lat_abs = abs(latitude)
    if lat_abs < 10:
        base_poa = 1900.0
    elif lat_abs < 20:
        base_poa = 1750.0
    elif lat_abs < 30:
        base_poa = 1800.0
    elif lat_abs < 45:
        base_poa = 1500.0
    elif lat_abs < 60:
        base_poa = 1200.0
    else:
        base_poa = 800.0
    if 8 <= lat_abs <= 37 and 68 <= longitude <= 97:
        if longitude < 77 or longitude > 92:
            base_poa *= 0.85
        else:
            base_poa *= 0.90
    optimal_tilt = min(lat_abs, 35.0)
    tilt_diff = abs(tilt - optimal_tilt)
    tilt_penalty = max(0.75, 1.0 - 0.01 * tilt_diff)
    return base_poa * tilt_penalty

def _calculate_monthly_distribution(latitude: float, longitude: float, annual_total: float) -> List[float]:
    lat_abs = abs(latitude)
    is_monsoon_region = (8 <= lat_abs <= 37 and 68 <= longitude <= 97)
    if is_monsoon_region:
        monthly_factors = [0.90, 0.85, 1.05, 1.10, 1.05, 0.60, 0.50, 0.55, 0.70, 0.95, 0.90, 0.90]
    else:
        if lat_abs < 23.5:
            monthly_factors = [0.84, 0.86, 0.89, 0.88, 0.85, 0.78, 0.80, 0.83, 0.85, 0.87, 0.87, 0.85]
        elif lat_abs < 45:
            monthly_factors = [0.63, 0.71, 0.84, 0.95, 1.06, 1.08, 1.09, 1.03, 0.88, 0.76, 0.62, 0.55]
        else:
            monthly_factors = [0.35, 0.55, 0.82, 1.08, 1.28, 1.35, 1.33, 1.15, 0.88, 0.65, 0.40, 0.26]
    if latitude < 0:
        monthly_factors = monthly_factors[6:] + monthly_factors[:6]
    total_factor = sum(monthly_factors)
    monthly_fractions = [f / total_factor for f in monthly_factors]
    monthly_values = [annual_total * frac for frac in monthly_fractions]
    actual_sum = sum(monthly_values)
    if actual_sum > 0:
        scale = annual_total / actual_sum
        monthly_values = [v * scale for v in monthly_values]
    return monthly_values

def _get_direction_name(azimuth: float) -> str:
    az = azimuth % 360
    if az < 22.5 or az >= 337.5:
        return "North"
    elif az < 67.5:
        return "North-East"
    elif az < 112.5:
        return "East"
    elif az < 157.5:
        return "South-East"
    elif az < 202.5:
        return "South"
    elif az < 247.5:
        return "South-West"
    elif az < 292.5:
        return "West"
    elif az < 337.5:
        return "North-West"
    return "North"

@app.get("/")
async def root():
    return {"message": "Smart Solar Repositioning API is running!", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational"}

@app.post("/api/solar-data")
async def get_solar_data(request: SolarRequest):
    try:
        lat = request.latitude
        lng = request.longitude
        optimal_tilt = min(abs(lat), 35.0)
        if optimal_tilt <= 25:
            optimal_tilt += 2
        elif optimal_tilt > 50:
            optimal_tilt -= 3
        optimal_azimuth = 180.0 if lat >= 0 else 0.0
        annual_poa = _calculate_realistic_annual_poa(lat, lng, optimal_tilt)
        efficiency_gain = min(25, 5 + abs(lat) * 0.3)
        weather_data = None
        weather_adjusted_efficiency = efficiency_gain
        weather_adjusted_poa = annual_poa
        if request.include_weather:
            weather_data = await get_weather_data(lat, lng)
            if weather_data:
                cloud_penalty = (weather_data["cloud_cover"] / 100) * 0.3
                humidity_penalty = max(0, (weather_data["humidity"] - 60) / 100) * 0.1
                weather_adjusted_efficiency = efficiency_gain * (1 - cloud_penalty - humidity_penalty)
                weather_adjusted_poa = annual_poa * (1 - cloud_penalty * 0.5)

        # ✅ Abbreviated months for chart
        months_abbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        # ✅ Full month names for peak/low and summary
        months_full = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"]

        monthly_values = _calculate_monthly_distribution(lat, lng, weather_adjusted_poa)
        monthly_data = [{"month": months_abbr[i], "value": round(monthly_values[i], 1)} for i in range(12)]

        max_idx = int(np.argmax(monthly_values))
        min_idx = int(np.argmin(monthly_values))
        direction = _get_direction_name(optimal_azimuth)

        summary_text = (
            f"The solar array is optimally positioned at a {optimal_tilt:.1f}° tilt angle, "
            f"facing {direction.lower()} (azimuth {int(round(optimal_azimuth))}°). "
            f"This configuration maximizes solar energy capture, delivering an estimated {int(round(weather_adjusted_poa))} "
            f"kilowatt-hours per square meter annually. "
            f"Peak production occurs in {months_full[max_idx]} ({monthly_values[max_idx]:.0f} kWh/m²), "
            f"while {months_full[min_idx]} shows the lowest output ({monthly_values[min_idx]:.0f} kWh/m²)."
        )

        tips = []
        abs_lat = abs(lat)
        if abs_lat < 23.5:
            tips.append("Your tropical location receives consistent solar irradiance year-round")
            tips.append("Consider tracking systems for maximum efficiency due to high sun angles")
        elif abs_lat < 40:
            tips.append("Seasonal adjustment of tilt angle can increase annual energy yield by 3-5%")
            tips.append("Consider east-west orientation to reduce afternoon overheating")
        else:
            tips.append("Winter conditions may impact performance - ensure easy cleaning access")
            tips.append("Consider higher mounting to maximize winter sun exposure")

        tips.extend([
            "Regular cleaning improves efficiency by 2-5%",
            "Avoid shading between 10 AM - 2 PM for optimal performance",
            f"Optimal tilt angle of {optimal_tilt:.1f}° is ideal for your latitude"
        ])
        if weather_data:
            if weather_data["cloud_cover"] > 70:
                tips.insert(0, f"High cloud cover ({weather_data['cloud_cover']}%) may reduce current efficiency")
            if weather_data["humidity"] > 80:
                tips.append("High humidity - ensure proper ventilation around panels")

        return {
            "latitude": lat,
            "longitude": lng,
            "optimal_tilt": round(optimal_tilt, 1),
            "optimal_azimuth": round(optimal_azimuth, 1),
            "annual_irradiance": round(weather_adjusted_poa, 1),
            "efficiency_gain": round(weather_adjusted_efficiency, 1),
            "monthly_data": monthly_data,  # ✅ Chart stays abbreviated
            "peak_month": months_full[max_idx],  # ✅ Full month name
            "low_month": months_full[min_idx],   # ✅ Full month name
            "tips": tips[:6],
            "summary_text": summary_text,
            "orientation_text": f"Face panels toward {direction} ({int(round(optimal_azimuth))}°) at {optimal_tilt:.1f}° tilt",
            "weather_adjusted": request.include_weather,
            "weather_data": weather_data
        }

    except Exception as e:
        print(f"❌ Error in get_solar_data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Solar analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🌞 Starting Enhanced Solar API server on http://localhost:8000")
    print("✅ Health check: http://localhost:8000/health")
    print("📡 Solar endpoint: http://localhost:8000/api/solar-data")
    print("🌤️ Weather integration now uses Open-Meteo API")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
