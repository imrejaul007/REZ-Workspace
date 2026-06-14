"""
AssetMind Python SDK - Exceptions
"""

class AssetMindError(Exception):
    """Base exception for AssetMind SDK"""
    pass


class APIError(AssetMindError):
    """API error"""

    def __init__(self, message: str, status_code: int = None, response: dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class AuthenticationError(AssetMindError):
    """Authentication error"""
    pass


class RateLimitError(AssetMindError):
    """Rate limit exceeded"""
    pass


class ValidationError(AssetMindError):
    """Validation error"""
    pass


class NotFoundError(AssetMindError):
    """Resource not found"""
    pass
