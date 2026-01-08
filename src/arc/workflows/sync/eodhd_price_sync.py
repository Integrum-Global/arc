"""
EODHD Price Sync Workflow.

Syncs historical price data from EODHD API to PriceHistory model.

Workflow Pattern:
1. Get active securities from database (SecurityListNode)
2. Fetch prices from EODHD API (AsyncPythonCodeNode with EODHDClient)
3. Transform and batch prices (PythonCodeNode)
4. Upsert to PriceHistory (PriceHistoryBulkUpsertNode)
5. Update security last_price_date (SecurityBulkUpdateNode)

Key Patterns:
- AsyncPythonCodeNode for async HTTP calls (v0.9.30+ feature parity)
- Multi-output from PythonCodeNode (v0.9.28+)
- BulkUpsertNode with conflict_resolution="update"
- Proper error handling with try/except in code nodes

CRITICAL RULES:
- NEVER manually set created_at or updated_at
- Use string decimals for all price values
- Composite ID format: "{security_id}_{price_date}"
"""

from kailash.workflow.builder import WorkflowBuilder


def build_eodhd_price_sync_workflow(
    security_ids: list[str] | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    batch_size: int = 1000,
) -> WorkflowBuilder:
    """
    Build workflow to sync prices for specified securities.

    Args:
        security_ids: List of security IDs to sync. If None, syncs all active securities.
        start_date: Start date for price history (YYYY-MM-DD). Defaults to last sync date.
        end_date: End date for price history (YYYY-MM-DD). Defaults to today.
        batch_size: Number of records per batch for bulk operations.

    Returns:
        WorkflowBuilder configured for price sync.

    Example:
        >>> workflow = build_eodhd_price_sync_workflow(
        ...     security_ids=["AAPL", "MSFT"],
        ...     start_date="2024-01-01",
        ...     end_date="2024-12-31"
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # =========================================================================
    # Step 1: Get Securities to Sync
    # =========================================================================
    # If security_ids provided, use them directly; otherwise query active securities

    if security_ids:
        # Use provided security IDs
        workflow.add_node(
            "PythonCodeNode",
            "get_securities",
            {
                "code": f"""
# Use provided security IDs
security_ids = {security_ids!r}
result = {{"security_ids": security_ids, "count": len(security_ids)}}
"""
            },
        )
    else:
        # Query active securities from database
        workflow.add_node(
            "SecurityListNode",
            "list_securities",
            {
                "filter": {"active": True, "deleted_at": {"$null": True}},  # Exclude soft-deleted
                "limit": 10000,  # Reasonable limit for sync operations
            },
        )

        # Extract security IDs from list result
        workflow.add_node(
            "PythonCodeNode",
            "get_securities",
            {
                "code": """
# Extract security IDs from database query
securities = records if isinstance(records, list) else []
security_ids = [s['id'] for s in securities]
result = {"security_ids": security_ids, "count": len(security_ids)}
"""
            },
        )

        workflow.add_connection("list_securities", "records", "get_securities", "records")

    # =========================================================================
    # Step 2: Fetch Prices from EODHD API
    # =========================================================================
    # Use AsyncPythonCodeNode for async HTTP calls with proper error handling

    # Build date parameters for the code
    start_date_code = f'"{start_date}"' if start_date else "None"
    end_date_code = f'"{end_date}"' if end_date else "None"

    workflow.add_node(
        "AsyncPythonCodeNode",
        "fetch_prices",
        {
            "code": f"""
import os
import httpx
from datetime import datetime, timedelta

# EODHD API configuration
BASE_URL = "https://eodhistoricaldata.com/api"
api_key = os.environ.get("EODHD_API_KEY")
if not api_key:
    raise ValueError("EODHD_API_KEY environment variable not set")

# Get parameters
security_ids = input_data.get("security_ids", [])
start_date = {start_date_code}
end_date = {end_date_code}

# Default date range if not specified
if not end_date:
    end_date = datetime.now().strftime("%Y-%m-%d")
if not start_date:
    # Default to last 30 days if no start date
    start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

# Fetch prices for each security
all_prices = []
errors = []
success_count = 0
error_count = 0

async with httpx.AsyncClient(timeout=30.0) as client:
    for security_id in security_ids:
        try:
            # Extract ticker and exchange from security_id
            parts = security_id.split(".")
            ticker = parts[0]
            exchange = parts[1] if len(parts) > 1 else "US"

            # Build endpoint URL
            endpoint = f"{{BASE_URL}}/eod/{{ticker}}.{{exchange}}"
            params = {{
                "api_token": api_key,
                "fmt": "json",
                "from": start_date,
                "to": end_date,
            }}

            # Fetch historical prices
            response = await client.get(endpoint, params=params)
            response.raise_for_status()
            prices = response.json()

            if isinstance(prices, list):
                for price in prices:
                    price["security_id"] = security_id
                all_prices.extend(prices)

            success_count += 1

        except Exception as e:
            errors.append({{"security_id": security_id, "error": str(e)}})
            error_count += 1

# Export multiple outputs (v0.9.28+ feature)
prices_data = all_prices
fetch_errors = errors
fetch_success_count = success_count
fetch_error_count = error_count
fetch_total = len(security_ids)
"""
        },
    )

    workflow.add_connection("get_securities", "result", "fetch_prices", "input_data")

    # =========================================================================
    # Step 3: Transform Prices to PriceHistory Format
    # =========================================================================
    # Convert EODHD response format to PriceHistory model format

    workflow.add_node(
        "PythonCodeNode",
        "transform_prices",
        {
            "code": """
from datetime import datetime

# Transform to PriceHistory model format
price_records = []

for price in prices_data:
    security_id = price.get("security_id", "")
    price_date = price.get("date", "")

    if not security_id or not price_date:
        continue

    # Create composite ID: "{security_id}_{price_date}"
    record_id = f"{security_id}_{price_date}"

    # Convert numeric values to string decimals (DataFlow best practice)
    price_records.append({
        "id": record_id,
        "security_id": security_id,
        "price_date": price_date,
        "open_price": str(price.get("open", 0)),
        "high_price": str(price.get("high", 0)),
        "low_price": str(price.get("low", 0)),
        "close_price": str(price.get("close", 0)),
        "adjusted_close": str(price.get("adjusted_close", 0)),
        "volume": int(price.get("volume", 0)),
        "source": "eodhd",
        "currency": "USD",
        "is_adjusted": True
    })

# Calculate daily returns if we have enough data
# Sort by security and date for return calculation
from collections import defaultdict
by_security = defaultdict(list)
for record in price_records:
    by_security[record["security_id"]].append(record)

for security_id, records in by_security.items():
    records.sort(key=lambda x: x["price_date"])
    for i in range(1, len(records)):
        prev_close = float(records[i-1]["close_price"])
        curr_close = float(records[i]["close_price"])
        if prev_close > 0:
            daily_return = (curr_close - prev_close) / prev_close
            records[i]["daily_return"] = str(round(daily_return, 6))

# Multi-output (v0.9.28+)
transformed_prices = price_records
transform_count = len(price_records)
"""
        },
    )

    workflow.add_connection("fetch_prices", "prices_data", "transform_prices", "prices_data")

    # =========================================================================
    # Step 4: Bulk Upsert to PriceHistory
    # =========================================================================
    # Use BulkUpsertNode for efficient database operations
    # conflict_resolution="update" updates existing records

    workflow.add_node(
        "PriceHistoryBulkUpsertNode",
        "save_prices",
        {
            "data": "{{transform_prices.transformed_prices}}",
            "conflict_resolution": "update",  # Update existing, insert new
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("transform_prices", "transformed_prices", "save_prices", "data")

    # =========================================================================
    # Step 5: Update Security last_price_date
    # =========================================================================
    # Track when each security was last synced

    workflow.add_node(
        "PythonCodeNode",
        "prepare_security_updates",
        {
            "code": """
from datetime import datetime
from collections import defaultdict

# Find the latest price date for each security
latest_dates = defaultdict(str)
for record in transformed_prices:
    security_id = record["security_id"]
    price_date = record["price_date"]
    if price_date > latest_dates[security_id]:
        latest_dates[security_id] = price_date

# Prepare update records
security_updates = [
    {"id": security_id, "last_price_date": date}
    for security_id, date in latest_dates.items()
]

# Multi-output
update_records = security_updates
update_count = len(security_updates)
"""
        },
    )

    workflow.add_connection(
        "transform_prices", "transformed_prices", "prepare_security_updates", "transformed_prices"
    )

    # Bulk update securities (only if we have updates)
    workflow.add_node(
        "SecurityBulkUpdateNode",
        "update_securities",
        {"data": "{{prepare_security_updates.update_records}}", "batch_size": 500},
    )

    workflow.add_connection(
        "prepare_security_updates", "update_records", "update_securities", "data"
    )

    # =========================================================================
    # Step 6: Compile Sync Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": """
from datetime import datetime

# Compile comprehensive sync summary
summary = {
    "sync_type": "eodhd_price_sync",
    "completed_at": datetime.now().isoformat(),
    "securities_requested": fetch_total,
    "securities_success": fetch_success_count,
    "securities_failed": fetch_error_count,
    "prices_fetched": len(prices_data) if prices_data else 0,
    "prices_saved": transform_count,
    "securities_updated": update_count,
    "errors": fetch_errors[:10] if fetch_errors else [],  # First 10 errors
    "status": "success" if fetch_error_count == 0 else "partial_success"
}

result = summary
"""
        },
    )

    # Connect all summary inputs
    workflow.add_connection("fetch_prices", "fetch_total", "compile_summary", "fetch_total")
    workflow.add_connection(
        "fetch_prices", "fetch_success_count", "compile_summary", "fetch_success_count"
    )
    workflow.add_connection(
        "fetch_prices", "fetch_error_count", "compile_summary", "fetch_error_count"
    )
    workflow.add_connection("fetch_prices", "prices_data", "compile_summary", "prices_data")
    workflow.add_connection("fetch_prices", "fetch_errors", "compile_summary", "fetch_errors")
    workflow.add_connection(
        "transform_prices", "transform_count", "compile_summary", "transform_count"
    )
    workflow.add_connection(
        "prepare_security_updates", "update_count", "compile_summary", "update_count"
    )

    return workflow


def build_eodhd_bulk_price_sync_workflow(
    exchange: str = "US",
    date: str | None = None,
    batch_size: int = 2000,
) -> WorkflowBuilder:
    """
    Build workflow to sync bulk prices for an entire exchange.

    Uses EODHD's bulk endpoint for more efficient data retrieval.
    Useful for end-of-day sync operations.

    Args:
        exchange: Exchange code (e.g., "US", "LSE", "TO").
        date: Date to fetch prices for (YYYY-MM-DD). Defaults to latest.
        batch_size: Number of records per batch for bulk operations.

    Returns:
        WorkflowBuilder configured for bulk price sync.

    Example:
        >>> workflow = build_eodhd_bulk_price_sync_workflow(exchange="US")
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Date parameter for code
    date_code = f'"{date}"' if date else "None"

    # =========================================================================
    # Step 1: Fetch Bulk Prices from EODHD
    # =========================================================================

    workflow.add_node(
        "AsyncPythonCodeNode",
        "fetch_bulk_prices",
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

exchange = "{exchange}"
date = {date_code}

# Build endpoint URL
endpoint = f"{{BASE_URL}}/eod-bulk-last-day/{{exchange}}"
params = {{"api_token": api_key, "fmt": "json"}}
if date:
    params["date"] = date

async with httpx.AsyncClient(timeout=60.0) as client:
    response = await client.get(endpoint, params=params)
    response.raise_for_status()
    prices = response.json()

if not isinstance(prices, list):
    prices = []

# Multi-output
bulk_prices = prices
exchange_code = exchange
price_date = date or datetime.now().strftime("%Y-%m-%d")
total_fetched = len(prices)
"""
        },
    )

    # =========================================================================
    # Step 2: Match with Known Securities
    # =========================================================================
    # Only save prices for securities in our database

    workflow.add_node(
        "SecurityListNode",
        "list_exchange_securities",
        {
            "filter": {"exchange": exchange, "active": True, "deleted_at": {"$null": True}},
            "limit": 50000,
        },
    )

    workflow.add_node(
        "PythonCodeNode",
        "match_securities",
        {
            "code": """
# Create lookup of known securities by ticker
known_tickers = {s['ticker']: s['id'] for s in records if 'ticker' in s}

# Match bulk prices with known securities
matched_prices = []
unmatched_count = 0

for price in bulk_prices:
    ticker = price.get("code", "")
    if ticker in known_tickers:
        security_id = known_tickers[ticker]
        price_date = price.get("date", "")

        if security_id and price_date:
            matched_prices.append({
                "id": f"{security_id}_{price_date}",
                "security_id": security_id,
                "price_date": price_date,
                "open_price": str(price.get("open", 0)),
                "high_price": str(price.get("high", 0)),
                "low_price": str(price.get("low", 0)),
                "close_price": str(price.get("close", 0)),
                "adjusted_close": str(price.get("adjusted_close", 0)),
                "volume": int(price.get("volume", 0)),
                "source": "eodhd",
                "currency": "USD",
                "is_adjusted": True
            })
    else:
        unmatched_count += 1

# Multi-output
price_records = matched_prices
matched_count = len(matched_prices)
unmatched = unmatched_count
"""
        },
    )

    workflow.add_connection("fetch_bulk_prices", "bulk_prices", "match_securities", "bulk_prices")
    workflow.add_connection("list_exchange_securities", "records", "match_securities", "records")

    # =========================================================================
    # Step 3: Bulk Upsert Matched Prices
    # =========================================================================

    workflow.add_node(
        "PriceHistoryBulkUpsertNode",
        "save_bulk_prices",
        {
            "data": "{{match_securities.price_records}}",
            "conflict_resolution": "update",
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("match_securities", "price_records", "save_bulk_prices", "data")

    # =========================================================================
    # Step 4: Compile Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": """
from datetime import datetime

summary = {
    "sync_type": "eodhd_bulk_price_sync",
    "completed_at": datetime.now().isoformat(),
    "exchange": exchange_code,
    "price_date": price_date,
    "total_fetched": total_fetched,
    "matched_saved": matched_count,
    "unmatched_skipped": unmatched,
    "status": "success"
}

result = summary
"""
        },
    )

    workflow.add_connection(
        "fetch_bulk_prices", "exchange_code", "compile_summary", "exchange_code"
    )
    workflow.add_connection("fetch_bulk_prices", "price_date", "compile_summary", "price_date")
    workflow.add_connection(
        "fetch_bulk_prices", "total_fetched", "compile_summary", "total_fetched"
    )
    workflow.add_connection("match_securities", "matched_count", "compile_summary", "matched_count")
    workflow.add_connection("match_securities", "unmatched", "compile_summary", "unmatched")

    return workflow
