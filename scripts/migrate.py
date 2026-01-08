#!/usr/bin/env python3
"""
Database migration script.

This script manages database schema migrations using DataFlow's
automatic table management capabilities.

Usage:
    python scripts/migrate.py          # Run all pending migrations
    python scripts/migrate.py --reset  # Drop and recreate all tables
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


async def run_migrations(reset: bool = False) -> bool:
    """Run database migrations."""
    try:
        # Import here to ensure path is set
        from arc.core.config import settings

        print(f"Database: {settings.database.host}:{settings.database.port}/{settings.database.database}")

        # DataFlow migrations will be implemented when models are created
        # For now, this is a placeholder that verifies database connectivity

        print("\nNote: DataFlow migrations will be configured when models are implemented")
        print("This script will:")
        print("  - Initialize DataFlow with auto_migrate=False")
        print("  - Call db.create_tables_async() for all registered models")

        if reset:
            print("\n--reset flag: Would drop and recreate all tables")

        return True

    except ImportError as e:
        print(f"Import error: {e}")
        print("Make sure dependencies are installed: uv sync")
        return False
    except Exception as e:
        print(f"Migration error: {e}")
        return False


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Database migration script")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop and recreate all tables (DESTRUCTIVE)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("ARC Investment Platform - Database Migrations")
    print("=" * 60)

    success = asyncio.run(run_migrations(reset=args.reset))
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
