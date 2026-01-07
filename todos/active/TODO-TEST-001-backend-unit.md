# TODO-TEST-001: Backend Unit Tests

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 12h
**Dependencies**: TODO-BE-001 to TODO-BE-012

---

## Objective

Implement comprehensive unit tests (Tier 1) for backend services, utilities, and business logic. Mocking is ALLOWED in this tier for fast, isolated testing.

---

## Tasks

### 1. Test Infrastructure Setup
- [ ] Create `tests/unit/conftest.py`:
  - Mock fixtures for database
  - Mock fixtures for cache
  - Mock fixtures for external APIs
  - Common test utilities
- [ ] Configure pytest markers for unit tests
- [ ] Set up coverage reporting

### 2. Service Unit Tests - Portfolio
- [ ] Create `tests/unit/services/test_portfolio_service.py`:
  - test_calculate_portfolio_value
  - test_calculate_allocation_weights
  - test_calculate_gain_loss
  - test_validate_transaction_input
  - test_weighted_average_cost_basis
  - test_portfolio_rebalancing_suggestions

### 3. Service Unit Tests - Analytics
- [ ] Create `tests/unit/services/test_analytics_service.py`:
  - test_calculate_health_score_all_positive
  - test_calculate_health_score_empty
  - test_score_to_grade_boundaries (A/B/C/D/F)
  - test_determine_trend_improving
  - test_determine_trend_declining
  - test_determine_trend_stable
  - test_aggregate_findings
  - test_peer_ranking_calculation

### 4. Service Unit Tests - Intelligence
- [ ] Create `tests/unit/services/test_intelligence_service.py`:
  - test_parse_query_intent
  - test_format_query_response
  - test_extract_entities_from_query
  - test_calculate_confidence_score
  - test_generate_follow_up_suggestions
  - test_validate_brief_type

### 5. Utility Function Tests
- [ ] Create `tests/unit/utils/test_calculations.py`:
  - test_current_ratio
  - test_current_ratio_zero_liabilities
  - test_quick_ratio
  - test_cash_ratio
  - test_debt_to_equity
  - test_debt_to_equity_zero_equity
  - test_roe (return on equity)
  - test_roa (return on assets)
  - test_gross_margin
  - test_net_margin
  - test_operating_margin
  - test_pe_ratio
  - test_pb_ratio
  - test_dividend_yield
  - test_all_25_ratios

### 6. Formatter Tests
- [ ] Create `tests/unit/utils/test_formatters.py`:
  - test_format_currency_usd
  - test_format_currency_with_decimals
  - test_format_currency_negative
  - test_format_currency_zero
  - test_format_currency_large_numbers
  - test_format_percentage_decimal
  - test_format_percentage_whole
  - test_format_percentage_negative
  - test_format_ratio_decimal
  - test_format_ratio_multiple
  - test_format_ratio_none
  - test_format_timestamp_iso
  - test_format_timestamp_relative

### 7. Validation Tests
- [ ] Create `tests/unit/utils/test_validators.py`:
  - test_validate_email
  - test_validate_ticker_symbol
  - test_validate_currency_code
  - test_validate_date_range
  - test_validate_quantity_positive
  - test_validate_price_positive
  - test_validate_percentage_range

### 8. Agent Signature Tests
- [ ] Create `tests/unit/agents/test_signatures.py`:
  - test_query_signature_validation
  - test_analysis_signature_validation
  - test_brief_signature_validation
  - test_signature_input_types
  - test_signature_output_types
  - test_signature_required_fields

### 9. Agent Prompt Tests
- [ ] Create `tests/unit/agents/test_prompts.py`:
  - test_query_prompt_structure
  - test_analysis_prompt_includes_context
  - test_brief_prompt_sections
  - test_prompt_variable_substitution
  - test_prompt_length_limits

### 10. Model Validation Tests
- [ ] Create `tests/unit/models/test_model_validation.py`:
  - test_user_email_validation
  - test_portfolio_code_format
  - test_security_ticker_format
  - test_transaction_type_enum
  - test_alert_severity_enum
  - test_decimal_precision

---

## Acceptance Criteria

- [ ] All unit tests pass
- [ ] Code coverage >= 80% for services
- [ ] Code coverage >= 90% for utilities
- [ ] Tests run in < 30 seconds total
- [ ] No external dependencies required
- [ ] CI runs unit tests on every PR

---

## Test Directory Structure

```
tests/
├── unit/
│   ├── conftest.py              # Unit test fixtures
│   ├── services/
│   │   ├── __init__.py
│   │   ├── test_portfolio_service.py
│   │   ├── test_analytics_service.py
│   │   └── test_intelligence_service.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── test_calculations.py
│   │   ├── test_formatters.py
│   │   └── test_validators.py
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── test_signatures.py
│   │   └── test_prompts.py
│   └── models/
│       ├── __init__.py
│       └── test_model_validation.py
```

---

## Example Unit Test

```python
# tests/unit/services/test_analytics_service.py
import pytest
from unittest.mock import MagicMock
from arc.services.analytics_service import AnalyticsService

class TestAnalyticsServiceCalculations:
    """Unit tests for analytics calculations (mocking allowed)."""

    def test_calculate_health_score_all_positive(self):
        """Test health score with all positive findings."""
        service = AnalyticsService.__new__(AnalyticsService)

        findings = [
            {"category": "liquidity", "score": 85},
            {"category": "profitability", "score": 90},
            {"category": "leverage", "score": 75},
        ]

        score = service._calculate_health_score(findings)

        assert 70 <= score <= 90
        assert isinstance(score, float)

    def test_score_to_grade_boundaries(self):
        """Test grade boundaries."""
        service = AnalyticsService.__new__(AnalyticsService)

        assert service._score_to_grade(95) == "A"
        assert service._score_to_grade(89) == "B"
        assert service._score_to_grade(79) == "C"
        assert service._score_to_grade(69) == "D"
        assert service._score_to_grade(59) == "F"
```

---

## Running Unit Tests

```bash
# Run all unit tests
pytest tests/unit -v

# Run with coverage
pytest tests/unit --cov=arc --cov-report=html

# Run specific module
pytest tests/unit/services/test_analytics_service.py -v

# Run tests matching pattern
pytest tests/unit -k "test_calculate" -v

# Run fast (parallel)
pytest tests/unit -n auto
```

---

## Technical Notes

- Mocking is ALLOWED for unit tests only
- Use pytest fixtures for common setup
- Use pytest.mark.parametrize for similar tests
- Keep each test under 100ms
- Avoid database/network calls completely
- Use MagicMock/AsyncMock for dependencies
