"""
Portfolio service for ARC investment platform.

Provides portfolio management, holdings operations, transactions,
and NAV calculations using DataFlow Express API and workflows.

CRITICAL RULES:
- NEVER manually set created_at or updated_at - DataFlow manages these
- Use $null operator to filter soft-deleted records: {"deleted_at": {"$null": True}}
- Express API for simple CRUD, Workflows for complex multi-step operations
"""

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from arc.services.base import (
    BaseService,
    ConflictError,
    NotFoundError,
    ValidationError,
    service_operation,
)


class PortfolioService(BaseService):
    """
    Service for portfolio management operations.

    Provides:
    - Portfolio CRUD with code uniqueness checking
    - Holdings management with lot tracking
    - Transaction recording with automatic holding updates
    - NAV calculation and history
    - Health scan and allocation analytics
    """

    # =========================================
    # PORTFOLIO CRUD OPERATIONS
    # =========================================

    @service_operation("create_portfolio")
    async def create_portfolio(
        self,
        name: str,
        code: str,
        inception_date: str,
        manager_id: str | None = None,
        description: str | None = None,
        portfolio_type: str = "managed",
        strategy: str | None = None,
        asset_class_focus: str = "multi",
        base_currency: str = "USD",
        risk_profile: str = "moderate",
        investment_objective: str | None = None,
        constraints: dict | None = None,
        benchmark_id: str | None = None,
    ) -> dict:
        """
        Create a new portfolio.

        Args:
            name: Portfolio name
            code: Short code (must be unique within tenant)
            inception_date: When portfolio was created (ISO date)
            manager_id: Investment manager ID (defaults to current user)
            description: Optional description
            portfolio_type: "managed" | "model" | "benchmark" | "composite"
            strategy: Investment strategy
            asset_class_focus: Primary asset class
            base_currency: Base currency for valuation
            risk_profile: Risk profile classification
            investment_objective: Long-form objective statement
            constraints: Portfolio constraints dict
            benchmark_id: Optional benchmark portfolio ID

        Returns:
            Created portfolio dict

        Raises:
            ConflictError: If code already exists
            ValidationError: If required fields are missing
        """
        # Use current user if manager not specified
        effective_manager_id = manager_id or self.user_id
        if not effective_manager_id:
            raise ValidationError(
                "Manager ID is required",
                service="PortfolioService",
                operation="create_portfolio",
            )

        # Check for duplicate code
        existing = await self.db.express.list(
            "Portfolio",
            filter={
                "code": code,
                "deleted_at": {"$null": True},
            },
            limit=1,
        )
        if existing:
            raise ConflictError(
                f"Portfolio with code '{code}' already exists",
                service="PortfolioService",
                operation="create_portfolio",
                details={"code": code},
            )

        # Default constraints
        default_constraints = {
            "sector_limits": {},
            "single_name_limit": 0.10,
            "min_positions": 10,
            "max_positions": 50,
            "cash_minimum": 0.02,
            "cash_maximum": 0.10,
        }

        # Create portfolio
        portfolio_id = self.generate_id("port-")
        portfolio_data = {
            "id": portfolio_id,
            "name": name,
            "code": code,
            "description": description,
            "portfolio_type": portfolio_type,
            "strategy": strategy,
            "asset_class_focus": asset_class_focus,
            "inception_date": inception_date,
            "base_currency": base_currency,
            "manager_id": effective_manager_id,
            "benchmark_id": benchmark_id,
            "risk_profile": risk_profile,
            "investment_objective": investment_objective,
            "constraints": constraints or default_constraints,
            "active": True,
        }

        return await self.db.express.create("Portfolio", portfolio_data)

    @service_operation("get_portfolio")
    async def get_portfolio(self, portfolio_id: str) -> dict | None:
        """
        Get a portfolio by ID.

        Args:
            portfolio_id: Portfolio ID

        Returns:
            Portfolio dict or None if not found

        Raises:
            NotFoundError: If portfolio not found or deleted
        """
        portfolio = await self.db.express.read("Portfolio", portfolio_id)

        if not portfolio:
            raise NotFoundError(
                f"Portfolio {portfolio_id} not found",
                service="PortfolioService",
                operation="get_portfolio",
                details={"portfolio_id": portfolio_id},
            )

        # Check soft-delete
        if portfolio.get("deleted_at"):
            raise NotFoundError(
                f"Portfolio {portfolio_id} has been deleted",
                service="PortfolioService",
                operation="get_portfolio",
                details={"portfolio_id": portfolio_id},
            )

        return portfolio

    @service_operation("list_portfolios")
    async def list_portfolios(
        self,
        manager_id: str | None = None,
        portfolio_type: str | None = None,
        active_only: bool = True,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """
        List portfolios with optional filters.

        Args:
            manager_id: Filter by manager (defaults to current user)
            portfolio_type: Filter by type
            active_only: Only return active portfolios
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            List of portfolio dicts
        """
        filter_dict: dict[str, Any] = {
            "deleted_at": {"$null": True},  # Exclude soft-deleted
        }

        # Use provided manager_id or default to current user
        effective_manager_id = manager_id or self.user_id
        if effective_manager_id:
            filter_dict["manager_id"] = effective_manager_id

        if portfolio_type:
            filter_dict["portfolio_type"] = portfolio_type

        if active_only:
            filter_dict["active"] = True

        return await self.db.express.list(
            "Portfolio",
            filter=filter_dict,
            limit=limit,
            offset=offset,
        )

    @service_operation("update_portfolio")
    async def update_portfolio(
        self,
        portfolio_id: str,
        updates: dict,
    ) -> dict:
        """
        Update a portfolio.

        Args:
            portfolio_id: Portfolio ID to update
            updates: Fields to update

        Returns:
            Updated portfolio dict

        Raises:
            NotFoundError: If portfolio not found
            ValidationError: If trying to update immutable fields
        """
        # Verify portfolio exists (raises NotFoundError if not)
        await self.get_portfolio(portfolio_id)

        # Prevent updating immutable fields
        immutable_fields = {"id", "code", "inception_date", "created_at", "updated_at"}
        invalid_updates = set(updates.keys()) & immutable_fields
        if invalid_updates:
            raise ValidationError(
                f"Cannot update immutable fields: {invalid_updates}",
                service="PortfolioService",
                operation="update_portfolio",
                details={"fields": list(invalid_updates)},
            )

        # Remove any timestamp fields
        updates.pop("created_at", None)
        updates.pop("updated_at", None)
        updates.pop("deleted_at", None)

        # Perform update
        result = await self.db.express.update(
            "Portfolio",
            filter={"id": portfolio_id, "deleted_at": {"$null": True}},
            fields=updates,
        )

        if not result:
            raise NotFoundError(
                f"Portfolio {portfolio_id} not found or deleted",
                service="PortfolioService",
                operation="update_portfolio",
            )

        return result

    @service_operation("delete_portfolio")
    async def delete_portfolio(self, portfolio_id: str) -> bool:
        """
        Soft-delete a portfolio.

        Args:
            portfolio_id: Portfolio ID to delete

        Returns:
            True if deleted successfully

        Raises:
            NotFoundError: If portfolio not found
        """
        # Verify portfolio exists
        await self.get_portfolio(portfolio_id)

        # Soft-delete (DataFlow sets deleted_at automatically)
        success = await self.db.express.delete("Portfolio", portfolio_id)

        if not success:
            raise NotFoundError(
                f"Portfolio {portfolio_id} could not be deleted",
                service="PortfolioService",
                operation="delete_portfolio",
            )

        return True

    # =========================================
    # HOLDINGS MANAGEMENT
    # =========================================

    @service_operation("get_holdings")
    async def get_holdings(
        self,
        portfolio_id: str,
        include_closed: bool = False,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """
        Get holdings for a portfolio.

        Args:
            portfolio_id: Portfolio ID
            include_closed: Include closed positions (active=False)
            limit: Maximum records
            offset: Records to skip

        Returns:
            List of holding dicts
        """
        # Verify portfolio exists
        await self.get_portfolio(portfolio_id)

        filter_dict: dict[str, Any] = {
            "portfolio_id": portfolio_id,
        }

        if not include_closed:
            filter_dict["active"] = True

        return await self.db.express.list(
            "Holding",
            filter=filter_dict,
            limit=limit,
            offset=offset,
        )

    @service_operation("add_holding")
    async def add_holding(
        self,
        portfolio_id: str,
        security_id: str,
        quantity: str,
        cost_basis: str,
        acquisition_date: str,
        lot_id: str | None = None,
        notes: str | None = None,
        tags: list[str] | None = None,
    ) -> dict:
        """
        Add or update a holding in a portfolio.

        If a holding for the same security exists, updates with averaged cost basis.
        Otherwise creates a new holding.

        Args:
            portfolio_id: Portfolio ID
            security_id: Security ID
            quantity: Number of shares (as string decimal)
            cost_basis: Per-share cost (as string decimal)
            acquisition_date: Date acquired (ISO date)
            lot_id: Optional specific lot ID for tax lot tracking
            notes: Optional notes
            tags: Optional tags for categorization

        Returns:
            Created or updated holding dict
        """
        # Verify portfolio exists
        await self.get_portfolio(portfolio_id)

        # Calculate total cost
        qty = Decimal(quantity)
        basis = Decimal(cost_basis)
        total_cost = qty * basis

        # Check if holding exists for this security
        existing_holdings = await self.db.express.list(
            "Holding",
            filter={
                "portfolio_id": portfolio_id,
                "security_id": security_id,
                "active": True,
            },
            limit=1,
        )

        if existing_holdings and not lot_id:
            # Update existing holding with averaged cost basis
            existing = existing_holdings[0]
            existing_qty = Decimal(existing["quantity"])
            existing_total = Decimal(existing["total_cost"])

            new_qty = existing_qty + qty
            new_total_cost = existing_total + total_cost
            new_cost_basis = new_total_cost / new_qty if new_qty > 0 else Decimal("0")

            return await self.db.express.update(
                "Holding",
                filter={"id": existing["id"]},
                fields={
                    "quantity": str(new_qty),
                    "cost_basis": str(new_cost_basis),
                    "total_cost": str(new_total_cost),
                    "notes": notes if notes else existing.get("notes"),
                    "tags": tags if tags else existing.get("tags", []),
                },
            )

        # Calculate holding period (long > 1 year)
        holding_period = "short"  # Default, would calculate based on dates

        # Create new holding
        holding_id = self.generate_id("hold-")
        holding_data = {
            "id": holding_id,
            "portfolio_id": portfolio_id,
            "security_id": security_id,
            "quantity": quantity,
            "cost_basis": cost_basis,
            "total_cost": str(total_cost),
            "lot_id": lot_id,
            "acquisition_date": acquisition_date,
            "holding_period": holding_period,
            "notes": notes,
            "tags": tags or [],
            "active": True,
        }

        return await self.db.express.create("Holding", holding_data)

    @service_operation("update_holding")
    async def update_holding(
        self,
        holding_id: str,
        updates: dict,
    ) -> dict:
        """
        Update a holding.

        Args:
            holding_id: Holding ID
            updates: Fields to update

        Returns:
            Updated holding dict

        Raises:
            NotFoundError: If holding not found
        """
        # Remove timestamp fields
        updates.pop("created_at", None)
        updates.pop("updated_at", None)

        # Recalculate total_cost if quantity or cost_basis changed
        if "quantity" in updates or "cost_basis" in updates:
            existing = await self.db.express.read("Holding", holding_id)
            if not existing:
                raise NotFoundError(
                    f"Holding {holding_id} not found",
                    service="PortfolioService",
                    operation="update_holding",
                )

            qty = Decimal(updates.get("quantity", existing["quantity"]))
            basis = Decimal(updates.get("cost_basis", existing["cost_basis"]))
            updates["total_cost"] = str(qty * basis)

        result = await self.db.express.update(
            "Holding",
            filter={"id": holding_id},
            fields=updates,
        )

        if not result:
            raise NotFoundError(
                f"Holding {holding_id} not found",
                service="PortfolioService",
                operation="update_holding",
            )

        return result

    @service_operation("close_holding")
    async def close_holding(self, holding_id: str) -> dict:
        """
        Close a holding (set quantity to 0 and mark inactive).

        Args:
            holding_id: Holding ID

        Returns:
            Updated holding dict
        """
        result = await self.db.express.update(
            "Holding",
            filter={"id": holding_id},
            fields={
                "quantity": "0",
                "market_value": "0",
                "weight": "0",
                "active": False,
            },
        )

        if not result:
            raise NotFoundError(
                f"Holding {holding_id} not found",
                service="PortfolioService",
                operation="close_holding",
            )

        return result

    # =========================================
    # TRANSACTION RECORDING
    # =========================================

    @service_operation("record_transaction")
    async def record_transaction(
        self,
        portfolio_id: str,
        security_id: str,
        transaction_type: str,
        transaction_date: str,
        settlement_date: str,
        quantity: str,
        price: str,
        commission: str = "0",
        fees: str = "0",
        taxes: str = "0",
        currency: str = "USD",
        fx_rate: str = "1.0",
        order_id: str | None = None,
        broker: str | None = None,
        execution_venue: str | None = None,
        compliance_status: str = "approved",
        compliance_notes: str | None = None,
    ) -> dict:
        """
        Record a transaction and update holdings automatically.

        Args:
            portfolio_id: Portfolio ID
            security_id: Security ID
            transaction_type: "buy" | "sell" | "dividend" | etc.
            transaction_date: Trade date (ISO)
            settlement_date: Settlement date (ISO)
            quantity: Number of shares (negative for sells)
            price: Per-share price
            commission: Broker commission
            fees: Exchange fees
            taxes: Withholding taxes
            currency: Transaction currency
            fx_rate: FX rate to base currency
            order_id: External order reference
            broker: Executing broker
            execution_venue: Exchange/venue
            compliance_status: Compliance approval status
            compliance_notes: Compliance notes

        Returns:
            Created transaction dict
        """
        # Verify portfolio exists
        await self.get_portfolio(portfolio_id)

        # Calculate amounts
        qty = Decimal(quantity)
        prc = Decimal(price)
        comm = Decimal(commission)
        fee = Decimal(fees)
        tax = Decimal(taxes)

        gross_amount = qty * prc
        net_amount = gross_amount - comm - fee - tax

        # Create transaction
        transaction_id = self.generate_id("txn-")
        transaction_data = {
            "id": transaction_id,
            "portfolio_id": portfolio_id,
            "security_id": security_id,
            "transaction_type": transaction_type,
            "transaction_date": transaction_date,
            "settlement_date": settlement_date,
            "quantity": quantity,
            "price": price,
            "gross_amount": str(gross_amount),
            "commission": commission,
            "fees": fees,
            "taxes": taxes,
            "net_amount": str(net_amount),
            "currency": currency,
            "fx_rate": fx_rate,
            "order_id": order_id,
            "broker": broker,
            "execution_venue": execution_venue,
            "compliance_status": compliance_status,
            "compliance_notes": compliance_notes,
            "created_by": self.user_id,
        }

        transaction = await self.db.express.create("Transaction", transaction_data)

        # Update holdings based on transaction type
        if transaction_type == "buy":
            await self.add_holding(
                portfolio_id=portfolio_id,
                security_id=security_id,
                quantity=quantity,
                cost_basis=price,
                acquisition_date=transaction_date,
            )
        elif transaction_type == "sell":
            # Reduce existing holding
            holdings = await self.db.express.list(
                "Holding",
                filter={
                    "portfolio_id": portfolio_id,
                    "security_id": security_id,
                    "active": True,
                },
                limit=1,
            )
            if holdings:
                holding = holdings[0]
                current_qty = Decimal(holding["quantity"])
                sell_qty = abs(qty)  # quantity is negative for sells
                new_qty = current_qty - sell_qty

                if new_qty <= 0:
                    await self.close_holding(holding["id"])
                else:
                    await self.update_holding(
                        holding["id"],
                        {"quantity": str(new_qty)},
                    )

        return transaction

    @service_operation("get_transactions")
    async def get_transactions(
        self,
        portfolio_id: str,
        start_date: str | None = None,
        end_date: str | None = None,
        transaction_type: str | None = None,
        security_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """
        Get transactions for a portfolio.

        Args:
            portfolio_id: Portfolio ID
            start_date: Filter by start date (ISO)
            end_date: Filter by end date (ISO)
            transaction_type: Filter by type
            security_id: Filter by security
            limit: Maximum records
            offset: Records to skip

        Returns:
            List of transaction dicts
        """
        # Verify portfolio exists
        await self.get_portfolio(portfolio_id)

        filter_dict: dict[str, Any] = {
            "portfolio_id": portfolio_id,
        }

        if transaction_type:
            filter_dict["transaction_type"] = transaction_type

        if security_id:
            filter_dict["security_id"] = security_id

        if start_date:
            filter_dict["transaction_date"] = {"$gte": start_date}

        if end_date:
            if "transaction_date" in filter_dict:
                filter_dict["transaction_date"]["$lte"] = end_date
            else:
                filter_dict["transaction_date"] = {"$lte": end_date}

        return await self.db.express.list(
            "Transaction",
            filter=filter_dict,
            limit=limit,
            offset=offset,
        )

    # =========================================
    # NAV OPERATIONS
    # =========================================

    @service_operation("calculate_nav")
    async def calculate_nav(
        self,
        portfolio_id: str,
        valuation_date: str | None = None,
    ) -> dict:
        """
        Calculate portfolio NAV (Net Asset Value).

        Args:
            portfolio_id: Portfolio ID
            valuation_date: Date for valuation (defaults to today)

        Returns:
            NAV calculation result dict
        """
        # Get portfolio
        portfolio = await self.get_portfolio(portfolio_id)

        # Get holdings
        holdings = await self.get_holdings(portfolio_id, include_closed=False)

        # Get cash accounts
        cash_accounts = await self.db.express.list(
            "CashAccount",
            filter={"portfolio_id": portfolio_id},
        )

        # Calculate values
        securities_value = Decimal("0")
        for holding in holdings:
            if holding.get("market_value"):
                securities_value += Decimal(holding["market_value"])
            elif holding.get("current_price") and holding.get("quantity"):
                securities_value += Decimal(holding["current_price"]) * Decimal(holding["quantity"])

        cash_value = Decimal("0")
        for cash in cash_accounts:
            if cash.get("balance"):
                cash_value += Decimal(cash["balance"])

        total_value = securities_value + cash_value

        # Use provided date or today
        effective_date = valuation_date or datetime.now(UTC).strftime("%Y-%m-%d")

        # Create or update valuation record
        valuation_id = f"{portfolio_id}_{effective_date}"

        valuation_data = {
            "id": valuation_id,
            "portfolio_id": portfolio_id,
            "valuation_date": effective_date,
            "total_value": str(total_value),
            "securities_value": str(securities_value),
            "cash_value": str(cash_value),
            "pricing_source": "calculated",
            "is_final": False,
        }

        # Use upsert to create or update
        existing = await self.db.express.read("PortfolioValuation", valuation_id)
        if existing:
            await self.db.express.update(
                "PortfolioValuation",
                filter={"id": valuation_id},
                fields={
                    "total_value": str(total_value),
                    "securities_value": str(securities_value),
                    "cash_value": str(cash_value),
                },
            )
        else:
            await self.db.express.create("PortfolioValuation", valuation_data)

        return {
            "portfolio_id": portfolio_id,
            "portfolio_name": portfolio["name"],
            "valuation_date": effective_date,
            "total_value": str(total_value),
            "securities_value": str(securities_value),
            "cash_value": str(cash_value),
            "holding_count": len(holdings),
        }

    @service_operation("get_nav_history")
    async def get_nav_history(
        self,
        portfolio_id: str,
        start_date: str | None = None,
        end_date: str | None = None,
        limit: int = 100,
    ) -> list[dict]:
        """
        Get historical NAV values.

        Args:
            portfolio_id: Portfolio ID
            start_date: Start date filter (ISO)
            end_date: End date filter (ISO)
            limit: Maximum records

        Returns:
            List of valuation dicts ordered by date
        """
        # Verify portfolio exists
        await self.get_portfolio(portfolio_id)

        filter_dict: dict[str, Any] = {
            "portfolio_id": portfolio_id,
        }

        if start_date:
            filter_dict["valuation_date"] = {"$gte": start_date}

        if end_date:
            if "valuation_date" in filter_dict:
                filter_dict["valuation_date"]["$lte"] = end_date
            else:
                filter_dict["valuation_date"] = {"$lte": end_date}

        return await self.db.express.list(
            "PortfolioValuation",
            filter=filter_dict,
            limit=limit,
        )

    # =========================================
    # HEALTH SCAN
    # =========================================

    @service_operation("run_health_scan")
    async def run_health_scan(self, portfolio_id: str) -> dict:
        """
        Run a health scan on a portfolio.

        Checks for:
        - Concentration risk (single name > 10%)
        - Sector allocation limits
        - Cash level compliance
        - Position count within limits

        Args:
            portfolio_id: Portfolio ID

        Returns:
            Health scan results with scores and issues
        """
        portfolio = await self.get_portfolio(portfolio_id)
        holdings = await self.get_holdings(portfolio_id)
        constraints = portfolio.get("constraints", {})

        issues = []
        score = 100

        # Get total value
        nav_result = await self.calculate_nav(portfolio_id)
        total_value = Decimal(nav_result["total_value"])

        if total_value <= 0:
            return {
                "portfolio_id": portfolio_id,
                "score": 0,
                "issues": [{"type": "error", "message": "Portfolio has no value"}],
                "checks": [],
            }

        # Check single name concentration
        single_name_limit = Decimal(str(constraints.get("single_name_limit", 0.10)))
        for holding in holdings:
            if holding.get("market_value"):
                weight = Decimal(holding["market_value"]) / total_value
                if weight > single_name_limit:
                    issues.append(
                        {
                            "type": "concentration",
                            "severity": "warning",
                            "message": f"Holding {holding['security_id']} exceeds single name limit ({weight:.1%} > {single_name_limit:.1%})",
                        }
                    )
                    score -= 10

        # Check position count
        min_positions = constraints.get("min_positions", 10)
        max_positions = constraints.get("max_positions", 50)
        position_count = len([h for h in holdings if Decimal(h.get("quantity", "0")) > 0])

        if position_count < min_positions:
            issues.append(
                {
                    "type": "diversification",
                    "severity": "warning",
                    "message": f"Portfolio has fewer positions ({position_count}) than minimum ({min_positions})",
                }
            )
            score -= 15

        if position_count > max_positions:
            issues.append(
                {
                    "type": "diversification",
                    "severity": "info",
                    "message": f"Portfolio has more positions ({position_count}) than recommended maximum ({max_positions})",
                }
            )
            score -= 5

        # Check cash levels
        cash_value = Decimal(nav_result["cash_value"])
        cash_pct = cash_value / total_value if total_value > 0 else Decimal("0")
        cash_min = Decimal(str(constraints.get("cash_minimum", 0.02)))
        cash_max = Decimal(str(constraints.get("cash_maximum", 0.10)))

        if cash_pct < cash_min:
            issues.append(
                {
                    "type": "liquidity",
                    "severity": "warning",
                    "message": f"Cash level ({cash_pct:.1%}) below minimum ({cash_min:.1%})",
                }
            )
            score -= 10

        if cash_pct > cash_max:
            issues.append(
                {
                    "type": "liquidity",
                    "severity": "info",
                    "message": f"Cash level ({cash_pct:.1%}) above maximum ({cash_max:.1%})",
                }
            )
            score -= 5

        return {
            "portfolio_id": portfolio_id,
            "portfolio_name": portfolio["name"],
            "score": max(0, score),
            "issues": issues,
            "metrics": {
                "total_value": str(total_value),
                "position_count": position_count,
                "cash_percentage": str(cash_pct),
            },
        }

    # =========================================
    # ANALYTICS
    # =========================================

    @service_operation("get_sector_allocation")
    async def get_sector_allocation(self, portfolio_id: str) -> list[dict]:
        """
        Get sector allocation for a portfolio.

        Args:
            portfolio_id: Portfolio ID

        Returns:
            List of sector allocations with weights
        """
        holdings = await self.get_holdings(portfolio_id)

        # Group by sector (would need security lookup for real implementation)
        # For now, return placeholder
        sector_totals: dict[str, Decimal] = {}
        total_value = Decimal("0")

        for holding in holdings:
            market_value = Decimal(holding.get("market_value", "0"))
            # In real implementation, would look up security's sector
            sector = "Unknown"  # Placeholder
            sector_totals[sector] = sector_totals.get(sector, Decimal("0")) + market_value
            total_value += market_value

        allocations = []
        for sector, value in sector_totals.items():
            weight = value / total_value if total_value > 0 else Decimal("0")
            allocations.append(
                {
                    "sector": sector,
                    "value": str(value),
                    "weight": str(weight),
                }
            )

        return allocations

    @service_operation("get_asset_allocation")
    async def get_asset_allocation(self, portfolio_id: str) -> list[dict]:
        """
        Get asset class allocation for a portfolio.

        Args:
            portfolio_id: Portfolio ID

        Returns:
            List of asset class allocations with weights
        """
        holdings = await self.get_holdings(portfolio_id)

        # Group by asset class (would need security lookup for real implementation)
        asset_totals: dict[str, Decimal] = {}
        total_value = Decimal("0")

        for holding in holdings:
            market_value = Decimal(holding.get("market_value", "0"))
            # In real implementation, would look up security's asset class
            asset_class = "Equity"  # Placeholder
            asset_totals[asset_class] = asset_totals.get(asset_class, Decimal("0")) + market_value
            total_value += market_value

        allocations = []
        for asset_class, value in asset_totals.items():
            weight = value / total_value if total_value > 0 else Decimal("0")
            allocations.append(
                {
                    "asset_class": asset_class,
                    "value": str(value),
                    "weight": str(weight),
                }
            )

        return allocations

    @service_operation("get_top_holdings")
    async def get_top_holdings(
        self,
        portfolio_id: str,
        limit: int = 10,
    ) -> list[dict]:
        """
        Get top holdings by market value.

        Args:
            portfolio_id: Portfolio ID
            limit: Number of top holdings to return

        Returns:
            List of holdings sorted by market value descending
        """
        holdings = await self.get_holdings(portfolio_id)

        # Sort by market value
        sorted_holdings = sorted(
            holdings,
            key=lambda h: Decimal(h.get("market_value", "0")),
            reverse=True,
        )

        return sorted_holdings[:limit]
