# TODO-BE-006: Data Sync Workflows

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-004

---

## Objective

Implement Kailash workflows for synchronizing data from external providers (EODHD, Capital IQ, Pitchbook).

---

## Tasks

### 1. EODHD Price Sync Workflow
- [ ] Create `src/arc/workflows/sync/eodhd.py`
- [ ] Implement `create_eodhd_price_sync_workflow()`:
  - Node 1: `SecurityListNode` - Get active securities
  - Node 2: `DataProviderConnectionReadNode` - Get EODHD credentials
  - Node 3: `PythonCodeNode` - Fetch prices from EODHD API
  - Node 4: `PythonCodeNode` - Batch prices (max 1000 per batch)
  - Node 5: `PriceHistoryBulkUpsertNode` - Save prices
  - Node 6: `DataProviderConnectionUpdateNode` - Update sync status
  - Node 7: `SyncJobCreateNode` - Create job record
- [ ] Implement proper connections between nodes
- [ ] Add error handling for API failures
- [ ] Support incremental sync (date range filtering)

**Inputs**:
```python
{
    "security_ids": Optional[List[str]],
    "start_date": Optional[str],
    "end_date": Optional[str]
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

### 2. Capital IQ Fundamentals Sync Workflow
- [ ] Create `src/arc/workflows/sync/capitaliq.py`
- [ ] Implement `create_capitaliq_fundamentals_workflow()`:
  - Node 1: `SecurityListNode` - Get equities to sync
  - Node 2: `DataProviderConnectionReadNode` - Get Capital IQ credentials
  - Node 3: `PythonCodeNode` - Fetch fundamentals via OAuth
  - Node 4: `CompanyFundamentalsBulkUpsertNode` - Save fundamentals
  - Node 5: `PythonCodeNode` - Trigger ratio recalculation
- [ ] Support quarterly and annual periods
- [ ] Map all fundamental fields correctly

### 3. Pitchbook Private Company Sync Workflow
- [ ] Create `src/arc/workflows/sync/pitchbook.py`
- [ ] Implement `create_pitchbook_sync_workflow()`:
  - Fetch private company data
  - Create/update Security records with `is_private=True`
  - Handle valuation data
- [ ] (Lower priority - implement skeleton for now)

### 4. Workflow Registry
- [ ] Create `src/arc/workflows/sync/__init__.py`
- [ ] Export all sync workflows
- [ ] Create workflow factory functions

---

## Acceptance Criteria

- [ ] EODHD workflow syncs daily prices for all active securities
- [ ] Batch processing for large datasets (1000 records per batch)
- [ ] Error handling with partial success support
- [ ] Sync status tracking in DataProviderConnection
- [ ] Job records created for audit trail
- [ ] Capital IQ OAuth token handling
- [ ] Ratio recalculation triggered after fundamentals sync
- [ ] Unit test: Mock EODHD response parsing
- [ ] Unit test: Batch size handling
- [ ] Integration test: End-to-end price sync
- [ ] Integration test: Full fundamentals sync

---

## Technical Notes

```python
# Example workflow pattern
def create_eodhd_price_sync_workflow():
    workflow = WorkflowBuilder()
    workflow.add_metadata({
        "name": "eodhd_price_sync",
        "description": "Synchronize daily prices from EODHD",
        "version": "1.0.0"
    })

    workflow.add_node("SecurityListNode", "get_securities", {...})
    workflow.add_node("PythonCodeNode", "fetch_prices", {...})
    workflow.add_connection("get_securities", "records", "fetch_prices", "securities")

    return workflow.build()
```

- Use `AsyncLocalRuntime` for Docker deployment
- Always call `.build()` before execution
- Use proper connection parameter mapping
