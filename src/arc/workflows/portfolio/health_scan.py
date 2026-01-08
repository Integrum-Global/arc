"""
Portfolio Health Scan Workflow.

Calculates portfolio health scores based on financial ratios and thresholds.

Workflow Pattern:
1. Get portfolio and holdings
2. Get user thresholds (or use defaults)
3. Get security ratios for holdings
4. Calculate health scores by ratio class
5. Calculate overall health score
6. Identify issues by severity

Scoring Algorithm:
- Start at 100 points
- -15 points per critical issue
- -5 points per warning issue
- Minimum score is 0

Weights by Ratio Class:
- Liquidity: 20%
- Profitability: 25%
- Leverage: 25%
- Efficiency: 15%
- Valuation: 15%

CRITICAL RULES:
- NEVER manually set created_at or updated_at
- Use Decimal for all calculations
"""

from kailash.workflow.builder import WorkflowBuilder

# Default thresholds for common financial ratios
DEFAULT_THRESHOLDS = {
    # Liquidity (higher is better)
    "current_ratio": {"min": 1.0, "warning": 1.5, "target": 2.0},
    "quick_ratio": {"min": 0.5, "warning": 1.0, "target": 1.5},
    # Profitability (higher is better, percentages)
    "roe": {"min": 5.0, "warning": 10.0, "target": 15.0},
    "roa": {"min": 2.0, "warning": 5.0, "target": 8.0},
    "profit_margin": {"min": 3.0, "warning": 8.0, "target": 15.0},
    # Leverage (lower is better)
    "debt_to_equity": {"max": 2.0, "warning": 1.5, "target": 1.0},
    "debt_ratio": {"max": 0.7, "warning": 0.5, "target": 0.4},
    # Valuation (lower is better for most)
    "pe_ratio": {"max": 40.0, "warning": 25.0, "target": 15.0},
    "pb_ratio": {"max": 5.0, "warning": 3.0, "target": 2.0},
}

# Weights for each ratio class
CLASS_WEIGHTS = {
    "liquidity": 0.20,
    "profitability": 0.25,
    "leverage": 0.25,
    "efficiency": 0.15,
    "valuation": 0.15,
}


def build_portfolio_health_scan_workflow(
    portfolio_id: str,
    user_id: str | None = None,
    use_default_thresholds: bool = True,
) -> WorkflowBuilder:
    """
    Build workflow to calculate portfolio health score.

    This workflow analyzes portfolio holdings' financial ratios against
    thresholds and calculates an overall health score.

    Args:
        portfolio_id: Portfolio to scan.
        user_id: User ID for custom thresholds. If None, uses defaults.
        use_default_thresholds: Whether to use default thresholds.

    Returns:
        WorkflowBuilder configured for portfolio health scan.

    Example:
        >>> workflow = build_portfolio_health_scan_workflow(
        ...     portfolio_id="port-001",
        ...     user_id="user-123"
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

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

# Multi-output
portfolio_id = "{portfolio_id}"
portfolio_name = portfolio.get("name", "Unknown")
owner_id = portfolio.get("owner_id")
base_currency = portfolio.get("base_currency", "USD")
"""
        },
    )

    workflow.add_connection("get_portfolio", "record", "extract_portfolio_info", "record")

    # =========================================================================
    # Step 2: Get Holdings
    # =========================================================================

    workflow.add_node(
        "HoldingListNode",
        "get_holdings",
        {
            "filter": {"portfolio_id": portfolio_id, "deleted_at": {"$null": True}},
            "limit": 10000,
        },
    )

    workflow.add_node(
        "PythonCodeNode",
        "extract_security_ids",
        {
            "code": """
holdings_list = records if isinstance(records, list) else []
active_holdings = [h for h in holdings_list if float(h.get("quantity", 0)) > 0]

# Multi-output
holdings = active_holdings
holding_count = len(active_holdings)
security_ids = list(set(h.get("security_id") for h in active_holdings if h.get("security_id")))
"""
        },
    )

    workflow.add_connection("get_holdings", "records", "extract_security_ids", "records")

    # =========================================================================
    # Step 3: Get User Thresholds (or use defaults)
    # =========================================================================

    if user_id and not use_default_thresholds:
        workflow.add_node(
            "AlertThresholdListNode",
            "get_thresholds",
            {
                "filter": {"user_id": user_id, "active": True},
                "limit": 1000,
            },
        )

        workflow.add_node(
            "PythonCodeNode",
            "prepare_thresholds",
            {
                "code": f"""
# Build threshold mapping from user thresholds
threshold_records = records if isinstance(records, list) else []

# Default thresholds
default_thresholds = {repr(DEFAULT_THRESHOLDS)}

# Merge user thresholds with defaults
user_thresholds = {{}}
for tr in threshold_records:
    ratio_name = tr.get("ratio_name")
    if ratio_name:
        user_thresholds[ratio_name] = {{
            "value": float(tr.get("threshold_value", 0)),
            "comparison": tr.get("comparison", "gt"),
            "severity": tr.get("severity", "warning"),
        }}

# Multi-output
thresholds = default_thresholds
custom_thresholds = user_thresholds
threshold_count = len(default_thresholds)
"""
            },
        )

        workflow.add_connection("get_thresholds", "records", "prepare_thresholds", "records")
    else:
        workflow.add_node(
            "PythonCodeNode",
            "prepare_thresholds",
            {
                "code": f"""
# Use default thresholds
default_thresholds = {repr(DEFAULT_THRESHOLDS)}

# Multi-output
thresholds = default_thresholds
custom_thresholds = {{}}
threshold_count = len(default_thresholds)
"""
            },
        )

    # =========================================================================
    # Step 4: Get Security Ratios for Holdings
    # =========================================================================

    workflow.add_node(
        "SecurityRatioListNode",
        "get_security_ratios",
        {
            "filter": {},
            "limit": 500000,
        },
    )

    # =========================================================================
    # Step 5: Calculate Health Scores
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "calculate_health_scores",
        {
            "code": f"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from collections import defaultdict

CLASS_WEIGHTS = {repr(CLASS_WEIGHTS)}

def safe_float(value):
    '''Safely convert to float.'''
    if value is None or value == "" or value == "None":
        return None
    try:
        return float(str(value))
    except (ValueError, TypeError):
        return None

# Get latest ratio per security per ratio_name
latest_ratios = {{}}
for ratio in ratios:
    sec_id = ratio.get("security_id")
    ratio_name = ratio.get("ratio_name")
    calc_date = ratio.get("calculation_date", "")

    # Only include holdings securities
    if sec_id not in security_ids:
        continue

    key = (sec_id, ratio_name)
    if key not in latest_ratios or calc_date > latest_ratios[key].get("calculation_date", ""):
        latest_ratios[key] = ratio

# Organize ratios by class
ratio_by_class = defaultdict(list)
for (sec_id, ratio_name), ratio in latest_ratios.items():
    ratio_class = ratio.get("ratio_class", "other")
    ratio_by_class[ratio_class].append(ratio)

# Check each ratio against thresholds
issues = []
class_issues = defaultdict(list)

for (sec_id, ratio_name), ratio in latest_ratios.items():
    ratio_class = ratio.get("ratio_class", "other")
    ratio_value = safe_float(ratio.get("ratio_value"))

    if ratio_value is None:
        continue

    # Check against thresholds
    threshold_config = thresholds.get(ratio_name, {{}})
    custom_config = custom_thresholds.get(ratio_name, {{}})

    issue = None

    # Higher is better ratios (check min)
    if "min" in threshold_config:
        min_val = threshold_config.get("min", 0)
        warning_val = threshold_config.get("warning", min_val)

        if ratio_value < min_val:
            issue = {{
                "security_id": sec_id,
                "ratio_name": ratio_name,
                "ratio_class": ratio_class,
                "current_value": ratio_value,
                "threshold": min_val,
                "severity": "critical",
                "message": f"{{ratio_name}} ({{ratio_value:.2f}}) below minimum ({{min_val}})"
            }}
        elif ratio_value < warning_val:
            issue = {{
                "security_id": sec_id,
                "ratio_name": ratio_name,
                "ratio_class": ratio_class,
                "current_value": ratio_value,
                "threshold": warning_val,
                "severity": "warning",
                "message": f"{{ratio_name}} ({{ratio_value:.2f}}) below warning level ({{warning_val}})"
            }}

    # Lower is better ratios (check max)
    elif "max" in threshold_config:
        max_val = threshold_config.get("max", 100)
        warning_val = threshold_config.get("warning", max_val)

        if ratio_value > max_val:
            issue = {{
                "security_id": sec_id,
                "ratio_name": ratio_name,
                "ratio_class": ratio_class,
                "current_value": ratio_value,
                "threshold": max_val,
                "severity": "critical",
                "message": f"{{ratio_name}} ({{ratio_value:.2f}}) above maximum ({{max_val}})"
            }}
        elif ratio_value > warning_val:
            issue = {{
                "security_id": sec_id,
                "ratio_name": ratio_name,
                "ratio_class": ratio_class,
                "current_value": ratio_value,
                "threshold": warning_val,
                "severity": "warning",
                "message": f"{{ratio_name}} ({{ratio_value:.2f}}) above warning level ({{warning_val}})"
            }}

    # Custom user thresholds
    if custom_config and not issue:
        custom_val = custom_config.get("value", 0)
        comparison = custom_config.get("comparison", "gt")
        severity = custom_config.get("severity", "warning")

        triggered = False
        if comparison == "gt" and ratio_value > custom_val:
            triggered = True
        elif comparison == "lt" and ratio_value < custom_val:
            triggered = True
        elif comparison == "gte" and ratio_value >= custom_val:
            triggered = True
        elif comparison == "lte" and ratio_value <= custom_val:
            triggered = True

        if triggered:
            issue = {{
                "security_id": sec_id,
                "ratio_name": ratio_name,
                "ratio_class": ratio_class,
                "current_value": ratio_value,
                "threshold": custom_val,
                "severity": severity,
                "message": f"{{ratio_name}} ({{ratio_value:.2f}}) triggered custom threshold ({{comparison}} {{custom_val}})"
            }}

    if issue:
        issues.append(issue)
        class_issues[ratio_class].append(issue)

# Calculate class scores (start at 100)
class_scores = {{}}
for ratio_class, weight in CLASS_WEIGHTS.items():
    score = 100
    class_issue_list = class_issues.get(ratio_class, [])

    for issue in class_issue_list:
        if issue["severity"] == "critical":
            score -= 15
        else:
            score -= 5

    score = max(0, score)  # Minimum 0
    class_scores[ratio_class] = {{
        "score": score,
        "issue_count": len(class_issue_list),
        "issues": class_issue_list,
    }}

# Calculate overall weighted score
overall_score = 0
for ratio_class, weight in CLASS_WEIGHTS.items():
    class_score = class_scores.get(ratio_class, {{"score": 100}}).get("score", 100)
    overall_score += class_score * weight

overall_score = int(round(overall_score))

# Generate summary
critical_count = sum(1 for i in issues if i["severity"] == "critical")
warning_count = sum(1 for i in issues if i["severity"] == "warning")

if overall_score >= 90:
    summary = "Excellent portfolio health with minimal issues."
elif overall_score >= 70:
    summary = f"Good portfolio health with {{warning_count}} warnings."
elif overall_score >= 50:
    summary = f"Fair portfolio health with {{critical_count}} critical and {{warning_count}} warning issues."
else:
    summary = f"Poor portfolio health requiring attention. {{critical_count}} critical issues found."

# Multi-output
health_score = overall_score
ratio_class_scores = class_scores
all_issues = issues
issue_count = len(issues)
health_summary = summary
"""
        },
    )

    # Connect inputs
    workflow.add_connection(
        "extract_security_ids", "security_ids", "calculate_health_scores", "security_ids"
    )
    workflow.add_connection("get_security_ratios", "records", "calculate_health_scores", "ratios")
    workflow.add_connection(
        "prepare_thresholds", "thresholds", "calculate_health_scores", "thresholds"
    )
    workflow.add_connection(
        "prepare_thresholds", "custom_thresholds", "calculate_health_scores", "custom_thresholds"
    )

    # =========================================================================
    # Step 6: Compile Results
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_results",
        {
            "code": """
from datetime import datetime

result = {
    "workflow": "portfolio_health_scan",
    "completed_at": datetime.now().isoformat(),
    "portfolio_id": portfolio_id,
    "portfolio_name": portfolio_name,
    "holdings_analyzed": holding_count,
    "overall_score": health_score,
    "ratio_class_scores": ratio_class_scores,
    "issues": all_issues,
    "issue_count": issue_count,
    "summary": health_summary,
    "status": "success"
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
        "extract_security_ids", "holding_count", "compile_results", "holding_count"
    )
    workflow.add_connection(
        "calculate_health_scores", "health_score", "compile_results", "health_score"
    )
    workflow.add_connection(
        "calculate_health_scores", "ratio_class_scores", "compile_results", "ratio_class_scores"
    )
    workflow.add_connection(
        "calculate_health_scores", "all_issues", "compile_results", "all_issues"
    )
    workflow.add_connection(
        "calculate_health_scores", "issue_count", "compile_results", "issue_count"
    )
    workflow.add_connection(
        "calculate_health_scores", "health_summary", "compile_results", "health_summary"
    )

    return workflow


def build_batch_health_scan_workflow(
    portfolio_ids: list[str] | None = None,
    user_id: str | None = None,
) -> WorkflowBuilder:
    """
    Build workflow to calculate health scores for multiple portfolios.

    Args:
        portfolio_ids: List of portfolios to scan. If None, scans all active.
        user_id: User ID for custom thresholds.

    Returns:
        WorkflowBuilder configured for batch health scan.

    Example:
        >>> workflow = build_batch_health_scan_workflow(
        ...     portfolio_ids=["port-001", "port-002"]
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Parameters for code - user_id reserved for future custom threshold support
    portfolio_ids_code = repr(portfolio_ids) if portfolio_ids else "None"
    _ = user_id  # Reserved for future use with custom thresholds

    # =========================================================================
    # Step 1: Get Portfolios
    # =========================================================================

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
requested_ids = {portfolio_ids_code}

# Filter to requested portfolios if specified
if requested_ids:
    portfolios_to_scan = [p for p in records if p.get("id") in requested_ids]
else:
    portfolios_to_scan = records if isinstance(records, list) else []

# Multi-output
portfolios = portfolios_to_scan
portfolio_count = len(portfolios_to_scan)
portfolio_ids = [p.get("id") for p in portfolios_to_scan]
"""
        },
    )

    workflow.add_connection("get_portfolios", "records", "filter_portfolios", "records")

    # =========================================================================
    # Step 2: Get All Holdings
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
    # Step 3: Get All Ratios
    # =========================================================================

    workflow.add_node(
        "SecurityRatioListNode",
        "get_ratios",
        {
            "filter": {},
            "limit": 500000,
        },
    )

    # =========================================================================
    # Step 4: Calculate Health Scores for All Portfolios
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "calculate_all_health_scores",
        {
            "code": f"""
from collections import defaultdict

DEFAULT_THRESHOLDS = {repr(DEFAULT_THRESHOLDS)}
CLASS_WEIGHTS = {repr(CLASS_WEIGHTS)}

def safe_float(value):
    if value is None or value == "" or value == "None":
        return None
    try:
        return float(str(value))
    except (ValueError, TypeError):
        return None

# Build holdings by portfolio
portfolio_holdings = defaultdict(list)
for holding in holdings:
    port_id = holding.get("portfolio_id")
    if port_id in portfolio_ids and float(holding.get("quantity", 0)) > 0:
        portfolio_holdings[port_id].append(holding)

# Get latest ratios by security
latest_ratios = {{}}
for ratio in ratios:
    sec_id = ratio.get("security_id")
    ratio_name = ratio.get("ratio_name")
    calc_date = ratio.get("calculation_date", "")

    key = (sec_id, ratio_name)
    if key not in latest_ratios or calc_date > latest_ratios[key].get("calculation_date", ""):
        latest_ratios[key] = ratio

# Calculate health for each portfolio
portfolio_health_results = []

for portfolio in portfolios:
    port_id = portfolio.get("id")
    port_name = portfolio.get("name", "Unknown")
    port_holdings = portfolio_holdings.get(port_id, [])

    # Get security IDs for this portfolio
    security_ids = list(set(h.get("security_id") for h in port_holdings if h.get("security_id")))

    # Find issues for this portfolio's securities
    issues = []
    class_issues = defaultdict(list)

    for sec_id in security_ids:
        for ratio_name in DEFAULT_THRESHOLDS:
            ratio = latest_ratios.get((sec_id, ratio_name))
            if not ratio:
                continue

            ratio_class = ratio.get("ratio_class", "other")
            ratio_value = safe_float(ratio.get("ratio_value"))

            if ratio_value is None:
                continue

            threshold_config = DEFAULT_THRESHOLDS.get(ratio_name, {{}})
            issue = None

            # Higher is better ratios
            if "min" in threshold_config:
                min_val = threshold_config.get("min", 0)
                warning_val = threshold_config.get("warning", min_val)

                if ratio_value < min_val:
                    issue = {{
                        "security_id": sec_id,
                        "ratio_name": ratio_name,
                        "ratio_class": ratio_class,
                        "current_value": ratio_value,
                        "threshold": min_val,
                        "severity": "critical",
                    }}
                elif ratio_value < warning_val:
                    issue = {{
                        "security_id": sec_id,
                        "ratio_name": ratio_name,
                        "ratio_class": ratio_class,
                        "current_value": ratio_value,
                        "threshold": warning_val,
                        "severity": "warning",
                    }}

            # Lower is better ratios
            elif "max" in threshold_config:
                max_val = threshold_config.get("max", 100)
                warning_val = threshold_config.get("warning", max_val)

                if ratio_value > max_val:
                    issue = {{
                        "security_id": sec_id,
                        "ratio_name": ratio_name,
                        "ratio_class": ratio_class,
                        "current_value": ratio_value,
                        "threshold": max_val,
                        "severity": "critical",
                    }}
                elif ratio_value > warning_val:
                    issue = {{
                        "security_id": sec_id,
                        "ratio_name": ratio_name,
                        "ratio_class": ratio_class,
                        "current_value": ratio_value,
                        "threshold": warning_val,
                        "severity": "warning",
                    }}

            if issue:
                issues.append(issue)
                class_issues[ratio_class].append(issue)

    # Calculate class scores
    class_scores = {{}}
    for ratio_class, weight in CLASS_WEIGHTS.items():
        score = 100
        for issue in class_issues.get(ratio_class, []):
            if issue["severity"] == "critical":
                score -= 15
            else:
                score -= 5
        class_scores[ratio_class] = max(0, score)

    # Calculate overall weighted score
    overall_score = 0
    for ratio_class, weight in CLASS_WEIGHTS.items():
        overall_score += class_scores.get(ratio_class, 100) * weight

    portfolio_health_results.append({{
        "portfolio_id": port_id,
        "portfolio_name": port_name,
        "holdings_count": len(port_holdings),
        "overall_score": int(round(overall_score)),
        "class_scores": class_scores,
        "issue_count": len(issues),
        "critical_count": sum(1 for i in issues if i["severity"] == "critical"),
        "warning_count": sum(1 for i in issues if i["severity"] == "warning"),
    }})

# Multi-output
health_results = portfolio_health_results
results_count = len(portfolio_health_results)
"""
        },
    )

    # Connect inputs
    workflow.add_connection(
        "filter_portfolios", "portfolios", "calculate_all_health_scores", "portfolios"
    )
    workflow.add_connection(
        "filter_portfolios", "portfolio_ids", "calculate_all_health_scores", "portfolio_ids"
    )
    workflow.add_connection("get_holdings", "records", "calculate_all_health_scores", "holdings")
    workflow.add_connection("get_ratios", "records", "calculate_all_health_scores", "ratios")

    # =========================================================================
    # Step 5: Compile Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": """
from datetime import datetime

# Calculate averages
avg_score = sum(r["overall_score"] for r in health_results) / len(health_results) if health_results else 0
total_critical = sum(r["critical_count"] for r in health_results)
total_warnings = sum(r["warning_count"] for r in health_results)

result = {
    "workflow": "batch_health_scan",
    "completed_at": datetime.now().isoformat(),
    "portfolios_scanned": portfolio_count,
    "average_health_score": int(round(avg_score)),
    "total_critical_issues": total_critical,
    "total_warning_issues": total_warnings,
    "portfolio_results": health_results,
    "status": "success"
}
"""
        },
    )

    # Connect summary inputs
    workflow.add_connection(
        "filter_portfolios", "portfolio_count", "compile_summary", "portfolio_count"
    )
    workflow.add_connection(
        "calculate_all_health_scores", "health_results", "compile_summary", "health_results"
    )

    return workflow
