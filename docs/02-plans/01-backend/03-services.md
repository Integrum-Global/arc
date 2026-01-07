# ARC Backend Services Layer

## Overview

This document defines the service layer architecture that orchestrates DataFlow models and Kailash workflows. Services provide business logic abstraction, transaction management, and API integration points.

---

## 1. Service Architecture

### 1.1 Design Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                         Nexus API Layer                         │
├─────────────────────────────────────────────────────────────────┤
│                      Service Layer (This Doc)                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ Portfolio   │ │ Analytics   │ │ Intelligence│ │ Integration│ │
│  │ Service     │ │ Service     │ │ Service     │ │ Service    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    Workflow Execution Layer                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              AsyncLocalRuntime (Docker-optimized)           ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                      DataFlow Express Layer                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              db.express (23x faster CRUD)                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Service Base Class

```python
# src/arc/services/base.py
from abc import ABC, abstractmethod
from dataflow import DataFlow
from kailash.runtime import AsyncLocalRuntime
from typing import Optional, Any
import logging

class BaseService(ABC):
    """Base service class for all ARC services."""

    def __init__(self, db: DataFlow, tenant_id: Optional[str] = None):
        self.db = db
        self.tenant_id = tenant_id
        self.runtime = AsyncLocalRuntime()
        self.logger = logging.getLogger(self.__class__.__name__)

    async def execute_workflow(self, workflow, inputs: dict = None) -> tuple[dict, str]:
        """Execute a workflow with tenant context."""
        inputs = inputs or {}
        if self.tenant_id:
            inputs["_tenant_id"] = self.tenant_id
        return await self.runtime.execute_workflow_async(workflow, inputs)

    def with_tenant(self, tenant_id: str) -> "BaseService":
        """Create service copy with tenant context."""
        service = self.__class__(self.db, tenant_id)
        return service
```

---

## 2. Portfolio Service

### 2.1 Service Definition

**File**: `src/arc/services/portfolio_service.py`

```python
from arc.services.base import BaseService
from arc.workflows.portfolio import (
    create_nav_calculation_workflow,
    create_portfolio_health_scan_workflow,
    create_portfolio_rebalance_workflow,
)
from arc.models import Portfolio, Holding, Transaction, PortfolioValuation
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

class PortfolioService(BaseService):
    """
    Portfolio management service.

    Handles:
    - Portfolio CRUD operations
    - Holdings management
    - NAV calculation
    - Health scans
    - Rebalancing
    """

    # ========== Portfolio CRUD ==========

    async def create_portfolio(
        self,
        name: str,
        code: str,
        manager_id: str,
        portfolio_type: str = "managed",
        base_currency: str = "USD",
        inception_date: Optional[str] = None,
        benchmark_id: Optional[str] = None,
        risk_profile: str = "moderate",
        constraints: Optional[dict] = None
    ) -> dict:
        """
        Create a new portfolio.

        Args:
            name: Portfolio display name
            code: Unique portfolio code
            manager_id: ID of portfolio manager
            portfolio_type: "managed" | "model" | "benchmark" | "composite"
            base_currency: ISO currency code
            inception_date: Portfolio start date (defaults to today)
            benchmark_id: Optional benchmark portfolio ID
            risk_profile: "conservative" | "moderate" | "aggressive"
            constraints: Investment constraints dict

        Returns:
            Created portfolio dict

        Raises:
            ValueError: If code already exists
        """
        # Check for duplicate code
        existing = await self.db.express.list(
            "Portfolio",
            filter={"code": code, "deleted_at": {"$null": True}},
            limit=1
        )
        if existing:
            raise ValueError(f"Portfolio with code '{code}' already exists")

        portfolio_id = f"pf-{code.lower()}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        portfolio_data = {
            "id": portfolio_id,
            "name": name,
            "code": code,
            "portfolio_type": portfolio_type,
            "base_currency": base_currency,
            "inception_date": inception_date or date.today().isoformat(),
            "manager_id": manager_id,
            "benchmark_id": benchmark_id,
            "risk_profile": risk_profile,
            "constraints": constraints or {
                "sector_limits": {},
                "single_name_limit": 0.10,
                "min_positions": 10,
                "max_positions": 50,
                "cash_minimum": 0.02
            },
            "active": True
        }

        return await self.db.express.create("Portfolio", portfolio_data)

    async def get_portfolio(self, portfolio_id: str) -> Optional[dict]:
        """Get portfolio by ID."""
        portfolio = await self.db.express.read("Portfolio", portfolio_id)
        if portfolio and portfolio.get("deleted_at"):
            return None
        return portfolio

    async def list_portfolios(
        self,
        manager_id: Optional[str] = None,
        portfolio_type: Optional[str] = None,
        active_only: bool = True,
        limit: int = 100,
        offset: int = 0
    ) -> List[dict]:
        """List portfolios with filters."""
        filter_dict = {"deleted_at": {"$null": True}}

        if manager_id:
            filter_dict["manager_id"] = manager_id
        if portfolio_type:
            filter_dict["portfolio_type"] = portfolio_type
        if active_only:
            filter_dict["active"] = True

        return await self.db.express.list(
            "Portfolio",
            filter=filter_dict,
            limit=limit,
            offset=offset,
            order_by=[("-created_at", "desc")]
        )

    async def update_portfolio(
        self,
        portfolio_id: str,
        updates: dict
    ) -> dict:
        """Update portfolio fields."""
        # Prevent updating immutable fields
        immutable_fields = {"id", "code", "inception_date", "created_at", "updated_at"}
        for field in immutable_fields:
            updates.pop(field, None)

        return await self.db.express.update("Portfolio", portfolio_id, updates)

    async def delete_portfolio(self, portfolio_id: str) -> bool:
        """Soft delete portfolio."""
        return await self.db.express.delete("Portfolio", portfolio_id)

    # ========== Holdings Management ==========

    async def get_holdings(
        self,
        portfolio_id: str,
        as_of_date: Optional[str] = None,
        include_closed: bool = False
    ) -> List[dict]:
        """
        Get portfolio holdings.

        Args:
            portfolio_id: Portfolio ID
            as_of_date: Point-in-time holdings (defaults to current)
            include_closed: Include zero-quantity positions

        Returns:
            List of holding dicts with security details
        """
        filter_dict = {
            "portfolio_id": portfolio_id,
            "deleted_at": {"$null": True}
        }

        if not include_closed:
            filter_dict["quantity"] = {"$gt": 0}

        holdings = await self.db.express.list("Holding", filter=filter_dict, limit=1000)

        # Enrich with security data
        if holdings:
            security_ids = [h["security_id"] for h in holdings]
            securities = await self.db.express.list(
                "Security",
                filter={"id": {"$in": security_ids}},
                limit=1000
            )
            security_map = {s["id"]: s for s in securities}

            for holding in holdings:
                holding["security"] = security_map.get(holding["security_id"], {})

        return holdings

    async def add_holding(
        self,
        portfolio_id: str,
        security_id: str,
        quantity: Decimal,
        cost_basis: Decimal,
        acquisition_date: str,
        lot_id: Optional[str] = None
    ) -> dict:
        """Add or update a holding position."""
        holding_id = f"hold-{portfolio_id[-8:]}-{security_id[-8:]}-{lot_id or 'main'}"

        # Check if holding exists
        existing = await self.db.express.read("Holding", holding_id)

        if existing:
            # Update existing holding
            new_quantity = float(existing["quantity"]) + float(quantity)
            new_cost_basis = (
                (float(existing["quantity"]) * float(existing["cost_basis"]) +
                 float(quantity) * float(cost_basis)) / new_quantity
            ) if new_quantity > 0 else 0

            return await self.db.express.update("Holding", holding_id, {
                "quantity": new_quantity,
                "cost_basis": new_cost_basis
            })
        else:
            # Create new holding
            return await self.db.express.create("Holding", {
                "id": holding_id,
                "portfolio_id": portfolio_id,
                "security_id": security_id,
                "quantity": float(quantity),
                "cost_basis": float(cost_basis),
                "acquisition_date": acquisition_date,
                "lot_id": lot_id or "main"
            })

    async def record_transaction(
        self,
        portfolio_id: str,
        security_id: str,
        transaction_type: str,  # "buy" | "sell" | "dividend" | "transfer" | "adjustment"
        quantity: Decimal,
        price: Decimal,
        trade_date: str,
        settlement_date: Optional[str] = None,
        fees: Decimal = Decimal("0"),
        notes: Optional[str] = None
    ) -> dict:
        """
        Record a portfolio transaction.

        Automatically updates holdings based on transaction type.
        """
        transaction_id = f"txn-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"

        # Calculate amounts
        gross_amount = float(quantity) * float(price)
        net_amount = gross_amount + (float(fees) if transaction_type == "buy" else -float(fees))

        # Create transaction record
        transaction = await self.db.express.create("Transaction", {
            "id": transaction_id,
            "portfolio_id": portfolio_id,
            "security_id": security_id,
            "transaction_type": transaction_type,
            "quantity": float(quantity),
            "price": float(price),
            "gross_amount": gross_amount,
            "net_amount": net_amount,
            "fees": float(fees),
            "currency": "USD",  # TODO: Get from portfolio
            "trade_date": trade_date,
            "settlement_date": settlement_date or trade_date,
            "status": "settled",
            "notes": notes
        })

        # Update holdings
        if transaction_type == "buy":
            await self.add_holding(
                portfolio_id=portfolio_id,
                security_id=security_id,
                quantity=quantity,
                cost_basis=price,
                acquisition_date=trade_date
            )
        elif transaction_type == "sell":
            await self.add_holding(
                portfolio_id=portfolio_id,
                security_id=security_id,
                quantity=-quantity,  # Negative for sells
                cost_basis=Decimal("0"),
                acquisition_date=trade_date
            )

        return transaction

    # ========== NAV Calculation ==========

    async def calculate_nav(
        self,
        portfolio_id: str,
        as_of_date: Optional[str] = None
    ) -> dict:
        """
        Calculate portfolio NAV.

        Returns:
            {
                "portfolio_id": str,
                "valuation_date": str,
                "total_value": float,
                "cash_balance": float,
                "invested_value": float,
                "nav_per_unit": float,
                "holdings_count": int,
                "currency": str
            }
        """
        workflow = create_nav_calculation_workflow()

        results, run_id = await self.execute_workflow(workflow, {
            "portfolio_id": portfolio_id,
            "as_of_date": as_of_date or date.today().isoformat()
        })

        nav_data = results.get("calculate_nav", {})

        # Save valuation record
        valuation_id = f"val-{portfolio_id[-8:]}-{(as_of_date or date.today().isoformat()).replace('-', '')}"

        await self.db.express.upsert("PortfolioValuation", {
            "id": valuation_id,
            "portfolio_id": portfolio_id,
            "valuation_date": as_of_date or date.today().isoformat(),
            "total_value": nav_data.get("total_value", 0),
            "cash_balance": nav_data.get("cash_balance", 0),
            "invested_value": nav_data.get("invested_value", 0),
            "nav_per_unit": nav_data.get("nav_per_unit", 1.0),
            "units_outstanding": nav_data.get("units_outstanding", 1.0),
            "currency": nav_data.get("currency", "USD"),
            "calculation_method": "market_value"
        })

        return nav_data

    # ========== Health Scan ==========

    async def run_health_scan(self, portfolio_id: str) -> dict:
        """
        Run comprehensive portfolio health scan.

        Returns:
            {
                "overall_score": float (0-100),
                "liquidity_score": float,
                "concentration_score": float,
                "diversification_score": float,
                "performance_score": float,
                "risk_score": float,
                "issues": [
                    {"severity": "high"|"medium"|"low", "category": str, "message": str}
                ],
                "recommendations": [str]
            }
        """
        workflow = create_portfolio_health_scan_workflow()

        results, run_id = await self.execute_workflow(workflow, {
            "portfolio_id": portfolio_id
        })

        return results.get("health_scan", {})

    # ========== Portfolio Analytics ==========

    async def get_sector_allocation(self, portfolio_id: str) -> List[dict]:
        """Get portfolio allocation by sector."""
        holdings = await self.get_holdings(portfolio_id)

        sector_totals = {}
        total_value = 0

        for holding in holdings:
            security = holding.get("security", {})
            sector = security.get("sector", "Unknown")
            value = float(holding.get("market_value", 0))

            sector_totals[sector] = sector_totals.get(sector, 0) + value
            total_value += value

        return [
            {
                "sector": sector,
                "value": value,
                "weight": value / total_value if total_value > 0 else 0
            }
            for sector, value in sorted(sector_totals.items(), key=lambda x: -x[1])
        ]

    async def get_asset_allocation(self, portfolio_id: str) -> List[dict]:
        """Get portfolio allocation by asset class."""
        holdings = await self.get_holdings(portfolio_id)

        asset_totals = {}
        total_value = 0

        for holding in holdings:
            security = holding.get("security", {})
            asset_class = security.get("asset_class", "Unknown")
            value = float(holding.get("market_value", 0))

            asset_totals[asset_class] = asset_totals.get(asset_class, 0) + value
            total_value += value

        return [
            {
                "asset_class": asset_class,
                "value": value,
                "weight": value / total_value if total_value > 0 else 0
            }
            for asset_class, value in sorted(asset_totals.items(), key=lambda x: -x[1])
        ]

    async def get_top_holdings(
        self,
        portfolio_id: str,
        limit: int = 10
    ) -> List[dict]:
        """Get top holdings by market value."""
        holdings = await self.get_holdings(portfolio_id)

        # Sort by market value
        sorted_holdings = sorted(
            holdings,
            key=lambda h: float(h.get("market_value", 0)),
            reverse=True
        )

        return sorted_holdings[:limit]
```

### 2.2 Acceptance Criteria

- [ ] Portfolio CRUD with code uniqueness validation
- [ ] Holdings management with lot tracking
- [ ] Transaction recording with automatic holding updates
- [ ] NAV calculation with historical storage
- [ ] Health scan with scoring algorithm
- [ ] Sector and asset allocation analytics
- [ ] Top holdings retrieval
- [ ] Multi-tenant isolation via tenant_id

---

## 3. Analytics Service

### 3.1 Service Definition

**File**: `src/arc/services/analytics_service.py`

```python
from arc.services.base import BaseService
from arc.workflows.analytics import (
    create_ratio_calculation_workflow,
    create_threshold_alert_workflow,
    create_peer_benchmarking_workflow,
)
from typing import Optional, List
from datetime import datetime, date

class AnalyticsService(BaseService):
    """
    Analytics and financial ratio service.

    Handles:
    - Financial ratio calculations (5 classes, 25 ratios)
    - Threshold alerting
    - Peer benchmarking
    - Trend analysis
    """

    # ========== Ratio Calculations ==========

    async def calculate_ratios(
        self,
        security_ids: Optional[List[str]] = None,
        recalculate_all: bool = False
    ) -> dict:
        """
        Calculate financial ratios for securities.

        Args:
            security_ids: Specific securities (None = all active)
            recalculate_all: Force recalculation even if recent

        Returns:
            {
                "securities_processed": int,
                "ratios_calculated": int,
                "errors": [{"security_id": str, "error": str}]
            }
        """
        workflow = create_ratio_calculation_workflow()

        results, run_id = await self.execute_workflow(workflow, {
            "security_ids": security_ids,
            "recalculate_all": recalculate_all
        })

        return results.get("summary", {})

    async def get_security_ratios(
        self,
        security_id: str,
        as_of_date: Optional[str] = None
    ) -> Optional[dict]:
        """
        Get all ratios for a security.

        Returns dict with all 25 ratios organized by class:
        {
            "security_id": str,
            "calculation_date": str,
            "liquidity": {
                "current_ratio": float,
                "quick_ratio": float,
                "cash_ratio": float,
                "operating_cash_flow_ratio": float,
                "working_capital_ratio": float
            },
            "profitability": {
                "roe": float,
                "roa": float,
                "net_margin": float,
                "operating_margin": float,
                "ebitda_margin": float
            },
            "leverage": {
                "debt_to_equity": float,
                "debt_to_assets": float,
                "interest_coverage": float,
                "debt_to_ebitda": float,
                "equity_multiplier": float
            },
            "utilization": {
                "asset_turnover": float,
                "inventory_turnover": float,
                "receivables_turnover": float,
                "payables_turnover": float,
                "cash_conversion_cycle": float
            },
            "valuation": {
                "pe_ratio": float,
                "pb_ratio": float,
                "ps_ratio": float,
                "ev_to_ebitda": float,
                "dividend_yield": float
            }
        }
        """
        filter_dict = {"security_id": security_id}

        if as_of_date:
            filter_dict["calculation_date"] = {"$lte": as_of_date}

        ratios = await self.db.express.list(
            "SecurityRatio",
            filter=filter_dict,
            order_by=[("-calculation_date", "desc")],
            limit=1
        )

        if not ratios:
            return None

        ratio = ratios[0]

        # Organize into classes
        return {
            "security_id": ratio["security_id"],
            "calculation_date": ratio["calculation_date"],
            "liquidity": {
                "current_ratio": ratio.get("current_ratio"),
                "quick_ratio": ratio.get("quick_ratio"),
                "cash_ratio": ratio.get("cash_ratio"),
                "operating_cash_flow_ratio": ratio.get("operating_cash_flow_ratio"),
                "working_capital_ratio": ratio.get("working_capital_ratio")
            },
            "profitability": {
                "roe": ratio.get("roe"),
                "roa": ratio.get("roa"),
                "net_margin": ratio.get("net_margin"),
                "operating_margin": ratio.get("operating_margin"),
                "ebitda_margin": ratio.get("ebitda_margin")
            },
            "leverage": {
                "debt_to_equity": ratio.get("debt_to_equity"),
                "debt_to_assets": ratio.get("debt_to_assets"),
                "interest_coverage": ratio.get("interest_coverage"),
                "debt_to_ebitda": ratio.get("debt_to_ebitda"),
                "equity_multiplier": ratio.get("equity_multiplier")
            },
            "utilization": {
                "asset_turnover": ratio.get("asset_turnover"),
                "inventory_turnover": ratio.get("inventory_turnover"),
                "receivables_turnover": ratio.get("receivables_turnover"),
                "payables_turnover": ratio.get("payables_turnover"),
                "cash_conversion_cycle": ratio.get("cash_conversion_cycle")
            },
            "valuation": {
                "pe_ratio": ratio.get("pe_ratio"),
                "pb_ratio": ratio.get("pb_ratio"),
                "ps_ratio": ratio.get("ps_ratio"),
                "ev_to_ebitda": ratio.get("ev_to_ebitda"),
                "dividend_yield": ratio.get("dividend_yield")
            }
        }

    async def get_ratio_history(
        self,
        security_id: str,
        ratio_name: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        interval: str = "monthly"  # "daily" | "weekly" | "monthly" | "quarterly"
    ) -> List[dict]:
        """
        Get historical values for a specific ratio.

        Returns:
            [{"date": str, "value": float}, ...]
        """
        filter_dict = {"security_id": security_id}

        if start_date:
            filter_dict["calculation_date"] = {"$gte": start_date}
        if end_date:
            filter_dict.setdefault("calculation_date", {})["$lte"] = end_date

        ratios = await self.db.express.list(
            "SecurityRatio",
            filter=filter_dict,
            order_by=[("calculation_date", "asc")],
            limit=1000
        )

        # Filter by interval
        result = []
        last_period = None

        for ratio in ratios:
            calc_date = datetime.fromisoformat(ratio["calculation_date"])

            if interval == "monthly":
                period = calc_date.strftime("%Y-%m")
            elif interval == "quarterly":
                quarter = (calc_date.month - 1) // 3 + 1
                period = f"{calc_date.year}-Q{quarter}"
            elif interval == "weekly":
                period = calc_date.strftime("%Y-W%W")
            else:
                period = calc_date.strftime("%Y-%m-%d")

            if period != last_period:
                result.append({
                    "date": ratio["calculation_date"],
                    "value": ratio.get(ratio_name)
                })
                last_period = period

        return result

    # ========== Threshold Alerts ==========

    async def configure_threshold(
        self,
        user_id: str,
        ratio_name: str,
        lower_threshold: Optional[float] = None,
        upper_threshold: Optional[float] = None,
        security_ids: Optional[List[str]] = None,
        portfolio_ids: Optional[List[str]] = None,
        alert_channels: List[str] = None
    ) -> dict:
        """
        Configure alert threshold for a ratio.

        Args:
            user_id: User configuring the alert
            ratio_name: Name of ratio to monitor
            lower_threshold: Alert if ratio falls below
            upper_threshold: Alert if ratio exceeds
            security_ids: Specific securities (None = all)
            portfolio_ids: Monitor securities in portfolios
            alert_channels: ["email", "push", "in_app"]
        """
        threshold_id = f"thresh-{user_id[-6:]}-{ratio_name}-{datetime.utcnow().strftime('%H%M%S')}"

        return await self.db.express.create("AlertThreshold", {
            "id": threshold_id,
            "user_id": user_id,
            "ratio_name": ratio_name,
            "lower_threshold": lower_threshold,
            "upper_threshold": upper_threshold,
            "security_ids": security_ids or [],
            "portfolio_ids": portfolio_ids or [],
            "alert_channels": alert_channels or ["in_app"],
            "active": True
        })

    async def check_thresholds(
        self,
        user_id: Optional[str] = None
    ) -> dict:
        """
        Check all thresholds and generate alerts.

        Returns:
            {
                "thresholds_checked": int,
                "alerts_generated": int,
                "alerts": [
                    {
                        "id": str,
                        "security_id": str,
                        "ratio_name": str,
                        "current_value": float,
                        "threshold_value": float,
                        "direction": "above" | "below"
                    }
                ]
            }
        """
        workflow = create_threshold_alert_workflow()

        results, run_id = await self.execute_workflow(workflow, {
            "user_id": user_id
        })

        return results.get("alert_summary", {})

    async def get_user_alerts(
        self,
        user_id: str,
        status: Optional[str] = None,  # "new" | "acknowledged" | "resolved"
        limit: int = 50
    ) -> List[dict]:
        """Get alerts for a user."""
        filter_dict = {"user_id": user_id}

        if status:
            filter_dict["status"] = status

        return await self.db.express.list(
            "Alert",
            filter=filter_dict,
            order_by=[("-created_at", "desc")],
            limit=limit
        )

    async def acknowledge_alert(self, alert_id: str, user_id: str) -> dict:
        """Mark alert as acknowledged."""
        return await self.db.express.update("Alert", alert_id, {
            "status": "acknowledged",
            "acknowledged_by": user_id,
            "acknowledged_at": datetime.utcnow().isoformat()
        })

    # ========== Peer Benchmarking ==========

    async def create_peer_group(
        self,
        name: str,
        security_ids: List[str],
        user_id: str,
        criteria: Optional[dict] = None
    ) -> dict:
        """
        Create a peer comparison group.

        Args:
            name: Peer group name
            security_ids: Securities in the group
            user_id: Creating user
            criteria: {
                "sector": str,
                "market_cap_range": [min, max],
                "geography": str
            }
        """
        group_id = f"peer-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        return await self.db.express.create("PeerGroup", {
            "id": group_id,
            "name": name,
            "security_ids": security_ids,
            "user_id": user_id,
            "criteria": criteria or {},
            "is_system": False
        })

    async def benchmark_against_peers(
        self,
        security_id: str,
        peer_group_id: str,
        ratios: Optional[List[str]] = None
    ) -> dict:
        """
        Benchmark a security against its peer group.

        Returns:
            {
                "security_id": str,
                "peer_group_id": str,
                "comparisons": {
                    "ratio_name": {
                        "security_value": float,
                        "peer_average": float,
                        "peer_median": float,
                        "percentile": float,
                        "rank": int,
                        "peer_count": int
                    }
                }
            }
        """
        workflow = create_peer_benchmarking_workflow()

        results, run_id = await self.execute_workflow(workflow, {
            "security_id": security_id,
            "peer_group_id": peer_group_id,
            "ratios": ratios
        })

        return results.get("benchmark_results", {})

    async def get_peer_comparison_report(
        self,
        portfolio_id: str,
        include_charts: bool = False
    ) -> dict:
        """
        Generate comprehensive peer comparison report for portfolio holdings.
        """
        # Get portfolio holdings
        holdings = await self.db.express.list(
            "Holding",
            filter={
                "portfolio_id": portfolio_id,
                "quantity": {"$gt": 0}
            },
            limit=1000
        )

        comparisons = []

        for holding in holdings:
            security_id = holding["security_id"]

            # Get security's peer group
            security = await self.db.express.read("Security", security_id)
            if not security:
                continue

            peer_groups = await self.db.express.list(
                "PeerGroup",
                filter={"security_ids": {"$contains": security_id}},
                limit=1
            )

            if peer_groups:
                comparison = await self.benchmark_against_peers(
                    security_id=security_id,
                    peer_group_id=peer_groups[0]["id"]
                )
                comparisons.append({
                    "security": security,
                    "holding": holding,
                    "comparison": comparison
                })

        return {
            "portfolio_id": portfolio_id,
            "generated_at": datetime.utcnow().isoformat(),
            "holdings_count": len(holdings),
            "comparisons": comparisons
        }
```

### 3.2 Acceptance Criteria

- [ ] Calculate all 25 ratios from fundamentals data
- [ ] Store and retrieve ratio history with interval aggregation
- [ ] Configure user-specific thresholds per ratio
- [ ] Automatic threshold checking with alert generation
- [ ] Peer group creation and management
- [ ] Percentile ranking within peer groups
- [ ] Comprehensive benchmark reports

---

## 4. Intelligence Service

### 4.1 Service Definition

**File**: `src/arc/services/intelligence_service.py`

```python
from arc.services.base import BaseService
from arc.agents.market_intelligence import MarketIntelligenceAgent
from arc.agents.portfolio_query import PortfolioQueryAgent
from arc.agents.financial_analyst import FinancialAnalystAgent
from typing import Optional, List, AsyncIterator
from datetime import datetime

class IntelligenceService(BaseService):
    """
    AI Intelligence service powered by Kaizen agents.

    Handles:
    - Market intelligence briefs
    - Natural language portfolio queries
    - Financial analysis with anomaly detection
    - Research synthesis
    """

    def __init__(self, db, tenant_id: Optional[str] = None):
        super().__init__(db, tenant_id)
        self.market_agent = MarketIntelligenceAgent()
        self.query_agent = PortfolioQueryAgent(db)
        self.analyst_agent = FinancialAnalystAgent()

    # ========== Market Briefs ==========

    async def generate_market_brief(
        self,
        brief_type: str = "daily",  # "daily" | "weekly" | "custom"
        topics: Optional[List[str]] = None,
        portfolio_id: Optional[str] = None,
        format: str = "summary"  # "summary" | "detailed" | "executive"
    ) -> dict:
        """
        Generate AI-powered market brief.

        Args:
            brief_type: Frequency/type of brief
            topics: Specific topics to cover
            portfolio_id: Contextualize for portfolio holdings
            format: Output format/length

        Returns:
            {
                "id": str,
                "type": str,
                "generated_at": str,
                "sections": [
                    {
                        "title": str,
                        "content": str,
                        "sentiment": "positive" | "neutral" | "negative",
                        "relevance_score": float,
                        "sources": [str]
                    }
                ],
                "key_takeaways": [str],
                "action_items": [str]
            }
        """
        # Get portfolio context if provided
        portfolio_context = None
        if portfolio_id:
            holdings = await self.db.express.list(
                "Holding",
                filter={"portfolio_id": portfolio_id, "quantity": {"$gt": 0}},
                limit=100
            )
            security_ids = [h["security_id"] for h in holdings]
            securities = await self.db.express.list(
                "Security",
                filter={"id": {"$in": security_ids}},
                limit=100
            )
            portfolio_context = {
                "sectors": list(set(s.get("sector") for s in securities)),
                "tickers": [s.get("ticker") for s in securities],
                "holdings_count": len(holdings)
            }

        brief = await self.market_agent.generate_brief(
            brief_type=brief_type,
            topics=topics or [],
            portfolio_context=portfolio_context,
            format=format
        )

        # Store brief
        brief_id = f"brief-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        await self.db.express.create("MarketBrief", {
            "id": brief_id,
            "brief_type": brief_type,
            "content": brief,
            "portfolio_id": portfolio_id,
            "generated_at": datetime.utcnow().isoformat()
        })

        return {"id": brief_id, **brief}

    async def stream_market_brief(
        self,
        brief_type: str = "daily",
        topics: Optional[List[str]] = None
    ) -> AsyncIterator[str]:
        """Stream market brief generation in real-time."""
        async for chunk in self.market_agent.stream_brief(
            brief_type=brief_type,
            topics=topics or []
        ):
            yield chunk

    # ========== Natural Language Queries ==========

    async def query_portfolio(
        self,
        user_id: str,
        query: str,
        portfolio_id: Optional[str] = None,
        include_sources: bool = True
    ) -> dict:
        """
        Answer natural language questions about portfolios.

        Examples:
        - "What's my exposure to technology sector?"
        - "Which holdings have the lowest P/E ratios?"
        - "How has my portfolio performed vs S&P 500?"
        - "Show me holdings with declining profitability"

        Returns:
            {
                "query": str,
                "answer": str,
                "confidence": float,
                "data": {...},  # Structured data backing the answer
                "sources": [str],  # Data sources used
                "follow_up_questions": [str]
            }
        """
        # Get user's portfolios if not specified
        if not portfolio_id:
            portfolios = await self.db.express.list(
                "Portfolio",
                filter={"manager_id": user_id, "active": True},
                limit=10
            )
        else:
            portfolios = [await self.db.express.read("Portfolio", portfolio_id)]

        result = await self.query_agent.answer(
            query=query,
            portfolios=portfolios,
            include_sources=include_sources
        )

        # Log query for learning
        await self.db.express.create("QueryLog", {
            "id": f"qlog-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}",
            "user_id": user_id,
            "query": query,
            "response": result.get("answer"),
            "confidence": result.get("confidence"),
            "portfolio_id": portfolio_id
        })

        return result

    async def suggest_queries(
        self,
        user_id: str,
        context: Optional[str] = None
    ) -> List[str]:
        """
        Suggest relevant queries based on user context.

        Returns contextual query suggestions based on:
        - User's portfolio state
        - Recent alerts
        - Market conditions
        """
        # Get recent user activity
        recent_queries = await self.db.express.list(
            "QueryLog",
            filter={"user_id": user_id},
            order_by=[("-created_at", "desc")],
            limit=5
        )

        recent_alerts = await self.db.express.list(
            "Alert",
            filter={"user_id": user_id, "status": "new"},
            limit=5
        )

        return await self.query_agent.suggest_queries(
            recent_queries=[q["query"] for q in recent_queries],
            recent_alerts=recent_alerts,
            context=context
        )

    # ========== Financial Analysis ==========

    async def analyze_security(
        self,
        security_id: str,
        analysis_type: str = "comprehensive"  # "comprehensive" | "quick" | "deep_dive"
    ) -> dict:
        """
        Perform AI-powered financial analysis on a security.

        Returns:
            {
                "security_id": str,
                "analysis_type": str,
                "generated_at": str,
                "summary": str,
                "financial_health": {
                    "score": float,
                    "grade": "A" - "F",
                    "trend": "improving" | "stable" | "declining"
                },
                "key_metrics": {...},
                "strengths": [str],
                "concerns": [str],
                "peer_comparison": {...},
                "recommendation": str,
                "confidence": float
            }
        """
        # Get security data
        security = await self.db.express.read("Security", security_id)
        fundamentals = await self.db.express.list(
            "CompanyFundamentals",
            filter={"security_id": security_id},
            order_by=[("-period_end_date", "desc")],
            limit=4  # Last 4 quarters
        )
        ratios = await self.db.express.list(
            "SecurityRatio",
            filter={"security_id": security_id},
            order_by=[("-calculation_date", "desc")],
            limit=12  # Last 12 months
        )

        analysis = await self.analyst_agent.analyze(
            security=security,
            fundamentals=fundamentals,
            ratios=ratios,
            analysis_type=analysis_type
        )

        return {
            "security_id": security_id,
            "analysis_type": analysis_type,
            "generated_at": datetime.utcnow().isoformat(),
            **analysis
        }

    async def detect_anomalies(
        self,
        portfolio_id: Optional[str] = None,
        lookback_days: int = 90
    ) -> List[dict]:
        """
        Detect anomalies in portfolio or all holdings.

        Returns:
            [
                {
                    "security_id": str,
                    "anomaly_type": str,
                    "severity": "high" | "medium" | "low",
                    "description": str,
                    "detected_at": str,
                    "metrics": {...}
                }
            ]
        """
        # Get securities to analyze
        if portfolio_id:
            holdings = await self.db.express.list(
                "Holding",
                filter={"portfolio_id": portfolio_id, "quantity": {"$gt": 0}},
                limit=500
            )
            security_ids = [h["security_id"] for h in holdings]
        else:
            securities = await self.db.express.list("Security", limit=1000)
            security_ids = [s["id"] for s in securities]

        anomalies = await self.analyst_agent.detect_anomalies(
            security_ids=security_ids,
            lookback_days=lookback_days
        )

        # Create alerts for high severity anomalies
        for anomaly in anomalies:
            if anomaly["severity"] == "high":
                await self.db.express.create("Alert", {
                    "id": f"alert-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}",
                    "alert_type": "anomaly",
                    "severity": "high",
                    "title": f"Anomaly detected: {anomaly['anomaly_type']}",
                    "message": anomaly["description"],
                    "security_id": anomaly["security_id"],
                    "portfolio_id": portfolio_id,
                    "data": anomaly.get("metrics", {}),
                    "status": "new"
                })

        return anomalies

    # ========== Research Synthesis ==========

    async def research_topic(
        self,
        topic: str,
        depth: str = "standard",  # "quick" | "standard" | "comprehensive"
        sources: Optional[List[str]] = None
    ) -> dict:
        """
        Research and synthesize information on a topic.

        Returns:
            {
                "topic": str,
                "summary": str,
                "key_points": [str],
                "data": {...},
                "sources": [{"title": str, "url": str, "relevance": float}],
                "related_topics": [str]
            }
        """
        return await self.market_agent.research(
            topic=topic,
            depth=depth,
            sources=sources
        )
```

### 4.2 Acceptance Criteria

- [ ] Market brief generation (daily, weekly, custom)
- [ ] Brief streaming for real-time UI updates
- [ ] Natural language portfolio queries with confidence scores
- [ ] Query suggestions based on user context
- [ ] Comprehensive security analysis with AI
- [ ] Anomaly detection with automatic alerting
- [ ] Research synthesis with source attribution

---

## 5. Integration Service

### 5.1 Service Definition

**File**: `src/arc/services/integration_service.py`

```python
from arc.services.base import BaseService
from arc.workflows.sync import (
    create_eodhd_price_sync_workflow,
    create_capital_iq_sync_workflow,
    create_pitchbook_sync_workflow,
)
from arc.integrations.eodhd import EODHDClient
from arc.integrations.capital_iq import CapitalIQClient
from arc.integrations.pitchbook import PitchbookClient
from typing import Optional, List
from datetime import datetime, timedelta
import asyncio

class IntegrationService(BaseService):
    """
    Data provider integration service.

    Handles:
    - EODHD price data sync
    - Capital IQ fundamentals sync
    - Pitchbook private company sync
    - Sync job scheduling and monitoring
    """

    def __init__(self, db, tenant_id: Optional[str] = None):
        super().__init__(db, tenant_id)
        self.eodhd_client = EODHDClient()
        self.capital_iq_client = CapitalIQClient()
        self.pitchbook_client = PitchbookClient()

    # ========== Data Provider Configuration ==========

    async def configure_provider(
        self,
        provider: str,  # "eodhd" | "capital_iq" | "pitchbook"
        api_key: str,
        settings: Optional[dict] = None
    ) -> dict:
        """
        Configure a data provider connection.

        Args:
            provider: Provider identifier
            api_key: API key/credentials
            settings: Provider-specific settings
        """
        # Validate credentials
        if provider == "eodhd":
            valid = await self.eodhd_client.validate_credentials(api_key)
        elif provider == "capital_iq":
            valid = await self.capital_iq_client.validate_credentials(api_key)
        elif provider == "pitchbook":
            valid = await self.pitchbook_client.validate_credentials(api_key)
        else:
            raise ValueError(f"Unknown provider: {provider}")

        if not valid:
            raise ValueError(f"Invalid credentials for {provider}")

        connection_id = f"conn-{provider}-{self.tenant_id or 'default'}"

        return await self.db.express.upsert("DataProviderConnection", {
            "id": connection_id,
            "provider": provider,
            "api_key_encrypted": self._encrypt_key(api_key),  # Encrypt before storage
            "settings": settings or {},
            "status": "active",
            "last_validated": datetime.utcnow().isoformat()
        })

    async def get_provider_status(self, provider: str) -> dict:
        """Get provider connection status."""
        connection_id = f"conn-{provider}-{self.tenant_id or 'default'}"
        connection = await self.db.express.read("DataProviderConnection", connection_id)

        if not connection:
            return {"provider": provider, "status": "not_configured"}

        # Get recent sync jobs
        recent_jobs = await self.db.express.list(
            "SyncJob",
            filter={"provider": provider},
            order_by=[("-started_at", "desc")],
            limit=5
        )

        return {
            "provider": provider,
            "status": connection["status"],
            "last_validated": connection.get("last_validated"),
            "recent_syncs": recent_jobs
        }

    # ========== Price Data Sync (EODHD) ==========

    async def sync_prices(
        self,
        tickers: Optional[List[str]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> dict:
        """
        Sync price data from EODHD.

        Args:
            tickers: Specific tickers (None = all active securities)
            start_date: Start of date range
            end_date: End of date range (defaults to today)

        Returns:
            {
                "job_id": str,
                "status": "completed" | "failed" | "partial",
                "tickers_processed": int,
                "records_synced": int,
                "errors": [{"ticker": str, "error": str}]
            }
        """
        job_id = f"sync-eodhd-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        # Create sync job record
        await self.db.express.create("SyncJob", {
            "id": job_id,
            "provider": "eodhd",
            "job_type": "prices",
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "parameters": {
                "tickers": tickers,
                "start_date": start_date,
                "end_date": end_date
            }
        })

        try:
            workflow = create_eodhd_price_sync_workflow()

            results, run_id = await self.execute_workflow(workflow, {
                "tickers": tickers,
                "start_date": start_date or (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d"),
                "end_date": end_date or datetime.utcnow().strftime("%Y-%m-%d")
            })

            sync_result = results.get("sync_summary", {})

            # Update job record
            await self.db.express.update("SyncJob", job_id, {
                "status": "completed" if not sync_result.get("errors") else "partial",
                "completed_at": datetime.utcnow().isoformat(),
                "records_processed": sync_result.get("records_synced", 0),
                "errors": sync_result.get("errors", [])
            })

            return {"job_id": job_id, **sync_result}

        except Exception as e:
            await self.db.express.update("SyncJob", job_id, {
                "status": "failed",
                "completed_at": datetime.utcnow().isoformat(),
                "error_message": str(e)
            })
            raise

    async def get_real_time_quote(self, ticker: str) -> dict:
        """Get real-time quote for a ticker."""
        return await self.eodhd_client.get_real_time_quote(ticker)

    # ========== Fundamentals Sync (Capital IQ) ==========

    async def sync_fundamentals(
        self,
        security_ids: Optional[List[str]] = None,
        period_type: str = "quarterly"  # "quarterly" | "annual"
    ) -> dict:
        """
        Sync fundamental data from Capital IQ.

        Returns:
            {
                "job_id": str,
                "status": "completed" | "failed" | "partial",
                "securities_processed": int,
                "records_synced": int,
                "errors": [{"security_id": str, "error": str}]
            }
        """
        job_id = f"sync-capiq-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        await self.db.express.create("SyncJob", {
            "id": job_id,
            "provider": "capital_iq",
            "job_type": "fundamentals",
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "parameters": {
                "security_ids": security_ids,
                "period_type": period_type
            }
        })

        try:
            workflow = create_capital_iq_sync_workflow()

            results, run_id = await self.execute_workflow(workflow, {
                "security_ids": security_ids,
                "period_type": period_type
            })

            sync_result = results.get("sync_summary", {})

            await self.db.express.update("SyncJob", job_id, {
                "status": "completed" if not sync_result.get("errors") else "partial",
                "completed_at": datetime.utcnow().isoformat(),
                "records_processed": sync_result.get("records_synced", 0),
                "errors": sync_result.get("errors", [])
            })

            return {"job_id": job_id, **sync_result}

        except Exception as e:
            await self.db.express.update("SyncJob", job_id, {
                "status": "failed",
                "completed_at": datetime.utcnow().isoformat(),
                "error_message": str(e)
            })
            raise

    # ========== Private Company Sync (Pitchbook) ==========

    async def sync_private_companies(
        self,
        company_ids: Optional[List[str]] = None
    ) -> dict:
        """
        Sync private company data from Pitchbook.

        Returns:
            {
                "job_id": str,
                "status": "completed" | "failed" | "partial",
                "companies_processed": int,
                "records_synced": int,
                "errors": [{"company_id": str, "error": str}]
            }
        """
        job_id = f"sync-pitchbook-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        await self.db.express.create("SyncJob", {
            "id": job_id,
            "provider": "pitchbook",
            "job_type": "private_companies",
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "parameters": {"company_ids": company_ids}
        })

        try:
            workflow = create_pitchbook_sync_workflow()

            results, run_id = await self.execute_workflow(workflow, {
                "company_ids": company_ids
            })

            sync_result = results.get("sync_summary", {})

            await self.db.express.update("SyncJob", job_id, {
                "status": "completed" if not sync_result.get("errors") else "partial",
                "completed_at": datetime.utcnow().isoformat(),
                "records_processed": sync_result.get("records_synced", 0),
                "errors": sync_result.get("errors", [])
            })

            return {"job_id": job_id, **sync_result}

        except Exception as e:
            await self.db.express.update("SyncJob", job_id, {
                "status": "failed",
                "completed_at": datetime.utcnow().isoformat(),
                "error_message": str(e)
            })
            raise

    # ========== Sync Job Management ==========

    async def get_sync_jobs(
        self,
        provider: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 20
    ) -> List[dict]:
        """Get sync job history."""
        filter_dict = {}

        if provider:
            filter_dict["provider"] = provider
        if status:
            filter_dict["status"] = status

        return await self.db.express.list(
            "SyncJob",
            filter=filter_dict,
            order_by=[("-started_at", "desc")],
            limit=limit
        )

    async def schedule_sync(
        self,
        provider: str,
        job_type: str,
        schedule: str,  # cron expression
        parameters: Optional[dict] = None
    ) -> dict:
        """Schedule recurring sync job."""
        schedule_id = f"sched-{provider}-{job_type}-{datetime.utcnow().strftime('%H%M%S')}"

        return await self.db.express.create("SyncSchedule", {
            "id": schedule_id,
            "provider": provider,
            "job_type": job_type,
            "schedule": schedule,
            "parameters": parameters or {},
            "active": True,
            "last_run": None,
            "next_run": self._calculate_next_run(schedule)
        })

    def _encrypt_key(self, api_key: str) -> str:
        """Encrypt API key for storage."""
        # TODO: Implement proper encryption
        return f"encrypted:{api_key[:4]}****"

    def _calculate_next_run(self, cron_expression: str) -> str:
        """Calculate next run time from cron expression."""
        # TODO: Implement cron parsing
        return (datetime.utcnow() + timedelta(hours=1)).isoformat()
```

### 5.2 Acceptance Criteria

- [ ] Configure provider connections with credential validation
- [ ] EODHD price sync with date range support
- [ ] Real-time quote retrieval
- [ ] Capital IQ fundamentals sync (quarterly/annual)
- [ ] Pitchbook private company sync
- [ ] Sync job tracking and history
- [ ] Scheduled sync configuration
- [ ] Error handling and partial success reporting

---

## 6. User Service

### 6.1 Service Definition

**File**: `src/arc/services/user_service.py`

```python
from arc.services.base import BaseService
from typing import Optional, List
from datetime import datetime
import hashlib
import secrets

class UserService(BaseService):
    """
    User and tenant management service.

    Handles:
    - User CRUD
    - Tenant management
    - Preferences
    - Access control
    """

    # ========== Tenant Management ==========

    async def create_tenant(
        self,
        name: str,
        subscription_tier: str = "professional",
        settings: Optional[dict] = None
    ) -> dict:
        """Create a new tenant organization."""
        tenant_id = f"tenant-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        return await self.db.express.create("Tenant", {
            "id": tenant_id,
            "name": name,
            "subscription_tier": subscription_tier,
            "settings": settings or {
                "max_users": 5 if subscription_tier == "professional" else 50,
                "max_portfolios": 10 if subscription_tier == "professional" else 100,
                "data_providers": ["eodhd"] if subscription_tier == "professional" else ["eodhd", "capital_iq", "pitchbook"]
            },
            "status": "active"
        })

    async def get_tenant(self, tenant_id: str) -> Optional[dict]:
        """Get tenant by ID."""
        return await self.db.express.read("Tenant", tenant_id)

    async def update_tenant_settings(
        self,
        tenant_id: str,
        settings: dict
    ) -> dict:
        """Update tenant settings."""
        return await self.db.express.update("Tenant", tenant_id, {"settings": settings})

    # ========== User Management ==========

    async def create_user(
        self,
        email: str,
        name: str,
        role: str = "analyst",  # "admin" | "manager" | "analyst" | "viewer"
        tenant_id: Optional[str] = None
    ) -> dict:
        """Create a new user."""
        # Check for duplicate email
        existing = await self.db.express.list(
            "User",
            filter={"email": email},
            limit=1
        )
        if existing:
            raise ValueError(f"User with email '{email}' already exists")

        user_id = f"user-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        return await self.db.express.create("User", {
            "id": user_id,
            "email": email,
            "name": name,
            "role": role,
            "tenant_id": tenant_id or self.tenant_id,
            "status": "pending",  # Requires email verification
            "preferences": self._default_preferences()
        })

    async def get_user(self, user_id: str) -> Optional[dict]:
        """Get user by ID."""
        return await self.db.express.read("User", user_id)

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email."""
        users = await self.db.express.list(
            "User",
            filter={"email": email},
            limit=1
        )
        return users[0] if users else None

    async def list_users(
        self,
        tenant_id: Optional[str] = None,
        role: Optional[str] = None,
        status: str = "active"
    ) -> List[dict]:
        """List users with filters."""
        filter_dict = {"status": status}

        if tenant_id:
            filter_dict["tenant_id"] = tenant_id
        if role:
            filter_dict["role"] = role

        return await self.db.express.list("User", filter=filter_dict, limit=1000)

    async def update_user(self, user_id: str, updates: dict) -> dict:
        """Update user fields."""
        immutable = {"id", "email", "created_at", "updated_at"}
        for field in immutable:
            updates.pop(field, None)

        return await self.db.express.update("User", user_id, updates)

    async def deactivate_user(self, user_id: str) -> dict:
        """Deactivate a user."""
        return await self.db.express.update("User", user_id, {
            "status": "inactive",
            "deactivated_at": datetime.utcnow().isoformat()
        })

    # ========== Preferences ==========

    async def get_preferences(self, user_id: str) -> dict:
        """Get user preferences."""
        user = await self.db.express.read("User", user_id)
        return user.get("preferences", self._default_preferences()) if user else {}

    async def update_preferences(
        self,
        user_id: str,
        preferences: dict
    ) -> dict:
        """Update user preferences."""
        current = await self.get_preferences(user_id)
        merged = {**current, **preferences}

        await self.db.express.update("User", user_id, {"preferences": merged})
        return merged

    async def configure_notifications(
        self,
        user_id: str,
        channels: dict
    ) -> dict:
        """
        Configure notification preferences.

        Args:
            channels: {
                "email": {"enabled": bool, "frequency": str},
                "push": {"enabled": bool},
                "in_app": {"enabled": bool}
            }
        """
        return await self.db.express.upsert("NotificationPreference", {
            "id": f"notif-{user_id}",
            "user_id": user_id,
            "channels": channels
        })

    def _default_preferences(self) -> dict:
        """Default user preferences."""
        return {
            "theme": "light",
            "language": "en",
            "timezone": "UTC",
            "date_format": "YYYY-MM-DD",
            "number_format": "1,234.56",
            "default_currency": "USD",
            "dashboard_layout": "standard",
            "notifications": {
                "email": True,
                "push": True,
                "in_app": True
            }
        }
```

### 6.2 Acceptance Criteria

- [ ] Tenant creation with subscription tier configuration
- [ ] User CRUD with email uniqueness validation
- [ ] Role-based access levels (admin, manager, analyst, viewer)
- [ ] User preference management
- [ ] Notification configuration per channel
- [ ] User deactivation (soft delete)

---

## 7. Service Registry

### 7.1 Registry Pattern

**File**: `src/arc/services/__init__.py`

```python
from dataflow import DataFlow
from arc.services.portfolio_service import PortfolioService
from arc.services.analytics_service import AnalyticsService
from arc.services.intelligence_service import IntelligenceService
from arc.services.integration_service import IntegrationService
from arc.services.user_service import UserService
from typing import Optional

class ServiceRegistry:
    """
    Central service registry for dependency injection.

    Usage:
        registry = ServiceRegistry(db)
        registry.with_tenant("tenant-123")

        portfolio = await registry.portfolio.create_portfolio(...)
        ratios = await registry.analytics.get_security_ratios(...)
    """

    def __init__(self, db: DataFlow, tenant_id: Optional[str] = None):
        self.db = db
        self.tenant_id = tenant_id

        # Initialize services
        self._portfolio = None
        self._analytics = None
        self._intelligence = None
        self._integration = None
        self._user = None

    def with_tenant(self, tenant_id: str) -> "ServiceRegistry":
        """Create registry copy with tenant context."""
        return ServiceRegistry(self.db, tenant_id)

    @property
    def portfolio(self) -> PortfolioService:
        if self._portfolio is None:
            self._portfolio = PortfolioService(self.db, self.tenant_id)
        return self._portfolio

    @property
    def analytics(self) -> AnalyticsService:
        if self._analytics is None:
            self._analytics = AnalyticsService(self.db, self.tenant_id)
        return self._analytics

    @property
    def intelligence(self) -> IntelligenceService:
        if self._intelligence is None:
            self._intelligence = IntelligenceService(self.db, self.tenant_id)
        return self._intelligence

    @property
    def integration(self) -> IntegrationService:
        if self._integration is None:
            self._integration = IntegrationService(self.db, self.tenant_id)
        return self._integration

    @property
    def user(self) -> UserService:
        if self._user is None:
            self._user = UserService(self.db, self.tenant_id)
        return self._user


# Convenience function for creating registry
def create_services(db: DataFlow, tenant_id: Optional[str] = None) -> ServiceRegistry:
    """Create service registry with database connection."""
    return ServiceRegistry(db, tenant_id)


__all__ = [
    "ServiceRegistry",
    "create_services",
    "PortfolioService",
    "AnalyticsService",
    "IntelligenceService",
    "IntegrationService",
    "UserService",
]
```

---

## 8. Implementation Checklist

### Phase 1: Core Services
- [ ] Implement `BaseService` with tenant context
- [ ] Implement `PortfolioService` CRUD operations
- [ ] Implement `PortfolioService` holdings management
- [ ] Implement `UserService` user management
- [ ] Implement `ServiceRegistry` pattern

### Phase 2: Analytics Services
- [ ] Implement ratio calculation in `AnalyticsService`
- [ ] Implement threshold alerting
- [ ] Implement peer benchmarking

### Phase 3: Integration Services
- [ ] Implement EODHD client and sync
- [ ] Implement Capital IQ client and sync
- [ ] Implement Pitchbook client and sync
- [ ] Implement sync job management

### Phase 4: Intelligence Services
- [ ] Implement `IntelligenceService` with Kaizen agents
- [ ] Implement market brief generation
- [ ] Implement NL portfolio queries
- [ ] Implement anomaly detection

---

## 9. Testing Strategy

Each service requires:

1. **Unit tests** (mocked dependencies)
2. **Integration tests** (real DataFlow, test database)
3. **E2E tests** (full workflow execution)

See `docs/02-plans/08-testing/` for detailed test specifications.
