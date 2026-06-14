"""
RiderCircle Intelligence Engine
Python FastAPI service for AI-powered rider intelligence
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import numpy as np
import pandas as pd
import os
import httpx

# Load environment
from dotenv import load_dotenv
load_dotenv()

# FastAPI App
app = FastAPI(
    title="RiderCircle Intelligence Engine",
    description="AI-powered rider intelligence services",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Pydantic Models
# ============================================

class BikeHealthRequest(BaseModel):
    bike_id: str
    odometer: float
    tire_health_front: float = 100
    tire_health_rear: float = 100
    chain_condition: float = 100
    brake_health_front: float = 100
    brake_health_rear: float = 100
    oil_condition: float = 100
    battery_health: float = 100
    insurance_expiry: Optional[datetime] = None
    puc_expiry: Optional[datetime] = None

class BikeHealthResponse(BaseModel):
    overall_health: float
    status: str # excellent, good, fair, poor
    recommendations: List[str]
    predictions: Dict[str, Any]

class RideMemoryRequest(BaseModel):
    ride_id: str
    rider_id: str
    title: str
    distance: float
    duration: int # minutes
    start_location: str
    end_location: Optional[str] = None
    waypoints: List[Dict[str, Any]] = []
    companions: List[str] = []
    expenses: Dict[str, float] = {}
    weather: Optional[str] = None
    photos: List[str] = []

class RideMemoryResponse(BaseModel):
    title: str
    story: str
    highlights: List[str]
    hashtags: List[str]
    cover_image: Optional[str] = None

class RouteRecommendationRequest(BaseModel):
    rider_id: str
    current_location: Dict[str, float]  # lat, lng
    destination: Optional[str] = None
    distance_preference: str = "medium"  # short, medium, long
    difficulty_preference: str = "moderate"  # easy, moderate, hard
    riding_style: str = "tourer"

class RouteRecommendationResponse(BaseModel):
    routes: List[Dict[str, Any]]
    reasoning: str

class TrustScoreRequest(BaseModel):
    rider_id: str
    total_rides: int = 0
    total_distance: float = 0
    verified_rides: int = 0
    followers_count: int = 0
    group_memberships: int = 0
    badges_count: int = 0
    ride_history_quality: float = 0.5  # 0-1

class TrustScoreResponse(BaseModel):
    trust_score: int
    level: str  # new, verified, trusted
    factors: Dict[str, float]
    recommendations: List[str]

class PredictionRequest(BaseModel):
    bike_id: str
    current_odometer: float
    tire_health: float
    chain_condition: float
    avg_monthly_km: float = 1000

class PredictionResponse(BaseModel):
    predictions: Dict[str, Any]
    confidence: float

# ============================================
# Health Check
# ============================================

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "rider-circle-intelligence",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

# ============================================
# Bike Health Engine
# ============================================

@app.post("/api/bike/health", response_model=BikeHealthResponse)
async def calculate_bike_health(request: BikeHealthRequest):
    """Calculate overall bike health score and generate recommendations"""

    # Weighted health calculation
    weights = {
        'tires': 0.20,
        'chain': 0.10,
        'brakes': 0.15,
        'oil': 0.10,
        'battery': 0.10,
        'documents': 0.35
    }

    tire_avg = (request.tire_health_front + request.tire_health_rear) / 2
    brake_avg = (request.brake_health_front + request.brake_health_rear) / 2

    # Document expiry penalty
    document_score = 100
    now = datetime.now()

    if request.insurance_expiry:
        days_until = (request.insurance_expiry - now).days
        if days_until < 0:
            document_score -= 30
        elif days_until < 30:
            document_score -= 15

    if request.puc_expiry:
        days_until = (request.puc_expiry - now).days
        if days_until < 0:
            document_score -= 20
        elif days_until < 30:
            document_score -= 10

    # Calculate overall health
    overall_health = round(
        (tire_avg * weights['tires']) +
        (request.chain_condition * weights['chain']) +
        (brake_avg * weights['brakes']) +
        (request.oil_condition * weights['oil']) +
        (request.battery_health * weights['battery']) +
        (document_score * weights['documents']),
1
    )

    # Determine status
    if overall_health >= 90:
        status = "excellent"
    elif overall_health >= 70:
        status = "good"
    elif overall_health >= 50:
        status = "fair"
    else:
        status = "poor"

    # Generate recommendations
    recommendations = []

    if request.tire_health_front < 50:
        recommendations.append("Front tire needs replacement soon")
    if request.tire_health_rear < 50:
        recommendations.append("Rear tire needs replacement soon")
    if request.chain_condition < 60:
        recommendations.append("Chain maintenance overdue - consider lubrication or replacement")
    if request.brake_health_front < 50:
        recommendations.append("Front brake pads need attention")
    if request.brake_health_rear < 50:
        recommendations.append("Rear brake pads need attention")
    if request.oil_condition < 70:
        recommendations.append("Oil change recommended")
    if request.battery_health < 60:
        recommendations.append("Battery health declining - consider replacement")

    if request.insurance_expiry:
        days_until = (request.insurance_expiry - now).days
        if days_until < 30:
            recommendations.append(f"Insurance renewal due in {days_until} days")

    if request.puc_expiry:
        days_until = (request.puc_expiry - now).days
        if days_until < 30:
            recommendations.append(f"PUC renewal due in {days_until} days")

    # Generate predictions
    predictions = {}

    # Tire replacement (average 20,000 km life)
    if tire_avg < 70:
        remaining_km = (tire_avg / 100) * 20000
        days_until = (remaining_km / request.avg_monthly_km if request.avg_monthly_km > 0 else 1000) * 30
        predictions['tire_replacement_due'] = {
            'estimated_km': remaining_km,
            'estimated_date': (now + pd.Timedelta(days=days_until)).isoformat()
        }

    # Next service (every 5,000 km)
    next_service_km = ((request.current_odometer // 5000) + 1) * 5000
    remaining_service = next_service_km - request.current_odometer
    days_service = (remaining_service / request.avg_monthly_km * 30) if request.avg_monthly_km > 0 else 90
    predictions['next_service'] = {
        'at_km': next_service_km,
        'estimated_date': (now + pd.Timedelta(days=days_service)).isoformat()
    }

    # Insurance renewal
    if request.insurance_expiry:
        predictions['insurance_renewal'] = request.insurance_expiry.isoformat()

    # PUC expiry
    if request.puc_expiry:
        predictions['puc_expiry'] = request.puc_expiry.isoformat()

    return BikeHealthResponse(
        overall_health=overall_health,
        status=status,
        recommendations=recommendations,
        predictions=predictions
    )

# ============================================
# Ride Memory Generator
# ============================================

@app.post("/api/memory/generate", response_model=RideMemoryResponse)
async def generate_ride_memory(request: RideMemoryRequest):
    """Generate AI-powered ride memory with story and highlights"""

    # Generate title based on ride characteristics
    title = request.title

    if not title:
        if request.distance > 200:
            title = f"Epic {int(request.distance)}km Adventure"
        elif request.distance > 100:
            title = f"Great {int(request.distance)}km Ride"
        else:
            title = f"{int(request.distance)}km Cruise"

    # Generate story using templates (in production, use LLM)
    companions_text = ""
    if request.companions:
        companions_text = f" with {len(request.companions)} fellow riders"

    weather_text = ""
    if request.weather:
        weather_map = {
            'sunny': 'under clear skies',
            'cloudy': 'through cloudy weather',
            'rainy': 'in the rain',
            'stormy': 'braving the storm'
        }
        weather_text = weather_map.get(request.weather.lower(), '')

    story = f"""
    {title}

    Started from {request.start_location}{companions_text}, covering {int(request.distance)}km over {request.duration //60}h {request.duration % 60}m{weather_text}.

    The journey took you through winding roads and scenic vistas, with memorable stops at each waypoint.
    """

    if request.end_location:
        story += f" You finished at {request.end_location}."

    if request.expenses:
        total = sum(request.expenses.values())
        story += f" Total expenses: ₹{int(total)}"

    # Generate highlights
    highlights = []

    if request.distance > 100:
        highlights.append(f"Rode {int(request.distance)}km")

    if request.duration > 180:
        highlights.append(f"{request.duration // 60}h epic journey")

    if len(request.companions) > 2:
        highlights.append(f"Group of {len(request.companions) + 1} riders")

    if request.waypoints:
        highlights.append(f"Visited {len(request.waypoints)} waypoints")

    if request.photos:
        highlights.append(f"Captured {len(request.photos)} memories")

    # Generate hashtags
    hashtags = [
        "#RiderCircle",
        f"#Ride{int(request.distance)}km",
        "#TwoWheels"
    ]

    if request.distance > 200:
        hashtags.append("#LongRide")

    if request.weather == 'rainy':
        hashtags.append("#RainRider")

    if request.end_location:
        # Add location-based hashtag
        location_tag = request.end_location.split(',')[0].replace(' ', '')
        if location_tag:
            hashtags.append(f"#{location_tag}")

    return RideMemoryResponse(
        title=title,
        story=story.strip(),
        highlights=highlights,
        hashtags=hashtags
    )

# ============================================
# Route Intelligence
# ============================================

@app.post("/api/routes/recommend", response_model=RouteRecommendationResponse)
async def recommend_routes(request: RouteRecommendationRequest):
    """AI-powered route recommendations based on rider preferences"""

    # In production, this would use:
    # 1. HOJAI Knowledge Graph for route data
    # 2. HOJAI Vector for semantic route matching
    # 3. Historical ride data for personalization

    # Mock recommendations
    routes = [
        {
            "id": "route_1",
            "name": "Nandi Hills Sunrise Ride",
            "distance": 85,
            "difficulty": "moderate",
            "duration": 3,
            "highlights": ["Sunrise viewpoint", "Coffee stop", "Winding roads"],
            "score": 0.95
        },
        {
            "id": "route_2",
            "name": "Mysore Express",
            "distance": 145,
            "difficulty": "easy",
            "duration": 4,
            "highlights": ["Mysore Palace", "Chamundi Hill", "Srirangapatna"],
            "score": 0.88
        },
        {
            "id": "route_3",
            "name": "Coorg Weekend Getaway",
            "distance": 320,
            "difficulty": "hard",
            "duration": 8,
            "highlights": ["Coffee plantations", "Abbey Falls", "Raja's Seat"],
            "score": 0.82
        }
    ]

    reasoning = f"Based on your {request.riding_style} riding style and {request.distance_preference} distance preference, these routes match your profile."

    return RouteRecommendationResponse(
        routes=routes,
        reasoning=reasoning
    )

# ============================================
# Trust Score Engine
# ============================================

@app.post("/api/trust/score", response_model=TrustScoreResponse)
async def calculate_trust_score(request: TrustScoreRequest):
    """Calculate rider trust score based on various factors"""

    # Factor weights
    factors = {
        'ride_history': 0.30,
        'verification': 0.25,
        'community': 0.20,
        'engagement': 0.15,
        'achievements': 0.10
    }

    # Calculate individual scores (0-100)
    ride_score = min(100, (request.total_rides / 100) * 100)
    verification_score = min(100, (request.verified_rides / request.total_rides * 100) if request.total_rides > 0 else 0)
    community_score = min(100, (request.followers_count / 50) * 50 + (request.group_memberships * 10))
    engagement_score = request.ride_history_quality * 100
    achievement_score = min(100, (request.badges_count * 20))

    # Weighted trust score
    trust_score = round(
        (ride_score * factors['ride_history']) +
        (verification_score * factors['verification']) +
        (community_score * factors['community']) +
        (engagement_score * factors['engagement']) +
        (achievement_score * factors['achievements'])
    )

    # Cap at 100
    trust_score = min(100, trust_score)

    # Determine level
    if trust_score >= 80:
        level = "trusted"
    elif trust_score >= 50:
        level = "verified"
    else:
        level = "new"

    # Generate recommendations
    recommendations = []

    if request.total_rides < 10:
        recommendations.append("Complete more rides to increase your trust score")

    if request.verified_rides == 0:
        recommendations.append("Verify your rides by sharing GPS data")

    if request.followers_count < 10:
        recommendations.append("Connect with other riders to build your network")

    if request.group_memberships == 0:
        recommendations.append("Join riding groups in your area")

    if request.badges_count == 0:
        recommendations.append("Earn badges by participating in events and rides")

    return TrustScoreResponse(
        trust_score=trust_score,
        level=level,
        factors={
            'ride_history': round(ride_score, 1),
            'verification': round(verification_score, 1),
            'community': round(community_score, 1),
            'engagement': round(engagement_score, 1),
            'achievements': round(achievement_score, 1)
        },
        recommendations=recommendations
    )

# ============================================
# Prediction Engine
# ============================================

@app.post("/api/predictions/bike", response_model=PredictionResponse)
async def predict_bike_maintenance(request: PredictionRequest):
    """Predict bike maintenance needs based on usage patterns"""

    predictions = {}

    # Tire replacement prediction
    if request.tire_health < 80:
        remaining_tire_life = (request.tire_health / 100) * 20000  #20,000 km average
        replacement_km = request.current_odometer + remaining_tire_life
        months_until = (remaining_tire_life / request.avg_monthly_km) if request.avg_monthly_km > 0 else 12
        predictions['tire_replacement'] = {
            'estimated_km': round(replacement_km, 0),
            'estimated_months': round(months_until, 1),
            'urgency': 'high' if request.tire_health < 50 else 'medium'
        }

    # Chain maintenance
    if request.chain_condition < 70:
        remaining_chain_life = (request.chain_condition / 100) * 10000  # 10,000 km average
        maintenance_km = request.current_odometer + remaining_chain_life
        predictions['chain_maintenance'] = {
            'estimated_km': round(maintenance_km, 0),
            'urgency': 'high' if request.chain_condition < 50 else 'medium'
        }

    # Next service
    next_service_km = ((request.current_odometer // 5000) + 1) * 5000
    predictions['next_service'] = {
        'at_km': next_service_km,
        'type': 'regular_service'
    }

    # Confidence based on data quality
    confidence = 0.7 if request.avg_monthly_km > 500 else 0.5

    return PredictionResponse(
        predictions=predictions,
        confidence=confidence
    )

# ============================================
# Genie Ride Assistant
# ============================================

class GenieRequest(BaseModel):
    rider_id: str
    message: str
    context: Optional[Dict[str, Any]] = {}

class GenieResponse(BaseModel):
    response: str
    action: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

@app.post("/api/genie/chat", response_model=GenieResponse)
async def genie_chat(request: GenieRequest):
    """AI ride assistant powered by HOJAI Genie"""

    message = request.message.lower()

    # Intent detection
    if any(word in message for word in ['plan', 'route', 'trip', 'ride', 'go']):
        action = "route_planning"
        response = "I can help you plan your next ride! Tell me your starting point, destination, and preferred distance."

    elif any(word in message for word in ['maintenance', 'service', 'repair', 'tire', 'oil']):
        action = "maintenance"
        response = "I can check your bike's health and suggest maintenance. Would you like me to analyze your bike data?"

    elif any(word in message for word in ['weather', 'rain', 'sunny', 'forecast']):
        action = "weather_check"
        response = "I can check weather conditions along your route. What's your planned route?"

    elif any(word in message for word in ['group', 'club', 'event', 'ride with']):
        action = "community"
        response = "I can help you find groups and events nearby. Would you like me to search for riding communities in your area?"

    elif any(word in message for word in ['sos', 'emergency', 'help', 'crash']):
        action = "safety"
        response = "If you need emergency help, tap the SOS button in the app. For non-emergency assistance, I'm here to help!"

    else:
        action = "general"
        response = "I'm Genie, your AI riding companion. I can help with route planning, bike maintenance, weather updates, and connecting you with the rider community. What would you like help with?"

    return GenieResponse(
        response=response,
        action=action,
        data={"intent": action}
    )

# ============================================
# Start Server
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "4400"))
    uvicorn.run(app, host="0.0.0.0", port=port)