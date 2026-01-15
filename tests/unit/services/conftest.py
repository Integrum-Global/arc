"""
Pytest configuration for unit service tests.

Uses in-memory SQLite for fast unit tests with NO MOCKING of DataFlow.
Follows gold standards: real infrastructure, NO MOCKING in Tier 2-3.
"""

import pytest
from dataflow import DataFlow


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    """
    Set up and tear down in-memory SQLite database for each test.

    Creates all tables before each test and cleans up after.
    Uses real DataFlow (NO MOCKING) per gold standards.
    """
    # Create in-memory SQLite database
    test_db = DataFlow(
        database_url="sqlite:///:memory:",
        auto_migrate=True,  # OK for tests
    )

    # Import models to register them with DataFlow
    import arc.models.core  # noqa: F401
    import arc.models.sso  # noqa: F401
    import arc.models.portfolio  # noqa: F401
    import arc.models.security  # noqa: F401
    import arc.models.analytics  # noqa: F401

    # Monkey-patch arc.models.database.db with our test db
    import arc.models.database
    import arc.models.core
    import arc.models.sso

    original_db = arc.models.database.db
    arc.models.database.db = test_db
    arc.models.core.db = test_db
    arc.models.sso.db = test_db

    # Create all tables
    test_db.create_tables()

    yield test_db

    # Cleanup: Close connections
    try:
        test_db.close()
    except Exception:
        pass

    # Restore original db
    arc.models.database.db = original_db
    arc.models.core.db = original_db
    arc.models.sso.db = original_db
