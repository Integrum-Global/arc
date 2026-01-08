"""
Threshold Alert Workflow.

Monitors security ratios against user-defined thresholds and creates alerts
when thresholds are breached.

Workflow Pattern:
1. Get enabled alert thresholds
2. Get current security ratios for threshold checks
3. Check thresholds with cooldown enforcement
4. Create alerts for breaches
5. Update threshold last_triggered fields

Features:
- Supports lt, gt, lte, gte comparisons
- Warning vs critical severity levels
- Cooldown period enforcement (prevents alert spam)
- Batch processing for multiple users
- Security/portfolio scoping

CRITICAL RULES:
- NEVER manually set created_at or updated_at
- Use Decimal for threshold comparisons
- Respect cooldown_hours before re-alerting
- Alert status workflow: active -> acknowledged -> dismissed/resolved
"""

from kailash.workflow.builder import WorkflowBuilder


def build_threshold_alert_workflow(
    user_id: str | None = None,
    check_date: str | None = None,
    security_ids: list[str] | None = None,
    batch_size: int = 500,
) -> WorkflowBuilder:
    """
    Build workflow to check thresholds and create alerts.

    This workflow monitors user-defined ratio thresholds and creates alerts
    when ratios breach warning or critical levels. It enforces cooldown
    periods to prevent alert spam.

    Args:
        user_id: User ID to check thresholds for. If None, checks all users (batch mode).
        check_date: Date for threshold check (YYYY-MM-DD). Defaults to today.
        security_ids: Specific securities to check. If None, checks all based on threshold scope.
        batch_size: Number of records per batch for bulk operations.

    Returns:
        WorkflowBuilder configured for threshold alert checking.

    Example:
        >>> workflow = build_threshold_alert_workflow(
        ...     user_id="user-123",
        ...     check_date="2024-01-15"
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Build filter for thresholds
    threshold_filter = {"enabled": True}
    if user_id:
        threshold_filter["user_id"] = user_id

    # Date parameter
    date_code = f'"{check_date}"' if check_date else "None"
    security_ids_code = repr(security_ids) if security_ids else "None"

    # =========================================================================
    # Step 1: Get Enabled Alert Thresholds
    # =========================================================================

    workflow.add_node(
        "AlertThresholdListNode",
        "get_thresholds",
        {
            "filter": threshold_filter,
            "limit": 10000,
        },
    )

    # Extract unique security IDs and ratio names needed
    workflow.add_node(
        "PythonCodeNode",
        "prepare_threshold_check",
        {
            "code": f"""
from datetime import datetime

check_date = {date_code} or datetime.now().strftime("%Y-%m-%d")
explicit_security_ids = {security_ids_code}

# Extract threshold info
thresholds = records if isinstance(records, list) else []

# Group thresholds by ratio_name to efficiently query ratios
ratio_names = set()
security_scope = set()

for threshold in thresholds:
    ratio_names.add(threshold.get("ratio_name"))

    # Determine security scope
    if threshold.get("security_id"):
        security_scope.add(threshold.get("security_id"))

# If explicit security IDs provided, use those
if explicit_security_ids:
    security_scope = set(explicit_security_ids)

# Multi-output
threshold_data = thresholds
threshold_count = len(thresholds)
unique_ratio_names = list(ratio_names)
security_ids_to_check = list(security_scope) if security_scope else None
current_check_date = check_date
"""
        },
    )

    workflow.add_connection("get_thresholds", "records", "prepare_threshold_check", "records")

    # =========================================================================
    # Step 2: Get Current Security Ratios
    # =========================================================================
    # Get the most recent ratios for the specified securities

    workflow.add_node(
        "SecurityRatioListNode",
        "get_ratios",
        {
            "filter": {},  # Filter dynamically in next node
            "limit": 100000,
        },
    )

    # Get latest ratio per security/ratio_name combination
    workflow.add_node(
        "PythonCodeNode",
        "get_latest_ratios",
        {
            "code": """
# Create lookup: (security_id, ratio_name) -> latest ratio record
ratio_lookup = {}

for ratio in records:
    security_id = ratio.get("security_id")
    ratio_name = ratio.get("ratio_name")
    calc_date = ratio.get("calculation_date", "")

    if security_id and ratio_name:
        key = (security_id, ratio_name)

        if key not in ratio_lookup:
            ratio_lookup[key] = ratio
        elif calc_date > ratio_lookup[key].get("calculation_date", ""):
            ratio_lookup[key] = ratio

# Multi-output
current_ratios = ratio_lookup
ratio_count = len(ratio_lookup)
"""
        },
    )

    workflow.add_connection("get_ratios", "records", "get_latest_ratios", "records")

    # =========================================================================
    # Step 3: Check Thresholds with Cooldown Enforcement
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "check_thresholds",
        {
            "code": """
from decimal import Decimal, InvalidOperation
from datetime import datetime, timedelta
import uuid

def safe_decimal(value):
    '''Safely convert value to Decimal.'''
    if value is None or value == "" or value == "None":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None

def compare_values(current_value, threshold_value, comparison):
    '''
    Compare current value against threshold based on comparison type.
    Returns True if threshold is breached.
    '''
    if current_value is None or threshold_value is None:
        return False

    current = safe_decimal(current_value)
    threshold = safe_decimal(threshold_value)

    if current is None or threshold is None:
        return False

    if comparison == "lt":
        return current < threshold
    elif comparison == "lte":
        return current <= threshold
    elif comparison == "gt":
        return current > threshold
    elif comparison == "gte":
        return current >= threshold
    elif comparison == "eq":
        return current == threshold
    else:
        return False

def is_on_cooldown(threshold, check_datetime):
    '''Check if threshold is still on cooldown.'''
    last_triggered = threshold.get("last_triggered_at")
    cooldown_hours = threshold.get("cooldown_hours", 24)

    if not last_triggered:
        return False

    try:
        # Parse the last triggered datetime
        if 'T' in last_triggered:
            last_dt = datetime.fromisoformat(last_triggered.replace('Z', '+00:00'))
        else:
            last_dt = datetime.strptime(last_triggered, "%Y-%m-%d")

        # Make check_datetime timezone-naive for comparison if needed
        if hasattr(last_dt, 'tzinfo') and last_dt.tzinfo is not None:
            last_dt = last_dt.replace(tzinfo=None)

        cooldown_end = last_dt + timedelta(hours=cooldown_hours)
        return check_datetime < cooldown_end
    except (ValueError, TypeError):
        return False

def determine_severity(current_value, warning_threshold, critical_threshold, comparison):
    '''Determine if this is a warning or critical alert.'''
    current = safe_decimal(current_value)
    warning = safe_decimal(warning_threshold)
    critical = safe_decimal(critical_threshold)

    if current is None:
        return None

    # For lt/lte comparisons, critical is lower than warning
    # For gt/gte comparisons, critical is higher than warning
    if comparison in ("lt", "lte"):
        if critical and compare_values(current, critical, comparison):
            return "critical"
        elif warning and compare_values(current, warning, comparison):
            return "warning"
    else:  # gt, gte, eq
        if critical and compare_values(current, critical, comparison):
            return "critical"
        elif warning and compare_values(current, warning, comparison):
            return "warning"

    return None

# Process thresholds
alerts_to_create = []
thresholds_to_update = []
check_datetime = datetime.now()
check_date_str = current_check_date

skipped_cooldown = 0
no_ratio_found = 0
no_breach = 0

for threshold in threshold_data:
    threshold_id = threshold.get("id")
    user_id = threshold.get("user_id")
    security_id = threshold.get("security_id")
    portfolio_id = threshold.get("portfolio_id")
    ratio_name = threshold.get("ratio_name")
    ratio_class = threshold.get("ratio_class")
    comparison = threshold.get("comparison", "lt")
    warning_threshold = threshold.get("warning_threshold")
    critical_threshold = threshold.get("critical_threshold")

    # Check cooldown
    if is_on_cooldown(threshold, check_datetime):
        skipped_cooldown += 1
        continue

    # If security-specific threshold, only check that security
    if security_id:
        securities_to_check = [security_id]
    elif security_ids_to_check:
        securities_to_check = security_ids_to_check
    else:
        # Global threshold - check all securities with this ratio
        securities_to_check = [
            key[0] for key in current_ratios.keys()
            if key[1] == ratio_name
        ]

    for sec_id in securities_to_check:
        # Get current ratio value
        ratio_key = (sec_id, ratio_name)
        ratio_record = current_ratios.get(ratio_key)

        if not ratio_record:
            no_ratio_found += 1
            continue

        current_value = ratio_record.get("ratio_value")

        # Determine severity of breach
        severity = determine_severity(
            current_value, warning_threshold, critical_threshold, comparison
        )

        if not severity:
            no_breach += 1
            continue

        # Create alert
        alert_id = str(uuid.uuid4())
        triggered_at = check_datetime.isoformat()

        # Determine which threshold was breached
        breached_threshold = critical_threshold if severity == "critical" else warning_threshold

        # Create descriptive title and message
        ratio_display = ratio_name.replace("_", " ").title()
        comparison_text = {
            "lt": "below", "lte": "at or below",
            "gt": "above", "gte": "at or above",
            "eq": "equal to"
        }.get(comparison, comparison)

        alert = {
            "id": alert_id,
            "user_id": user_id,
            "portfolio_id": portfolio_id,
            "security_id": sec_id,
            "alert_type": "threshold",
            "severity": severity,
            "title": f"{sec_id}: {ratio_display} {comparison_text} threshold",
            "message": f"The {ratio_display} for {sec_id} is {current_value}, which is {comparison_text} the {severity} threshold of {breached_threshold}.",
            "trigger_value": str(current_value) if current_value else None,
            "threshold_value": str(breached_threshold) if breached_threshold else None,
            "ratio_name": ratio_name,
            "comparison": comparison,
            "triggered_at": triggered_at,
            "status": "active",
            "source": "workflow",
            "metadata": {
                "threshold_id": threshold_id,
                "ratio_class": ratio_class,
                "warning_threshold": warning_threshold,
                "critical_threshold": critical_threshold,
                "peer_percentile": ratio_record.get("peer_percentile")
            }
        }

        alerts_to_create.append(alert)

        # Mark threshold for update
        times_triggered = threshold.get("times_triggered", 0) + 1
        thresholds_to_update.append({
            "id": threshold_id,
            "last_triggered_at": triggered_at,
            "last_triggered_value": str(current_value) if current_value else None,
            "times_triggered": times_triggered
        })

# Multi-output
new_alerts = alerts_to_create
alert_count = len(alerts_to_create)
threshold_updates = thresholds_to_update
update_count = len(thresholds_to_update)
stats = {
    "thresholds_checked": len(threshold_data),
    "skipped_cooldown": skipped_cooldown,
    "no_ratio_found": no_ratio_found,
    "no_breach": no_breach,
    "alerts_created": len(alerts_to_create)
}
"""
        },
    )

    # Connect inputs
    workflow.add_connection(
        "prepare_threshold_check", "threshold_data", "check_thresholds", "threshold_data"
    )
    workflow.add_connection(
        "prepare_threshold_check",
        "security_ids_to_check",
        "check_thresholds",
        "security_ids_to_check",
    )
    workflow.add_connection(
        "prepare_threshold_check", "current_check_date", "check_thresholds", "current_check_date"
    )
    workflow.add_connection(
        "get_latest_ratios", "current_ratios", "check_thresholds", "current_ratios"
    )

    # =========================================================================
    # Step 4: Create Alerts for Breaches
    # =========================================================================

    workflow.add_node(
        "AlertBulkCreateNode",
        "create_alerts",
        {
            "data": "{{check_thresholds.new_alerts}}",
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("check_thresholds", "new_alerts", "create_alerts", "data")

    # =========================================================================
    # Step 5: Update Threshold last_triggered Fields
    # =========================================================================

    workflow.add_node(
        "AlertThresholdBulkUpdateNode",
        "update_thresholds",
        {
            "data": "{{check_thresholds.threshold_updates}}",
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("check_thresholds", "threshold_updates", "update_thresholds", "data")

    # =========================================================================
    # Step 6: Compile Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": """
from datetime import datetime

summary = {
    "workflow": "threshold_alert_check",
    "completed_at": datetime.now().isoformat(),
    "check_date": current_check_date,
    "thresholds_checked": threshold_count,
    "ratios_available": ratio_count,
    "alerts_created": alert_count,
    "thresholds_updated": update_count,
    "statistics": stats,
    "status": "success"
}

result = summary
"""
        },
    )

    # Connect summary inputs
    workflow.add_connection(
        "prepare_threshold_check", "current_check_date", "compile_summary", "current_check_date"
    )
    workflow.add_connection(
        "prepare_threshold_check", "threshold_count", "compile_summary", "threshold_count"
    )
    workflow.add_connection("get_latest_ratios", "ratio_count", "compile_summary", "ratio_count")
    workflow.add_connection("check_thresholds", "alert_count", "compile_summary", "alert_count")
    workflow.add_connection("check_thresholds", "update_count", "compile_summary", "update_count")
    workflow.add_connection("check_thresholds", "stats", "compile_summary", "stats")

    return workflow


def build_alert_cleanup_workflow(
    user_id: str | None = None,
    days_to_keep: int = 30,
    batch_size: int = 500,
) -> WorkflowBuilder:
    """
    Build workflow to clean up old dismissed/resolved alerts.

    This workflow removes alerts that have been dismissed or resolved
    for longer than the retention period, keeping the alert table clean.

    Args:
        user_id: User ID to clean alerts for. If None, cleans for all users.
        days_to_keep: Days to keep dismissed/resolved alerts. Default 30.
        batch_size: Batch size for delete operations.

    Returns:
        WorkflowBuilder configured for alert cleanup.

    Example:
        >>> workflow = build_alert_cleanup_workflow(days_to_keep=30)
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Build filter
    user_filter = {"user_id": user_id} if user_id else {}

    # =========================================================================
    # Step 1: Find Old Dismissed/Resolved Alerts
    # =========================================================================

    workflow.add_node(
        "AlertListNode",
        "get_old_alerts",
        {
            "filter": {
                **user_filter,
                "status": {"$in": ["dismissed", "resolved"]},
            },
            "limit": 50000,
        },
    )

    workflow.add_node(
        "PythonCodeNode",
        "filter_old_alerts",
        {
            "code": f"""
from datetime import datetime, timedelta

days_to_keep = {days_to_keep}
cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).isoformat()

# Filter alerts older than cutoff
old_alert_ids = []

for alert in records:
    # Check dismissed_at or resolved_at
    dismissed_at = alert.get("dismissed_at")
    resolved_at = alert.get("resolved_at")

    end_date = dismissed_at or resolved_at

    if end_date and end_date < cutoff_date:
        old_alert_ids.append(alert.get("id"))

# Multi-output
alerts_to_delete = old_alert_ids
delete_count = len(old_alert_ids)
"""
        },
    )

    workflow.add_connection("get_old_alerts", "records", "filter_old_alerts", "records")

    # =========================================================================
    # Step 2: Delete Old Alerts
    # =========================================================================

    workflow.add_node(
        "AlertBulkDeleteNode",
        "delete_alerts",
        {
            "filter": {"id": {"$in": "{{filter_old_alerts.alerts_to_delete}}"}},
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("filter_old_alerts", "alerts_to_delete", "delete_alerts", "ids")

    # =========================================================================
    # Step 3: Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": f"""
from datetime import datetime

summary = {{
    "workflow": "alert_cleanup",
    "completed_at": datetime.now().isoformat(),
    "days_retention": {days_to_keep},
    "alerts_deleted": delete_count,
    "status": "success"
}}

result = summary
"""
        },
    )

    workflow.add_connection("filter_old_alerts", "delete_count", "compile_summary", "delete_count")

    return workflow


def build_batch_alert_check_workflow(
    check_date: str | None = None,
    batch_size: int = 500,
) -> WorkflowBuilder:
    """
    Build workflow to check thresholds for all users in batch.

    This is a convenience wrapper for batch processing of all users.
    Suitable for scheduled jobs.

    Args:
        check_date: Date for threshold check. Defaults to today.
        batch_size: Batch size for bulk operations.

    Returns:
        WorkflowBuilder for batch threshold checking.

    Example:
        >>> workflow = build_batch_alert_check_workflow()
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    return build_threshold_alert_workflow(
        user_id=None,  # All users
        check_date=check_date,
        security_ids=None,  # All securities
        batch_size=batch_size,
    )
