"""
Integration tests for ARC platform.

These tests use real infrastructure (PostgreSQL, Redis) via docker-compose.test.yml.
NO MOCKING is used in integration tests per project policy.

Usage:
    1. Start test containers: docker-compose -f docker-compose.test.yml up -d
    2. Run tests: pytest tests/integration/ -v
    3. Stop containers: docker-compose -f docker-compose.test.yml down -v
"""
