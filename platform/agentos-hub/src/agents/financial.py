"""
AgentOS Hub - Financial Industry Adapter

Adapter for Financial Services industry vertical.
Supports banking, trading, compliance, and risk management operations.
"""

from typing import Dict, List, Optional, Any
from ..base import BaseIndustryAdapter, TwinType, TwinReference, IndustryCapability
import asyncio
import logging

logger = logging.getLogger(__name__)


class FinancialAdapter(BaseIndustryAdapter):
    """
    Financial Industry Adapter.

    Twins: Account, Transaction, Customer, Product, Portfolio, Compliance, Risk, Trading, Loan
    Agents: Account, Loan, Investment, Compliance, Risk, Trading
    """

    industry_name = "financial"
    industry_display_name = "Financial Services"
    port_range = (8943, 8952)

    async def initialize(self) -> bool:
        """Initialize financial agents and twins."""
        logger.info("Initializing Financial adapter...")

        # Initialize twins
        twin_configs = [
            ("account", TwinType.USER, "Account management"),
            ("transaction", TwinType.TRANSACTION, "Transaction processing"),
            ("customer", TwinType.USER, "Customer profiles"),
            ("product", TwinType.PRODUCT, "Financial products"),
            ("portfolio", TwinType.ASSET, "Investment portfolios"),
            ("compliance", TwinType.DOCUMENT, "Regulatory compliance"),
            ("risk", TwinType.DOCUMENT, "Risk assessment"),
            ("trading", TwinType.TRANSACTION, "Trading operations"),
            ("loan", TwinType.DOCUMENT, "Loan management"),
        ]

        for twin_name, twin_type, description in twin_configs:
            twin = TwinReference(
                twin_id=f"twin.financial.{twin_name}",
                twin_type=twin_type,
                industry=self.industry_name,
                entity_id=f"{twin_name}_001",
                endpoint=f"http://localhost:89{tand(43, 52)}",
                metadata={"description": description}
            )
            await self.register_twin(twin)

        self._running = True
        logger.info("Financial adapter initialized")
        return True

    async def shutdown(self) -> bool:
        """Shutdown financial adapter."""
        self._running = False
        self.agents.clear()
        self.twins.clear()
        logger.info("Financial adapter shutdown")
        return True

    def get_capabilities(self) -> List[IndustryCapability]:
        """Get financial-specific capabilities."""
        return [
            IndustryCapability(
                name="account_management",
                description="Account creation, update, and management",
                endpoints=["/api/accounts", "/api/accounts/{id}"],
                required_twins=["account", "customer"]
            ),
            IndustryCapability(
                name="transaction_processing",
                description="Real-time transaction processing",
                endpoints=["/api/transactions", "/api/transactions/{id}/process"],
                required_twins=["transaction", "account"]
            ),
            IndustryCapability(
                name="investment_management",
                description="Investment portfolio management",
                endpoints=["/api/portfolio", "/api/portfolio/{id}/rebalance"],
                required_twins=["portfolio", "trading"]
            ),
            IndustryCapability(
                name="compliance_monitoring",
                description="Regulatory compliance monitoring",
                endpoints=["/api/compliance", "/api/compliance/check"],
                required_twins=["compliance", "transaction"]
            ),
            IndustryCapability(
                name="risk_assessment",
                description="Risk assessment and management",
                endpoints=["/api/risk", "/api/risk/{id}/assess"],
                required_twins=["risk", "customer"]
            ),
            IndustryCapability(
                name="loan_processing",
                description="Loan application and management",
                endpoints=["/api/loans", "/api/loans/{id}/approve"],
                required_twins=["loan", "customer", "risk"]
            ),
        ]

    async def execute_operation(
        self,
        operation: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute financial-specific operation."""
        operations = {
            "create_account": self._create_account,
            "process_transaction": self._process_transaction,
            "assess_risk": self._assess_risk,
            "approve_loan": self._approve_loan,
            "rebalance_portfolio": self._rebalance_portfolio,
            "check_compliance": self._check_compliance,
        }

        handler = operations.get(operation)
        if handler:
            return await handler(payload)
        else:
            return {"error": f"Unknown operation: {operation}"}

    async def _create_account(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new account."""
        return {
            "operation": "create_account",
            "status": "created",
            "account_id": f"ACC{payload.get('customer_id')}",
            "account_type": payload.get("account_type", "checking"),
            "initial_balance": payload.get("initial_balance", 0)
        }

    async def _process_transaction(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process a transaction."""
        return {
            "operation": "process_transaction",
            "status": "completed",
            "transaction_id": f"TXN{hash(payload.get('amount', 0))}",
            "amount": payload.get("amount"),
            "fee": payload.get("amount", 0) * 0.01,
            "processed_at": "2026-06-12T10:00:00Z"
        }

    async def _assess_risk(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Assess risk for a customer or transaction."""
        return {
            "operation": "assess_risk",
            "status": "completed",
            "risk_score": 0.35,
            "risk_level": "LOW",
            "recommendations": ["Approve with standard terms"]
        }

    async def _approve_loan(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process loan approval."""
        return {
            "operation": "approve_loan",
            "status": "approved",
            "loan_id": f"LOAN{hash(payload.get('amount', 0))}",
            "principal": payload.get("amount"),
            "interest_rate": 5.5,
            "term_months": payload.get("term", 36)
        }

    async def _rebalance_portfolio(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Rebalance investment portfolio."""
        return {
            "operation": "rebalance_portfolio",
            "status": "completed",
            "portfolio_id": payload.get("portfolio_id"),
            "changes": [
                {"asset": "stocks", "from": "60%", "to": "55%"},
                {"asset": "bonds", "from": "30%", "to": "35%"},
                {"asset": "cash", "from": "10%", "to": "10%"}
            ]
        }

    async def _check_compliance(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Check regulatory compliance."""
        return {
            "operation": "check_compliance",
            "status": "compliant",
            "checks_passed": ["KYC", "AML", "SAR"],
            "violations": []
        }


def tand(start: int, end: int) -> int:
    """Helper to generate port numbers."""
    import random
    return random.randint(start, end)
