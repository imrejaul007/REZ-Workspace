"""
AssetMind Core - Custom exceptions
"""


class AssetMindError(Exception):
    """Base exception for AssetMind"""
    pass


class DataError(AssetMindError):
    """Data-related errors"""
    pass


class TwinNotFoundError(AssetMindError):
    """Raised when a twin is not found"""
    pass


class PredictionError(AssetMindError):
    """Prediction-related errors"""
    pass


class AgentError(AssetMindError):
    """Agent-related errors"""
    pass


class DataSourceError(AssetMindError):
    """External data source errors"""
    pass


class ValidationError(AssetMindError):
    """Validation errors"""
    pass


class AuthenticationError(AssetMindError):
    """Authentication errors"""
    pass


class AuthorizationError(AssetMindError):
    """Authorization errors"""
    pass


class RateLimitError(AssetMindError):
    """Rate limit errors"""
    pass
