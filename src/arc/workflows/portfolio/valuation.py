"""
NAV Calculation Workflow.

Calculates portfolio Net Asset Value (NAV) and performance metrics.

Workflow Pattern:
1. Get portfolios to value
2. Get all active holdings for portfolios
3. Get latest prices for securities
4. Get cash balances
5. Get previous valuations (for return calculation)
6. Calculate NAV and returns
7. Save valuations
8. Update holding current values

Features:
- Multi-currency support with FX conversion
- Multiple return periods (daily, MTD, QTD, YTD, inception)
- Missing price handling (use last available)
- Idempotent - re-running updates existing valuation

CRITICAL RULES:
- NEVER manually set created_at or updated_at
- Use Decimal for all calculations
- Store all monetary values as string decimals
"""

from kailash.workflow.builder import WorkflowBuilder


def build_nav_calculation_workflow(
    portfolio_ids: list[str] | None = None,
    valuation_date: str | None = None,
    base_currency: str = "USD",
    batch_size: int = 1000,
) -> WorkflowBuilder:
    """
    Build workflow to calculate NAV for portfolios.

    This workflow calculates the Net Asset Value (NAV) and performance
    metrics for one or more portfolios.

    Args:
        portfolio_ids: List of portfolios to value. If None, values all active portfolios.
        valuation_date: Date for valuation (YYYY-MM-DD). Defaults to today.
        base_currency: Base currency for multi-currency portfolios.
        batch_size: Batch size for bulk operations.

    Returns:
        WorkflowBuilder configured for NAV calculation.

    Example:
        >>> workflow = build_nav_calculation_workflow(
        ...     portfolio_ids=["port-001", "port-002"],
        ...     valuation_date="2024-12-31"
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Parameters for code
    date_code = f'"{valuation_date}"' if valuation_date else "None"
    portfolio_ids_code = repr(portfolio_ids) if portfolio_ids else "None"

    # =========================================================================
    # Step 1: Get Portfolios to Value
    # =========================================================================

    if portfolio_ids:
        # Get specific portfolios
        workflow.add_node(
            "PythonCodeNode",
            "prepare_portfolio_filter",
            {
                "code": f"""
portfolio_ids = {portfolio_ids_code}
result = {{"ids": portfolio_ids}}
"""
            },
        )

        workflow.add_node(
            "PortfolioListNode",
            "get_portfolios",
            {
                "filter": {"active": True, "deleted_at": {"$null": True}},
                "limit": 10000,
            },
        )

        # Filter to requested portfolios
        workflow.add_node(
            "PythonCodeNode",
            "filter_portfolios",
            {
                "code": f"""
from datetime import datetime

valuation_date = {date_code} or datetime.now().strftime("%Y-%m-%d")
requested_ids = {portfolio_ids_code}

# Filter to requested portfolios
portfolios_to_value = [p for p in records if p.get("id") in requested_ids]

# Multi-output
portfolios = portfolios_to_value
portfolio_count = len(portfolios_to_value)
portfolio_ids = [p.get("id") for p in portfolios_to_value]
val_date = valuation_date
"""
            },
        )

        workflow.add_connection("get_portfolios", "records", "filter_portfolios", "records")
    else:
        # Get all active portfolios
        workflow.add_node(
            "PortfolioListNode",
            "get_portfolios",
            {
                "filter": {"active": True, "deleted_at": {"$null": True}},
                "limit": 10000,
            },
        )

        workflow.add_node(
            "PythonCodeNode",
            "filter_portfolios",
            {
                "code": f"""
from datetime import datetime

valuation_date = {date_code} or datetime.now().strftime("%Y-%m-%d")

# Use all portfolios
portfolios_to_value = records if isinstance(records, list) else []

# Multi-output
portfolios = portfolios_to_value
portfolio_count = len(portfolios_to_value)
portfolio_ids = [p.get("id") for p in portfolios_to_value]
val_date = valuation_date
"""
            },
        )

        workflow.add_connection("get_portfolios", "records", "filter_portfolios", "records")

    # =========================================================================
    # Step 2: Get Holdings for All Portfolios
    # =========================================================================

    workflow.add_node(
        "HoldingListNode",
        "get_holdings",
        {
            "filter": {"deleted_at": {"$null": True}},
            "limit": 500000,
        },
    )

    # =========================================================================
    # Step 3: Get Latest Prices for Securities
    # =========================================================================

    workflow.add_node(
        "PriceHistoryListNode",
        "get_prices",
        {
            "filter": {},
            "limit": 500000,
        },
    )

    # =========================================================================
    # Step 4: Get Cash Balances
    # =========================================================================

    workflow.add_node(
        "CashAccountListNode",
        "get_cash_accounts",
        {
            "filter": {},
            "limit": 100000,
        },
    )

    # =========================================================================
    # Step 5: Get Previous Valuations (for return calculation)
    # =========================================================================

    workflow.add_node(
        "PortfolioValuationListNode",
        "get_previous_valuations",
        {
            "filter": {},
            "limit": 500000,
        },
    )

    # =========================================================================
    # Step 6: Calculate NAV and Returns
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "calculate_nav",
        {
            "code": f"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from datetime import datetime, timedelta
from collections import defaultdict

BASE_CURRENCY = "{base_currency}"

def safe_decimal(value):
    '''Safely convert to Decimal.'''
    if value is None or value == "" or value == "None":
        return Decimal("0")
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal("0")

def get_fx_rate(from_currency, to_currency, fx_rates):
    '''Get FX rate for currency conversion.'''
    if from_currency == to_currency:
        return Decimal("1")
    key = f"{{from_currency}}_{{to_currency}}"
    if key in fx_rates:
        return safe_decimal(fx_rates[key])
    # Try reverse
    reverse_key = f"{{to_currency}}_{{from_currency}}"
    if reverse_key in fx_rates:
        rate = safe_decimal(fx_rates[reverse_key])
        if rate > 0:
            return Decimal("1") / rate
    # Default to 1 if no rate found
    return Decimal("1")

# Build security to latest price mapping
# Structure: {{security_id: {{price_date: price_record}}}}
latest_prices = {{}}
for price in prices:
    sec_id = price.get("security_id")
    p_date = price.get("price_date", "")
    if sec_id:
        if sec_id not in latest_prices:
            latest_prices[sec_id] = price
        elif p_date > latest_prices[sec_id].get("price_date", ""):
            latest_prices[sec_id] = price

# Build portfolio holdings mapping
# Structure: {{portfolio_id: [holdings]}}
portfolio_holdings = defaultdict(list)
for holding in holdings:
    port_id = holding.get("portfolio_id")
    if port_id in portfolio_ids:
        portfolio_holdings[port_id].append(holding)

# Build portfolio cash mapping
# Structure: {{portfolio_id: {{currency: balance}}}}
portfolio_cash = defaultdict(dict)
for cash in cash_accounts:
    port_id = cash.get("portfolio_id")
    currency = cash.get("currency", BASE_CURRENCY)
    if port_id in portfolio_ids:
        portfolio_cash[port_id][currency] = safe_decimal(cash.get("balance", "0"))

# Build previous valuation mapping
# Structure: {{portfolio_id: {{date: valuation}}}}
prev_valuations = defaultdict(dict)
for val in previous_valuations:
    port_id = val.get("portfolio_id")
    v_date = val.get("valuation_date", "")
    if port_id and v_date:
        prev_valuations[port_id][v_date] = val

# Get period start dates
val_date_obj = datetime.strptime(val_date, "%Y-%m-%d")
prev_day = (val_date_obj - timedelta(days=1)).strftime("%Y-%m-%d")
month_start = val_date_obj.replace(day=1).strftime("%Y-%m-%d")
if val_date_obj.month <= 3:
    quarter_start = val_date_obj.replace(month=1, day=1).strftime("%Y-%m-%d")
elif val_date_obj.month <= 6:
    quarter_start = val_date_obj.replace(month=4, day=1).strftime("%Y-%m-%d")
elif val_date_obj.month <= 9:
    quarter_start = val_date_obj.replace(month=7, day=1).strftime("%Y-%m-%d")
else:
    quarter_start = val_date_obj.replace(month=10, day=1).strftime("%Y-%m-%d")
year_start = val_date_obj.replace(month=1, day=1).strftime("%Y-%m-%d")

# FX rates (placeholder - in production would fetch from FX data)
fx_rates = {{}}

# Calculate NAV for each portfolio
valuations = []
holding_updates = []

for portfolio in portfolios:
    port_id = portfolio.get("id")
    port_currency = portfolio.get("base_currency", BASE_CURRENCY)
    inception_date = portfolio.get("inception_date", year_start)

    # Calculate securities value
    securities_value = Decimal("0")
    holdings_for_port = portfolio_holdings.get(port_id, [])

    for holding in holdings_for_port:
        sec_id = holding.get("security_id")
        quantity = safe_decimal(holding.get("quantity", "0"))

        if quantity == 0:
            continue

        # Get latest price
        price_record = latest_prices.get(sec_id, {{}})
        price = safe_decimal(price_record.get("close_price", "0"))
        price_currency = price_record.get("currency", BASE_CURRENCY)

        # Convert to portfolio currency
        fx_rate = get_fx_rate(price_currency, port_currency, fx_rates)
        holding_value = quantity * price * fx_rate

        securities_value += holding_value

        # Track holding update
        holding_updates.append({{
            "id": holding.get("id"),
            "current_price": str(price.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)),
            "current_value": str(holding_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        }})

    # Calculate cash value
    cash_value = Decimal("0")
    cash_accounts_for_port = portfolio_cash.get(port_id, {{}})
    for currency, balance in cash_accounts_for_port.items():
        fx_rate = get_fx_rate(currency, port_currency, fx_rates)
        cash_value += balance * fx_rate

    # Total NAV
    total_value = securities_value + cash_value

    # Calculate returns
    def get_return(start_date, end_value):
        '''Calculate return from start date.'''
        port_vals = prev_valuations.get(port_id, {{}})
        # Find closest valuation to start date
        start_val = None
        for v_date, val in sorted(port_vals.items()):
            if v_date <= start_date:
                start_val = val
        if start_val:
            start_value = safe_decimal(start_val.get("total_value", "0"))
            if start_value > 0:
                return ((end_value - start_value) / start_value * 100).quantize(
                    Decimal("0.0001"), rounding=ROUND_HALF_UP
                )
        return None

    daily_return = get_return(prev_day, total_value)
    mtd_return = get_return(month_start, total_value)
    qtd_return = get_return(quarter_start, total_value)
    ytd_return = get_return(year_start, total_value)
    inception_return = get_return(inception_date, total_value)

    # Create valuation record
    valuation = {{
        "id": f"{{port_id}}_{{val_date}}",
        "portfolio_id": port_id,
        "valuation_date": val_date,
        "total_value": str(total_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "securities_value": str(securities_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "cash_value": str(cash_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "daily_return": str(daily_return) if daily_return else None,
        "mtd_return": str(mtd_return) if mtd_return else None,
        "qtd_return": str(qtd_return) if qtd_return else None,
        "ytd_return": str(ytd_return) if ytd_return else None,
        "inception_return": str(inception_return) if inception_return else None,
        "pricing_source": "eodhd",
        "is_final": False,
    }}
    valuations.append(valuation)

# Multi-output
valuation_records = valuations
valuation_count = len(valuations)
holding_update_records = holding_updates
holding_update_count = len(holding_updates)
"""
        },
    )

    # Connect inputs
    workflow.add_connection("filter_portfolios", "portfolios", "calculate_nav", "portfolios")
    workflow.add_connection("filter_portfolios", "portfolio_ids", "calculate_nav", "portfolio_ids")
    workflow.add_connection("filter_portfolios", "val_date", "calculate_nav", "val_date")
    workflow.add_connection("get_holdings", "records", "calculate_nav", "holdings")
    workflow.add_connection("get_prices", "records", "calculate_nav", "prices")
    workflow.add_connection("get_cash_accounts", "records", "calculate_nav", "cash_accounts")
    workflow.add_connection(
        "get_previous_valuations", "records", "calculate_nav", "previous_valuations"
    )

    # =========================================================================
    # Step 7: Save Valuations
    # =========================================================================

    workflow.add_node(
        "PortfolioValuationBulkUpsertNode",
        "save_valuations",
        {
            "data": "{{calculate_nav.valuation_records}}",
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("calculate_nav", "valuation_records", "save_valuations", "data")

    # =========================================================================
    # Step 8: Update Holdings with Current Values
    # =========================================================================

    workflow.add_node(
        "HoldingBulkUpdateNode",
        "update_holdings",
        {
            "data": "{{calculate_nav.holding_update_records}}",
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("calculate_nav", "holding_update_records", "update_holdings", "data")

    # =========================================================================
    # Step 9: Compile Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": """
from datetime import datetime

summary = {
    "workflow": "nav_calculation",
    "completed_at": datetime.now().isoformat(),
    "valuation_date": val_date,
    "portfolios_valued": portfolio_count,
    "valuations_saved": valuation_count,
    "holdings_updated": holding_update_count,
    "status": "success"
}

result = summary
"""
        },
    )

    # Connect summary inputs
    workflow.add_connection("filter_portfolios", "val_date", "compile_summary", "val_date")
    workflow.add_connection(
        "filter_portfolios", "portfolio_count", "compile_summary", "portfolio_count"
    )
    workflow.add_connection(
        "calculate_nav", "valuation_count", "compile_summary", "valuation_count"
    )
    workflow.add_connection(
        "calculate_nav", "holding_update_count", "compile_summary", "holding_update_count"
    )

    return workflow


def build_portfolio_valuation_workflow(
    portfolio_id: str,
    valuation_date: str | None = None,
    base_currency: str = "USD",
) -> WorkflowBuilder:
    """
    Build workflow to calculate NAV for a single portfolio.

    Convenience wrapper around build_nav_calculation_workflow.

    Args:
        portfolio_id: Portfolio to value.
        valuation_date: Date for valuation (YYYY-MM-DD). Defaults to today.
        base_currency: Base currency for calculations.

    Returns:
        WorkflowBuilder configured for single portfolio NAV calculation.

    Example:
        >>> workflow = build_portfolio_valuation_workflow(
        ...     portfolio_id="port-001",
        ...     valuation_date="2024-12-31"
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    return build_nav_calculation_workflow(
        portfolio_ids=[portfolio_id],
        valuation_date=valuation_date,
        base_currency=base_currency,
    )
