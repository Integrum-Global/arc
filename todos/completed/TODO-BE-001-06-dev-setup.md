# TODO-BE-001-06: Development Setup Scripts

**Parent**: TODO-BE-001 (Backend Project Initialization)
**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 30m
**Dependencies**: TODO-BE-001-01 (Project Structure), TODO-BE-001-03 (Config Module)

---

## Objective

Create development setup scripts and placeholder files for database migrations and seed data.

---

## Description

Set up the `scripts/` directory with:
- Database migration placeholder (to be expanded in TODO-BE-002)
- Seed data script placeholder for development data
- Development environment setup verification script

---

## Acceptance Criteria

- [ ] `scripts/` directory created
- [ ] `scripts/migrate.py` placeholder exists
- [ ] `scripts/seed_data.py` placeholder exists
- [ ] `scripts/dev_setup.py` environment verification script exists
- [ ] Scripts are executable and provide helpful output
- [ ] README in scripts directory explains usage

---

## Subtasks

- [ ] Create `scripts/` directory (Est: 2m)
  - Verification: Directory exists

- [ ] Create `scripts/migrate.py` placeholder (Est: 10m)
  - Import DataFlow when available
  - Placeholder for auto_migrate functionality
  - CLI interface with click
  - Verification: `python scripts/migrate.py --help` works

- [ ] Create `scripts/seed_data.py` placeholder (Est: 10m)
  - Placeholder for seeding development data
  - Will be expanded in later TODOs
  - CLI interface with click
  - Verification: `python scripts/seed_data.py --help` works

- [ ] Create `scripts/dev_setup.py` verification script (Est: 15m)
  - Check Python version
  - Check required dependencies installed
  - Check .env file exists
  - Check database connection (when available)
  - Verification: Script runs and reports status

- [ ] Create `scripts/README.md` (Est: 5m)
  - Document each script's purpose
  - Document usage examples
  - Verification: Documentation complete

---

## Script Structure

```python
# scripts/migrate.py
"""
Database migration script for ARC platform.

Usage:
    python scripts/migrate.py --create    Create all tables
    python scripts/migrate.py --drop      Drop all tables
    python scripts/migrate.py --reset     Drop and recreate tables
"""
import asyncio

import click


@click.command()
@click.option("--create", is_flag=True, help="Create all tables")
@click.option("--drop", is_flag=True, help="Drop all tables")
@click.option("--reset", is_flag=True, help="Drop and recreate tables")
def migrate(create: bool, drop: bool, reset: bool) -> None:
    """Run database migrations."""
    click.echo("Migration script placeholder")
    click.echo("This will be implemented after DataFlow models are created.")

    if create:
        click.echo("Would create tables...")
    if drop:
        click.echo("Would drop tables...")
    if reset:
        click.echo("Would reset tables...")


if __name__ == "__main__":
    migrate()
```

```python
# scripts/seed_data.py
"""
Seed data script for ARC platform development.

Usage:
    python scripts/seed_data.py --all     Seed all data
    python scripts/seed_data.py --users   Seed user data only
    python scripts/seed_data.py --demo    Seed demo portfolio data
"""
import asyncio

import click


@click.command()
@click.option("--all", "seed_all", is_flag=True, help="Seed all development data")
@click.option("--users", is_flag=True, help="Seed user data only")
@click.option("--demo", is_flag=True, help="Seed demo portfolio data")
def seed(seed_all: bool, users: bool, demo: bool) -> None:
    """Seed development data."""
    click.echo("Seed data script placeholder")
    click.echo("This will be implemented after DataFlow models are created.")

    if seed_all:
        click.echo("Would seed all data...")
    if users:
        click.echo("Would seed user data...")
    if demo:
        click.echo("Would seed demo data...")


if __name__ == "__main__":
    seed()
```

```python
# scripts/dev_setup.py
"""
Development environment verification script.

Usage:
    python scripts/dev_setup.py
"""
import subprocess
import sys
from pathlib import Path

import click


def check_python_version() -> bool:
    """Check Python version is 3.12+."""
    version = sys.version_info
    if version >= (3, 12):
        click.echo(f"[OK] Python {version.major}.{version.minor}.{version.micro}")
        return True
    click.echo(f"[FAIL] Python {version.major}.{version.minor} (need 3.12+)")
    return False


def check_env_file() -> bool:
    """Check .env file exists."""
    env_path = Path(".env")
    if env_path.exists():
        click.echo("[OK] .env file exists")
        return True
    env_example = Path(".env.example")
    if env_example.exists():
        click.echo("[WARN] .env missing, copy from .env.example")
    else:
        click.echo("[FAIL] .env file missing")
    return False


def check_dependencies() -> bool:
    """Check required packages are installed."""
    required = ["kailash", "fastapi", "pydantic", "click"]
    all_ok = True
    for pkg in required:
        try:
            __import__(pkg)
            click.echo(f"[OK] {pkg} installed")
        except ImportError:
            click.echo(f"[FAIL] {pkg} not installed")
            all_ok = False
    return all_ok


def check_config() -> bool:
    """Check configuration loads."""
    try:
        from arc.core.config import settings
        click.echo(f"[OK] Config loads (env: {settings.environment})")
        return True
    except ImportError:
        click.echo("[WARN] arc.core.config not yet created")
        return True
    except Exception as e:
        click.echo(f"[FAIL] Config error: {e}")
        return False


@click.command()
def main() -> None:
    """Verify development environment setup."""
    click.echo("=" * 50)
    click.echo("ARC Development Environment Check")
    click.echo("=" * 50)
    click.echo()

    checks = [
        ("Python Version", check_python_version),
        ("Environment File", check_env_file),
        ("Dependencies", check_dependencies),
        ("Configuration", check_config),
    ]

    results = []
    for name, check in checks:
        click.echo(f"\n{name}:")
        click.echo("-" * 30)
        results.append(check())

    click.echo("\n" + "=" * 50)
    if all(results):
        click.echo("All checks passed!")
    else:
        click.echo("Some checks failed. Please fix issues above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## Risk Assessment

- **LOW**: Simple script creation
- **MITIGATION**: Scripts are placeholders, full implementation in later TODOs

---

## Testing Requirements

- [ ] Manual verification: `python scripts/migrate.py --help` works
- [ ] Manual verification: `python scripts/seed_data.py --help` works
- [ ] Manual verification: `python scripts/dev_setup.py` runs

---

## Definition of Done

- [ ] All scripts created and functional
- [ ] Scripts have CLI help output
- [ ] README.md documents usage
- [ ] Parent todo TODO-BE-001 updated with completion status
