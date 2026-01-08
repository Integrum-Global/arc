"""
Peer Benchmark Workflow.

Calculates peer group benchmarks and percentile rankings for securities.

Workflow Pattern:
1. Get peer group definition
2. Get target security ratios
3. Get all peer security ratios
4. Calculate percentiles, median, mean, rank
5. Update SecurityRatio with peer_percentile

Features:
- Percentile calculation for any ratio
- Multiple statistical measures (mean, median, std, min, max)
- Peer group ranking
- Sector and industry averages
- Optional ratio updates with peer data

CRITICAL RULES:
- NEVER manually set created_at or updated_at
- Use Decimal for all calculations
- Handle edge cases (single peer, no data)
"""

from kailash.workflow.builder import WorkflowBuilder


def build_peer_benchmark_workflow(
    security_id: str,
    peer_group_id: str,
    ratio_names: list[str] | None = None,
    calculation_date: str | None = None,
    update_ratios: bool = True,
    batch_size: int = 1000,
) -> WorkflowBuilder:
    """
    Build workflow to calculate peer group benchmarks for a security.

    This workflow compares a security's ratios against its peer group,
    calculating percentile rankings and statistical benchmarks.

    Args:
        security_id: The security to benchmark.
        peer_group_id: The peer group to compare against.
        ratio_names: List of ratios to benchmark. If None, benchmarks all available.
        calculation_date: Date for calculation. Defaults to today.
        update_ratios: Whether to update SecurityRatio with peer_percentile.
        batch_size: Batch size for bulk operations.

    Returns:
        WorkflowBuilder configured for peer benchmarking.

    Example:
        >>> workflow = build_peer_benchmark_workflow(
        ...     security_id="AAPL",
        ...     peer_group_id="sector_technology_large",
        ...     ratio_names=["pe_ratio", "roe", "profit_margin"]
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Parameters for code
    date_code = f'"{calculation_date}"' if calculation_date else "None"
    ratio_names_code = repr(ratio_names) if ratio_names else "None"

    # =========================================================================
    # Step 1: Get Peer Group Definition
    # =========================================================================

    workflow.add_node(
        "PeerGroupReadNode",
        "get_peer_group",
        {
            "id": peer_group_id,
        },
    )

    workflow.add_node(
        "PythonCodeNode",
        "extract_peer_info",
        {
            "code": f"""
from datetime import datetime

target_security_id = "{security_id}"
calculation_date = {date_code} or datetime.now().strftime("%Y-%m-%d")

# Extract peer group info
peer_group = record if record else {{}}
peer_group_name = peer_group.get("name", "Unknown")
peer_security_ids = peer_group.get("security_ids", [])
criteria = peer_group.get("criteria", {{}})

# Ensure target is not in peer list for comparison
if target_security_id in peer_security_ids:
    peer_security_ids = [s for s in peer_security_ids if s != target_security_id]

# Multi-output
target_id = target_security_id
peer_ids = peer_security_ids
peer_count = len(peer_security_ids)
group_name = peer_group_name
group_criteria = criteria
calc_date = calculation_date
"""
        },
    )

    workflow.add_connection("get_peer_group", "record", "extract_peer_info", "record")

    # =========================================================================
    # Step 2: Get Target Security Ratios
    # =========================================================================

    workflow.add_node(
        "SecurityRatioListNode",
        "get_target_ratios",
        {
            "filter": {"security_id": security_id},
            "limit": 10000,
        },
    )

    # Get latest ratio per ratio_name for target
    workflow.add_node(
        "PythonCodeNode",
        "get_latest_target_ratios",
        {
            "code": f"""
ratio_filter = {ratio_names_code}

# Get latest ratio per ratio_name
latest_ratios = {{}}

for ratio in records:
    ratio_name = ratio.get("ratio_name")
    calc_date = ratio.get("calculation_date", "")

    # Apply ratio filter if specified
    if ratio_filter and ratio_name not in ratio_filter:
        continue

    if ratio_name:
        if ratio_name not in latest_ratios:
            latest_ratios[ratio_name] = ratio
        elif calc_date > latest_ratios[ratio_name].get("calculation_date", ""):
            latest_ratios[ratio_name] = ratio

# Multi-output
target_ratios = latest_ratios
target_ratio_names = list(latest_ratios.keys())
target_ratio_count = len(latest_ratios)
"""
        },
    )

    workflow.add_connection("get_target_ratios", "records", "get_latest_target_ratios", "records")

    # =========================================================================
    # Step 3: Get Peer Security Ratios
    # =========================================================================
    # Query all ratios for peer securities

    workflow.add_node(
        "SecurityRatioListNode",
        "get_peer_ratios",
        {
            "filter": {},  # Will filter by peer_ids
            "limit": 500000,
        },
    )

    # Organize peer ratios by ratio_name
    workflow.add_node(
        "PythonCodeNode",
        "organize_peer_ratios",
        {
            "code": f"""
from collections import defaultdict

ratio_filter = {ratio_names_code}

# Get latest ratio per security per ratio_name
# Structure: {{ratio_name: {{security_id: ratio_record}}}}
peer_ratios_by_name = defaultdict(dict)

for ratio in records:
    security_id = ratio.get("security_id")
    ratio_name = ratio.get("ratio_name")
    calc_date = ratio.get("calculation_date", "")

    # Only include peer securities
    if security_id not in peer_ids:
        continue

    # Apply ratio filter if specified
    if ratio_filter and ratio_name not in ratio_filter:
        continue

    if security_id and ratio_name:
        current = peer_ratios_by_name[ratio_name].get(security_id)
        if not current or calc_date > current.get("calculation_date", ""):
            peer_ratios_by_name[ratio_name][security_id] = ratio

# Convert to regular dict for output
peer_ratio_data = dict(peer_ratios_by_name)
peer_data_ratio_count = len(peer_ratio_data)
"""
        },
    )

    workflow.add_connection("get_peer_ratios", "records", "organize_peer_ratios", "records")
    workflow.add_connection("extract_peer_info", "peer_ids", "organize_peer_ratios", "peer_ids")

    # =========================================================================
    # Step 4: Calculate Percentiles, Statistics, and Rankings
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "calculate_benchmarks",
        {
            "code": """
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import statistics

def safe_decimal(value):
    '''Safely convert to Decimal.'''
    if value is None or value == "" or value == "None":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None

def calculate_percentile(value, sorted_values):
    '''Calculate percentile rank of value in sorted list.'''
    if not sorted_values or value is None:
        return None

    # Count values less than or equal to target
    count_below = sum(1 for v in sorted_values if v <= value)
    percentile = (count_below / len(sorted_values)) * 100
    return int(round(percentile))

def safe_statistics(values_list):
    '''Calculate statistics from a list of Decimal values.'''
    if not values_list:
        return {}

    # Convert to float for statistics calculations
    float_values = [float(v) for v in values_list]

    result = {
        "count": len(float_values),
        "min": str(min(values_list)),
        "max": str(max(values_list)),
        "mean": str(Decimal(str(statistics.mean(float_values))).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )),
    }

    if len(float_values) >= 2:
        result["median"] = str(Decimal(str(statistics.median(float_values))).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        ))
        result["stdev"] = str(Decimal(str(statistics.stdev(float_values))).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        ))

    return result

# Calculate benchmarks for each ratio
benchmark_results = []
ratio_updates = []

for ratio_name, target_ratio in target_ratios.items():
    target_value = safe_decimal(target_ratio.get("ratio_value"))

    if target_value is None:
        continue

    # Get peer values for this ratio
    peer_data = peer_ratio_data.get(ratio_name, {})

    peer_values = []
    for sec_id, peer_ratio in peer_data.items():
        peer_val = safe_decimal(peer_ratio.get("ratio_value"))
        if peer_val is not None:
            peer_values.append(peer_val)

    if not peer_values:
        continue

    # Sort for percentile calculation
    sorted_peer_values = sorted(peer_values)

    # Calculate percentile
    percentile = calculate_percentile(target_value, sorted_peer_values)

    # Calculate rank (1 = best)
    # For most ratios, higher is better. For some (like debt_to_equity), lower is better.
    lower_is_better = ratio_name in [
        "debt_to_equity", "debt_ratio", "debt_to_ebitda",
        "pe_ratio", "pb_ratio", "ps_ratio", "ev_ebitda", "ev_revenue"
    ]

    if lower_is_better:
        # Count how many peers have higher (worse) values
        rank = sum(1 for v in peer_values if v > target_value) + 1
    else:
        # Count how many peers have lower (worse) values
        rank = sum(1 for v in peer_values if v < target_value) + 1

    # Calculate statistics
    stats = safe_statistics(peer_values)

    # Create benchmark result
    benchmark = {
        "ratio_name": ratio_name,
        "ratio_class": target_ratio.get("ratio_class"),
        "target_value": str(target_value),
        "percentile": percentile,
        "rank": rank,
        "rank_of": len(peer_values) + 1,  # +1 to include target
        "peer_count": len(peer_values),
        "peer_stats": stats,
        "vs_mean": str((target_value - Decimal(stats.get("mean", "0"))).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )) if stats.get("mean") else None,
        "vs_median": str((target_value - Decimal(stats.get("median", "0"))).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )) if stats.get("median") else None,
    }
    benchmark_results.append(benchmark)

    # Prepare ratio update if enabled
    ratio_updates.append({
        "id": target_ratio.get("id"),
        "peer_percentile": percentile,
        "sector_average": stats.get("mean"),
    })

# Multi-output
benchmarks = benchmark_results
benchmark_count = len(benchmark_results)
updates_for_ratios = ratio_updates
update_count = len(ratio_updates)
"""
        },
    )

    # Connect inputs
    workflow.add_connection(
        "get_latest_target_ratios", "target_ratios", "calculate_benchmarks", "target_ratios"
    )
    workflow.add_connection(
        "organize_peer_ratios", "peer_ratio_data", "calculate_benchmarks", "peer_ratio_data"
    )

    # =========================================================================
    # Step 5: Update Security Ratios with Peer Data (Optional)
    # =========================================================================

    if update_ratios:
        workflow.add_node(
            "SecurityRatioBulkUpdateNode",
            "update_ratio_percentiles",
            {
                "data": "{{calculate_benchmarks.updates_for_ratios}}",
                "batch_size": batch_size,
            },
        )

        workflow.add_connection(
            "calculate_benchmarks", "updates_for_ratios", "update_ratio_percentiles", "data"
        )

    # =========================================================================
    # Step 6: Compile Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": f"""
from datetime import datetime

summary = {{
    "workflow": "peer_benchmark",
    "completed_at": datetime.now().isoformat(),
    "calculation_date": calc_date,
    "target_security": target_id,
    "peer_group": group_name,
    "peer_count": peer_count,
    "ratios_benchmarked": benchmark_count,
    "ratios_updated": update_count if {update_ratios} else 0,
    "benchmarks": benchmarks,
    "status": "success"
}}

result = summary
"""
        },
    )

    # Connect summary inputs
    workflow.add_connection("extract_peer_info", "calc_date", "compile_summary", "calc_date")
    workflow.add_connection("extract_peer_info", "target_id", "compile_summary", "target_id")
    workflow.add_connection("extract_peer_info", "group_name", "compile_summary", "group_name")
    workflow.add_connection("extract_peer_info", "peer_count", "compile_summary", "peer_count")
    workflow.add_connection(
        "calculate_benchmarks", "benchmark_count", "compile_summary", "benchmark_count"
    )
    workflow.add_connection("calculate_benchmarks", "benchmarks", "compile_summary", "benchmarks")
    workflow.add_connection(
        "calculate_benchmarks", "update_count", "compile_summary", "update_count"
    )

    return workflow


def build_batch_peer_benchmark_workflow(
    peer_group_id: str,
    ratio_names: list[str] | None = None,
    calculation_date: str | None = None,
    batch_size: int = 1000,
) -> WorkflowBuilder:
    """
    Build workflow to calculate peer benchmarks for all securities in a group.

    This workflow benchmarks every security in the peer group against the
    group statistics, updating all SecurityRatio records with percentiles.

    Args:
        peer_group_id: The peer group to benchmark.
        ratio_names: List of ratios to benchmark. If None, benchmarks all.
        calculation_date: Date for calculation. Defaults to today.
        batch_size: Batch size for bulk operations.

    Returns:
        WorkflowBuilder configured for batch peer benchmarking.

    Example:
        >>> workflow = build_batch_peer_benchmark_workflow(
        ...     peer_group_id="sector_technology_large"
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Parameters
    date_code = f'"{calculation_date}"' if calculation_date else "None"
    ratio_names_code = repr(ratio_names) if ratio_names else "None"

    # =========================================================================
    # Step 1: Get Peer Group Definition
    # =========================================================================

    workflow.add_node(
        "PeerGroupReadNode",
        "get_peer_group",
        {
            "id": peer_group_id,
        },
    )

    workflow.add_node(
        "PythonCodeNode",
        "extract_peer_info",
        {
            "code": f"""
from datetime import datetime

calculation_date = {date_code} or datetime.now().strftime("%Y-%m-%d")

# Extract peer group info
peer_group = record if record else {{}}
peer_group_name = peer_group.get("name", "Unknown")
peer_security_ids = peer_group.get("security_ids", [])

# Multi-output
all_security_ids = peer_security_ids
security_count = len(peer_security_ids)
group_name = peer_group_name
calc_date = calculation_date
"""
        },
    )

    workflow.add_connection("get_peer_group", "record", "extract_peer_info", "record")

    # =========================================================================
    # Step 2: Get All Ratios for Peer Group Securities
    # =========================================================================

    workflow.add_node(
        "SecurityRatioListNode",
        "get_all_ratios",
        {
            "filter": {},  # Filter in code
            "limit": 500000,
        },
    )

    # =========================================================================
    # Step 3: Calculate Percentiles for All Securities
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "calculate_all_benchmarks",
        {
            "code": f"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from collections import defaultdict
import statistics

ratio_filter = {ratio_names_code}

def safe_decimal(value):
    if value is None or value == "" or value == "None":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None

def calculate_percentile(value, all_values):
    '''Calculate percentile of value among all values.'''
    if not all_values or value is None:
        return None
    count_below = sum(1 for v in all_values if v <= value)
    return int(round((count_below / len(all_values)) * 100))

# Organize ratios by (security_id, ratio_name) -> latest ratio
# And by ratio_name -> list of all values
latest_ratios = {{}}
ratio_values = defaultdict(list)

for ratio in records:
    security_id = ratio.get("security_id")
    ratio_name = ratio.get("ratio_name")
    calc_date = ratio.get("calculation_date", "")
    ratio_value = safe_decimal(ratio.get("ratio_value"))

    # Only include securities in peer group
    if security_id not in all_security_ids:
        continue

    # Apply ratio filter if specified
    if ratio_filter and ratio_name not in ratio_filter:
        continue

    if security_id and ratio_name:
        key = (security_id, ratio_name)

        # Track latest ratio per security/name
        if key not in latest_ratios or calc_date > latest_ratios[key].get("calculation_date", ""):
            latest_ratios[key] = ratio

        # Collect all values for this ratio
        if ratio_value is not None:
            ratio_values[ratio_name].append(ratio_value)

# Calculate group statistics for each ratio
ratio_stats = {{}}
for ratio_name, values in ratio_values.items():
    if values:
        float_values = [float(v) for v in values]
        ratio_stats[ratio_name] = {{
            "count": len(values),
            "mean": str(Decimal(str(statistics.mean(float_values))).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_UP
            )),
            "median": str(Decimal(str(statistics.median(float_values))).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_UP
            )) if len(values) >= 2 else None,
        }}

# Calculate percentiles and prepare updates
ratio_updates = []
for (security_id, ratio_name), ratio_record in latest_ratios.items():
    ratio_value = safe_decimal(ratio_record.get("ratio_value"))

    if ratio_value is None:
        continue

    # Calculate percentile among all peers
    all_values = ratio_values.get(ratio_name, [])
    percentile = calculate_percentile(ratio_value, all_values)

    if percentile is not None:
        ratio_updates.append({{
            "id": ratio_record.get("id"),
            "peer_percentile": percentile,
            "sector_average": ratio_stats.get(ratio_name, {{}}).get("mean"),
        }})

# Multi-output
updates = ratio_updates
update_count = len(ratio_updates)
group_statistics = ratio_stats
ratios_analyzed = len(ratio_stats)
"""
        },
    )

    workflow.add_connection("get_all_ratios", "records", "calculate_all_benchmarks", "records")
    workflow.add_connection(
        "extract_peer_info", "all_security_ids", "calculate_all_benchmarks", "all_security_ids"
    )

    # =========================================================================
    # Step 4: Bulk Update Ratios
    # =========================================================================

    workflow.add_node(
        "SecurityRatioBulkUpdateNode",
        "update_ratios",
        {
            "data": "{{calculate_all_benchmarks.updates}}",
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("calculate_all_benchmarks", "updates", "update_ratios", "data")

    # =========================================================================
    # Step 5: Update Peer Group Statistics
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "prepare_group_update",
        {
            "code": f"""
from datetime import datetime

# Extract key statistics for peer group record
stats = group_statistics

# Multi-output - fields to update (id is in filter, not here)
group_update = {{
    "member_count": security_count,
    "stats_date": calc_date,
    "avg_pe_ratio": stats.get("pe_ratio", {{}}).get("mean"),
    "avg_roe": stats.get("roe", {{}}).get("mean"),
}}
"""
        },
    )

    workflow.add_connection(
        "calculate_all_benchmarks", "group_statistics", "prepare_group_update", "group_statistics"
    )
    workflow.add_connection(
        "extract_peer_info", "security_count", "prepare_group_update", "security_count"
    )
    workflow.add_connection("extract_peer_info", "calc_date", "prepare_group_update", "calc_date")

    workflow.add_node(
        "PeerGroupUpdateNode",
        "update_peer_group",
        {
            "filter": {"id": peer_group_id},
            "fields": {},  # Will be populated via connection
        },
    )

    workflow.add_connection("prepare_group_update", "group_update", "update_peer_group", "fields")

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
    "workflow": "batch_peer_benchmark",
    "completed_at": datetime.now().isoformat(),
    "calculation_date": calc_date,
    "peer_group": group_name,
    "securities_in_group": security_count,
    "ratios_analyzed": ratios_analyzed,
    "ratio_records_updated": update_count,
    "group_statistics": group_statistics,
    "status": "success"
}

result = summary
"""
        },
    )

    # Connect summary inputs
    workflow.add_connection("extract_peer_info", "calc_date", "compile_summary", "calc_date")
    workflow.add_connection("extract_peer_info", "group_name", "compile_summary", "group_name")
    workflow.add_connection(
        "extract_peer_info", "security_count", "compile_summary", "security_count"
    )
    workflow.add_connection(
        "calculate_all_benchmarks", "ratios_analyzed", "compile_summary", "ratios_analyzed"
    )
    workflow.add_connection(
        "calculate_all_benchmarks", "update_count", "compile_summary", "update_count"
    )
    workflow.add_connection(
        "calculate_all_benchmarks", "group_statistics", "compile_summary", "group_statistics"
    )

    return workflow


def build_sector_benchmark_workflow(
    sector: str,
    ratio_names: list[str] | None = None,
    calculation_date: str | None = None,
    batch_size: int = 1000,
) -> WorkflowBuilder:
    """
    Build workflow to calculate sector-level benchmarks.

    This workflow creates dynamic peer groups based on sector and calculates
    benchmarks for all securities in that sector.

    Args:
        sector: GICS sector name (e.g., "Information Technology").
        ratio_names: List of ratios to benchmark. If None, benchmarks all.
        calculation_date: Date for calculation. Defaults to today.
        batch_size: Batch size for bulk operations.

    Returns:
        WorkflowBuilder configured for sector benchmarking.

    Example:
        >>> workflow = build_sector_benchmark_workflow(
        ...     sector="Information Technology",
        ...     ratio_names=["pe_ratio", "roe"]
        ... )
        >>> runtime = AsyncLocalRuntime()
        >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
    """
    workflow = WorkflowBuilder()

    # Parameters
    date_code = f'"{calculation_date}"' if calculation_date else "None"
    ratio_names_code = repr(ratio_names) if ratio_names else "None"

    # =========================================================================
    # Step 1: Get Securities in Sector
    # =========================================================================

    workflow.add_node(
        "SecurityListNode",
        "get_sector_securities",
        {
            "filter": {
                "sector": sector,
                "active": True,
                "deleted_at": {"$null": True},
            },
            "limit": 10000,
        },
    )

    workflow.add_node(
        "PythonCodeNode",
        "extract_security_ids",
        {
            "code": f"""
from datetime import datetime

calculation_date = {date_code} or datetime.now().strftime("%Y-%m-%d")
sector_name = "{sector}"

securities = records if isinstance(records, list) else []
security_ids = [s.get("id") for s in securities if s.get("id")]

# Multi-output
sector_security_ids = security_ids
security_count = len(security_ids)
calc_date = calculation_date
sector = sector_name
"""
        },
    )

    workflow.add_connection("get_sector_securities", "records", "extract_security_ids", "records")

    # =========================================================================
    # Step 2: Get Ratios for Sector Securities
    # =========================================================================

    workflow.add_node(
        "SecurityRatioListNode",
        "get_sector_ratios",
        {
            "filter": {},
            "limit": 500000,
        },
    )

    # =========================================================================
    # Step 3: Calculate Sector Benchmarks
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "calculate_sector_benchmarks",
        {
            "code": f"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from collections import defaultdict
import statistics

ratio_filter = {ratio_names_code}

def safe_decimal(value):
    if value is None or value == "" or value == "None":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None

def calculate_percentile(value, all_values):
    if not all_values or value is None:
        return None
    count_below = sum(1 for v in all_values if v <= value)
    return int(round((count_below / len(all_values)) * 100))

# Organize ratios
latest_ratios = {{}}
ratio_values = defaultdict(list)

for ratio in records:
    security_id = ratio.get("security_id")
    ratio_name = ratio.get("ratio_name")
    calc_date = ratio.get("calculation_date", "")
    ratio_value = safe_decimal(ratio.get("ratio_value"))

    # Only include sector securities
    if security_id not in sector_security_ids:
        continue

    # Apply ratio filter
    if ratio_filter and ratio_name not in ratio_filter:
        continue

    if security_id and ratio_name:
        key = (security_id, ratio_name)
        if key not in latest_ratios or calc_date > latest_ratios[key].get("calculation_date", ""):
            latest_ratios[key] = ratio

        if ratio_value is not None:
            ratio_values[ratio_name].append(ratio_value)

# Calculate sector statistics
sector_stats = {{}}
for ratio_name, values in ratio_values.items():
    if values:
        float_values = [float(v) for v in values]
        sector_stats[ratio_name] = {{
            "count": len(values),
            "mean": str(Decimal(str(statistics.mean(float_values))).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_UP
            )),
            "median": str(Decimal(str(statistics.median(float_values))).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_UP
            )) if len(values) >= 2 else None,
            "min": str(min(values)),
            "max": str(max(values)),
            "stdev": str(Decimal(str(statistics.stdev(float_values))).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_UP
            )) if len(values) >= 2 else None,
        }}

# Calculate percentiles and prepare updates
ratio_updates = []
for (security_id, ratio_name), ratio_record in latest_ratios.items():
    ratio_value = safe_decimal(ratio_record.get("ratio_value"))

    if ratio_value is None:
        continue

    all_values = ratio_values.get(ratio_name, [])
    percentile = calculate_percentile(ratio_value, all_values)

    if percentile is not None:
        ratio_updates.append({{
            "id": ratio_record.get("id"),
            "peer_percentile": percentile,
            "sector_average": sector_stats.get(ratio_name, {{}}).get("mean"),
        }})

# Multi-output
updates = ratio_updates
update_count = len(ratio_updates)
sector_statistics = sector_stats
ratios_analyzed = len(sector_stats)
"""
        },
    )

    workflow.add_connection(
        "get_sector_ratios", "records", "calculate_sector_benchmarks", "records"
    )
    workflow.add_connection(
        "extract_security_ids",
        "sector_security_ids",
        "calculate_sector_benchmarks",
        "sector_security_ids",
    )

    # =========================================================================
    # Step 4: Bulk Update Ratios
    # =========================================================================

    workflow.add_node(
        "SecurityRatioBulkUpdateNode",
        "update_ratios",
        {
            "data": "{{calculate_sector_benchmarks.updates}}",
            "batch_size": batch_size,
        },
    )

    workflow.add_connection("calculate_sector_benchmarks", "updates", "update_ratios", "data")

    # =========================================================================
    # Step 5: Compile Summary
    # =========================================================================

    workflow.add_node(
        "PythonCodeNode",
        "compile_summary",
        {
            "code": """
from datetime import datetime

summary = {
    "workflow": "sector_benchmark",
    "completed_at": datetime.now().isoformat(),
    "calculation_date": calc_date,
    "sector": sector,
    "securities_in_sector": security_count,
    "ratios_analyzed": ratios_analyzed,
    "ratio_records_updated": update_count,
    "sector_statistics": sector_statistics,
    "status": "success"
}

result = summary
"""
        },
    )

    workflow.add_connection("extract_security_ids", "calc_date", "compile_summary", "calc_date")
    workflow.add_connection("extract_security_ids", "sector", "compile_summary", "sector")
    workflow.add_connection(
        "extract_security_ids", "security_count", "compile_summary", "security_count"
    )
    workflow.add_connection(
        "calculate_sector_benchmarks", "ratios_analyzed", "compile_summary", "ratios_analyzed"
    )
    workflow.add_connection(
        "calculate_sector_benchmarks", "update_count", "compile_summary", "update_count"
    )
    workflow.add_connection(
        "calculate_sector_benchmarks", "sector_statistics", "compile_summary", "sector_statistics"
    )

    return workflow
