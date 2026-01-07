# Backend Plan: Kailash Workflows

## Overview

This document defines ALL Kailash workflows required for the ARC platform. Each workflow includes complete node specifications, connections, inputs/outputs, and implementation details.

---

## 1. Data Synchronization Workflows

### 1.1 WF-SYNC-001: EODHD Price Sync

**File**: `src/arc/workflows/data_sync/eodhd.py`

**Purpose**: Sync daily prices from EODHD for all active securities

**Trigger**:
- Scheduled: Daily at 6:00 AM UTC
- Manual: Via admin endpoint

**Inputs**:
```python
{
    "security_ids": Optional[List[str]],  # Specific securities (None = all)
    "start_date": Optional[str],          # Default: yesterday
    "end_date": Optional[str]             # Default: today
}
```

**Outputs**:
```python
{
    "records_processed": int,
    "records_created": int,
    "records_updated": int,
    "errors": List[dict],
    "duration_seconds": float
}
```

**Workflow Definition**:
```python
def create_eodhd_price_sync_workflow():
    workflow = WorkflowBuilder()
    workflow.add_metadata({
        "name": "eodhd_price_sync",
        "description": "Synchronize daily prices from EODHD",
        "version": "1.0.0"
    })

    # Node 1: Get securities to sync
    workflow.add_node("SecurityListNode", "get_securities", {
        "filter": {
            "active": True,
            "is_private": False
        },
        "limit": 10000
    })

    # Node 2: Get EODHD connection credentials
    workflow.add_node("DataProviderConnectionReadNode", "get_credentials", {
        "filter": {"provider": "eodhd", "enabled": True}
    })

    # Node 3: Fetch prices from EODHD API
    workflow.add_node("PythonCodeNode", "fetch_prices", {
        "code": '''
import httpx
import asyncio
from datetime import date, timedelta

securities = inputs.get("securities", {}).get("records", [])
connection = inputs.get("credentials")
start_date = inputs.get("start_date") or (date.today() - timedelta(days=1)).isoformat()
end_date = inputs.get("end_date") or date.today().isoformat()

api_key = decrypt_api_key(connection["api_key_encrypted"])
base_url = "https://eodhistoricaldata.com/api/eod"

all_prices = []
errors = []

async with httpx.AsyncClient(timeout=30) as client:
    for security in securities:
        ticker = security["ticker"]
        exchange = security.get("exchange", "US")

        try:
            url = f"{base_url}/{ticker}.{exchange}"
            params = {
                "api_token": api_key,
                "from": start_date,
                "to": end_date,
                "fmt": "json"
            }

            response = await client.get(url, params=params)
            response.raise_for_status()

            for price_data in response.json():
                all_prices.append({
                    "id": f"{security['id']}_{price_data['date']}",
                    "security_id": security["id"],
                    "price_date": price_data["date"],
                    "open_price": str(price_data.get("open")),
                    "high_price": str(price_data.get("high")),
                    "low_price": str(price_data.get("low")),
                    "close_price": str(price_data["close"]),
                    "adjusted_close": str(price_data.get("adjusted_close", price_data["close"])),
                    "volume": price_data.get("volume", 0),
                    "source": "eodhd"
                })
        except Exception as e:
            errors.append({"security_id": security["id"], "error": str(e)})

result = {"prices": all_prices, "errors": errors}
        '''
    })
    workflow.add_connection("get_securities", "records", "fetch_prices", "securities")
    workflow.add_connection("get_credentials", "result", "fetch_prices", "credentials")

    # Node 4: Batch prices for bulk upsert (max 1000 per batch)
    workflow.add_node("PythonCodeNode", "batch_prices", {
        "code": '''
prices = inputs.get("prices", [])
batch_size = 1000
batches = [prices[i:i+batch_size] for i in range(0, len(prices), batch_size)]
result = {"batches": batches, "total_records": len(prices)}
        '''
    })
    workflow.add_connection("fetch_prices", "prices", "batch_prices", "prices")

    # Node 5: Bulk upsert prices
    workflow.add_node("PriceHistoryBulkUpsertNode", "save_prices", {
        "conflict_resolution": "update"
    })
    workflow.add_connection("batch_prices", "batches", "save_prices", "data")

    # Node 6: Update connection sync status
    workflow.add_node("DataProviderConnectionUpdateNode", "update_status", {
        "fields": {
            "last_sync_at": "${current_timestamp}",
            "last_sync_status": "success",
            "last_sync_records": "${total_records}"
        }
    })

    # Node 7: Create sync job record
    workflow.add_node("SyncJobCreateNode", "create_job_record", {
        "job_type": "prices",
        "status": "completed"
    })

    return workflow.build()
```

**Acceptance Criteria**:
- [ ] Workflow file created at correct path
- [ ] All 7 nodes implemented
- [ ] Connections properly wired
- [ ] Error handling for API failures
- [ ] Batch processing for large datasets
- [ ] Sync status tracking
- [ ] Unit test: Mock EODHD response
- [ ] Integration test: End-to-end price sync

---

### 1.2 WF-SYNC-002: Capital IQ Fundamentals Sync

**File**: `src/arc/workflows/data_sync/capitaliq.py`

**Purpose**: Sync company fundamentals from Capital IQ

**Trigger**:
- Scheduled: Weekly on Sunday
- Manual: Via admin endpoint
- Event: After earnings release

**Inputs**:
```python
{
    "security_ids": Optional[List[str]],
    "fiscal_year": Optional[int],
    "include_quarterly": bool = True
}
```

**Workflow Definition**:
```python
def create_capitaliq_fundamentals_workflow():
    workflow = WorkflowBuilder()

    # Node 1: Get securities to sync
    workflow.add_node("SecurityListNode", "get_securities", {
        "filter": {
            "active": True,
            "is_private": False,
            "security_type": {"$in": ["equity"]}
        }
    })

    # Node 2: Get Capital IQ credentials
    workflow.add_node("DataProviderConnectionReadNode", "get_credentials", {
        "filter": {"provider": "capitaliq", "enabled": True}
    })

    # Node 3: Fetch fundamentals from Capital IQ
    workflow.add_node("PythonCodeNode", "fetch_fundamentals", {
        "code": '''
import httpx
from datetime import date

securities = inputs.get("securities", {}).get("records", [])
connection = inputs.get("credentials")
fiscal_year = inputs.get("fiscal_year") or date.today().year

# Capital IQ API integration
api_key = decrypt_api_key(connection["oauth_token_encrypted"])
base_url = "https://api.capitaliq.com/v1"

all_fundamentals = []
errors = []

async with httpx.AsyncClient(timeout=60) as client:
    headers = {"Authorization": f"Bearer {api_key}"}

    for security in securities:
        try:
            # Fetch annual data
            response = await client.get(
                f"{base_url}/company/{security['ticker']}/financials",
                headers=headers,
                params={"period": "annual", "fiscal_year": fiscal_year}
            )
            response.raise_for_status()
            data = response.json()

            for period in data.get("periods", []):
                all_fundamentals.append({
                    "id": f"{security['id']}_{period['fiscal_year']}_FY",
                    "security_id": security["id"],
                    "fiscal_year": period["fiscal_year"],
                    "fiscal_quarter": None,
                    "period_end_date": period["period_end_date"],
                    "revenue": str(period.get("revenue")),
                    "net_income": str(period.get("net_income")),
                    "total_assets": str(period.get("total_assets")),
                    "total_liabilities": str(period.get("total_liabilities")),
                    "total_equity": str(period.get("total_equity")),
                    "current_assets": str(period.get("current_assets")),
                    "current_liabilities": str(period.get("current_liabilities")),
                    "total_debt": str(period.get("total_debt")),
                    "cash_and_equivalents": str(period.get("cash")),
                    "operating_cash_flow": str(period.get("operating_cash_flow")),
                    "source": "capitaliq"
                })
        except Exception as e:
            errors.append({"security_id": security["id"], "error": str(e)})

result = {"fundamentals": all_fundamentals, "errors": errors}
        '''
    })
    workflow.add_connection("get_securities", "records", "fetch_fundamentals", "securities")
    workflow.add_connection("get_credentials", "result", "fetch_fundamentals", "credentials")

    # Node 4: Bulk upsert fundamentals
    workflow.add_node("CompanyFundamentalsBulkUpsertNode", "save_fundamentals", {
        "conflict_resolution": "update"
    })
    workflow.add_connection("fetch_fundamentals", "fundamentals", "save_fundamentals", "data")

    # Node 5: Trigger ratio recalculation
    workflow.add_node("PythonCodeNode", "trigger_ratios", {
        "code": '''
# Emit event to trigger ratio calculation
security_ids = [f["security_id"] for f in inputs.get("fundamentals", [])]
result = {"security_ids": list(set(security_ids)), "trigger": "ratio_calculation"}
        '''
    })
    workflow.add_connection("fetch_fundamentals", "fundamentals", "trigger_ratios", "fundamentals")

    return workflow.build()
```

**Acceptance Criteria**:
- [ ] OAuth2 token handling for Capital IQ
- [ ] Support annual and quarterly data
- [ ] Map all fundamental fields correctly
- [ ] Trigger ratio recalculation after sync
- [ ] Error handling and retry logic
- [ ] Unit test: Mock Capital IQ response
- [ ] Integration test: Full sync cycle

---

### 1.3 WF-SYNC-003: Pitchbook Private Company Sync

**File**: `src/arc/workflows/data_sync/pitchbook.py`

**Purpose**: Sync private company data from Pitchbook

**Priority**: Phase 4

*Similar structure to above - implement when needed*

---

## 2. Analytics Workflows

### 2.1 WF-ANAL-001: Financial Ratio Calculation

**File**: `src/arc/workflows/analytics/ratios.py`

**Purpose**: Calculate all 25+ financial ratios for securities

**Trigger**:
- After fundamentals sync
- Manual: Health scan request
- Scheduled: Daily after market close

**Inputs**:
```python
{
    "security_ids": Optional[List[str]],  # None = all with recent fundamentals
    "calculation_date": Optional[str]     # Default: today
}
```

**Outputs**:
```python
{
    "ratios_calculated": int,
    "securities_processed": int,
    "errors": List[dict]
}
```

**Workflow Definition**:
```python
def create_ratio_calculation_workflow():
    workflow = WorkflowBuilder()
    workflow.add_metadata({
        "name": "ratio_calculation",
        "description": "Calculate financial ratios for securities",
        "version": "1.0.0"
    })

    # Node 1: Get securities with recent fundamentals
    workflow.add_node("SecurityListNode", "get_securities", {
        "filter": {
            "active": True,
            "is_private": False
        },
        "limit": 10000
    })

    # Node 2: Get latest fundamentals for each security
    workflow.add_node("CompanyFundamentalsListNode", "get_fundamentals", {
        "order_by": ["-fiscal_year", "-fiscal_quarter"],
        "limit": 50000
    })

    # Node 3: Get latest prices for market-based ratios
    workflow.add_node("PriceHistoryListNode", "get_prices", {
        "filter": {
            "price_date": {"$gte": "${seven_days_ago}"}
        },
        "order_by": ["-price_date"],
        "limit": 50000
    })

    # Node 4: Calculate all ratios
    workflow.add_node("PythonCodeNode", "calculate_ratios", {
        "code": '''
from decimal import Decimal, InvalidOperation
from datetime import date

securities = inputs.get("securities", {}).get("records", [])
fundamentals_raw = inputs.get("fundamentals", {}).get("records", [])
prices_raw = inputs.get("prices", {}).get("records", [])
calculation_date = inputs.get("calculation_date") or date.today().isoformat()

# Build lookup tables
fundamentals_by_security = {}
for f in fundamentals_raw:
    sid = f["security_id"]
    if sid not in fundamentals_by_security:
        fundamentals_by_security[sid] = f  # Latest first due to ordering

prices_by_security = {}
for p in prices_raw:
    sid = p["security_id"]
    if sid not in prices_by_security:
        prices_by_security[sid] = p

def safe_decimal(value):
    """Safely convert to Decimal."""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except InvalidOperation:
        return None

def safe_divide(numerator, denominator):
    """Safely divide with None handling."""
    if numerator is None or denominator is None:
        return None
    if denominator == 0:
        return None
    return numerator / denominator

all_ratios = []
errors = []

for security in securities:
    sid = security["id"]
    fund = fundamentals_by_security.get(sid)
    price = prices_by_security.get(sid)

    if not fund:
        continue

    try:
        # Extract values
        current_assets = safe_decimal(fund.get("current_assets"))
        current_liabilities = safe_decimal(fund.get("current_liabilities"))
        inventory = safe_decimal(fund.get("inventory"))
        cash = safe_decimal(fund.get("cash_and_equivalents"))
        total_assets = safe_decimal(fund.get("total_assets"))
        total_equity = safe_decimal(fund.get("total_equity"))
        total_debt = safe_decimal(fund.get("total_debt"))
        total_liabilities = safe_decimal(fund.get("total_liabilities"))
        revenue = safe_decimal(fund.get("revenue"))
        net_income = safe_decimal(fund.get("net_income"))
        gross_profit = safe_decimal(fund.get("gross_profit"))
        operating_income = safe_decimal(fund.get("operating_income"))
        ebitda = safe_decimal(fund.get("ebitda"))
        interest_expense = safe_decimal(fund.get("interest_expense"))
        accounts_receivable = safe_decimal(fund.get("accounts_receivable"))
        accounts_payable = safe_decimal(fund.get("accounts_payable"))

        # Market data
        market_cap = safe_decimal(security.get("market_cap"))
        close_price = safe_decimal(price.get("close_price")) if price else None

        # === LIQUIDITY RATIOS ===

        # Current Ratio
        current_ratio = safe_divide(current_assets, current_liabilities)
        if current_ratio is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_current_ratio",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "liquidity",
                "ratio_name": "current_ratio",
                "ratio_value": str(round(current_ratio, 4))
            })

        # Quick Ratio
        if current_assets and inventory and current_liabilities:
            quick_ratio = safe_divide(current_assets - inventory, current_liabilities)
            if quick_ratio is not None:
                all_ratios.append({
                    "id": f"{sid}_{calculation_date}_quick_ratio",
                    "security_id": sid,
                    "calculation_date": calculation_date,
                    "ratio_class": "liquidity",
                    "ratio_name": "quick_ratio",
                    "ratio_value": str(round(quick_ratio, 4))
                })

        # Cash Ratio
        cash_ratio = safe_divide(cash, current_liabilities)
        if cash_ratio is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_cash_ratio",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "liquidity",
                "ratio_name": "cash_ratio",
                "ratio_value": str(round(cash_ratio, 4))
            })

        # === PROFITABILITY RATIOS ===

        # Return on Equity (ROE)
        roe = safe_divide(net_income, total_equity)
        if roe is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_roe",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "profitability",
                "ratio_name": "roe",
                "ratio_value": str(round(roe, 4))
            })

        # Return on Assets (ROA)
        roa = safe_divide(net_income, total_assets)
        if roa is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_roa",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "profitability",
                "ratio_name": "roa",
                "ratio_value": str(round(roa, 4))
            })

        # Gross Margin
        gross_margin = safe_divide(gross_profit, revenue)
        if gross_margin is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_gross_margin",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "profitability",
                "ratio_name": "gross_margin",
                "ratio_value": str(round(gross_margin, 4))
            })

        # Operating Margin
        operating_margin = safe_divide(operating_income, revenue)
        if operating_margin is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_operating_margin",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "profitability",
                "ratio_name": "operating_margin",
                "ratio_value": str(round(operating_margin, 4))
            })

        # Net Margin
        net_margin = safe_divide(net_income, revenue)
        if net_margin is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_net_margin",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "profitability",
                "ratio_name": "net_margin",
                "ratio_value": str(round(net_margin, 4))
            })

        # EBITDA Margin
        ebitda_margin = safe_divide(ebitda, revenue)
        if ebitda_margin is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_ebitda_margin",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "profitability",
                "ratio_name": "ebitda_margin",
                "ratio_value": str(round(ebitda_margin, 4))
            })

        # === LEVERAGE RATIOS ===

        # Debt to Equity
        debt_equity = safe_divide(total_debt, total_equity)
        if debt_equity is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_debt_equity",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "leverage",
                "ratio_name": "debt_equity",
                "ratio_value": str(round(debt_equity, 4))
            })

        # Debt to EBITDA
        debt_ebitda = safe_divide(total_debt, ebitda)
        if debt_ebitda is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_debt_ebitda",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "leverage",
                "ratio_name": "debt_ebitda",
                "ratio_value": str(round(debt_ebitda, 4))
            })

        # Interest Coverage
        interest_coverage = safe_divide(operating_income, interest_expense)
        if interest_coverage is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_interest_coverage",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "leverage",
                "ratio_name": "interest_coverage",
                "ratio_value": str(round(interest_coverage, 4))
            })

        # Debt to Assets
        debt_assets = safe_divide(total_debt, total_assets)
        if debt_assets is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_debt_assets",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "leverage",
                "ratio_name": "debt_assets",
                "ratio_value": str(round(debt_assets, 4))
            })

        # === ASSET UTILIZATION RATIOS ===

        # Asset Turnover
        asset_turnover = safe_divide(revenue, total_assets)
        if asset_turnover is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_asset_turnover",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "utilization",
                "ratio_name": "asset_turnover",
                "ratio_value": str(round(asset_turnover, 4))
            })

        # Inventory Turnover
        if inventory and inventory > 0:
            cost_of_revenue = safe_decimal(fund.get("cost_of_revenue"))
            inventory_turnover = safe_divide(cost_of_revenue, inventory)
            if inventory_turnover is not None:
                all_ratios.append({
                    "id": f"{sid}_{calculation_date}_inventory_turnover",
                    "security_id": sid,
                    "calculation_date": calculation_date,
                    "ratio_class": "utilization",
                    "ratio_name": "inventory_turnover",
                    "ratio_value": str(round(inventory_turnover, 4))
                })

        # Receivables Turnover
        receivables_turnover = safe_divide(revenue, accounts_receivable)
        if receivables_turnover is not None:
            all_ratios.append({
                "id": f"{sid}_{calculation_date}_receivables_turnover",
                "security_id": sid,
                "calculation_date": calculation_date,
                "ratio_class": "utilization",
                "ratio_name": "receivables_turnover",
                "ratio_value": str(round(receivables_turnover, 4))
            })

        # === VALUATION RATIOS ===

        if market_cap and net_income:
            # P/E Ratio
            pe_ratio = safe_divide(market_cap, net_income)
            if pe_ratio is not None and pe_ratio > 0:
                all_ratios.append({
                    "id": f"{sid}_{calculation_date}_pe_ratio",
                    "security_id": sid,
                    "calculation_date": calculation_date,
                    "ratio_class": "valuation",
                    "ratio_name": "pe_ratio",
                    "ratio_value": str(round(pe_ratio, 4))
                })

        if market_cap and total_equity:
            # P/B Ratio
            pb_ratio = safe_divide(market_cap, total_equity)
            if pb_ratio is not None:
                all_ratios.append({
                    "id": f"{sid}_{calculation_date}_pb_ratio",
                    "security_id": sid,
                    "calculation_date": calculation_date,
                    "ratio_class": "valuation",
                    "ratio_name": "pb_ratio",
                    "ratio_value": str(round(pb_ratio, 4))
                })

        if market_cap and revenue:
            # P/S Ratio
            ps_ratio = safe_divide(market_cap, revenue)
            if ps_ratio is not None:
                all_ratios.append({
                    "id": f"{sid}_{calculation_date}_ps_ratio",
                    "security_id": sid,
                    "calculation_date": calculation_date,
                    "ratio_class": "valuation",
                    "ratio_name": "ps_ratio",
                    "ratio_value": str(round(ps_ratio, 4))
                })

        # EV/EBITDA
        if market_cap and total_debt and cash and ebitda:
            enterprise_value = market_cap + total_debt - cash
            ev_ebitda = safe_divide(enterprise_value, ebitda)
            if ev_ebitda is not None:
                all_ratios.append({
                    "id": f"{sid}_{calculation_date}_ev_ebitda",
                    "security_id": sid,
                    "calculation_date": calculation_date,
                    "ratio_class": "valuation",
                    "ratio_name": "ev_ebitda",
                    "ratio_value": str(round(ev_ebitda, 4))
                })

    except Exception as e:
        errors.append({"security_id": sid, "error": str(e)})

result = {
    "ratios": all_ratios,
    "securities_processed": len(securities),
    "errors": errors
}
        '''
    })
    workflow.add_connection("get_securities", "records", "calculate_ratios", "securities")
    workflow.add_connection("get_fundamentals", "records", "calculate_ratios", "fundamentals")
    workflow.add_connection("get_prices", "records", "calculate_ratios", "prices")

    # Node 5: Bulk upsert ratios
    workflow.add_node("SecurityRatioBulkUpsertNode", "save_ratios", {
        "conflict_resolution": "update"
    })
    workflow.add_connection("calculate_ratios", "ratios", "save_ratios", "data")

    return workflow.build()
```

**Complete Ratio List** (25 ratios):

| Class | Ratio Name | Formula |
|-------|------------|---------|
| Liquidity | current_ratio | Current Assets / Current Liabilities |
| Liquidity | quick_ratio | (Current Assets - Inventory) / Current Liabilities |
| Liquidity | cash_ratio | Cash / Current Liabilities |
| Profitability | roe | Net Income / Total Equity |
| Profitability | roa | Net Income / Total Assets |
| Profitability | gross_margin | Gross Profit / Revenue |
| Profitability | operating_margin | Operating Income / Revenue |
| Profitability | net_margin | Net Income / Revenue |
| Profitability | ebitda_margin | EBITDA / Revenue |
| Leverage | debt_equity | Total Debt / Total Equity |
| Leverage | debt_ebitda | Total Debt / EBITDA |
| Leverage | interest_coverage | Operating Income / Interest Expense |
| Leverage | debt_assets | Total Debt / Total Assets |
| Leverage | equity_multiplier | Total Assets / Total Equity |
| Utilization | asset_turnover | Revenue / Total Assets |
| Utilization | inventory_turnover | Cost of Revenue / Inventory |
| Utilization | receivables_turnover | Revenue / Accounts Receivable |
| Utilization | payables_turnover | Cost of Revenue / Accounts Payable |
| Utilization | fixed_asset_turnover | Revenue / Net Fixed Assets |
| Valuation | pe_ratio | Market Cap / Net Income |
| Valuation | pb_ratio | Market Cap / Book Value |
| Valuation | ps_ratio | Market Cap / Revenue |
| Valuation | ev_ebitda | Enterprise Value / EBITDA |
| Valuation | ev_revenue | Enterprise Value / Revenue |
| Valuation | dividend_yield | DPS / Price |

**Acceptance Criteria**:
- [ ] All 25 ratios calculated correctly
- [ ] Safe division (no divide by zero)
- [ ] Null handling for missing data
- [ ] Bulk upsert for performance
- [ ] Unit test: Calculate each ratio category
- [ ] Integration test: Full ratio calculation

---

### 2.2 WF-ANAL-002: Threshold Alert Check

**File**: `src/arc/workflows/analytics/alerts.py`

**Purpose**: Check calculated ratios against user thresholds and generate alerts

**Trigger**:
- After ratio calculation workflow
- Scheduled: Every 15 minutes during market hours

**Inputs**:
```python
{
    "user_id": Optional[str],            # Specific user (None = all)
    "portfolio_id": Optional[str],       # Specific portfolio
    "check_date": Optional[str]          # Default: today
}
```

**Workflow Definition**:
```python
def create_threshold_alert_workflow():
    workflow = WorkflowBuilder()

    # Node 1: Get active alert thresholds
    workflow.add_node("AlertThresholdListNode", "get_thresholds", {
        "filter": {"enabled": True}
    })

    # Node 2: Get holdings for each user's portfolios
    workflow.add_node("HoldingListNode", "get_holdings", {
        "filter": {"active": True}
    })

    # Node 3: Get latest ratios for holdings
    workflow.add_node("SecurityRatioListNode", "get_ratios", {
        "filter": {
            "calculation_date": {"$gte": "${yesterday}"}
        },
        "order_by": ["-calculation_date"]
    })

    # Node 4: Check thresholds and generate alerts
    workflow.add_node("PythonCodeNode", "check_thresholds", {
        "code": '''
from datetime import datetime, timedelta

thresholds = inputs.get("thresholds", {}).get("records", [])
holdings = inputs.get("holdings", {}).get("records", [])
ratios = inputs.get("ratios", {}).get("records", [])

# Build lookup tables
ratios_by_security = {}
for r in ratios:
    key = (r["security_id"], r["ratio_name"])
    if key not in ratios_by_security:
        ratios_by_security[key] = r

holdings_by_portfolio = {}
for h in holdings:
    pid = h["portfolio_id"]
    if pid not in holdings_by_portfolio:
        holdings_by_portfolio[pid] = []
    holdings_by_portfolio[pid].append(h)

new_alerts = []
now = datetime.utcnow().isoformat()

for threshold in thresholds:
    user_id = threshold["user_id"]
    portfolio_id = threshold.get("portfolio_id")
    ratio_name = threshold["ratio_name"]
    warning_val = float(threshold["warning_threshold"])
    critical_val = float(threshold["critical_threshold"])
    comparison = threshold["comparison"]  # lt, gt

    # Check cooldown
    last_triggered = threshold.get("last_triggered_at")
    if last_triggered:
        last_dt = datetime.fromisoformat(last_triggered)
        cooldown_hours = threshold.get("cooldown_hours", 24)
        if datetime.utcnow() - last_dt < timedelta(hours=cooldown_hours):
            continue

    # Get relevant holdings
    relevant_holdings = []
    if portfolio_id:
        relevant_holdings = holdings_by_portfolio.get(portfolio_id, [])
    else:
        # All user's holdings - would need to filter by user's portfolios
        for pid, hs in holdings_by_portfolio.items():
            relevant_holdings.extend(hs)

    for holding in relevant_holdings:
        security_id = holding["security_id"]
        ratio = ratios_by_security.get((security_id, ratio_name))

        if not ratio:
            continue

        ratio_value = float(ratio["ratio_value"])

        # Determine severity
        severity = None
        if comparison == "lt":
            if ratio_value < critical_val:
                severity = "critical"
            elif ratio_value < warning_val:
                severity = "warning"
        elif comparison == "gt":
            if ratio_value > critical_val:
                severity = "critical"
            elif ratio_value > warning_val:
                severity = "warning"

        if severity:
            new_alerts.append({
                "id": f"alert_{user_id}_{security_id}_{ratio_name}_{now[:10]}",
                "user_id": user_id,
                "portfolio_id": holding["portfolio_id"],
                "security_id": security_id,
                "alert_type": "threshold",
                "severity": severity,
                "title": f"{ratio_name.replace('_', ' ').title()} Alert",
                "message": f"{holding.get('ticker', security_id)} {ratio_name} is {ratio_value:.2f} ({'below' if comparison == 'lt' else 'above'} {warning_val if severity == 'warning' else critical_val})",
                "trigger_value": str(ratio_value),
                "threshold_value": str(warning_val if severity == "warning" else critical_val),
                "ratio_name": ratio_name,
                "triggered_at": now,
                "status": "active"
            })

result = {"alerts": new_alerts}
        '''
    })
    workflow.add_connection("get_thresholds", "records", "check_thresholds", "thresholds")
    workflow.add_connection("get_holdings", "records", "check_thresholds", "holdings")
    workflow.add_connection("get_ratios", "records", "check_thresholds", "ratios")

    # Node 5: Create alerts
    workflow.add_node("AlertBulkCreateNode", "create_alerts", {})
    workflow.add_connection("check_thresholds", "alerts", "create_alerts", "data")

    # Node 6: Update threshold last_triggered
    workflow.add_node("PythonCodeNode", "update_triggers", {
        "code": '''
# Update last_triggered_at for triggered thresholds
result = {"updated": True}
        '''
    })

    # Node 7: Trigger notifications
    workflow.add_node("PythonCodeNode", "trigger_notifications", {
        "code": '''
# Group alerts by user and prepare for notification
alerts = inputs.get("alerts", [])

by_user = {}
for alert in alerts:
    uid = alert["user_id"]
    if uid not in by_user:
        by_user[uid] = []
    by_user[uid].append(alert)

notifications = []
for user_id, user_alerts in by_user.items():
    critical = [a for a in user_alerts if a["severity"] == "critical"]
    warnings = [a for a in user_alerts if a["severity"] == "warning"]

    if critical:
        notifications.append({
            "user_id": user_id,
            "type": "immediate",
            "severity": "critical",
            "alerts": critical
        })

    if warnings:
        notifications.append({
            "user_id": user_id,
            "type": "digest",
            "severity": "warning",
            "alerts": warnings
        })

result = {"notifications": notifications}
        '''
    })
    workflow.add_connection("check_thresholds", "alerts", "trigger_notifications", "alerts")

    return workflow.build()
```

**Acceptance Criteria**:
- [ ] Check all enabled thresholds
- [ ] Cooldown period enforcement
- [ ] Both lt and gt comparisons
- [ ] Severity determination (warning vs critical)
- [ ] Notification grouping by user
- [ ] Unit test: Threshold breach detection
- [ ] Integration test: Full alert generation

---

### 2.3 WF-ANAL-003: Peer Benchmarking

**File**: `src/arc/workflows/analytics/benchmarks.py`

**Purpose**: Compare security ratios against peer group

**Inputs**:
```python
{
    "security_id": str,
    "peer_group_id": str,
    "ratio_names": Optional[List[str]]   # None = all ratios
}
```

**Outputs**:
```python
{
    "security": dict,
    "peer_group": dict,
    "comparisons": [
        {
            "ratio_name": str,
            "security_value": float,
            "peer_median": float,
            "peer_min": float,
            "peer_max": float,
            "percentile": int
        }
    ]
}
```

**Workflow Definition**:
```python
def create_peer_benchmark_workflow():
    workflow = WorkflowBuilder()

    # Node 1: Get peer group definition
    workflow.add_node("PeerGroupReadNode", "get_peer_group", {})

    # Node 2: Get security ratios
    workflow.add_node("SecurityRatioListNode", "get_security_ratios", {
        "filter": {
            "security_id": "${security_id}"
        },
        "order_by": ["-calculation_date"]
    })

    # Node 3: Get peer security ratios
    workflow.add_node("SecurityRatioListNode", "get_peer_ratios", {
        "filter": {
            "security_id": {"$in": "${peer_security_ids}"}
        },
        "order_by": ["-calculation_date"]
    })

    # Node 4: Calculate percentiles and comparisons
    workflow.add_node("PythonCodeNode", "calculate_comparison", {
        "code": '''
import statistics
from collections import defaultdict

security_id = inputs.get("security_id")
peer_group = inputs.get("peer_group")
security_ratios = inputs.get("security_ratios", {}).get("records", [])
peer_ratios = inputs.get("peer_ratios", {}).get("records", [])
requested_ratios = inputs.get("ratio_names")

# Get latest ratio per security per ratio_name
def get_latest_ratios(ratios):
    latest = {}
    for r in ratios:
        key = (r["security_id"], r["ratio_name"])
        if key not in latest:
            latest[key] = r
    return latest

security_latest = get_latest_ratios(security_ratios)
peer_latest = get_latest_ratios(peer_ratios)

# Group peer values by ratio_name
peer_values_by_ratio = defaultdict(list)
for (sid, ratio_name), ratio in peer_latest.items():
    if ratio["ratio_value"]:
        peer_values_by_ratio[ratio_name].append(float(ratio["ratio_value"]))

# Calculate comparisons
comparisons = []
ratio_names = requested_ratios or list(peer_values_by_ratio.keys())

for ratio_name in ratio_names:
    peer_values = peer_values_by_ratio.get(ratio_name, [])
    security_ratio = security_latest.get((security_id, ratio_name))

    if not security_ratio or not peer_values:
        continue

    security_value = float(security_ratio["ratio_value"])

    # Calculate statistics
    peer_median = statistics.median(peer_values)
    peer_mean = statistics.mean(peer_values)
    peer_min = min(peer_values)
    peer_max = max(peer_values)
    peer_std = statistics.stdev(peer_values) if len(peer_values) > 1 else 0

    # Calculate percentile
    below_count = sum(1 for v in peer_values if v < security_value)
    percentile = int((below_count / len(peer_values)) * 100)

    comparisons.append({
        "ratio_name": ratio_name,
        "ratio_class": security_ratio.get("ratio_class"),
        "security_value": security_value,
        "peer_count": len(peer_values),
        "peer_median": peer_median,
        "peer_mean": peer_mean,
        "peer_min": peer_min,
        "peer_max": peer_max,
        "peer_std": peer_std,
        "percentile": percentile,
        "vs_median": security_value - peer_median,
        "vs_median_pct": ((security_value - peer_median) / peer_median * 100) if peer_median else None
    })

result = {
    "security_id": security_id,
    "peer_group": peer_group,
    "comparisons": comparisons
}
        '''
    })
    workflow.add_connection("get_peer_group", "result", "calculate_comparison", "peer_group")
    workflow.add_connection("get_security_ratios", "records", "calculate_comparison", "security_ratios")
    workflow.add_connection("get_peer_ratios", "records", "calculate_comparison", "peer_ratios")

    return workflow.build()
```

**Acceptance Criteria**:
- [ ] Percentile calculation correct
- [ ] All statistical measures
- [ ] Handle missing data gracefully
- [ ] Unit test: Percentile math
- [ ] Integration test: Full comparison

---

## 3. Portfolio Workflows

### 3.1 WF-PORT-001: NAV Calculation

**File**: `src/arc/workflows/portfolio/valuation.py`

**Purpose**: Calculate daily NAV for portfolios

**Trigger**:
- After price sync
- Scheduled: 6:30 AM UTC (after prices)

**Workflow Definition**:
```python
def create_nav_calculation_workflow():
    workflow = WorkflowBuilder()

    # Node 1: Get portfolios to value
    workflow.add_node("PortfolioListNode", "get_portfolios", {
        "filter": {"active": True}
    })

    # Node 2: Get all holdings
    workflow.add_node("HoldingListNode", "get_holdings", {
        "filter": {"active": True}
    })

    # Node 3: Get latest prices
    workflow.add_node("PriceHistoryListNode", "get_prices", {
        "filter": {
            "price_date": {"$gte": "${two_days_ago}"}
        },
        "order_by": ["-price_date"]
    })

    # Node 4: Get cash accounts
    workflow.add_node("CashAccountListNode", "get_cash", {})

    # Node 5: Get previous valuations (for return calc)
    workflow.add_node("PortfolioValuationListNode", "get_prev_valuations", {
        "filter": {
            "valuation_date": {"$gte": "${thirty_days_ago}"}
        },
        "order_by": ["-valuation_date"]
    })

    # Node 6: Calculate valuations
    workflow.add_node("PythonCodeNode", "calculate_nav", {
        "code": '''
from decimal import Decimal
from datetime import date, timedelta
from collections import defaultdict

portfolios = inputs.get("portfolios", {}).get("records", [])
holdings = inputs.get("holdings", {}).get("records", [])
prices_raw = inputs.get("prices", {}).get("records", [])
cash_accounts = inputs.get("cash", {}).get("records", [])
prev_valuations = inputs.get("prev_valuations", {}).get("records", [])

valuation_date = date.today().isoformat()

# Build lookup tables
prices_by_security = {}
for p in prices_raw:
    sid = p["security_id"]
    if sid not in prices_by_security:
        prices_by_security[sid] = Decimal(str(p["adjusted_close"]))

holdings_by_portfolio = defaultdict(list)
for h in holdings:
    holdings_by_portfolio[h["portfolio_id"]].append(h)

cash_by_portfolio = defaultdict(Decimal)
for c in cash_accounts:
    cash_by_portfolio[c["portfolio_id"]] += Decimal(str(c["balance"]))

prev_val_by_portfolio = {}
for v in prev_valuations:
    pid = v["portfolio_id"]
    if pid not in prev_val_by_portfolio:
        prev_val_by_portfolio[pid] = v

valuations = []

for portfolio in portfolios:
    pid = portfolio["id"]
    base_currency = portfolio.get("base_currency", "USD")

    # Calculate securities value
    securities_value = Decimal("0")
    holdings_detail = []

    for holding in holdings_by_portfolio.get(pid, []):
        security_id = holding["security_id"]
        quantity = Decimal(str(holding["quantity"]))
        price = prices_by_security.get(security_id)

        if price:
            market_value = quantity * price
            securities_value += market_value
            holdings_detail.append({
                "security_id": security_id,
                "quantity": str(quantity),
                "price": str(price),
                "market_value": str(market_value)
            })

    # Get cash
    cash_value = cash_by_portfolio.get(pid, Decimal("0"))

    # Total NAV
    total_value = securities_value + cash_value

    # Calculate returns
    prev_val = prev_val_by_portfolio.get(pid)
    daily_return = None

    if prev_val and prev_val.get("total_value"):
        prev_total = Decimal(str(prev_val["total_value"]))
        if prev_total > 0:
            daily_return = (total_value - prev_total) / prev_total

    valuations.append({
        "id": f"{pid}_{valuation_date}",
        "portfolio_id": pid,
        "valuation_date": valuation_date,
        "total_value": str(total_value),
        "securities_value": str(securities_value),
        "cash_value": str(cash_value),
        "daily_return": str(daily_return) if daily_return else None,
        "pricing_source": "eodhd",
        "is_final": False
    })

result = {"valuations": valuations}
        '''
    })
    workflow.add_connection("get_portfolios", "records", "calculate_nav", "portfolios")
    workflow.add_connection("get_holdings", "records", "calculate_nav", "holdings")
    workflow.add_connection("get_prices", "records", "calculate_nav", "prices")
    workflow.add_connection("get_cash", "records", "calculate_nav", "cash")
    workflow.add_connection("get_prev_valuations", "records", "calculate_nav", "prev_valuations")

    # Node 7: Save valuations
    workflow.add_node("PortfolioValuationBulkUpsertNode", "save_valuations", {
        "conflict_resolution": "update"
    })
    workflow.add_connection("calculate_nav", "valuations", "save_valuations", "data")

    # Node 8: Update holding current values
    workflow.add_node("PythonCodeNode", "update_holdings", {
        "code": '''
# Update current_price, market_value, weight for each holding
result = {"updated": True}
        '''
    })

    return workflow.build()
```

**Acceptance Criteria**:
- [ ] Accurate NAV calculation
- [ ] Multi-currency support
- [ ] Return calculations
- [ ] Missing price handling
- [ ] Unit test: NAV math
- [ ] Integration test: Full valuation

---

### 3.2 WF-PORT-002: Portfolio Health Scan

**File**: `src/arc/workflows/portfolio/health_scan.py`

**Purpose**: Comprehensive portfolio health assessment

**Inputs**:
```python
{
    "portfolio_id": str,
    "include_ai_explanation": bool = True
}
```

**Outputs**:
```python
{
    "overall_score": int,           # 0-100
    "ratio_class_scores": {
        "liquidity": {"score": int, "issues": []},
        "profitability": {...},
        "utilization": {...},
        "leverage": {...},
        "valuation": {...}
    },
    "issues": [
        {
            "security_id": str,
            "ratio_name": str,
            "severity": str,
            "current_value": float,
            "threshold": float,
            "ai_explanation": Optional[str]
        }
    ],
    "summary": str
}
```

**Workflow Definition**:
```python
def create_health_scan_workflow():
    workflow = WorkflowBuilder()

    # Node 1: Get portfolio
    workflow.add_node("PortfolioReadNode", "get_portfolio", {})

    # Node 2: Get holdings
    workflow.add_node("HoldingListNode", "get_holdings", {
        "filter": {"portfolio_id": "${portfolio_id}", "active": True}
    })

    # Node 3: Get user thresholds
    workflow.add_node("AlertThresholdListNode", "get_thresholds", {
        "filter": {"user_id": "${user_id}", "enabled": True}
    })

    # Node 4: Get security ratios for all holdings
    workflow.add_node("SecurityRatioListNode", "get_ratios", {
        "filter": {
            "security_id": {"$in": "${holding_security_ids}"}
        },
        "order_by": ["-calculation_date"]
    })

    # Node 5: Calculate health scores
    workflow.add_node("PythonCodeNode", "calculate_health", {
        "code": '''
from collections import defaultdict

portfolio = inputs.get("portfolio")
holdings = inputs.get("holdings", {}).get("records", [])
thresholds = inputs.get("thresholds", {}).get("records", [])
ratios = inputs.get("ratios", {}).get("records", [])

# Default thresholds if user hasn't configured
default_thresholds = {
    "current_ratio": {"warning": 1.5, "critical": 1.0, "comparison": "lt"},
    "quick_ratio": {"warning": 1.0, "critical": 0.5, "comparison": "lt"},
    "roe": {"warning": 0.10, "critical": 0.05, "comparison": "lt"},
    "debt_equity": {"warning": 1.0, "critical": 2.0, "comparison": "gt"},
    "debt_ebitda": {"warning": 3.0, "critical": 4.0, "comparison": "gt"},
    "interest_coverage": {"warning": 3.0, "critical": 2.0, "comparison": "lt"}
}

# Build threshold lookup
threshold_lookup = {}
for t in thresholds:
    threshold_lookup[t["ratio_name"]] = t
for name, vals in default_thresholds.items():
    if name not in threshold_lookup:
        threshold_lookup[name] = vals

# Get latest ratio per security per ratio_name
ratios_by_security = {}
for r in ratios:
    key = (r["security_id"], r["ratio_name"])
    if key not in ratios_by_security:
        ratios_by_security[key] = r

# Calculate issues and scores
issues = []
ratio_class_issues = defaultdict(list)

for holding in holdings:
    sid = holding["security_id"]

    for ratio_name, threshold in threshold_lookup.items():
        ratio = ratios_by_security.get((sid, ratio_name))
        if not ratio:
            continue

        value = float(ratio["ratio_value"])
        comparison = threshold.get("comparison", "lt")
        warning = float(threshold.get("warning_threshold", threshold.get("warning", 999)))
        critical = float(threshold.get("critical_threshold", threshold.get("critical", 999)))

        severity = None
        if comparison == "lt":
            if value < critical:
                severity = "critical"
            elif value < warning:
                severity = "warning"
        else:  # gt
            if value > critical:
                severity = "critical"
            elif value > warning:
                severity = "warning"

        if severity:
            issue = {
                "security_id": sid,
                "holding_id": holding["id"],
                "ratio_name": ratio_name,
                "ratio_class": ratio.get("ratio_class"),
                "severity": severity,
                "current_value": value,
                "threshold_value": critical if severity == "critical" else warning,
                "comparison": comparison
            }
            issues.append(issue)
            ratio_class_issues[ratio.get("ratio_class")].append(issue)

# Calculate scores
def calc_class_score(class_issues):
    if not class_issues:
        return 100
    critical_count = sum(1 for i in class_issues if i["severity"] == "critical")
    warning_count = sum(1 for i in class_issues if i["severity"] == "warning")
    # Deduct 15 points per critical, 5 per warning
    score = max(0, 100 - (critical_count * 15) - (warning_count * 5))
    return score

ratio_class_scores = {
    "liquidity": {
        "score": calc_class_score(ratio_class_issues.get("liquidity", [])),
        "issues": ratio_class_issues.get("liquidity", [])
    },
    "profitability": {
        "score": calc_class_score(ratio_class_issues.get("profitability", [])),
        "issues": ratio_class_issues.get("profitability", [])
    },
    "utilization": {
        "score": calc_class_score(ratio_class_issues.get("utilization", [])),
        "issues": ratio_class_issues.get("utilization", [])
    },
    "leverage": {
        "score": calc_class_score(ratio_class_issues.get("leverage", [])),
        "issues": ratio_class_issues.get("leverage", [])
    },
    "valuation": {
        "score": calc_class_score(ratio_class_issues.get("valuation", [])),
        "issues": ratio_class_issues.get("valuation", [])
    }
}

# Overall score (weighted average)
weights = {"liquidity": 0.20, "profitability": 0.25, "utilization": 0.15, "leverage": 0.25, "valuation": 0.15}
overall_score = int(sum(
    ratio_class_scores[cls]["score"] * weights[cls]
    for cls in weights
))

# Sort issues by severity
issues.sort(key=lambda x: (0 if x["severity"] == "critical" else 1, x["ratio_name"]))

result = {
    "portfolio": portfolio,
    "overall_score": overall_score,
    "ratio_class_scores": ratio_class_scores,
    "issues": issues,
    "issues_count": {
        "critical": sum(1 for i in issues if i["severity"] == "critical"),
        "warning": sum(1 for i in issues if i["severity"] == "warning")
    },
    "holdings_analyzed": len(holdings)
}
        '''
    })
    workflow.add_connection("get_portfolio", "result", "calculate_health", "portfolio")
    workflow.add_connection("get_holdings", "records", "calculate_health", "holdings")
    workflow.add_connection("get_thresholds", "records", "calculate_health", "thresholds")
    workflow.add_connection("get_ratios", "records", "calculate_health", "ratios")

    return workflow.build()
```

**Acceptance Criteria**:
- [ ] Overall score 0-100
- [ ] Per-class scores
- [ ] Issue severity classification
- [ ] Default thresholds for unconfigured
- [ ] Unit test: Score calculation
- [ ] Integration test: Full scan

---

## 4. Report Workflows

### 4.1 WF-RPT-001: Portfolio Report Generation

**File**: `src/arc/workflows/reports/portfolio_report.py`

*Full report generation workflow - see separate reports plan*

---

## 5. Implementation Checklist

### Phase 1 Workflows (Weeks 3-6)

- [ ] **WF-SYNC-001**: EODHD Price Sync
- [ ] **WF-PORT-001**: NAV Calculation
- [ ] **WF-PORT-002**: Health Scan

### Phase 2 Workflows (Weeks 7-12)

- [ ] **WF-SYNC-002**: Capital IQ Fundamentals
- [ ] **WF-ANAL-001**: Ratio Calculation
- [ ] **WF-ANAL-002**: Threshold Alert Check
- [ ] **WF-ANAL-003**: Peer Benchmarking
- [ ] **WF-RPT-001**: Portfolio Report

### Phase 3 Workflows (Weeks 13-18)

- [ ] **WF-PORT-003**: Mean-Variance Optimization
- [ ] **WF-PORT-004**: Pre-trade Compliance
- [ ] **WF-PORT-005**: Performance Attribution

### Phase 4 Workflows (Weeks 19-24)

- [ ] **WF-SYNC-003**: Pitchbook Sync
- [ ] **WF-INTEL-001**: Market Brief Generation (uses Kaizen)
- [ ] **WF-INTEL-002**: Portfolio Query (uses Kaizen)
