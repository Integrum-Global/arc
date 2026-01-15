"""
Integration tests for SSO DataFlow models CRUD operations using db.express.

Tests use real PostgreSQL database with DataFlow - NO MOCKING per gold standards.
Tests must be run with Docker containers running.

CRITICAL: Follow gold standards:
- Use real database infrastructure
- NO MOCKING in Tier 2-3 tests
- Use db.express for CRUD (23x faster than workflows, avoids event loop issues)
"""

import uuid
from datetime import UTC, datetime

import pytest


@pytest.mark.asyncio
class TestSSOProviderCRUD:
    """Integration tests for SSOProvider CRUD operations."""

    async def test_create_sso_provider(self, dataflow):
        """Test creating an SSOProvider record."""
        # Arrange
        tenant_id = f"tenant-{uuid.uuid4()}"
        provider_id = f"sso-{uuid.uuid4()}"

        # Act
        provider = await dataflow.express.create("SSOProvider", {
            "id": provider_id,
            "tenant_id": tenant_id,
            "provider_type": "azure",
            "display_name": "Company Azure AD",
            "client_id": "azure-client-id-123",
            "client_secret_encrypted": "encrypted-secret-abc",
            "azure_tenant_id": "common",
            "is_enabled": True,
            "auto_provision": True,
            "default_role": "viewer",
        })

        # Assert
        assert provider["id"] == provider_id
        assert provider["tenant_id"] == tenant_id
        assert provider["provider_type"] == "azure"
        assert provider["display_name"] == "Company Azure AD"
        assert provider["is_enabled"] is True
        assert provider["auto_provision"] is True
        assert provider["default_role"] == "viewer"

    async def test_read_sso_provider(self, dataflow):
        """Test reading an SSOProvider record."""
        # Arrange: Create a provider first
        tenant_id = f"tenant-{uuid.uuid4()}"
        provider_id = f"sso-{uuid.uuid4()}"

        await dataflow.express.create("SSOProvider", {
            "id": provider_id,
            "tenant_id": tenant_id,
            "provider_type": "google",
            "display_name": "Google Workspace",
            "client_id": "google-client-123",
            "client_secret_encrypted": "encrypted-google-secret",
            "google_domain": "company.com",
        })

        # Act: Read the provider
        provider = await dataflow.express.read("SSOProvider", provider_id)

        # Assert
        assert provider["id"] == provider_id
        assert provider["provider_type"] == "google"
        assert provider["google_domain"] == "company.com"

    async def test_update_sso_provider(self, dataflow):
        """Test updating an SSOProvider record."""
        # Arrange: Create a provider
        tenant_id = f"tenant-{uuid.uuid4()}"
        provider_id = f"sso-{uuid.uuid4()}"

        await dataflow.express.create("SSOProvider", {
            "id": provider_id,
            "tenant_id": tenant_id,
            "provider_type": "github",
            "display_name": "GitHub OAuth",
            "client_id": "github-client-123",
            "client_secret_encrypted": "encrypted-github-secret",
            "is_enabled": True,
        })

        # Act: Update the provider
        provider = await dataflow.express.update("SSOProvider", provider_id, {
            "is_enabled": False,
            "display_name": "GitHub OAuth (Disabled)",
        })

        # Assert
        assert provider["is_enabled"] is False
        assert provider["display_name"] == "GitHub OAuth (Disabled)"

    async def test_list_sso_providers_by_tenant(self, dataflow):
        """Test querying SSOProviders by tenant_id."""
        # Arrange: Create multiple providers for same tenant
        tenant_id = f"tenant-{uuid.uuid4()}"

        await dataflow.express.create("SSOProvider", {
            "id": f"sso-{uuid.uuid4()}",
            "tenant_id": tenant_id,
            "provider_type": "azure",
            "display_name": "Azure AD",
            "client_id": "azure-123",
            "client_secret_encrypted": "encrypted-azure",
        })

        await dataflow.express.create("SSOProvider", {
            "id": f"sso-{uuid.uuid4()}",
            "tenant_id": tenant_id,
            "provider_type": "google",
            "display_name": "Google",
            "client_id": "google-123",
            "client_secret_encrypted": "encrypted-google",
        })

        # Act: List providers for this tenant
        providers = await dataflow.express.list("SSOProvider", filter={"tenant_id": tenant_id})

        # Assert
        assert len(providers) == 2
        assert all(p["tenant_id"] == tenant_id for p in providers)
        provider_types = {p["provider_type"] for p in providers}
        assert provider_types == {"azure", "google"}

    async def test_unique_constraint_tenant_provider(self, dataflow):
        """Test unique constraint on (tenant_id, provider_type)."""
        # Arrange
        tenant_id = f"tenant-{uuid.uuid4()}"

        # Create first provider
        await dataflow.express.create("SSOProvider", {
            "id": f"sso-{uuid.uuid4()}",
            "tenant_id": tenant_id,
            "provider_type": "azure",
            "display_name": "Azure AD 1",
            "client_id": "azure-123",
            "client_secret_encrypted": "encrypted-1",
        })

        # Act: Try to create duplicate (same tenant + provider)
        with pytest.raises(Exception) as exc_info:
            await dataflow.express.create("SSOProvider", {
                "id": f"sso-{uuid.uuid4()}",
                "tenant_id": tenant_id,
                "provider_type": "azure",  # Same provider type
                "display_name": "Azure AD 2",
                "client_id": "azure-456",
                "client_secret_encrypted": "encrypted-2",
            })

        # Assert: Should raise constraint violation
        error_msg = str(exc_info.value).lower()
        assert "unique" in error_msg or "constraint" in error_msg or "duplicate" in error_msg


@pytest.mark.asyncio
class TestLinkedAccountCRUD:
    """Integration tests for LinkedAccount CRUD operations."""

    async def test_create_linked_account(self, dataflow):
        """Test creating a LinkedAccount record."""
        # Arrange
        user_id = f"user-{uuid.uuid4()}"
        link_id = f"link-{uuid.uuid4()}"
        linked_at = datetime.now(UTC).isoformat()

        # Act
        link = await dataflow.express.create("LinkedAccount", {
            "id": link_id,
            "user_id": user_id,
            "provider_type": "azure",
            "provider_user_id": "azure-user-sub-123",
            "provider_email": "john@company.com",
            "provider_name": "John Doe",
            "linked_at": linked_at,
        })

        # Assert
        assert link["id"] == link_id
        assert link["user_id"] == user_id
        assert link["provider_type"] == "azure"
        assert link["provider_user_id"] == "azure-user-sub-123"
        assert link["provider_email"] == "john@company.com"
        assert link["provider_name"] == "John Doe"
        assert link["linked_at"] == linked_at

    async def test_update_last_login(self, dataflow):
        """Test updating last_login_at timestamp."""
        # Arrange: Create linked account
        user_id = f"user-{uuid.uuid4()}"
        link_id = f"link-{uuid.uuid4()}"
        linked_at = datetime.now(UTC).isoformat()

        await dataflow.express.create("LinkedAccount", {
            "id": link_id,
            "user_id": user_id,
            "provider_type": "google",
            "provider_user_id": "google-user-123",
            "provider_email": "jane@company.com",
            "linked_at": linked_at,
        })

        # Act: Update last_login_at
        last_login = datetime.now(UTC).isoformat()
        link = await dataflow.express.update("LinkedAccount", link_id, {
            "last_login_at": last_login
        })

        # Assert
        assert link["last_login_at"] == last_login

    async def test_list_linked_accounts_by_user(self, dataflow):
        """Test querying linked accounts by user_id."""
        # Arrange: Create multiple links for same user
        user_id = f"user-{uuid.uuid4()}"
        linked_at = datetime.now(UTC).isoformat()

        await dataflow.express.create("LinkedAccount", {
            "id": f"link-{uuid.uuid4()}",
            "user_id": user_id,
            "provider_type": "azure",
            "provider_user_id": "azure-123",
            "provider_email": "user@company.com",
            "linked_at": linked_at,
        })

        await dataflow.express.create("LinkedAccount", {
            "id": f"link-{uuid.uuid4()}",
            "user_id": user_id,
            "provider_type": "google",
            "provider_user_id": "google-123",
            "provider_email": "user@gmail.com",
            "linked_at": linked_at,
        })

        # Act: List links for this user
        links = await dataflow.express.list("LinkedAccount", filter={"user_id": user_id})

        # Assert
        assert len(links) == 2
        assert all(link["user_id"] == user_id for link in links)
        provider_types = {link["provider_type"] for link in links}
        assert provider_types == {"azure", "google"}

    async def test_unique_constraint_user_provider(self, dataflow):
        """Test unique constraint on (user_id, provider_type)."""
        # Arrange
        user_id = f"user-{uuid.uuid4()}"
        linked_at = datetime.now(UTC).isoformat()

        # Create first link
        await dataflow.express.create("LinkedAccount", {
            "id": f"link-{uuid.uuid4()}",
            "user_id": user_id,
            "provider_type": "azure",
            "provider_user_id": "azure-123",
            "provider_email": "user@company.com",
            "linked_at": linked_at,
        })

        # Act: Try to create duplicate (same user + provider)
        with pytest.raises(Exception) as exc_info:
            await dataflow.express.create("LinkedAccount", {
                "id": f"link-{uuid.uuid4()}",
                "user_id": user_id,
                "provider_type": "azure",  # Same provider
                "provider_user_id": "azure-456",  # Different OAuth ID
                "provider_email": "user@company.com",
                "linked_at": linked_at,
            })

        # Assert: Should raise constraint violation
        error_msg = str(exc_info.value).lower()
        assert "unique" in error_msg or "constraint" in error_msg or "duplicate" in error_msg

    async def test_unique_constraint_provider_user_id(self, dataflow):
        """Test global unique constraint on (provider_type, provider_user_id)."""
        # Arrange
        user1_id = f"user-{uuid.uuid4()}"
        user2_id = f"user-{uuid.uuid4()}"
        linked_at = datetime.now(UTC).isoformat()

        # Create first link
        await dataflow.express.create("LinkedAccount", {
            "id": f"link-{uuid.uuid4()}",
            "user_id": user1_id,
            "provider_type": "google",
            "provider_user_id": "google-unique-id-123",
            "provider_email": "user1@gmail.com",
            "linked_at": linked_at,
        })

        # Act: Try to create link with same provider_user_id for different user
        with pytest.raises(Exception) as exc_info:
            await dataflow.express.create("LinkedAccount", {
                "id": f"link-{uuid.uuid4()}",
                "user_id": user2_id,  # Different user
                "provider_type": "google",
                "provider_user_id": "google-unique-id-123",  # Same OAuth ID
                "provider_email": "user2@gmail.com",
                "linked_at": linked_at,
            })

        # Assert: Should raise constraint violation
        error_msg = str(exc_info.value).lower()
        assert "unique" in error_msg or "constraint" in error_msg or "duplicate" in error_msg


@pytest.mark.asyncio
class TestSSOQueryPatterns:
    """Test common SSO query patterns."""

    async def test_find_provider_by_tenant_and_type(self, dataflow):
        """Test finding specific provider configuration."""
        # Arrange
        tenant_id = f"tenant-{uuid.uuid4()}"

        await dataflow.express.create("SSOProvider", {
            "id": f"sso-{uuid.uuid4()}",
            "tenant_id": tenant_id,
            "provider_type": "azure",
            "display_name": "Azure AD",
            "client_id": "azure-123",
            "client_secret_encrypted": "encrypted",
        })

        # Act: Query by tenant + provider type
        providers = await dataflow.express.list("SSOProvider", filter={
            "tenant_id": tenant_id,
            "provider_type": "azure"
        })

        # Assert
        assert len(providers) == 1
        assert providers[0]["provider_type"] == "azure"

    async def test_find_linked_account_by_provider_user_id(self, dataflow):
        """Test finding linked account by OAuth user ID."""
        # Arrange
        user_id = f"user-{uuid.uuid4()}"
        provider_user_id = f"oauth-user-{uuid.uuid4()}"
        linked_at = datetime.now(UTC).isoformat()

        await dataflow.express.create("LinkedAccount", {
            "id": f"link-{uuid.uuid4()}",
            "user_id": user_id,
            "provider_type": "github",
            "provider_user_id": provider_user_id,
            "provider_email": "dev@github.com",
            "linked_at": linked_at,
        })

        # Act: Query by provider + OAuth user ID
        links = await dataflow.express.list("LinkedAccount", filter={
            "provider_type": "github",
            "provider_user_id": provider_user_id,
        })

        # Assert
        assert len(links) == 1
        assert links[0]["provider_user_id"] == provider_user_id
        assert links[0]["user_id"] == user_id
