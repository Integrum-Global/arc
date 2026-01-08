# TODO-BE-001-02: Poetry Configuration Verification

**Parent**: TODO-BE-001 (Backend Project Initialization)
**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 30m
**Dependencies**: None

---

## Objective

Verify and complete the Poetry/pyproject.toml configuration with proper tool settings for code quality and testing.

---

## Description

The `pyproject.toml` already exists with core dependencies. This task completes the configuration by adding proper tool settings for black, ruff, mypy, and pytest to ensure consistent code quality across the project.

---

## Acceptance Criteria

- [ ] `pyproject.toml` contains `[tool.black]` configuration
- [ ] `pyproject.toml` contains `[tool.ruff]` configuration with ARC-specific rules
- [ ] `pyproject.toml` contains `[tool.mypy]` configuration for strict typing
- [ ] `pyproject.toml` contains `[tool.pytest.ini_options]` configuration
- [ ] `pyproject.toml` contains `[tool.coverage.run]` configuration
- [ ] `poetry install` or `uv sync` succeeds without errors
- [ ] `ruff check .` runs without configuration errors
- [ ] `black --check .` runs without configuration errors
- [ ] `mypy src/` runs without configuration errors

---

## Subtasks

- [ ] Add `[tool.black]` configuration (Est: 5m)
  - line-length = 88
  - target-version = ["py312"]
  - include patterns for Python files
  - Verification: `black --check --config pyproject.toml src/`

- [ ] Add `[tool.ruff]` configuration (Est: 10m)
  - line-length = 88
  - target-version = "py312"
  - select appropriate rules (E, F, W, I, B, UP, S)
  - exclude test fixtures and generated code
  - Verification: `ruff check src/`

- [ ] Add `[tool.ruff.lint.per-file-ignores]` (Est: 5m)
  - Ignore S101 (assert) in tests
  - Ignore specific rules for `__init__.py` files

- [ ] Add `[tool.mypy]` configuration (Est: 10m)
  - python_version = "3.12"
  - strict = true (or equivalent settings)
  - ignore_missing_imports = false (with explicit ignores)
  - Verification: `mypy src/`

- [ ] Add `[tool.pytest.ini_options]` configuration (Est: 10m)
  - asyncio_mode = "auto"
  - testpaths = ["tests"]
  - addopts with coverage flags
  - Verification: `pytest --collect-only`

- [ ] Add `[tool.coverage.run]` configuration (Est: 5m)
  - source = ["src/arc"]
  - omit patterns for tests and __pycache__
  - branch = true

- [ ] Verify dependency installation works (Est: 10m)
  - Run `poetry install` or `uv sync`
  - Verify no dependency conflicts
  - Verification: All packages install successfully

---

## Current State

The existing `pyproject.toml` has:
- Core dependencies (kailash, fastapi, etc.)
- Basic project metadata
- setuptools configuration

Missing:
- Tool configurations (black, ruff, mypy, pytest)
- Coverage configuration

---

## Configuration to Add

```toml
[tool.black]
line-length = 88
target-version = ["py312"]
include = '\.pyi?$'
extend-exclude = '''
/(
    \.eggs
  | \.git
  | \.mypy_cache
  | \.ruff_cache
  | \.venv
  | build
  | dist
)/
'''

[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = [
    "E",      # pycodestyle errors
    "F",      # Pyflakes
    "W",      # pycodestyle warnings
    "I",      # isort
    "B",      # flake8-bugbear
    "UP",     # pyupgrade
    "S",      # flake8-bandit (security)
    "C4",     # flake8-comprehensions
    "DTZ",    # flake8-datetimez
    "T10",    # flake8-debugger
    "ISC",    # flake8-implicit-str-concat
    "PIE",    # flake8-pie
    "PT",     # flake8-pytest-style
    "RET",    # flake8-return
    "SIM",    # flake8-simplify
    "TID",    # flake8-tidy-imports
]
ignore = [
    "E501",   # line length (handled by black)
    "S101",   # assert usage (needed for tests)
]

[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = ["S101", "S105", "S106"]
"**/__init__.py" = ["F401"]

[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
ignore_missing_imports = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_functions = ["test_*"]
addopts = [
    "-v",
    "--strict-markers",
    "--tb=short",
    "-ra",
]
markers = [
    "unit: Unit tests (no external dependencies)",
    "integration: Integration tests (requires database)",
    "e2e: End-to-end tests (full stack)",
    "slow: Slow-running tests",
]
filterwarnings = [
    "ignore::DeprecationWarning",
]

[tool.coverage.run]
source = ["src/arc"]
branch = true
omit = [
    "*/tests/*",
    "*/__pycache__/*",
    "*/migrations/*",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise NotImplementedError",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.:",
]
fail_under = 80
```

---

## Risk Assessment

- **LOW**: Configuration changes only, no code impact
- **MEDIUM**: Strict mypy settings may require type annotations
- **MITIGATION**: Start with ignore_missing_imports = true, tighten later

---

## Testing Requirements

- [ ] `ruff check src/` passes (no lint errors or exits cleanly)
- [ ] `black --check src/` passes (or formats correctly)
- [ ] `mypy src/` runs without configuration errors
- [ ] `pytest --collect-only` discovers test directory

---

## Definition of Done

- [ ] All tool configurations added to pyproject.toml
- [ ] `uv sync` or `poetry install` succeeds
- [ ] All linting tools run without configuration errors
- [ ] Parent todo TODO-BE-001 updated with completion status
