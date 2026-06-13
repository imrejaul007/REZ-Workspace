"""
AgentOS Hub - API Gateway

REST API gateway for the AgentOS Hub orchestration platform.
Provides unified access to all 24 industry verticals.
"""

__version__ = "1.0.0"

from .gateway import APIGateway, create_app
from .routes import setup_routes

__all__ = ["APIGateway", "create_app", "setup_routes"]
