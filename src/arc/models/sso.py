"""
SSO (Single Sign-On) models for OAuth provider configurations and linked accounts.

DataFlow automatically generates 11 nodes per model:
- {Model}CreateNode, {Model}ReadNode, {Model}UpdateNode, {Model}DeleteNode
- {Model}ListNode, {Model}CountNode, {Model}UpsertNode
- {Model}BulkCreateNode, {Model}BulkUpdateNode, {Model}BulkDeleteNode, {Model}BulkUpsertNode

CRITICAL RULES:
- NEVER manually set created_at or updated_at - DataFlow manages these
- Primary key MUST be named 'id' - not provider_id, link_id, etc.
- CreateNode uses FLAT fields, UpdateNode uses NESTED filter+fields
"""

from arc.models.database import db


@db.model
class SSOProvider:
    """
    OAuth provider configuration per tenant.

    Stores client credentials and settings for Azure AD, Google, and GitHub
    OAuth integrations. Each tenant can configure multiple providers.

    Unique Constraint: (tenant_id, provider_type) - one config per provider per tenant
    """

    # Primary Key - MUST be named 'id' (DataFlow requirement)
    id: str  # UUID format

    # Foreign Key
    tenant_id: str  # References Tenant.id

    # OAuth Provider Configuration
    provider_type: str  # "azure" | "google" | "github"
    display_name: str  # "Company Azure AD" - shown in UI
    client_id: str  # OAuth client ID from provider
    client_secret_encrypted: str  # Encrypted client secret (use Fernet in production)

    # Provider-Specific Settings (optional)
    azure_tenant_id: str | None = None  # Azure: "common" for multi-tenant or GUID
    google_domain: str | None = None  # Google: domain restriction (e.g., "company.com")

    # Behavioral Settings
    is_enabled: bool = True  # Enable/disable provider for this tenant
    auto_provision: bool = True  # Auto-create users on first SSO login (JIT)
    default_role: str = "viewer"  # Default role for auto-provisioned users

    # NOTE: created_at and updated_at are AUTO-MANAGED by DataFlow
    # NEVER set these manually - causes DF-104 error!

    __dataflow__ = {
        "indexes": [
            {
                "fields": ["tenant_id", "provider_type"],
                "unique": True,
            }  # One config per (tenant, provider)
        ]
    }


@db.model
class LinkedAccount:
    """
    Links ARC user to external OAuth identity.

    Maps internal User records to external OAuth provider user IDs.
    Supports multiple providers per user (e.g., link both Azure and Google).

    Unique Constraints:
    - (user_id, provider_type): One link per user per provider
    - (provider_type, provider_user_id): Global uniqueness across all users
    """

    # Primary Key - MUST be named 'id'
    id: str  # UUID format

    # Foreign Keys
    user_id: str  # References User.id
    provider_type: str  # "azure" | "google" | "github"

    # OAuth Provider Data
    provider_user_id: str  # External user ID from OAuth provider (sub claim)
    provider_email: str  # Email address from provider
    provider_name: str | None = None  # Display name from provider (optional)

    # Metadata
    linked_at: str  # ISO timestamp when account was linked
    last_login_at: str | None = None  # ISO timestamp of last SSO login (optional)

    __dataflow__ = {
        "indexes": [
            {
                "fields": ["user_id", "provider_type"],
                "unique": True,
            },  # One link per user per provider
            {
                "fields": ["provider_type", "provider_user_id"],
                "unique": True,
            },  # Global uniqueness
        ]
    }
