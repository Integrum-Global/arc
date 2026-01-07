# TODO-WEB-011: Settings Pages

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-WEB-003, TODO-WEB-006

---

## Objective

Implement the settings pages for user profile, preferences, notification configuration, and data provider management.

---

## Tasks

### 1. Settings Layout
- [ ] Create `src/pages/settings/index.tsx`:
  ```typescript
  export default function SettingsPage() {
    return (
      <PageContainer title="Settings">
        <div className="flex gap-6">
          <SettingsNav />
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </PageContainer>
    );
  }
  ```
- [ ] Create `src/pages/settings/components/SettingsNav.tsx`:
  - Profile
  - Preferences
  - Notifications
  - Data Providers
  - Security
  - (Admin only) Users
  - (Admin only) Tenant

### 2. Profile Settings
- [ ] Create `src/pages/settings/profile.tsx`:
  - Profile photo upload
  - Name editing
  - Email (read-only)
  - Role display
  - Timezone selection
  - Language selection

### 3. Preferences Settings
- [ ] Create `src/pages/settings/preferences.tsx`:
  - Theme (light/dark/system)
  - Default portfolio selection
  - Dashboard layout options
  - Number format (US/EU)
  - Date format
  - Default currency
  - Brief settings:
    - Enable/disable
    - Delivery time
    - Detail level
    - Focus areas

### 4. Notification Settings
- [ ] Create `src/pages/settings/notifications.tsx`:
  - Channel configuration:
    - Email (enable, address, frequency)
    - Push (enable, device tokens)
    - In-app (enable)
    - Slack (enable, webhook URL)
  - Alert type filtering:
    - Threshold alerts
    - Anomaly alerts
    - News alerts
  - Severity filter
  - Quiet hours

### 5. Data Provider Settings
- [ ] Create `src/pages/settings/providers.tsx`:
  - Provider list:
    - EODHD
    - Capital IQ
    - Pitchbook
  - Per provider:
    - Status indicator
    - API key input (masked)
    - Test connection button
    - Last sync info
    - Sync schedule
    - Enable/disable toggle

### 6. Security Settings
- [ ] Create `src/pages/settings/security.tsx`:
  - Change password
  - Two-factor authentication (placeholder)
  - Active sessions list
  - API keys management (future)

### 7. Admin: User Management
- [ ] Create `src/pages/settings/admin/users.tsx`:
  - User list table
  - Invite user button
  - Edit user role
  - Deactivate user
  - Activity log

### 8. Admin: Tenant Settings
- [ ] Create `src/pages/settings/admin/tenant.tsx`:
  - Organization name
  - Subscription info
  - Usage metrics
  - Feature toggles
  - Billing link

### 9. Settings Form Components
- [ ] Create reusable form sections:
  - SettingsSection (title, description, content)
  - SettingsField (label, input, help)
  - SettingsToggle
  - SettingsSelect

### 10. Save Handling
- [ ] Implement auto-save with debounce
- [ ] Show save indicator
- [ ] Handle validation errors
- [ ] Toast on success/error

---

## Acceptance Criteria

- [ ] Profile settings editable
- [ ] Theme switching works
- [ ] Notification channels configurable
- [ ] Data providers manageable
- [ ] Password change flow
- [ ] Admin pages for authorized users
- [ ] Settings persist correctly
- [ ] Unit test: Form validation
- [ ] Integration test: Settings save

---

## Settings Navigation

```
Settings
├── Profile
│   ├── Avatar
│   ├── Name
│   ├── Timezone
│   └── Language
├── Preferences
│   ├── Theme
│   ├── Defaults
│   ├── Number Format
│   └── Brief Settings
├── Notifications
│   ├── Email
│   ├── Push
│   ├── Slack
│   └── Filters
├── Data Providers
│   ├── EODHD
│   ├── Capital IQ
│   └── Pitchbook
├── Security
│   ├── Password
│   └── Sessions
└── (Admin)
    ├── Users
    └── Tenant
```

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐ ┌────────────────────────────────────────────┐ │
│  │            │ │                                            │ │
│  │ Profile    │ │  Preferences                               │ │
│  │ Preferences│ │  ─────────────────────────────────         │ │
│  │ Notif...   │ │                                            │ │
│  │ Providers  │ │  Theme                                     │ │
│  │ Security   │ │  ○ Light  ● Dark  ○ System                │ │
│  │            │ │                                            │ │
│  │ ───────    │ │  Default Portfolio                         │ │
│  │ Users      │ │  [Growth Portfolio          ▼]            │ │
│  │ Tenant     │ │                                            │ │
│  │            │ │  Number Format                             │ │
│  │            │ │  ○ US (1,234.56)  ● EU (1.234,56)         │ │
│  │            │ │                                            │ │
│  │            │ │  Morning Brief                             │ │
│  │            │ │  ☑ Enable daily brief                     │ │
│  │            │ │  Delivery time: [07:00 ▼]                 │ │
│  │            │ │  Detail level: [Standard ▼]               │ │
│  │            │ │                                            │ │
│  │            │ │                    [Save Changes]          │ │
│  └────────────┘ └────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

- Use Zustand for preferences state
- Sync preferences with backend
- Apply theme changes immediately
- Validate API keys before saving
- Role-based visibility for admin sections
- Encrypt sensitive data in transit
