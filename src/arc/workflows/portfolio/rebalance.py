"""
Portfolio Rebalance Analysis Workflow.

Analyzes portfolio weights against target allocation and generates
rebalance recommendations.

Workflow Pattern:
1. Get portfolio and target allocation
2. Get holdings with current values
3. Calculate current weights
4. Compare to target weights
5. Generate rebalance recommendations

Note: This is a skeleton implementation. Full execution of rebalance
trades will be implemented in a later phase.

CRITICAL RULES:
- NEVER manually set created_at or updated_at
- Use Decimal for all calculations
- This workflow generates recommendations only, not actual trades
"""

from kailash.workflow.builder import WorkflowBuilder


def build_rebalance_analysis_workflow(
    portfolio_id: str,
    target_allocation: dict[str, float] | None = None,
    tolerance_pct: float = 5.0,
    min_trade_value: float = 100.0,
) -> WorkflowBuilder:
    """
    Build workflow to analyze portfolio rebalancing needs.

    This workflow compares current portfolio weights against target
    allocation and generates recommendations for rebalancing.

    Args:
        portfolio_id: Portfolio to analyze.
        target_allocation: Target weights by security_id or asset_class.
            Example: {"AAPL": 10.0, "MSFT": 10.0, "cash": 20.0}
            If None, uses portfolio's stored target_weights.
        tolerance_pct: Tolerance band percentage (default 5%).
            A security is only flagged if weight differs by more than this.
        min_trade_value: Minimum trade value to recommend (default $100).

    Returns:
        WorkflowBuilder configured for rebalance analysis.

    Example:
        >>> workflow = build_rebalance_analysis_workflow(
        ...     portfolio_id="port-001",
        ...     target_allocation={"AAPL": 25.0, "MSFT": 25.0, "GOOGL": 25.0, "cash": 25.0}
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Parameters for code
    target_allocation_code = repr(target_allocation) if target_allocation else "None"

    # =========================================================================
    # Step 1: Get Portfolio
    # =========================================================================

    workflow.add_node(
        "PortfolioReadNode",
        "get_portfolio",
        {
            "id": portfolio_id,
        },
    )

    workflow.add_node(
        "PythonCodeNode",
        "extract_portfolio_info",
        {
            "code": f"""
portfolio = record if record else {{}}

# Get target weights from portfolio if not provided
target_allocation = {target_allocation_code}
if target_allocation is None:
    target_allocation = portfolio.get("target_weights", {{}})

# Multi-output
portfolio_id = "{portfolio_id}"
portfolio_name = portfolio.get("name", "Unknown")
base_currency = portfolio.get("base_currency", "USD")
target_weights = target_allocation
"""
        },
    )

    workflow.add_connection("get_portfolio", "record", "extract_portfolio_info", "record")

    # =========================================================================
    # Step 2: Get Holdings with Current Values
    # =========================================================================

    workflow.add_node(
        "HoldingListNode",
        "get_holdings",
        {
            "filter": {"portfolio_id": portfolio_id, "deleted_at": {"$null": True}},
            "limit": 10000,
        },
    )

    # =========================================================================
    # Step 3: Get Cash Balances
    # =========================================================================

    workflow.add_node(
        "CashAccountListNode",
        "get_cash",
        {
            "filter": {"portfolio_id": portfolio_id},
            "limit": 100,
        },
    )

    # =========================================================================
    # Step 4: Calculate Current Weights and Drift
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "calculate_weights_and_drift",
        {
            "code": f"""
from decimal import Decimal, ROUND_HALF_UP

TOLERANCE_PCT = {tolerance_pct}
MIN_TRADE_VALUE = {min_trade_value}

def safe_decimal(value):
    if value is None or value == "" or value == "None":
        return Decimal("0")
    try:
        return Decimal(str(value))
    except:
        return Decimal("0")

# Calculate total portfolio value
holdings_list = records if isinstance(records, list) else []
active_holdings = [h for h in holdings_list if float(h.get("quantity", 0)) > 0]

# Sum securities value
securities_value = Decimal("0")
security_values = {{}}

for holding in active_holdings:
    sec_id = holding.get("security_id")
    current_value = safe_decimal(holding.get("current_value", "0"))
    securities_value += current_value
    security_values[sec_id] = current_value

# Sum cash value
cash_value = Decimal("0")
for cash in cash_accounts:
    balance = safe_decimal(cash.get("balance", "0"))
    cash_value += balance

total_value = securities_value + cash_value

# Calculate current weights (as percentages)
current_weights = {{}}
if total_value > 0:
    for sec_id, value in security_values.items():
        weight = (value / total_value * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        current_weights[sec_id] = float(weight)

    # Add cash weight
    cash_weight = (cash_value / total_value * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    current_weights["cash"] = float(cash_weight)

# Calculate drift from target
drift_analysis = []
recommendations = []

for asset_id, target_weight in target_weights.items():
    current_weight = current_weights.get(asset_id, 0.0)
    drift = current_weight - target_weight

    drift_entry = {{
        "asset_id": asset_id,
        "target_weight": target_weight,
        "current_weight": current_weight,
        "drift": round(drift, 2),
        "within_tolerance": abs(drift) <= TOLERANCE_PCT,
    }}
    drift_analysis.append(drift_entry)

    # Generate recommendation if outside tolerance
    if abs(drift) > TOLERANCE_PCT:
        # Calculate trade value needed
        target_value = total_value * Decimal(str(target_weight)) / 100
        current_value_dec = total_value * Decimal(str(current_weight)) / 100
        trade_value = float((target_value - current_value_dec).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        ))

        if abs(trade_value) >= MIN_TRADE_VALUE:
            action = "buy" if trade_value > 0 else "sell"
            direction = "over" if drift > 0 else "under"
            recommendations.append({{
                "asset_id": asset_id,
                "action": action,
                "trade_value": abs(trade_value),
                "reason": f"{{asset_id}} is {{abs(drift):.1f}}% {{direction}}weight",
            }})

# Check for holdings not in target
for sec_id in current_weights:
    if sec_id not in target_weights and sec_id != "cash":
        current_weight = current_weights[sec_id]
        if current_weight > 0:
            drift_analysis.append({{
                "asset_id": sec_id,
                "target_weight": 0,
                "current_weight": current_weight,
                "drift": current_weight,
                "within_tolerance": False,
            }})
            # Recommend selling untracked positions
            if current_weight > TOLERANCE_PCT:
                trade_value = float(total_value * Decimal(str(current_weight)) / 100)
                if trade_value >= MIN_TRADE_VALUE:
                    recommendations.append({{
                        "asset_id": sec_id,
                        "action": "sell",
                        "trade_value": trade_value,
                        "reason": f"{{sec_id}} not in target allocation",
                    }})

# Calculate summary metrics
total_drift = sum(abs(d["drift"]) for d in drift_analysis) / 2  # Divide by 2 to avoid double counting
positions_out_of_tolerance = sum(1 for d in drift_analysis if not d["within_tolerance"])

# Multi-output
portfolio_value = float(total_value)
weight_analysis = current_weights
drift_results = drift_analysis
rebalance_recommendations = recommendations
total_drift_pct = round(total_drift, 2)
out_of_tolerance_count = positions_out_of_tolerance
needs_rebalancing = positions_out_of_tolerance > 0
"""
        },
    )

    # Connect inputs
    workflow.add_connection("get_holdings", "records", "calculate_weights_and_drift", "records")
    workflow.add_connection("get_cash", "records", "calculate_weights_and_drift", "cash_accounts")
    workflow.add_connection(
        "extract_portfolio_info", "target_weights", "calculate_weights_and_drift", "target_weights"
    )

    # =========================================================================
    # Step 5: Compile Results
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_results",
        {
            "code": """
from datetime import datetime

result = {
    "workflow": "rebalance_analysis",
    "completed_at": datetime.now().isoformat(),
    "portfolio_id": portfolio_id,
    "portfolio_name": portfolio_name,
    "portfolio_value": portfolio_value,
    "current_weights": weight_analysis,
    "target_weights": target_weights,
    "drift_analysis": drift_results,
    "total_drift_pct": total_drift_pct,
    "positions_out_of_tolerance": out_of_tolerance_count,
    "needs_rebalancing": needs_rebalancing,
    "recommendations": rebalance_recommendations,
    "recommendation_count": len(rebalance_recommendations),
    "status": "success",
    "note": "This is analysis only. Trade execution not implemented."
}
"""
        },
    )

    # Connect summary inputs
    workflow.add_connection(
        "extract_portfolio_info", "portfolio_id", "compile_results", "portfolio_id"
    )
    workflow.add_connection(
        "extract_portfolio_info", "portfolio_name", "compile_results", "portfolio_name"
    )
    workflow.add_connection(
        "extract_portfolio_info", "target_weights", "compile_results", "target_weights"
    )
    workflow.add_connection(
        "calculate_weights_and_drift", "portfolio_value", "compile_results", "portfolio_value"
    )
    workflow.add_connection(
        "calculate_weights_and_drift", "weight_analysis", "compile_results", "weight_analysis"
    )
    workflow.add_connection(
        "calculate_weights_and_drift", "drift_results", "compile_results", "drift_results"
    )
    workflow.add_connection(
        "calculate_weights_and_drift", "total_drift_pct", "compile_results", "total_drift_pct"
    )
    workflow.add_connection(
        "calculate_weights_and_drift",
        "out_of_tolerance_count",
        "compile_results",
        "out_of_tolerance_count",
    )
    workflow.add_connection(
        "calculate_weights_and_drift", "needs_rebalancing", "compile_results", "needs_rebalancing"
    )
    workflow.add_connection(
        "calculate_weights_and_drift",
        "rebalance_recommendations",
        "compile_results",
        "rebalance_recommendations",
    )

    return workflow
