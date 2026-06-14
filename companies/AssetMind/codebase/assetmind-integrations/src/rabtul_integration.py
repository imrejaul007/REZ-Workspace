"""
AssetMind → RABTUL Integration

Connects AssetMind to RABTUL services for:
- Authentication
- Wallet / Payment
- Financial Transactions

RABTUL is "The Stripe of Financial Infrastructure"

Version: 1.0.0
"""

import httpx
import os
from typing import Dict, Any, Optional
from datetime import datetime


class RABTULIntegration:
    """
    Integration with RABTUL payment services.

    Usage:
        rabtul = RABTULIntegration()
        auth = await rabtul.verify_token(token)
        payment = await rabtul.create_payment(amount=100, currency="USD")
    """

    def __init__(
        self,
        auth_url: str = None,
        wallet_url: str = None,
        payment_url: str = None,
        api_key: str = None,
        api_secret: str = None
    ):
        self.auth_url = auth_url or os.getenv("RABTUL_AUTH_URL", "http://localhost:4001")
        self.wallet_url = wallet_url or os.getenv("RABTUL_WALLET_URL", "http://localhost:4004")
        self.payment_url = payment_url or os.getenv("RABTUL_PAYMENT_URL", "http://localhost:4001")
        self.api_key = api_key or os.getenv("RABTUL_API_KEY", "")
        self.api_secret = api_secret or os.getenv("RABTUL_API_SECRET", "")
        self.timeout = 30.0

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify RABTUL authentication token.

        Args:
            token: JWT token

        Returns:
            User information
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.auth_url}/api/verify",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "X-API-Key": self.api_key
                    }
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"valid": False, "error": str(e)}

    async def get_user_wallet(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's wallet balance and transactions.

        Args:
            user_id: User ID

        Returns:
            Wallet information
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.wallet_url}/api/wallet/{user_id}",
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "balance": 0}

    async def create_payment(
        self,
        amount: float,
        currency: str,
        user_id: str,
        description: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Create a payment transaction.

        Args:
            amount: Amount to pay
            currency: Currency code (USD, INR, etc.)
            user_id: User ID
            description: Payment description
            metadata: Additional metadata

        Returns:
            Payment details
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.payment_url}/api/payments",
                    json={
                        "amount": amount,
                        "currency": currency,
                        "user_id": user_id,
                        "description": description,
                        "metadata": metadata or {},
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "status": "failed"}

    async def process_subscription(
        self,
        user_id: str,
        plan: str,
        amount: float,
        interval: str = "monthly"
    ) -> Dict[str, Any]:
        """
        Process subscription payment.

        Args:
            user_id: User ID
            plan: Plan name (free, pro, enterprise)
            amount: Subscription amount
            interval: Billing interval

        Returns:
            Subscription details
        """
        return await self.create_payment(
            amount=amount,
            currency="USD",
            user_id=user_id,
            description=f"AssetMind {plan} subscription",
            metadata={
                "type": "subscription",
                "plan": plan,
                "interval": interval
            }
        )

    async def refund_payment(
        self,
        payment_id: str,
        amount: Optional[float] = None,
        reason: str = "Customer request"
    ) -> Dict[str, Any]:
        """
        Refund a payment.

        Args:
            payment_id: Payment ID
            amount: Amount to refund (full if not specified)
            reason: Refund reason

        Returns:
            Refund details
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                json_data = {"reason": reason}
                if amount:
                    json_data["amount"] = amount

                response = await client.post(
                    f"{self.payment_url}/api/payments/{payment_id}/refund",
                    json=json_data,
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "status": "failed"}

    async def get_transaction_history(
        self,
        user_id: str,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Get transaction history for a user.

        Args:
            user_id: User ID
            limit: Maximum transactions

        Returns:
            Transaction list
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.wallet_url}/api/transactions/{user_id}",
                    params={"limit": limit},
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "transactions": []}

    async def create_checkout_session(
        self,
        amount: float,
        currency: str,
        user_id: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Create a checkout session for payments.

        Args:
            amount: Total amount
            currency: Currency
            user_id: User ID
            success_url: Redirect on success
            cancel_url: Redirect on cancel
            metadata: Additional data

        Returns:
            Checkout session with payment URL
        """
        return {
            "session_id": f"cs_{user_id}_{datetime.utcnow().timestamp()}",
            "payment_url": f"https://pay.rabtul.com/checkout",
            "amount": amount,
            "currency": currency,
            "status": "pending"
        }


# Singleton instance
_rabtul_integration = None


def get_rabtul_integration() -> RABTULIntegration:
    """Get singleton RABTUL integration instance."""
    global _rabtul_integration
    if _rabtul_integration is None:
        _rabtul_integration = RABTULIntegration()
    return _rabtul_integration