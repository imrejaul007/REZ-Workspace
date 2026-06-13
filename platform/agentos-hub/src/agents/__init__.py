"""
AgentOS Hub - Industry Adapters

Industry-specific adapters for seamless integration with all 24 industry verticals.
Each adapter provides standardized interfaces for industry-specific operations.
"""

from .base import BaseIndustryAdapter, IndustryAdapterRegistry
from .agriculture import AgricultureAdapter
from .automotive import AutomotiveAdapter
from .beauty import BeautyAdapter
from .construction import ConstructionAdapter
from .education import EducationAdapter
from .entertainment import EntertainmentAdapter
from .fashion import FashionAdapter
from .financial import FinancialAdapter
from .fitness import FitnessAdapter
from .gaming import GamingAdapter
from .government import GovernmentAdapter
from .healthcare import HealthcareAdapter
from .homeservices import HomeServicesAdapter
from .hotel import HotelAdapter
from .legal import LegalAdapter
from .manufacturing import ManufacturingAdapter
from .nonprofit import NonProfitAdapter
from .professional import ProfessionalAdapter
from .realestate import RealEstateAdapter
from .restaurant import RestaurantAdapter
from .retail import RetailAdapter
from .sports import SportsAdapter
from .transport import TransportAdapter
from .travel import TravelAdapter

__all__ = [
    "BaseIndustryAdapter",
    "IndustryAdapterRegistry",
    "AgricultureAdapter",
    "AutomotiveAdapter",
    "BeautyAdapter",
    "ConstructionAdapter",
    "EducationAdapter",
    "EntertainmentAdapter",
    "FashionAdapter",
    "FinancialAdapter",
    "FitnessAdapter",
    "GamingAdapter",
    "GovernmentAdapter",
    "HealthcareAdapter",
    "HomeServicesAdapter",
    "HotelAdapter",
    "LegalAdapter",
    "ManufacturingAdapter",
    "NonProfitAdapter",
    "ProfessionalAdapter",
    "RealEstateAdapter",
    "RestaurantAdapter",
    "RetailAdapter",
    "SportsAdapter",
    "TransportAdapter",
    "TravelAdapter",
]
