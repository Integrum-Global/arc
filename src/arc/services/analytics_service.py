"""
Analytics service for ARC investment platform.

Provides financial ratio calculations, threshold alerting,
peer benchmarking, and trend analysis using DataFlow Express API.

CRITICAL RULES:
- NEVER manually set created_at or updated_at - DataFlow manages these
- Use $null operator to filter soft-deleted records
- Express API for simple CRUD, calculations for complex operations
"""

from datetime import UTC, datetime
from decimal import Decimal
from statistics import mean, median
from typing import Any

from arc.services.base import (
    BaseService,
    ConflictError,
    NotFoundError,
    ValidationError,
    service_operation,
)

# Financial ratio classifications
RATIO_CLASSES = {
    "liquidity": [
        "current_ratio",
        "quick_ratio",
        "cash_ratio",
        "working_capital_ratio",
    ],
    "profitability": [
        "gross_margin",
        "operating_margin",
        "net_margin",
        "return_on_equity",
        "return_on_assets",
        "return_on_invested_capital",
    ],
    "efficiency": [
        "asset_turnover",
        "inventory_turnover",
        "receivables_turnover",
        "payables_turnover",
        "working_capital_turnover",
    ],
    "leverage": [
        "debt_to_equity",
        "debt_to_assets",
        "interest_coverage",
        "debt_to_ebitda",
        "equity_multiplier",
    ],
    "valuation": [
        "price_to_earnings",
        "price_to_book",
        "price_to_sales",
        "price_to_cash_flow",
        "ev_to_ebitda",
        "dividend_yield",
    ],
    "growth": [
        "revenue_growth",
        "earnings_growth",
        "book_value_growth",
        "dividend_growth",
    ],
}

ALL_RATIOS = []
for ratios in RATIO_CLASSES.values():
    ALL_RATIOS.extend(ratios)


class AnalyticsService(BaseService):
    """
    Service for analytics operations.

    Provides:
    - Financial ratio retrieval and calculations
    - Threshold-based alerting
    - Peer group management and benchmarking
    - Trend analysis
    """

    # =========================================
    # RATIO CALCULATIONS
    # =========================================

    @service_operation("calculate_ratios")
    async def calculate_ratios(
        self,
        security_ids: list[str] | None = None,
        ratio_names: list[str] | None = None,
        force_recalculate: bool = False,
    ) -> dict:
        """
        Calculate financial ratios for securities.

        Args:
            security_ids: List of security IDs (None for all)
            ratio_names: Specific ratios to calculate (None for all)
            force_recalculate: Recalculate even if recent values exist

        Returns:
            Calculation summary with counts
        """
        # Get securities to process
        filter_dict: dict[str, Any] = {"active": True}
        if security_ids:
            filter_dict["id"] = {"$in": security_ids}

        securities = await self.db.express.list("Security", filter=filter_dict, limit=1000)

        calculated_count = 0
        error_count = 0
        calculation_date = datetime.now(UTC).strftime("%Y-%m-%d")

        for security in securities:
            try:
                # Get fundamentals for the security
                fundamentals = await self.db.express.list(
                    "CompanyFundamentals",
                    filter={"security_id": security["id"]},
                    limit=1,
                )

                if not fundamentals:
                    continue

                latest_fundamentals = fundamentals[0]

                # Calculate and store ratios
                ratios_to_calc = ratio_names or ALL_RATIOS
                for ratio_name in ratios_to_calc:
                    ratio_value = self._calculate_ratio(ratio_name, latest_fundamentals)
                    if ratio_value is not None:
                        ratio_id = f"{security['id']}_{calculation_date}_{ratio_name}"

                        # Determine ratio class
                        ratio_class = None
                        for cls, ratios in RATIO_CLASSES.items():
                            if ratio_name in ratios:
                                ratio_class = cls
                                break

                        # Check if exists
                        existing = await self.db.express.read("SecurityRatio", ratio_id)
                        if existing and not force_recalculate:
                            continue

                        ratio_data = {
                            "id": ratio_id,
                            "security_id": security["id"],
                            "calculation_date": calculation_date,
                            "ratio_class": ratio_class or "other",
                            "ratio_name": ratio_name,
                            "ratio_value": str(ratio_value),
                            "source_fundamentals_id": latest_fundamentals.get("id"),
                        }

                        if existing:
                            await self.db.express.update(
                                "SecurityRatio",
                                filter={"id": ratio_id},
                                fields={"ratio_value": str(ratio_value)},
                            )
                        else:
                            await self.db.express.create("SecurityRatio", ratio_data)

                        calculated_count += 1

            except Exception as e:
                self.logger.warning(f"Error calculating ratios for {security['id']}: {e}")
                error_count += 1

        return {
            "securities_processed": len(securities),
            "ratios_calculated": calculated_count,
            "errors": error_count,
            "calculation_date": calculation_date,
        }

    def _calculate_ratio(self, ratio_name: str, fundamentals: dict) -> Decimal | None:
        """Calculate a specific ratio from fundamentals data."""
        try:
            # Liquidity Ratios
            if ratio_name == "current_ratio":
                current_assets = Decimal(fundamentals.get("current_assets") or "0")
                current_liabilities = Decimal(fundamentals.get("current_liabilities") or "0")
                if current_liabilities > 0:
                    return current_assets / current_liabilities

            elif ratio_name == "quick_ratio":
                current_assets = Decimal(fundamentals.get("current_assets") or "0")
                inventory = Decimal(fundamentals.get("inventory") or "0")
                current_liabilities = Decimal(fundamentals.get("current_liabilities") or "0")
                if current_liabilities > 0:
                    return (current_assets - inventory) / current_liabilities

            elif ratio_name == "cash_ratio":
                cash = Decimal(fundamentals.get("cash_and_equivalents") or "0")
                current_liabilities = Decimal(fundamentals.get("current_liabilities") or "0")
                if current_liabilities > 0:
                    return cash / current_liabilities

            # Profitability Ratios
            elif ratio_name == "gross_margin":
                gross_profit = Decimal(fundamentals.get("gross_profit") or "0")
                revenue = Decimal(fundamentals.get("revenue") or "0")
                if revenue > 0:
                    return gross_profit / revenue

            elif ratio_name == "operating_margin":
                operating_income = Decimal(fundamentals.get("operating_income") or "0")
                revenue = Decimal(fundamentals.get("revenue") or "0")
                if revenue > 0:
                    return operating_income / revenue

            elif ratio_name == "net_margin":
                net_income = Decimal(fundamentals.get("net_income") or "0")
                revenue = Decimal(fundamentals.get("revenue") or "0")
                if revenue > 0:
                    return net_income / revenue

            elif ratio_name == "return_on_equity":
                net_income = Decimal(fundamentals.get("net_income") or "0")
                total_equity = Decimal(fundamentals.get("total_equity") or "0")
                if total_equity > 0:
                    return net_income / total_equity

            elif ratio_name == "return_on_assets":
                net_income = Decimal(fundamentals.get("net_income") or "0")
                total_assets = Decimal(fundamentals.get("total_assets") or "0")
                if total_assets > 0:
                    return net_income / total_assets

            # Efficiency Ratios
            elif ratio_name == "asset_turnover":
                revenue = Decimal(fundamentals.get("revenue") or "0")
                total_assets = Decimal(fundamentals.get("total_assets") or "0")
                if total_assets > 0:
                    return revenue / total_assets

            elif ratio_name == "inventory_turnover":
                cost_of_revenue = Decimal(fundamentals.get("cost_of_revenue") or "0")
                inventory = Decimal(fundamentals.get("inventory") or "0")
                if inventory > 0:
                    return cost_of_revenue / inventory

            # Leverage Ratios
            elif ratio_name == "debt_to_equity":
                total_debt = Decimal(fundamentals.get("total_debt") or "0")
                total_equity = Decimal(fundamentals.get("total_equity") or "0")
                if total_equity > 0:
                    return total_debt / total_equity

            elif ratio_name == "debt_to_assets":
                total_debt = Decimal(fundamentals.get("total_debt") or "0")
                total_assets = Decimal(fundamentals.get("total_assets") or "0")
                if total_assets > 0:
                    return total_debt / total_assets

            elif ratio_name == "interest_coverage":
                ebit = Decimal(fundamentals.get("ebit") or "0")
                interest_expense = Decimal(fundamentals.get("interest_expense") or "0")
                if interest_expense > 0:
                    return ebit / interest_expense

            elif ratio_name == "debt_to_ebitda":
                total_debt = Decimal(fundamentals.get("total_debt") or "0")
                ebitda = Decimal(fundamentals.get("ebitda") or "0")
                if ebitda > 0:
                    return total_debt / ebitda

            return None
        except (TypeError, ValueError, ZeroDivisionError):
            return None

    @service_operation("get_security_ratios")
    async def get_security_ratios(
        self,
        security_id: str,
        as_of_date: str | None = None,
    ) -> dict | None:
        """
        Get all ratios for a security organized by class.

        Args:
            security_id: Security ID
            as_of_date: Date for ratios (defaults to latest)

        Returns:
            Ratios organized by class or None if not found
        """
        # Get security to verify it exists
        security = await self.db.express.read("Security", security_id)
        if not security:
            raise NotFoundError(
                f"Security {security_id} not found",
                service="AnalyticsService",
                operation="get_security_ratios",
            )

        # Build filter
        filter_dict: dict[str, Any] = {"security_id": security_id}
        if as_of_date:
            filter_dict["calculation_date"] = as_of_date

        ratios = await self.db.express.list(
            "SecurityRatio",
            filter=filter_dict,
            limit=100,
        )

        if not ratios:
            return None

        # Find the most recent date if not specified
        if not as_of_date:
            latest_date = max(r["calculation_date"] for r in ratios)
            ratios = [r for r in ratios if r["calculation_date"] == latest_date]

        # Organize by class
        result: dict[str, Any] = {
            "security_id": security_id,
            "calculation_date": ratios[0]["calculation_date"] if ratios else None,
            "liquidity": {},
            "profitability": {},
            "efficiency": {},
            "leverage": {},
            "valuation": {},
            "growth": {},
        }

        for ratio in ratios:
            ratio_class = ratio.get("ratio_class", "other")
            ratio_name = ratio.get("ratio_name")
            ratio_value = ratio.get("ratio_value")

            if ratio_class in result and ratio_name:
                result[ratio_class][ratio_name] = {
                    "value": ratio_value,
                    "peer_percentile": ratio.get("peer_percentile"),
                    "sector_average": ratio.get("sector_average"),
                    "trend_direction": ratio.get("trend_direction"),
                }

        return result

    @service_operation("get_ratio_history")
    async def get_ratio_history(
        self,
        security_id: str,
        ratio_name: str,
        start_date: str | None = None,
        end_date: str | None = None,
        limit: int = 100,
    ) -> list[dict]:
        """
        Get historical values for a specific ratio.

        Args:
            security_id: Security ID
            ratio_name: Name of ratio
            start_date: Start date filter (ISO)
            end_date: End date filter (ISO)
            limit: Maximum records

        Returns:
            List of ratio values over time
        """
        filter_dict: dict[str, Any] = {
            "security_id": security_id,
            "ratio_name": ratio_name,
        }

        if start_date:
            filter_dict["calculation_date"] = {"$gte": start_date}

        if end_date:
            if "calculation_date" in filter_dict:
                filter_dict["calculation_date"]["$lte"] = end_date
            else:
                filter_dict["calculation_date"] = {"$lte": end_date}

        return await self.db.express.list(
            "SecurityRatio",
            filter=filter_dict,
            limit=limit,
        )

    # =========================================
    # THRESHOLD ALERTING
    # =========================================

    @service_operation("configure_threshold")
    async def configure_threshold(
        self,
        ratio_class: str,
        ratio_name: str,
        warning_threshold: str,
        critical_threshold: str,
        comparison: str = "lt",
        portfolio_id: str | None = None,
        security_id: str | None = None,
        cooldown_hours: int = 24,
        alert_on_improvement: bool = False,
    ) -> dict:
        """
        Create or update a threshold configuration.

        Args:
            ratio_class: Class of ratio (liquidity, profitability, etc.)
            ratio_name: Specific ratio name
            warning_threshold: Value for warning alert
            critical_threshold: Value for critical alert
            comparison: Comparison operator (lt, gt, eq, lte, gte)
            portfolio_id: Optional portfolio scope
            security_id: Optional security scope
            cooldown_hours: Hours before re-alerting
            alert_on_improvement: Alert when ratio improves

        Returns:
            Created or updated threshold config
        """
        if not self.user_id:
            raise ValidationError(
                "User ID required for threshold configuration",
                service="AnalyticsService",
                operation="configure_threshold",
            )

        if ratio_name not in ALL_RATIOS:
            raise ValidationError(
                f"Unknown ratio: {ratio_name}",
                service="AnalyticsService",
                operation="configure_threshold",
                details={"valid_ratios": ALL_RATIOS},
            )

        if comparison not in ("lt", "gt", "eq", "lte", "gte"):
            raise ValidationError(
                f"Invalid comparison operator: {comparison}",
                service="AnalyticsService",
                operation="configure_threshold",
            )

        # Check for existing threshold
        existing = await self.db.express.list(
            "AlertThreshold",
            filter={
                "user_id": self.user_id,
                "ratio_name": ratio_name,
                "portfolio_id": portfolio_id or {"$null": True},
                "security_id": security_id or {"$null": True},
            },
            limit=1,
        )

        if existing:
            # Update existing threshold
            return await self.db.express.update(
                "AlertThreshold",
                filter={"id": existing[0]["id"]},
                fields={
                    "warning_threshold": warning_threshold,
                    "critical_threshold": critical_threshold,
                    "comparison": comparison,
                    "cooldown_hours": cooldown_hours,
                    "alert_on_improvement": alert_on_improvement,
                    "enabled": True,
                },
            )

        # Create new threshold
        threshold_id = self.generate_id("thresh-")
        threshold_data = {
            "id": threshold_id,
            "user_id": self.user_id,
            "portfolio_id": portfolio_id,
            "security_id": security_id,
            "ratio_class": ratio_class,
            "ratio_name": ratio_name,
            "warning_threshold": warning_threshold,
            "critical_threshold": critical_threshold,
            "comparison": comparison,
            "enabled": True,
            "alert_on_improvement": alert_on_improvement,
            "cooldown_hours": cooldown_hours,
            "times_triggered": 0,
        }

        return await self.db.express.create("AlertThreshold", threshold_data)

    @service_operation("get_thresholds")
    async def get_thresholds(
        self,
        ratio_name: str | None = None,
        portfolio_id: str | None = None,
        enabled_only: bool = True,
    ) -> list[dict]:
        """
        Get user's configured thresholds.

        Args:
            ratio_name: Filter by ratio
            portfolio_id: Filter by portfolio
            enabled_only: Only return enabled thresholds

        Returns:
            List of threshold configs
        """
        if not self.user_id:
            return []

        filter_dict: dict[str, Any] = {"user_id": self.user_id}

        if ratio_name:
            filter_dict["ratio_name"] = ratio_name

        if portfolio_id:
            filter_dict["portfolio_id"] = portfolio_id

        if enabled_only:
            filter_dict["enabled"] = True

        return await self.db.express.list("AlertThreshold", filter=filter_dict, limit=100)

    @service_operation("delete_threshold")
    async def delete_threshold(self, threshold_id: str) -> bool:
        """
        Delete a threshold configuration.

        Args:
            threshold_id: Threshold ID to delete

        Returns:
            True if deleted
        """
        threshold = await self.db.express.read("AlertThreshold", threshold_id)

        if not threshold:
            raise NotFoundError(
                f"Threshold {threshold_id} not found",
                service="AnalyticsService",
                operation="delete_threshold",
            )

        if threshold.get("user_id") != self.user_id:
            raise ValidationError(
                "Cannot delete another user's threshold",
                service="AnalyticsService",
                operation="delete_threshold",
            )

        return await self.db.express.delete("AlertThreshold", threshold_id)

    @service_operation("check_thresholds")
    async def check_thresholds(
        self,
        user_id: str | None = None,
    ) -> dict:
        """
        Check all enabled thresholds and generate alerts.

        Args:
            user_id: User to check thresholds for (defaults to current user)

        Returns:
            Summary of checks and generated alerts
        """
        effective_user_id = user_id or self.user_id
        if not effective_user_id:
            raise ValidationError(
                "User ID required",
                service="AnalyticsService",
                operation="check_thresholds",
            )

        # Get enabled thresholds
        thresholds = await self.db.express.list(
            "AlertThreshold",
            filter={"user_id": effective_user_id, "enabled": True},
            limit=100,
        )

        alerts_generated = 0
        thresholds_checked = 0
        now = datetime.now(UTC)

        for threshold in thresholds:
            thresholds_checked += 1

            # Check cooldown
            last_triggered = threshold.get("last_triggered_at")
            if last_triggered:
                last_triggered_dt = datetime.fromisoformat(last_triggered.replace("Z", "+00:00"))
                cooldown_hours = threshold.get("cooldown_hours", 24)
                hours_since = (now - last_triggered_dt).total_seconds() / 3600
                if hours_since < cooldown_hours:
                    continue

            # Get relevant ratio value
            security_id = threshold.get("security_id")
            ratio_name = threshold.get("ratio_name")

            if security_id:
                # Check specific security
                ratios = await self.db.express.list(
                    "SecurityRatio",
                    filter={"security_id": security_id, "ratio_name": ratio_name},
                    limit=1,
                )
            else:
                # Would need to check all securities in portfolio or all
                # For now, skip non-security-specific thresholds
                continue

            if not ratios:
                continue

            ratio = ratios[0]
            ratio_value = Decimal(ratio.get("ratio_value", "0"))
            warning_threshold = Decimal(threshold.get("warning_threshold", "0"))
            critical_threshold = Decimal(threshold.get("critical_threshold", "0"))
            comparison = threshold.get("comparison", "lt")

            # Check if threshold is breached
            severity = None
            threshold_value = None

            if comparison == "lt":
                if ratio_value < critical_threshold:
                    severity = "critical"
                    threshold_value = critical_threshold
                elif ratio_value < warning_threshold:
                    severity = "warning"
                    threshold_value = warning_threshold
            elif comparison == "gt":
                if ratio_value > critical_threshold:
                    severity = "critical"
                    threshold_value = critical_threshold
                elif ratio_value > warning_threshold:
                    severity = "warning"
                    threshold_value = warning_threshold
            elif comparison == "lte":
                if ratio_value <= critical_threshold:
                    severity = "critical"
                    threshold_value = critical_threshold
                elif ratio_value <= warning_threshold:
                    severity = "warning"
                    threshold_value = warning_threshold
            elif comparison == "gte":
                if ratio_value >= critical_threshold:
                    severity = "critical"
                    threshold_value = critical_threshold
                elif ratio_value >= warning_threshold:
                    severity = "warning"
                    threshold_value = warning_threshold

            if severity:
                # Create alert
                alert_id = self.generate_id("alert-")
                alert_data = {
                    "id": alert_id,
                    "user_id": effective_user_id,
                    "security_id": security_id,
                    "portfolio_id": threshold.get("portfolio_id"),
                    "alert_type": "threshold",
                    "severity": severity,
                    "title": f"{ratio_name} {comparison} threshold breached",
                    "message": f"{ratio_name} is {ratio_value}, which is {comparison} the {severity} threshold of {threshold_value}",
                    "trigger_value": str(ratio_value),
                    "threshold_value": str(threshold_value),
                    "ratio_name": ratio_name,
                    "comparison": comparison,
                    "triggered_at": now.isoformat(),
                    "status": "active",
                    "source": "system",
                }

                await self.db.express.create("Alert", alert_data)
                alerts_generated += 1

                # Update threshold trigger time
                await self.db.express.update(
                    "AlertThreshold",
                    filter={"id": threshold["id"]},
                    fields={
                        "last_triggered_at": now.isoformat(),
                        "last_triggered_value": str(ratio_value),
                        "times_triggered": threshold.get("times_triggered", 0) + 1,
                    },
                )

        return {
            "thresholds_checked": thresholds_checked,
            "alerts_generated": alerts_generated,
            "checked_at": now.isoformat(),
        }

    # =========================================
    # ALERTS
    # =========================================

    @service_operation("get_user_alerts")
    async def get_user_alerts(
        self,
        status: str | None = None,
        alert_type: str | None = None,
        severity: str | None = None,
        limit: int = 100,
    ) -> list[dict]:
        """
        Get alerts for the current user.

        Args:
            status: Filter by status (active, acknowledged, dismissed, resolved)
            alert_type: Filter by type
            severity: Filter by severity
            limit: Maximum records

        Returns:
            List of alerts
        """
        if not self.user_id:
            return []

        filter_dict: dict[str, Any] = {"user_id": self.user_id}

        if status:
            filter_dict["status"] = status

        if alert_type:
            filter_dict["alert_type"] = alert_type

        if severity:
            filter_dict["severity"] = severity

        return await self.db.express.list("Alert", filter=filter_dict, limit=limit)

    @service_operation("acknowledge_alert")
    async def acknowledge_alert(self, alert_id: str) -> dict:
        """
        Mark an alert as acknowledged.

        Args:
            alert_id: Alert ID

        Returns:
            Updated alert
        """
        alert = await self.db.express.read("Alert", alert_id)

        if not alert:
            raise NotFoundError(
                f"Alert {alert_id} not found",
                service="AnalyticsService",
                operation="acknowledge_alert",
            )

        if alert.get("user_id") != self.user_id:
            raise ValidationError(
                "Cannot acknowledge another user's alert",
                service="AnalyticsService",
                operation="acknowledge_alert",
            )

        now = datetime.now(UTC).isoformat()

        result = await self.db.express.update(
            "Alert",
            filter={"id": alert_id},
            fields={
                "status": "acknowledged",
                "acknowledged_at": now,
                "acknowledged_by": self.user_id,
            },
        )

        if not result:
            raise NotFoundError(f"Failed to update alert {alert_id}")

        return result

    @service_operation("dismiss_alert")
    async def dismiss_alert(
        self,
        alert_id: str,
        reason: str | None = None,
    ) -> dict:
        """
        Dismiss an alert.

        Args:
            alert_id: Alert ID
            reason: Optional dismissal reason

        Returns:
            Updated alert
        """
        alert = await self.db.express.read("Alert", alert_id)

        if not alert:
            raise NotFoundError(f"Alert {alert_id} not found")

        if alert.get("user_id") != self.user_id:
            raise ValidationError("Cannot dismiss another user's alert")

        now = datetime.now(UTC).isoformat()

        result = await self.db.express.update(
            "Alert",
            filter={"id": alert_id},
            fields={
                "status": "dismissed",
                "dismissed_at": now,
                "dismissed_by": self.user_id,
                "dismiss_reason": reason,
            },
        )

        if not result:
            raise NotFoundError(f"Failed to update alert {alert_id}")

        return result

    @service_operation("resolve_alert")
    async def resolve_alert(
        self,
        alert_id: str,
        resolution_notes: str | None = None,
    ) -> dict:
        """
        Mark an alert as resolved.

        Args:
            alert_id: Alert ID
            resolution_notes: Optional notes on resolution

        Returns:
            Updated alert
        """
        alert = await self.db.express.read("Alert", alert_id)

        if not alert:
            raise NotFoundError(f"Alert {alert_id} not found")

        if alert.get("user_id") != self.user_id:
            raise ValidationError("Cannot resolve another user's alert")

        now = datetime.now(UTC).isoformat()

        result = await self.db.express.update(
            "Alert",
            filter={"id": alert_id},
            fields={
                "status": "resolved",
                "resolved_at": now,
                "resolved_by": self.user_id,
                "resolution_notes": resolution_notes,
            },
        )

        if not result:
            raise NotFoundError(f"Failed to update alert {alert_id}")

        return result

    # =========================================
    # PEER GROUPS
    # =========================================

    @service_operation("create_peer_group")
    async def create_peer_group(
        self,
        name: str,
        security_ids: list[str],
        description: str | None = None,
        group_type: str = "custom",
        criteria: dict | None = None,
    ) -> dict:
        """
        Create a peer group for comparison.

        Args:
            name: Group name
            security_ids: List of security IDs in the group
            description: Optional description
            group_type: Type of group (sector, industry, custom)
            criteria: Optional criteria for auto-refresh

        Returns:
            Created peer group
        """
        # Check for duplicate name for this user
        existing = await self.db.express.list(
            "PeerGroup",
            filter={
                "user_id": self.user_id,
                "name": name,
            },
            limit=1,
        )

        if existing:
            raise ConflictError(
                f"Peer group '{name}' already exists",
                service="AnalyticsService",
                operation="create_peer_group",
            )

        peer_group_id = self.generate_id("peer-")
        peer_group_data = {
            "id": peer_group_id,
            "user_id": self.user_id,
            "name": name,
            "description": description,
            "group_type": group_type,
            "criteria": criteria or {},
            "security_ids": security_ids,
            "member_count": len(security_ids),
            "active": True,
        }

        return await self.db.express.create("PeerGroup", peer_group_data)

    @service_operation("get_peer_groups")
    async def get_peer_groups(
        self,
        include_system: bool = True,
        group_type: str | None = None,
    ) -> list[dict]:
        """
        Get user's peer groups plus optional system groups.

        Args:
            include_system: Include system-defined groups
            group_type: Filter by type

        Returns:
            List of peer groups
        """
        groups = []

        # User's groups
        if self.user_id:
            user_filter: dict[str, Any] = {"user_id": self.user_id, "active": True}
            if group_type:
                user_filter["group_type"] = group_type
            user_groups = await self.db.express.list("PeerGroup", filter=user_filter, limit=100)
            groups.extend(user_groups)

        # System groups
        if include_system:
            system_filter: dict[str, Any] = {"user_id": {"$null": True}, "active": True}
            if group_type:
                system_filter["group_type"] = group_type
            system_groups = await self.db.express.list("PeerGroup", filter=system_filter, limit=100)
            groups.extend(system_groups)

        return groups

    @service_operation("update_peer_group")
    async def update_peer_group(
        self,
        peer_group_id: str,
        updates: dict,
    ) -> dict:
        """
        Update a peer group.

        Args:
            peer_group_id: Peer group ID
            updates: Fields to update

        Returns:
            Updated peer group
        """
        peer_group = await self.db.express.read("PeerGroup", peer_group_id)

        if not peer_group:
            raise NotFoundError(f"Peer group {peer_group_id} not found")

        if peer_group.get("user_id") and peer_group.get("user_id") != self.user_id:
            raise ValidationError("Cannot update another user's peer group")

        # Update member count if security_ids changed
        if "security_ids" in updates:
            updates["member_count"] = len(updates["security_ids"])

        # Remove protected fields
        updates.pop("id", None)
        updates.pop("user_id", None)
        updates.pop("created_at", None)
        updates.pop("updated_at", None)

        result = await self.db.express.update(
            "PeerGroup",
            filter={"id": peer_group_id},
            fields=updates,
        )

        if not result:
            raise NotFoundError(f"Failed to update peer group {peer_group_id}")

        return result

    @service_operation("delete_peer_group")
    async def delete_peer_group(self, peer_group_id: str) -> bool:
        """
        Delete a user-created peer group.

        Args:
            peer_group_id: Peer group ID

        Returns:
            True if deleted
        """
        peer_group = await self.db.express.read("PeerGroup", peer_group_id)

        if not peer_group:
            raise NotFoundError(f"Peer group {peer_group_id} not found")

        if peer_group.get("user_id") is None:
            raise ValidationError("Cannot delete system peer group")

        if peer_group.get("user_id") != self.user_id:
            raise ValidationError("Cannot delete another user's peer group")

        return await self.db.express.delete("PeerGroup", peer_group_id)

    @service_operation("benchmark_against_peers")
    async def benchmark_against_peers(
        self,
        security_id: str,
        peer_group_id: str,
        ratio_names: list[str] | None = None,
    ) -> dict:
        """
        Benchmark a security against its peer group.

        Args:
            security_id: Security to benchmark
            peer_group_id: Peer group to compare against
            ratio_names: Specific ratios (None for all)

        Returns:
            Comparison results with percentiles
        """
        # Get peer group
        peer_group = await self.db.express.read("PeerGroup", peer_group_id)
        if not peer_group:
            raise NotFoundError(f"Peer group {peer_group_id} not found")

        peer_security_ids = peer_group.get("security_ids", [])
        if not peer_security_ids:
            raise ValidationError("Peer group has no members")

        # Get security's ratios
        security_ratios = await self.get_security_ratios(security_id)
        if not security_ratios:
            raise NotFoundError(f"No ratios found for security {security_id}")

        # Get peer ratios
        ratios_to_compare = ratio_names or ALL_RATIOS
        comparisons = {}

        for ratio_name in ratios_to_compare:
            # Get ratio values for all peers
            peer_values = []
            for peer_id in peer_security_ids:
                peer_ratios = await self.db.express.list(
                    "SecurityRatio",
                    filter={"security_id": peer_id, "ratio_name": ratio_name},
                    limit=1,
                )
                if peer_ratios and peer_ratios[0].get("ratio_value"):
                    peer_values.append(float(peer_ratios[0]["ratio_value"]))

            if not peer_values:
                continue

            # Find security's value for this ratio
            security_value = None
            for ratio_class in [
                "liquidity",
                "profitability",
                "efficiency",
                "leverage",
                "valuation",
                "growth",
            ]:
                if ratio_class in security_ratios and ratio_name in security_ratios[ratio_class]:
                    security_value = float(security_ratios[ratio_class][ratio_name].get("value", 0))
                    break

            if security_value is None:
                continue

            # Calculate percentile
            below_count = sum(1 for v in peer_values if v < security_value)
            percentile = (below_count / len(peer_values)) * 100

            # Calculate rank
            sorted_values = sorted(peer_values, reverse=True)
            rank = 1
            for i, v in enumerate(sorted_values):
                if security_value >= v:
                    rank = i + 1
                    break

            comparisons[ratio_name] = {
                "security_value": security_value,
                "peer_average": mean(peer_values),
                "peer_median": median(peer_values),
                "peer_min": min(peer_values),
                "peer_max": max(peer_values),
                "percentile": round(percentile, 1),
                "rank": rank,
                "peer_count": len(peer_values),
            }

        return {
            "security_id": security_id,
            "peer_group_id": peer_group_id,
            "peer_group_name": peer_group.get("name"),
            "comparison_date": datetime.now(UTC).strftime("%Y-%m-%d"),
            "comparisons": comparisons,
        }

    # =========================================
    # TREND ANALYSIS
    # =========================================

    @service_operation("get_ratio_trend")
    async def get_ratio_trend(
        self,
        security_id: str,
        ratio_name: str,
        periods: int = 4,
    ) -> dict:
        """
        Analyze trend for a ratio.

        Args:
            security_id: Security ID
            ratio_name: Ratio to analyze
            periods: Number of periods to analyze

        Returns:
            Trend analysis with direction and magnitude
        """
        # Get historical values
        history = await self.get_ratio_history(
            security_id=security_id,
            ratio_name=ratio_name,
            limit=periods,
        )

        if len(history) < 2:
            return {
                "security_id": security_id,
                "ratio_name": ratio_name,
                "trend_direction": "unknown",
                "trend_magnitude": None,
                "data_points": len(history),
            }

        # Sort by date
        history_sorted = sorted(history, key=lambda x: x.get("calculation_date", ""))
        values = [Decimal(h.get("ratio_value", "0")) for h in history_sorted]

        # Calculate trend
        first_value = values[0]
        last_value = values[-1]

        if first_value == 0:
            change_pct = None
        else:
            change_pct = ((last_value - first_value) / first_value) * 100

        # Determine direction
        if change_pct is None:
            direction = "unknown"
        elif change_pct > 5:
            direction = "improving"
        elif change_pct < -5:
            direction = "declining"
        else:
            direction = "stable"

        return {
            "security_id": security_id,
            "ratio_name": ratio_name,
            "trend_direction": direction,
            "trend_magnitude": str(change_pct) if change_pct else None,
            "first_value": str(first_value),
            "last_value": str(last_value),
            "first_date": history_sorted[0].get("calculation_date"),
            "last_date": history_sorted[-1].get("calculation_date"),
            "data_points": len(history),
        }

    @service_operation("compare_periods")
    async def compare_periods(
        self,
        security_id: str,
        ratio_name: str,
        current_date: str | None = None,
        comparison_date: str | None = None,
    ) -> dict:
        """
        Compare ratio values between two periods.

        Args:
            security_id: Security ID
            ratio_name: Ratio to compare
            current_date: Current period date (defaults to latest)
            comparison_date: Historical date to compare against

        Returns:
            Period comparison with changes
        """
        # Get current value
        filter_current: dict[str, Any] = {
            "security_id": security_id,
            "ratio_name": ratio_name,
        }
        if current_date:
            filter_current["calculation_date"] = current_date

        current_ratios = await self.db.express.list(
            "SecurityRatio",
            filter=filter_current,
            limit=1,
        )

        if not current_ratios:
            raise NotFoundError(f"No current ratio found for {security_id}/{ratio_name}")

        current = current_ratios[0]
        current_value = Decimal(current.get("ratio_value", "0"))

        # Get comparison value
        if comparison_date:
            filter_comparison = {
                "security_id": security_id,
                "ratio_name": ratio_name,
                "calculation_date": comparison_date,
            }
            comparison_ratios = await self.db.express.list(
                "SecurityRatio",
                filter=filter_comparison,
                limit=1,
            )
        else:
            # Use historical values from the ratio record
            comparison_value = current.get("value_1y_ago")
            if comparison_value:
                return {
                    "security_id": security_id,
                    "ratio_name": ratio_name,
                    "current_value": str(current_value),
                    "current_date": current.get("calculation_date"),
                    "comparison_value": comparison_value,
                    "comparison_date": "1 year ago",
                    "absolute_change": str(current_value - Decimal(comparison_value)),
                    "percent_change": (
                        str(
                            (
                                (current_value - Decimal(comparison_value))
                                / Decimal(comparison_value)
                            )
                            * 100
                        )
                        if Decimal(comparison_value) != 0
                        else None
                    ),
                }
            comparison_ratios = []

        if not comparison_ratios:
            return {
                "security_id": security_id,
                "ratio_name": ratio_name,
                "current_value": str(current_value),
                "current_date": current.get("calculation_date"),
                "comparison_value": None,
                "comparison_date": comparison_date,
                "absolute_change": None,
                "percent_change": None,
            }

        comparison = comparison_ratios[0]
        comparison_value = Decimal(comparison.get("ratio_value", "0"))

        absolute_change = current_value - comparison_value
        percent_change = (
            (absolute_change / comparison_value) * 100 if comparison_value != 0 else None
        )

        return {
            "security_id": security_id,
            "ratio_name": ratio_name,
            "current_value": str(current_value),
            "current_date": current.get("calculation_date"),
            "comparison_value": str(comparison_value),
            "comparison_date": comparison.get("calculation_date"),
            "absolute_change": str(absolute_change),
            "percent_change": str(percent_change) if percent_change else None,
        }
