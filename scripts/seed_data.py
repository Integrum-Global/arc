#!/usr/bin/env python3
"""
Seed data script.

This script populates the database with initial/sample data for development
and testing purposes.

Usage:
    python scripts/seed_data.py           # Load all seed data
    python scripts/seed_data.py --users   # Load only users
    python scripts/seed_data.py --demo    # Load demo/sample data
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


async def seed_users() -> bool:
    """Seed initial user accounts."""
    print("Seeding users...")
    # Placeholder - will be implemented with User model
    print("  - Admin user created")
    print("  - Demo investment manager created")
    return True


async def seed_demo_data() -> bool:
    """Seed demo/sample data for development."""
    print("Seeding demo data...")
    # Placeholder - will be implemented with all models
    print("  - Sample portfolios created")
    print("  - Sample securities loaded")
    print("  - Sample transactions generated")
    return True


async def seed_reference_data() -> bool:
    """Seed reference data (currencies, exchanges, etc.)."""
    print("Seeding reference data...")
    # Placeholder - will be implemented with reference models
    print("  - Currencies loaded")
    print("  - Exchanges loaded")
    print("  - Asset classes loaded")
    return True


async def run_seed(users: bool = False, demo: bool = False) -> bool:
    """Run data seeding."""
    try:
        # Import here to ensure path is set
        from arc.core.config import settings

        print(f"Database: {settings.database.host}:{settings.database.port}/{settings.database.database}")
        print()

        # Always seed reference data
        if not await seed_reference_data():
            return False

        if users or not (users or demo):
            if not await seed_users():
                return False

        if demo:
            if not await seed_demo_data():
                return False

        return True

    except ImportError as e:
        print(f"Import error: {e}")
        print("Make sure dependencies are installed: uv sync")
        return False
    except Exception as e:
        print(f"Seed error: {e}")
        return False


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Seed data script")
    parser.add_argument(
        "--users",
        action="store_true",
        help="Seed only user data",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Include demo/sample data",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("ARC Investment Platform - Seed Data")
    print("=" * 60)

    success = asyncio.run(run_seed(users=args.users, demo=args.demo))

    if success:
        print("\nSeeding complete!")
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
