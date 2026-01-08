"""
Financial Ratio Calculation Workflow.

Calculates 25+ financial ratios across 5 classes for securities:
- Liquidity: current_ratio, quick_ratio, cash_ratio, working_capital_ratio
- Profitability: roe, roa, profit_margin, operating_margin, gross_margin, roic
- Leverage: debt_to_equity, debt_ratio, equity_multiplier, interest_coverage
- Efficiency: asset_turnover, inventory_turnover, receivables_turnover, payables_turnover
- Valuation: pe_ratio, pb_ratio, ps_ratio, ev_ebitda, dividend_yield

Workflow Pattern:
1. Get securities with fundamentals
2. Get latest fundamentals data
3. Get latest prices for market-based ratios
4. Calculate all ratios using Decimal math
5. Bulk upsert to SecurityRatio

Key Patterns:
- PythonCodeNode for calculations (sync - no external API calls)
- Multi-output pattern (v0.9.28+)
- BulkUpsertNode with conflict_resolution="update"
- Safe division handling for zero denominators
- String decimals for precision

CRITICAL RULES:
- NEVER manually set created_at or updated_at
- Use Decimal for all calculations
- Handle None/null values gracefully
- Composite ID format: "{security_id}_{calculation_date}_{ratio_name}"
"""

from kailash.workflow.builder import WorkflowBuilder


def build_ratio_calculation_workflow(
    security_ids: list[str] | None = None,
    calculation_date: str | None = None,
    ratio_classes: list[str] | None = None,
    batch_size: int = 1000,
) -> WorkflowBuilder:
    """
    Build workflow to calculate financial ratios for securities.

    This workflow calculates 25+ financial ratios across 5 ratio classes.
    It uses fundamentals data for balance sheet and income statement ratios,
    and combines with price data for valuation ratios.

    Args:
        security_ids: List of security IDs to calculate. If None, calculates for all.
        calculation_date: Date for calculation (YYYY-MM-DD). Defaults to today.
        ratio_classes: List of ratio classes to calculate. Options:
            - 'liquidity': Current ratio, quick ratio, etc.
            - 'profitability': ROE, ROA, margins, etc.
            - 'leverage': Debt ratios, coverage ratios
            - 'efficiency': Turnover ratios
            - 'valuation': P/E, P/B, EV/EBITDA, etc.
            If None, calculates all classes.
        batch_size: Number of records per batch for bulk operations.

    Returns:
        WorkflowBuilder configured for ratio calculation.

    Example:
        >>> workflow = build_ratio_calculation_workflow(
        ...     security_ids=["AAPL", "MSFT"],
        ...     ratio_classes=["liquidity", "profitability"]
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Default ratio classes
    if ratio_classes is None:
        ratio_classes = ["liquidity", "profitability", "leverage", "efficiency", "valuation"]

    # Date parameter for code
    date_code = f'"{calculation_date}"' if calculation_date else "None"
    ratio_classes_code = repr(ratio_classes)

    # =========================================================================
    # Step 1: Get Securities to Process
    # =========================================================================

    if security_ids:
        workflow.add_node(
            "PythonCodeNode",
            "get_security_ids",
            {
                "code": f"""
# Use provided security IDs
security_ids = {security_ids!r}
result = {{"security_ids": security_ids, "count": len(security_ids)}}
"""
            },
        )
    else:
        # Query active equities (fundamentals are for equities)
        workflow.add_node(
            "SecurityListNode",
            "list_securities",
            {
                "filter": {
                    "security_type": "equity",
                    "active": True,
                    "deleted_at": {"$null": True},
                },
                "limit": 10000,
            },
        )

        workflow.add_node(
            "PythonCodeNode",
            "get_security_ids",
            {
                "code": """
securities = records if isinstance(records, list) else []
security_ids = [s['id'] for s in securities]
result = {"security_ids": security_ids, "count": len(security_ids)}
"""
            },
        )

        workflow.add_connection("list_securities", "records", "get_security_ids", "records")

    # =========================================================================
    # Step 2: Get Latest Fundamentals for Securities
    # =========================================================================

    if security_ids:
        workflow.add_node(
            "CompanyFundamentalsListNode",
            "get_fundamentals",
            {
                "filter": {"security_id": {"$in": security_ids}},
                "limit": 50000,
            },
        )
    else:
        workflow.add_node(
            "CompanyFundamentalsListNode",
            "get_fundamentals",
            {
                "filter": {},
                "limit": 100000,
            },
        )

    # Deduplicate to get latest fundamental per security
    workflow.add_node(
        "PythonCodeNode",
        "get_latest_fundamentals",
        {
            "code": f"""
from datetime import datetime

calculation_date = {date_code} or datetime.now().strftime("%Y-%m-%d")

# Get the latest fundamental record per security
latest_by_security = {{}}
for fund in records:
    security_id = fund.get("security_id")
    period_end = fund.get("period_end_date", "")

    if security_id:
        if security_id not in latest_by_security:
            latest_by_security[security_id] = fund
        elif period_end > latest_by_security[security_id].get("period_end_date", ""):
            latest_by_security[security_id] = fund

# Multi-output
latest_fundamentals = list(latest_by_security.values())
calc_date = calculation_date
fundamentals_count = len(latest_fundamentals)
security_ids_with_fundamentals = list(latest_by_security.keys())
"""
        },
    )

    workflow.add_connection("get_fundamentals", "records", "get_latest_fundamentals", "records")

    # =========================================================================
    # Step 3: Get Latest Prices for Valuation Ratios
    # =========================================================================
    # Only needed if calculating valuation ratios

    workflow.add_node(
        "PriceHistoryListNode",
        "get_prices",
        {
            "filter": {},  # Will be filtered by connection
            "limit": 50000,
        },
    )

    # Get latest price per security
    workflow.add_node(
        "PythonCodeNode",
        "get_latest_prices",
        {
            "code": """
# Get the latest price record per security
latest_prices = {}
for price in records:
    security_id = price.get("security_id")
    price_date = price.get("price_date", "")

    if security_id:
        if security_id not in latest_prices:
            latest_prices[security_id] = price
        elif price_date > latest_prices[security_id].get("price_date", ""):
            latest_prices[security_id] = price

# Multi-output
price_lookup = latest_prices
price_count = len(latest_prices)
"""
        },
    )

    workflow.add_connection("get_prices", "records", "get_latest_prices", "records")

    # =========================================================================
    # Step 4: Calculate All Financial Ratios
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "calculate_ratios",
        {
            "code": f"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from datetime import datetime

# Configuration
ratio_classes_to_calc = {ratio_classes_code}

def safe_decimal(value):
    '''Safely convert value to Decimal, returning None if not possible.'''
    if value is None or value == "" or value == "None":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None

def safe_divide(numerator, denominator, precision=4):
    '''Safely divide two Decimals, returning None if denominator is zero or None.'''
    if numerator is None or denominator is None:
        return None
    if denominator == Decimal(0):
        return None
    result = numerator / denominator
    return str(result.quantize(Decimal(10) ** -precision, rounding=ROUND_HALF_UP))

def create_ratio_record(security_id, calc_date, ratio_class, ratio_name, ratio_value, source_id=None):
    '''Create a ratio record with proper composite ID.'''
    if ratio_value is None:
        return None
    return {{
        "id": f"{{security_id}}_{{calc_date}}_{{ratio_name}}",
        "security_id": security_id,
        "calculation_date": calc_date,
        "ratio_class": ratio_class,
        "ratio_name": ratio_name,
        "ratio_value": ratio_value,
        "source_fundamentals_id": source_id,
    }}

# Process each security's fundamentals
ratio_records = []
errors = []

for fund in latest_fundamentals:
    security_id = fund.get("security_id", "")
    if not security_id:
        continue

    source_id = fund.get("id")

    # Get price data for this security (for valuation ratios)
    price_data = price_lookup.get(security_id, {{}})

    # Parse all fundamental values
    # Balance Sheet - Assets
    total_assets = safe_decimal(fund.get("total_assets"))
    current_assets = safe_decimal(fund.get("current_assets"))
    cash = safe_decimal(fund.get("cash_and_equivalents"))
    short_term_investments = safe_decimal(fund.get("short_term_investments"))
    accounts_receivable = safe_decimal(fund.get("accounts_receivable"))
    inventory = safe_decimal(fund.get("inventory"))
    non_current_assets = safe_decimal(fund.get("non_current_assets"))

    # Balance Sheet - Liabilities
    total_liabilities = safe_decimal(fund.get("total_liabilities"))
    current_liabilities = safe_decimal(fund.get("current_liabilities"))
    accounts_payable = safe_decimal(fund.get("accounts_payable"))
    short_term_debt = safe_decimal(fund.get("short_term_debt"))
    long_term_debt = safe_decimal(fund.get("long_term_debt"))
    total_debt = safe_decimal(fund.get("total_debt"))

    # Balance Sheet - Equity
    total_equity = safe_decimal(fund.get("total_equity"))
    retained_earnings = safe_decimal(fund.get("retained_earnings"))

    # Income Statement
    revenue = safe_decimal(fund.get("revenue"))
    cost_of_revenue = safe_decimal(fund.get("cost_of_revenue"))
    gross_profit = safe_decimal(fund.get("gross_profit"))
    operating_income = safe_decimal(fund.get("operating_income"))
    operating_expenses = safe_decimal(fund.get("operating_expenses"))
    ebitda = safe_decimal(fund.get("ebitda"))
    ebit = safe_decimal(fund.get("ebit"))
    interest_expense = safe_decimal(fund.get("interest_expense"))
    net_income = safe_decimal(fund.get("net_income"))
    eps_diluted = safe_decimal(fund.get("eps_diluted"))
    dividend_per_share = safe_decimal(fund.get("dividend_per_share"))

    # Cash Flow
    operating_cash_flow = safe_decimal(fund.get("operating_cash_flow"))
    capital_expenditures = safe_decimal(fund.get("capital_expenditures"))
    free_cash_flow = safe_decimal(fund.get("free_cash_flow"))

    # Price Data
    close_price = safe_decimal(price_data.get("close_price"))
    adjusted_close = safe_decimal(price_data.get("adjusted_close"))
    shares_outstanding = safe_decimal(fund.get("shares_diluted"))

    # Calculate market cap if we have price and shares
    market_cap = None
    if adjusted_close and shares_outstanding:
        market_cap = adjusted_close * shares_outstanding

    # =====================================================================
    # LIQUIDITY RATIOS
    # =====================================================================
    if "liquidity" in ratio_classes_to_calc:
        # Current Ratio = Current Assets / Current Liabilities
        ratio = create_ratio_record(
            security_id, calc_date, "liquidity", "current_ratio",
            safe_divide(current_assets, current_liabilities), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Quick Ratio = (Current Assets - Inventory) / Current Liabilities
        if current_assets and current_liabilities:
            quick_assets = current_assets - (inventory or Decimal(0))
            ratio = create_ratio_record(
                security_id, calc_date, "liquidity", "quick_ratio",
                safe_divide(quick_assets, current_liabilities), source_id
            )
            if ratio:
                ratio_records.append(ratio)

        # Cash Ratio = (Cash + Short-Term Investments) / Current Liabilities
        if current_liabilities:
            cash_total = (cash or Decimal(0)) + (short_term_investments or Decimal(0))
            ratio = create_ratio_record(
                security_id, calc_date, "liquidity", "cash_ratio",
                safe_divide(cash_total, current_liabilities) if cash_total else None, source_id
            )
            if ratio:
                ratio_records.append(ratio)

        # Working Capital Ratio = (Current Assets - Current Liabilities) / Total Assets
        if current_assets and current_liabilities and total_assets:
            working_capital = current_assets - current_liabilities
            ratio = create_ratio_record(
                security_id, calc_date, "liquidity", "working_capital_ratio",
                safe_divide(working_capital, total_assets), source_id
            )
            if ratio:
                ratio_records.append(ratio)

    # =====================================================================
    # PROFITABILITY RATIOS
    # =====================================================================
    if "profitability" in ratio_classes_to_calc:
        # Return on Equity (ROE) = Net Income / Total Equity
        ratio = create_ratio_record(
            security_id, calc_date, "profitability", "roe",
            safe_divide(net_income, total_equity), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Return on Assets (ROA) = Net Income / Total Assets
        ratio = create_ratio_record(
            security_id, calc_date, "profitability", "roa",
            safe_divide(net_income, total_assets), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Return on Invested Capital (ROIC) = EBIT * (1 - tax rate) / (Debt + Equity)
        if ebit and total_debt is not None and total_equity:
            invested_capital = (total_debt or Decimal(0)) + total_equity
            # Assume 25% tax rate if we can't calculate it
            nopat = ebit * Decimal("0.75")
            ratio = create_ratio_record(
                security_id, calc_date, "profitability", "roic",
                safe_divide(nopat, invested_capital), source_id
            )
            if ratio:
                ratio_records.append(ratio)

        # Gross Profit Margin = Gross Profit / Revenue
        ratio = create_ratio_record(
            security_id, calc_date, "profitability", "gross_margin",
            safe_divide(gross_profit, revenue), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Operating Margin = Operating Income / Revenue
        ratio = create_ratio_record(
            security_id, calc_date, "profitability", "operating_margin",
            safe_divide(operating_income, revenue), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Net Profit Margin = Net Income / Revenue
        ratio = create_ratio_record(
            security_id, calc_date, "profitability", "profit_margin",
            safe_divide(net_income, revenue), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # EBITDA Margin = EBITDA / Revenue
        ratio = create_ratio_record(
            security_id, calc_date, "profitability", "ebitda_margin",
            safe_divide(ebitda, revenue), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Free Cash Flow Margin = FCF / Revenue
        ratio = create_ratio_record(
            security_id, calc_date, "profitability", "fcf_margin",
            safe_divide(free_cash_flow, revenue), source_id
        )
        if ratio:
            ratio_records.append(ratio)

    # =====================================================================
    # LEVERAGE RATIOS
    # =====================================================================
    if "leverage" in ratio_classes_to_calc:
        # Debt to Equity = Total Debt / Total Equity
        ratio = create_ratio_record(
            security_id, calc_date, "leverage", "debt_to_equity",
            safe_divide(total_debt, total_equity), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Debt Ratio = Total Liabilities / Total Assets
        ratio = create_ratio_record(
            security_id, calc_date, "leverage", "debt_ratio",
            safe_divide(total_liabilities, total_assets), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Equity Multiplier = Total Assets / Total Equity
        ratio = create_ratio_record(
            security_id, calc_date, "leverage", "equity_multiplier",
            safe_divide(total_assets, total_equity), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Interest Coverage = EBIT / Interest Expense
        ratio = create_ratio_record(
            security_id, calc_date, "leverage", "interest_coverage",
            safe_divide(ebit, interest_expense), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Debt to EBITDA = Total Debt / EBITDA
        ratio = create_ratio_record(
            security_id, calc_date, "leverage", "debt_to_ebitda",
            safe_divide(total_debt, ebitda), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Long-Term Debt to Equity = Long-Term Debt / Total Equity
        ratio = create_ratio_record(
            security_id, calc_date, "leverage", "long_term_debt_to_equity",
            safe_divide(long_term_debt, total_equity), source_id
        )
        if ratio:
            ratio_records.append(ratio)

    # =====================================================================
    # EFFICIENCY RATIOS
    # =====================================================================
    if "efficiency" in ratio_classes_to_calc:
        # Asset Turnover = Revenue / Total Assets
        ratio = create_ratio_record(
            security_id, calc_date, "efficiency", "asset_turnover",
            safe_divide(revenue, total_assets), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Inventory Turnover = Cost of Revenue / Inventory
        ratio = create_ratio_record(
            security_id, calc_date, "efficiency", "inventory_turnover",
            safe_divide(cost_of_revenue, inventory), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Receivables Turnover = Revenue / Accounts Receivable
        ratio = create_ratio_record(
            security_id, calc_date, "efficiency", "receivables_turnover",
            safe_divide(revenue, accounts_receivable), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Payables Turnover = Cost of Revenue / Accounts Payable
        ratio = create_ratio_record(
            security_id, calc_date, "efficiency", "payables_turnover",
            safe_divide(cost_of_revenue, accounts_payable), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Fixed Asset Turnover = Revenue / Non-Current Assets
        ratio = create_ratio_record(
            security_id, calc_date, "efficiency", "fixed_asset_turnover",
            safe_divide(revenue, non_current_assets), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Days Inventory Outstanding = 365 / Inventory Turnover
        if cost_of_revenue and inventory and inventory != Decimal(0):
            inv_turnover = cost_of_revenue / inventory
            if inv_turnover != Decimal(0):
                dio = Decimal(365) / inv_turnover
                ratio = create_ratio_record(
                    security_id, calc_date, "efficiency", "days_inventory_outstanding",
                    str(dio.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)), source_id
                )
                if ratio:
                    ratio_records.append(ratio)

        # Days Sales Outstanding = 365 / Receivables Turnover
        if revenue and accounts_receivable and accounts_receivable != Decimal(0):
            rec_turnover = revenue / accounts_receivable
            if rec_turnover != Decimal(0):
                dso = Decimal(365) / rec_turnover
                ratio = create_ratio_record(
                    security_id, calc_date, "efficiency", "days_sales_outstanding",
                    str(dso.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)), source_id
                )
                if ratio:
                    ratio_records.append(ratio)

    # =====================================================================
    # VALUATION RATIOS (Require Price Data)
    # =====================================================================
    if "valuation" in ratio_classes_to_calc and adjusted_close:
        # Price to Earnings (P/E) = Price / EPS
        ratio = create_ratio_record(
            security_id, calc_date, "valuation", "pe_ratio",
            safe_divide(adjusted_close, eps_diluted), source_id
        )
        if ratio:
            ratio_records.append(ratio)

        # Price to Book (P/B) = Market Cap / Book Value (Total Equity)
        if market_cap and total_equity:
            ratio = create_ratio_record(
                security_id, calc_date, "valuation", "pb_ratio",
                safe_divide(market_cap, total_equity), source_id
            )
            if ratio:
                ratio_records.append(ratio)

        # Price to Sales (P/S) = Market Cap / Revenue
        if market_cap and revenue:
            ratio = create_ratio_record(
                security_id, calc_date, "valuation", "ps_ratio",
                safe_divide(market_cap, revenue), source_id
            )
            if ratio:
                ratio_records.append(ratio)

        # EV/EBITDA = (Market Cap + Total Debt - Cash) / EBITDA
        if market_cap and ebitda:
            ev = market_cap + (total_debt or Decimal(0)) - (cash or Decimal(0))
            ratio = create_ratio_record(
                security_id, calc_date, "valuation", "ev_ebitda",
                safe_divide(ev, ebitda), source_id
            )
            if ratio:
                ratio_records.append(ratio)

        # EV/Revenue = Enterprise Value / Revenue
        if market_cap and revenue:
            ev = market_cap + (total_debt or Decimal(0)) - (cash or Decimal(0))
            ratio = create_ratio_record(
                security_id, calc_date, "valuation", "ev_revenue",
                safe_divide(ev, revenue), source_id
            )
            if ratio:
                ratio_records.append(ratio)

        # Price to Free Cash Flow = Market Cap / FCF
        if market_cap and free_cash_flow:
            ratio = create_ratio_record(
                security_id, calc_date, "valuation", "price_to_fcf",
                safe_divide(market_cap, free_cash_flow), source_id
            )
            if ratio:
                ratio_records.append(ratio)

        # Dividend Yield = Dividend Per Share / Price
        if dividend_per_share and adjusted_close:
            ratio = create_ratio_record(
                security_id, calc_date, "valuation", "dividend_yield",
                safe_divide(dividend_per_share, adjusted_close), source_id
            )
            if ratio:
                ratio_records.append(ratio)

        # Earnings Yield = EPS / Price (inverse of P/E)
        if eps_diluted and adjusted_close:
            ratio = create_ratio_record(
                security_id, calc_date, "valuation", "earnings_yield",
                safe_divide(eps_diluted, adjusted_close), source_id
            )
            if ratio:
                ratio_records.append(ratio)

# Multi-output
calculated_ratios = ratio_records
ratio_count = len(ratio_records)
calculation_errors = errors
securities_processed = len(latest_fundamentals)
"""
        },
    )

    # Connect inputs to calculation node
    workflow.add_connection(
        "get_latest_fundamentals", "latest_fundamentals", "calculate_ratios", "latest_fundamentals"
    )
    workflow.add_connection("get_latest_fundamentals", "calc_date", "calculate_ratios", "calc_date")
    workflow.add_connection("get_latest_prices", "price_lookup", "calculate_ratios", "price_lookup")

    # =========================================================================
    # Step 5: Bulk Upsert Ratios
    # =========================================================================

    workflow.add_node(
        "SecurityRatioBulkUpsertNode",
        "save_ratios",
        {
            "data": "{{calculate_ratios.calculated_ratios}}",
            "conflict_resolution": "update",
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("calculate_ratios", "calculated_ratios", "save_ratios", "data")

    # =========================================================================
    # Step 6: Compile Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": f"""
from datetime import datetime
from collections import Counter

# Count ratios by class
ratio_class_counts = Counter()
for ratio in calculated_ratios:
    ratio_class_counts[ratio.get("ratio_class", "unknown")] += 1

summary = {{
    "workflow": "ratio_calculation",
    "completed_at": datetime.now().isoformat(),
    "calculation_date": calc_date,
    "ratio_classes": {ratio_classes_code},
    "securities_processed": securities_processed,
    "fundamentals_used": fundamentals_count,
    "prices_used": price_count,
    "total_ratios_calculated": ratio_count,
    "ratios_by_class": dict(ratio_class_counts),
    "errors": calculation_errors[:10] if calculation_errors else [],
    "status": "success" if not calculation_errors else "partial_success"
}}

result = summary
"""
        },
    )

    # Connect summary inputs
    workflow.add_connection(
        "calculate_ratios", "calculated_ratios", "compile_summary", "calculated_ratios"
    )
    workflow.add_connection("calculate_ratios", "calc_date", "compile_summary", "calc_date")
    workflow.add_connection("calculate_ratios", "ratio_count", "compile_summary", "ratio_count")
    workflow.add_connection(
        "calculate_ratios", "calculation_errors", "compile_summary", "calculation_errors"
    )
    workflow.add_connection(
        "calculate_ratios", "securities_processed", "compile_summary", "securities_processed"
    )
    workflow.add_connection(
        "get_latest_fundamentals", "fundamentals_count", "compile_summary", "fundamentals_count"
    )
    workflow.add_connection("get_latest_prices", "price_count", "compile_summary", "price_count")

    return workflow


def build_valuation_ratio_workflow(
    security_ids: list[str] | None = None,
    calculation_date: str | None = None,
    batch_size: int = 1000,
) -> WorkflowBuilder:
    """
    Build workflow to calculate only valuation ratios.

    This is a convenience wrapper that calculates only market-based valuation
    ratios. Useful for daily updates when price data changes.

    Args:
        security_ids: List of security IDs. If None, calculates for all.
        calculation_date: Date for calculation. Defaults to today.
        batch_size: Batch size for bulk operations.

    Returns:
        WorkflowBuilder configured for valuation ratio calculation.

    Example:
        >>> workflow = build_valuation_ratio_workflow(security_ids=["AAPL"])
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    return build_ratio_calculation_workflow(
        security_ids=security_ids,
        calculation_date=calculation_date,
        ratio_classes=["valuation"],
        batch_size=batch_size,
    )


def build_fundamental_ratio_workflow(
    security_ids: list[str] | None = None,
    calculation_date: str | None = None,
    batch_size: int = 1000,
) -> WorkflowBuilder:
    """
    Build workflow to calculate non-valuation ratios.

    Calculates liquidity, profitability, leverage, and efficiency ratios
    which don't require price data. Useful when fundamentals are updated.

    Args:
        security_ids: List of security IDs. If None, calculates for all.
        calculation_date: Date for calculation. Defaults to today.
        batch_size: Batch size for bulk operations.

    Returns:
        WorkflowBuilder configured for fundamental ratio calculation.

    Example:
        >>> workflow = build_fundamental_ratio_workflow(security_ids=["AAPL"])
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    return build_ratio_calculation_workflow(
        security_ids=security_ids,
        calculation_date=calculation_date,
        ratio_classes=["liquidity", "profitability", "leverage", "efficiency"],
        batch_size=batch_size,
    )
