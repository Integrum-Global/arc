#!/usr/bin/env python3
"""
Development environment setup script.

This script sets up the development environment including:
- Verifying dependencies
- Creating .env from template
- Initializing the database
- Running initial migrations
"""

import shutil
import subprocess
import sys
from pathlib import Path


def check_python_version() -> bool:
    """Verify Python version is 3.12+."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 12):
        print(f"Error: Python 3.12+ required, found {version.major}.{version.minor}")
        return False
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    return True


def check_dependencies() -> bool:
    """Verify required tools are installed."""
    tools = ["docker", "uv"]
    missing = []

    for tool in tools:
        if shutil.which(tool) is None:
            missing.append(tool)

    if missing:
        print(f"Error: Missing required tools: {', '.join(missing)}")
        return False

    print("All required tools found")
    return True


def create_env_file() -> bool:
    """Create .env from .env.example if not exists."""
    project_root = Path(__file__).parent.parent
    env_file = project_root / ".env"
    env_example = project_root / ".env.example"

    if env_file.exists():
        print(".env file already exists")
        return True

    if not env_example.exists():
        print("Error: .env.example not found")
        return False

    shutil.copy(env_example, env_file)
    print("Created .env from .env.example")
    print("Please edit .env with your credentials")
    return True


def install_dependencies() -> bool:
    """Install Python dependencies using uv."""
    print("Installing dependencies...")
    result = subprocess.run(
        ["uv", "sync"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"Error installing dependencies: {result.stderr}")
        return False
    print("Dependencies installed successfully")
    return True


def start_docker_services() -> bool:
    """Start Docker services (PostgreSQL, Redis)."""
    project_root = Path(__file__).parent.parent
    compose_file = project_root / "docker-compose.yml"

    if not compose_file.exists():
        print("Note: docker-compose.yml not found, skipping service startup")
        return True

    print("Starting Docker services...")
    result = subprocess.run(
        ["docker", "compose", "up", "-d"],
        capture_output=True,
        text=True,
        cwd=project_root,
    )
    if result.returncode != 0:
        print(f"Error starting services: {result.stderr}")
        return False
    print("Docker services started")
    return True


def main() -> int:
    """Run development setup."""
    print("=" * 60)
    print("ARC Investment Platform - Development Setup")
    print("=" * 60)
    print()

    steps = [
        ("Checking Python version", check_python_version),
        ("Checking dependencies", check_dependencies),
        ("Creating .env file", create_env_file),
        ("Installing Python packages", install_dependencies),
        ("Starting Docker services", start_docker_services),
    ]

    for step_name, step_func in steps:
        print(f"\n{step_name}...")
        if not step_func():
            print(f"\nSetup failed at: {step_name}")
            return 1

    print("\n" + "=" * 60)
    print("Development setup complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Edit .env with your credentials")
    print("2. Run database migrations: python scripts/migrate.py")
    print("3. Load seed data: python scripts/seed_data.py")
    print("4. Start the API: uvicorn arc.api.app:app --reload")
    return 0


if __name__ == "__main__":
    sys.exit(main())
