"""
Company Fundamentals Sync Workflow.

Syncs fundamental data (financial statements) from external APIs to CompanyFundamentals model.

Workflow Pattern:
1. Get equities to sync (SecurityListNode)
2. Fetch fundamentals from API (AsyncPythonCodeNode)
3. Transform to CompanyFundamentals format (PythonCodeNode)
4. Upsert fundamentals (CompanyFundamentalsBulkUpsertNode)
5. Trigger ratio recalculation (sub-workflow)
6. Update security last_fundamental_date (SecurityBulkUpdateNode)

Key Patterns:
- AsyncPythonCodeNode for async HTTP calls
- Multi-output from PythonCodeNode (v0.9.28+)
- BulkUpsertNode with conflict_resolution="update"
- Proper error handling

CRITICAL RULES:
- NEVER manually set created_at or updated_at
- Use string decimals for ALL financial values
- Composite ID format: "{security_id}_{fiscal_year}_{fiscal_quarter or 'FY'}"
"""

from kailash.workflow.builder import WorkflowBuilder


def build_fundamentals_sync_workflow(
    security_ids: list[str] | None = None,
    sync_annual: bool = True,
    sync_quarterly: bool = True,
    batch_size: int = 500,
    trigger_ratio_calc: bool = True,
) -> WorkflowBuilder:
    """
    Build workflow to sync company fundamentals.

    Args:
        security_ids: List of security IDs to sync. If None, syncs all active equities.
        sync_annual: Whether to sync annual statements.
        sync_quarterly: Whether to sync quarterly statements.
        batch_size: Number of records per batch for bulk operations.
        trigger_ratio_calc: Whether to trigger ratio recalculation after sync.

    Returns:
        WorkflowBuilder configured for fundamentals sync.

    Example:
        >>> workflow = build_fundamentals_sync_workflow(
        ...     security_ids=["AAPL", "MSFT"],
        ...     sync_annual=True,
        ...     sync_quarterly=True
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # =========================================================================
    # Step 1: Get Securities to Sync
    # =========================================================================

    if security_ids:
        workflow.add_node(
            "PythonCodeNode",
            "get_securities",
            {
                "code": f"""
security_ids = {security_ids!r}
result = {{"security_ids": security_ids, "count": len(security_ids)}}
"""
            },
        )
    else:
        # Query active equities only (fundamentals are for equities)
        workflow.add_node(
            "SecurityListNode",
            "list_equities",
            {
                "filter": {
                    "security_type": "equity",
                    "active": True,
                    "deleted_at": {"$null": True},
                },
                "limit": 5000,
            },
        )

        workflow.add_node(
            "PythonCodeNode",
            "get_securities",
            {
                "code": """
securities = records if isinstance(records, list) else []
security_ids = [s['id'] for s in securities]
result = {"security_ids": security_ids, "count": len(security_ids)}
"""
            },
        )

        workflow.add_connection("list_equities", "records", "get_securities", "records")

    # =========================================================================
    # Step 2: Fetch Fundamentals from API
    # =========================================================================
    # Using EODHD for fundamentals (can be swapped for Capital IQ)

    workflow.add_node(
        "AsyncPythonCodeNode",
        "fetch_fundamentals",
        {
            "code": f"""
import os
import httpx
from datetime import datetime

# EODHD API configuration
BASE_URL = "https://eodhistoricaldata.com/api"
api_key = os.environ.get("EODHD_API_KEY")
if not api_key:
    raise ValueError("EODHD_API_KEY environment variable not set")

security_ids = input_data.get("security_ids", [])
sync_annual = {sync_annual}
sync_quarterly = {sync_quarterly}

all_fundamentals = []
errors = []
success_count = 0
error_count = 0

async with httpx.AsyncClient(timeout=30.0) as client:
    for security_id in security_ids:
        try:
            # Extract ticker and exchange
            parts = security_id.split(".")
            ticker = parts[0]
            exchange = parts[1] if len(parts) > 1 else "US"

            # Build endpoint URL
            endpoint = f"{{BASE_URL}}/fundamentals/{{ticker}}.{{exchange}}"
            params = {{"api_token": api_key, "fmt": "json"}}

            # Fetch fundamentals
            response = await client.get(endpoint, params=params)
            response.raise_for_status()
            fundamentals = response.json()

            if fundamentals and isinstance(fundamentals, dict):
                fundamentals["security_id"] = security_id
                all_fundamentals.append(fundamentals)
                success_count += 1

        except Exception as e:
            errors.append({{"security_id": security_id, "error": str(e)}})
            error_count += 1

# Multi-output
fundamentals_data = all_fundamentals
fetch_errors = errors
fetch_success_count = success_count
fetch_error_count = error_count
fetch_total = len(security_ids)
"""
        },
    )

    workflow.add_connection("get_securities", "result", "fetch_fundamentals", "input_data")

    # =========================================================================
    # Step 3: Transform to CompanyFundamentals Format
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "transform_fundamentals",
        {
            "code": f"""
from datetime import datetime

def safe_str(value):
    '''Convert value to string for decimal fields, None if None/empty.'''
    if value is None or value == "":
        return None
    return str(value)

sync_annual = {sync_annual}
sync_quarterly = {sync_quarterly}

fundamental_records = []

for data in fundamentals_data:
    security_id = data.get("security_id", "")
    if not security_id:
        continue

    general = data.get("general", {{}})
    income_stmt = data.get("income_statement", {{}})
    balance_sheet = data.get("balance_sheet", {{}})
    cash_flow = data.get("cash_flow", {{}})
    highlights = data.get("highlights", {{}})

    # Extract fiscal year from data (default to current year)
    fiscal_year = datetime.now().year

    # Create annual record if enabled
    if sync_annual:
        annual_id = f"{{security_id}}_{{fiscal_year}}_FY"

        annual_record = {{
            "id": annual_id,
            "security_id": security_id,
            "fiscal_year": fiscal_year,
            "fiscal_quarter": None,
            "period_type": "annual",
            "period_end_date": f"{{fiscal_year}}-12-31",

            # Income Statement
            "revenue": safe_str(highlights.get("revenue_ttm")),
            "gross_profit": safe_str(highlights.get("gross_profit_ttm")),
            "operating_income": safe_str(income_stmt.get("operatingIncome")),
            "ebitda": safe_str(income_stmt.get("ebitda")),
            "net_income": safe_str(income_stmt.get("netIncome")),
            "eps_basic": safe_str(highlights.get("eps")),
            "eps_diluted": safe_str(highlights.get("diluted_eps")),
            "operating_expenses": safe_str(income_stmt.get("operatingExpenses")),
            "interest_expense": safe_str(income_stmt.get("interestExpense")),

            # Balance Sheet
            "total_assets": safe_str(balance_sheet.get("totalAssets")),
            "current_assets": safe_str(balance_sheet.get("totalCurrentAssets")),
            "cash_and_equivalents": safe_str(balance_sheet.get("cash")),
            "accounts_receivable": safe_str(balance_sheet.get("netReceivables")),
            "inventory": safe_str(balance_sheet.get("inventory")),
            "total_liabilities": safe_str(balance_sheet.get("totalLiab")),
            "current_liabilities": safe_str(balance_sheet.get("totalCurrentLiabilities")),
            "long_term_debt": safe_str(balance_sheet.get("longTermDebt")),
            "total_debt": safe_str(balance_sheet.get("shortLongTermDebt")),
            "total_equity": safe_str(balance_sheet.get("totalStockholderEquity")),
            "retained_earnings": safe_str(balance_sheet.get("retainedEarnings")),

            # Cash Flow
            "operating_cash_flow": safe_str(cash_flow.get("totalCashFromOperatingActivities")),
            "capital_expenditures": safe_str(cash_flow.get("capitalExpenditures")),
            "free_cash_flow": safe_str(cash_flow.get("freeCashFlow")),
            "dividends_paid": safe_str(cash_flow.get("dividendsPaid")),

            # Metadata
            "source": "eodhd",
            "currency": general.get("currency", "USD"),
        }}

        fundamental_records.append(annual_record)

    # Quarterly records would follow similar pattern
    # (Simplified for this example - would parse quarterly data from API)

# Multi-output
transformed_fundamentals = fundamental_records
transform_count = len(fundamental_records)
"""
        },
    )

    workflow.add_connection(
        "fetch_fundamentals", "fundamentals_data", "transform_fundamentals", "fundamentals_data"
    )

    # =========================================================================
    # Step 4: Bulk Upsert Fundamentals
    # =========================================================================

    workflow.add_node(
        "CompanyFundamentalsBulkUpsertNode",
        "save_fundamentals",
        {
            "data": "{{transform_fundamentals.transformed_fundamentals}}",
            "conflict_resolution": "update",
            "batch_size": batch_size,
        },
    )

    workflow.add_connection(
        "transform_fundamentals", "transformed_fundamentals", "save_fundamentals", "data"
    )

    # =========================================================================
    # Step 5: Calculate Financial Ratios (Optional)
    # =========================================================================
    if trigger_ratio_calc:
        workflow.add_node(
            "PythonCodeNode",
            "calculate_ratios",
            {
                "code": """
from datetime import datetime
from decimal import Decimal, InvalidOperation

def safe_decimal(value):
    '''Safely convert to Decimal.'''
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None

def safe_divide(numerator, denominator):
    '''Safely divide, returning None if not possible.'''
    if numerator is None or denominator is None:
        return None
    if denominator == 0:
        return None
    return str(round(numerator / denominator, 4))

calculation_date = datetime.now().strftime("%Y-%m-%d")
ratio_records = []

for fund in transformed_fundamentals:
    security_id = fund.get("security_id", "")
    if not security_id:
        continue

    # Parse financial values
    current_assets = safe_decimal(fund.get("current_assets"))
    current_liabilities = safe_decimal(fund.get("current_liabilities"))
    total_assets = safe_decimal(fund.get("total_assets"))
    total_liabilities = safe_decimal(fund.get("total_liabilities"))
    total_equity = safe_decimal(fund.get("total_equity"))
    net_income = safe_decimal(fund.get("net_income"))
    revenue = safe_decimal(fund.get("revenue"))
    inventory = safe_decimal(fund.get("inventory"))
    operating_income = safe_decimal(fund.get("operating_income"))
    total_debt = safe_decimal(fund.get("total_debt"))

    # Liquidity Ratios
    if current_assets and current_liabilities:
        # Current Ratio
        ratio_records.append({
            "id": f"{security_id}_{calculation_date}_current_ratio",
            "security_id": security_id,
            "calculation_date": calculation_date,
            "ratio_class": "liquidity",
            "ratio_name": "current_ratio",
            "ratio_value": safe_divide(current_assets, current_liabilities),
            "source_fundamentals_id": fund.get("id")
        })

        # Quick Ratio (excludes inventory)
        quick_assets = current_assets - (inventory or Decimal(0))
        ratio_records.append({
            "id": f"{security_id}_{calculation_date}_quick_ratio",
            "security_id": security_id,
            "calculation_date": calculation_date,
            "ratio_class": "liquidity",
            "ratio_name": "quick_ratio",
            "ratio_value": safe_divide(quick_assets, current_liabilities),
            "source_fundamentals_id": fund.get("id")
        })

    # Profitability Ratios
    if net_income and total_equity:
        # ROE - Return on Equity
        ratio_records.append({
            "id": f"{security_id}_{calculation_date}_roe",
            "security_id": security_id,
            "calculation_date": calculation_date,
            "ratio_class": "profitability",
            "ratio_name": "roe",
            "ratio_value": safe_divide(net_income, total_equity),
            "source_fundamentals_id": fund.get("id")
        })

    if net_income and total_assets:
        # ROA - Return on Assets
        ratio_records.append({
            "id": f"{security_id}_{calculation_date}_roa",
            "security_id": security_id,
            "calculation_date": calculation_date,
            "ratio_class": "profitability",
            "ratio_name": "roa",
            "ratio_value": safe_divide(net_income, total_assets),
            "source_fundamentals_id": fund.get("id")
        })

    if net_income and revenue:
        # Profit Margin
        ratio_records.append({
            "id": f"{security_id}_{calculation_date}_profit_margin",
            "security_id": security_id,
            "calculation_date": calculation_date,
            "ratio_class": "profitability",
            "ratio_name": "profit_margin",
            "ratio_value": safe_divide(net_income, revenue),
            "source_fundamentals_id": fund.get("id")
        })

    if operating_income and revenue:
        # Operating Margin
        ratio_records.append({
            "id": f"{security_id}_{calculation_date}_operating_margin",
            "security_id": security_id,
            "calculation_date": calculation_date,
            "ratio_class": "profitability",
            "ratio_name": "operating_margin",
            "ratio_value": safe_divide(operating_income, revenue),
            "source_fundamentals_id": fund.get("id")
        })

    # Leverage Ratios
    if total_debt and total_equity:
        # Debt to Equity
        ratio_records.append({
            "id": f"{security_id}_{calculation_date}_debt_to_equity",
            "security_id": security_id,
            "calculation_date": calculation_date,
            "ratio_class": "leverage",
            "ratio_name": "debt_to_equity",
            "ratio_value": safe_divide(total_debt, total_equity),
            "source_fundamentals_id": fund.get("id")
        })

    if total_liabilities and total_assets:
        # Debt Ratio
        ratio_records.append({
            "id": f"{security_id}_{calculation_date}_debt_ratio",
            "security_id": security_id,
            "calculation_date": calculation_date,
            "ratio_class": "leverage",
            "ratio_name": "debt_ratio",
            "ratio_value": safe_divide(total_liabilities, total_assets),
            "source_fundamentals_id": fund.get("id")
        })

# Filter out records with None ratio_value
ratio_records = [r for r in ratio_records if r.get("ratio_value") is not None]

# Multi-output
calculated_ratios = ratio_records
ratio_count = len(ratio_records)
"""
            },
        )

        workflow.add_connection(
            "transform_fundamentals",
            "transformed_fundamentals",
            "calculate_ratios",
            "transformed_fundamentals",
        )

        # Save ratios
        workflow.add_node(
            "SecurityRatioBulkUpsertNode",
            "save_ratios",
            {
                "data": "{{calculate_ratios.calculated_ratios}}",
                "conflict_resolution": "update",
                "batch_size": 1000,
            },
        )

        workflow.add_connection("calculate_ratios", "calculated_ratios", "save_ratios", "data")

    # =========================================================================
    # Step 6: Update Security last_fundamental_date
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "prepare_security_updates",
        {
            "code": """
from datetime import datetime

# Get unique security IDs from transformed fundamentals
security_ids_updated = list(set(
    f.get("security_id") for f in transformed_fundamentals
    if f.get("security_id")
))

today = datetime.now().strftime("%Y-%m-%d")

# Prepare update records
security_updates = [
    {"id": security_id, "last_fundamental_date": today}
    for security_id in security_ids_updated
]

# Multi-output
update_records = security_updates
update_count = len(security_updates)
"""
        },
    )

    workflow.add_connection(
        "transform_fundamentals",
        "transformed_fundamentals",
        "prepare_security_updates",
        "transformed_fundamentals",
    )

    workflow.add_node(
        "SecurityBulkUpdateNode",
        "update_securities",
        {"data": "{{prepare_security_updates.update_records}}", "batch_size": 500},
    )

    workflow.add_connection(
        "prepare_security_updates", "update_records", "update_securities", "data"
    )

    # =========================================================================
    # Step 7: Compile Summary
    # =========================================================================

    ratio_count_var = "ratio_count" if trigger_ratio_calc else "0"

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": f"""
from datetime import datetime

summary = {{
    "sync_type": "fundamentals_sync",
    "completed_at": datetime.now().isoformat(),
    "securities_requested": fetch_total,
    "securities_success": fetch_success_count,
    "securities_failed": fetch_error_count,
    "fundamentals_saved": transform_count,
    "ratios_calculated": {ratio_count_var} if '{ratio_count_var}' != '0' else 0,
    "securities_updated": update_count,
    "errors": fetch_errors[:10] if fetch_errors else [],
    "status": "success" if fetch_error_count == 0 else "partial_success"
}}

result = summary
"""
        },
    )

    # Connect summary inputs
    workflow.add_connection("fetch_fundamentals", "fetch_total", "compile_summary", "fetch_total")
    workflow.add_connection(
        "fetch_fundamentals", "fetch_success_count", "compile_summary", "fetch_success_count"
    )
    workflow.add_connection(
        "fetch_fundamentals", "fetch_error_count", "compile_summary", "fetch_error_count"
    )
    workflow.add_connection("fetch_fundamentals", "fetch_errors", "compile_summary", "fetch_errors")
    workflow.add_connection(
        "transform_fundamentals", "transform_count", "compile_summary", "transform_count"
    )
    workflow.add_connection(
        "prepare_security_updates", "update_count", "compile_summary", "update_count"
    )

    if trigger_ratio_calc:
        workflow.add_connection("calculate_ratios", "ratio_count", "compile_summary", "ratio_count")

    return workflow


def build_ratio_recalculation_workflow(
    security_ids: list[str] | None = None,
    calculation_date: str | None = None,
    batch_size: int = 1000,
) -> WorkflowBuilder:
    """
    Build workflow to recalculate financial ratios from existing fundamentals.

    Useful when ratio calculation logic changes or for historical recalculation.

    Args:
        security_ids: List of security IDs to recalculate. If None, recalculates all.
        calculation_date: Date for ratio calculation. Defaults to today.
        batch_size: Number of records per batch.

    Returns:
        WorkflowBuilder configured for ratio recalculation.
    """
    workflow = WorkflowBuilder()

    date_code = f'"{calculation_date}"' if calculation_date else "None"

    # =========================================================================
    # Step 1: Get Latest Fundamentals
    # =========================================================================

    if security_ids:
        workflow.add_node(
            "CompanyFundamentalsListNode",
            "get_fundamentals",
            {"filter": {"security_id": {"$in": security_ids}}, "limit": 10000},
        )
    else:
        workflow.add_node(
            "CompanyFundamentalsListNode", "get_fundamentals", {"filter": {}, "limit": 50000}
        )

    # =========================================================================
    # Step 2: Get Latest per Security
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "deduplicate_fundamentals",
        {
            "code": f"""
from datetime import datetime

calculation_date = {date_code} or datetime.now().strftime("%Y-%m-%d")

# Get the latest record per security
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
"""
        },
    )

    workflow.add_connection("get_fundamentals", "records", "deduplicate_fundamentals", "records")

    # =========================================================================
    # Step 3: Calculate Ratios (Same logic as fundamentals sync)
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "calculate_ratios",
        {
            "code": """
from decimal import Decimal, InvalidOperation

def safe_decimal(value):
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None

def safe_divide(numerator, denominator):
    if numerator is None or denominator is None:
        return None
    if denominator == 0:
        return None
    return str(round(numerator / denominator, 4))

ratio_records = []

for fund in latest_fundamentals:
    security_id = fund.get("security_id", "")
    if not security_id:
        continue

    current_assets = safe_decimal(fund.get("current_assets"))
    current_liabilities = safe_decimal(fund.get("current_liabilities"))
    total_assets = safe_decimal(fund.get("total_assets"))
    total_equity = safe_decimal(fund.get("total_equity"))
    net_income = safe_decimal(fund.get("net_income"))
    revenue = safe_decimal(fund.get("revenue"))
    inventory = safe_decimal(fund.get("inventory"))
    total_liabilities = safe_decimal(fund.get("total_liabilities"))
    total_debt = safe_decimal(fund.get("total_debt"))

    # Calculate ratios (same as above)
    if current_assets and current_liabilities:
        ratio_records.append({
            "id": f"{security_id}_{calc_date}_current_ratio",
            "security_id": security_id,
            "calculation_date": calc_date,
            "ratio_class": "liquidity",
            "ratio_name": "current_ratio",
            "ratio_value": safe_divide(current_assets, current_liabilities),
            "source_fundamentals_id": fund.get("id")
        })

    if net_income and total_equity:
        ratio_records.append({
            "id": f"{security_id}_{calc_date}_roe",
            "security_id": security_id,
            "calculation_date": calc_date,
            "ratio_class": "profitability",
            "ratio_name": "roe",
            "ratio_value": safe_divide(net_income, total_equity),
            "source_fundamentals_id": fund.get("id")
        })

    if net_income and total_assets:
        ratio_records.append({
            "id": f"{security_id}_{calc_date}_roa",
            "security_id": security_id,
            "calculation_date": calc_date,
            "ratio_class": "profitability",
            "ratio_name": "roa",
            "ratio_value": safe_divide(net_income, total_assets),
            "source_fundamentals_id": fund.get("id")
        })

# Filter None values
ratio_records = [r for r in ratio_records if r.get("ratio_value") is not None]

calculated_ratios = ratio_records
ratio_count = len(ratio_records)
"""
        },
    )

    workflow.add_connection(
        "deduplicate_fundamentals", "latest_fundamentals", "calculate_ratios", "latest_fundamentals"
    )
    workflow.add_connection(
        "deduplicate_fundamentals", "calc_date", "calculate_ratios", "calc_date"
    )

    # =========================================================================
    # Step 4: Save Ratios
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
    # Step 5: Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": """
from datetime import datetime

summary = {
    "sync_type": "ratio_recalculation",
    "completed_at": datetime.now().isoformat(),
    "calculation_date": calc_date,
    "fundamentals_processed": fundamentals_count,
    "ratios_calculated": ratio_count,
    "status": "success"
}

result = summary
"""
        },
    )

    workflow.add_connection("deduplicate_fundamentals", "calc_date", "compile_summary", "calc_date")
    workflow.add_connection(
        "deduplicate_fundamentals", "fundamentals_count", "compile_summary", "fundamentals_count"
    )
    workflow.add_connection("calculate_ratios", "ratio_count", "compile_summary", "ratio_count")

    return workflow
