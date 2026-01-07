# TODO-MOB-003: Common Widgets

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-MOB-002

---

## Objective

Implement common reusable widgets for layout, navigation, and feedback used across the application.

---

## Tasks

### 1. Main Shell Widget
- [ ] Create `lib/shared/widgets/main_shell.dart`:
  ```dart
  class MainShell extends StatelessWidget {
    final Widget child;

    const MainShell({super.key, required this.child});

    @override
    Widget build(BuildContext context) {
      return Scaffold(
        body: child,
        bottomNavigationBar: const ArcBottomNavigation(),
      );
    }
  }
  ```

### 2. Bottom Navigation
- [ ] Create `lib/shared/widgets/arc_bottom_navigation.dart`:
  - Dashboard tab
  - Portfolio tab
  - Analytics tab
  - Intelligence tab
  - Settings tab
  - Active state highlighting
  - Go Router integration

### 3. Section Header
- [ ] Create `lib/shared/widgets/section_header.dart`:
  - Title text
  - Optional count badge
  - Optional "View All" action
  - Consistent styling

### 4. Empty State
- [ ] Create `lib/shared/widgets/empty_state.dart`:
  - Icon
  - Title
  - Description message
  - Optional action button
  - Centered layout

### 5. Error View
- [ ] Create `lib/shared/widgets/error_view.dart`:
  - Error icon based on type
  - Error title
  - Error message
  - Retry button
  - Support for ApiException types

### 6. Loading Skeleton
- [ ] Create `lib/shared/widgets/loading_skeleton.dart`:
  - Shimmer effect
  - Variants: text, circle, card
  - Configurable dimensions
  - Dark mode support

### 7. Skeleton Layouts
- [ ] Create skeleton layouts for:
  - PortfolioListSkeleton
  - DashboardSkeleton
  - HoldingsListSkeleton
  - AlertListSkeleton

### 8. Refresh Wrapper
- [ ] Create `lib/shared/widgets/refresh_wrapper.dart`:
  - Pull-to-refresh
  - Loading indicator
  - Error handling
  - Empty state handling

### 9. Modal Bottom Sheet
- [ ] Create `lib/shared/widgets/modal_sheet.dart`:
  - Drag handle
  - Title bar
  - Content area
  - Action buttons
  - Swipe to dismiss

### 10. Confirmation Dialog
- [ ] Create `lib/shared/widgets/confirmation_dialog.dart`:
  - Title and message
  - Confirm and cancel buttons
  - Destructive variant
  - Loading state

---

## Acceptance Criteria

- [ ] MainShell with bottom navigation works
- [ ] Navigation highlights active tab
- [ ] SectionHeader renders with all options
- [ ] EmptyState displays correctly
- [ ] ErrorView shows appropriate icons
- [ ] Skeleton loading animates smoothly
- [ ] Pull-to-refresh triggers callback
- [ ] Modal sheet slides up/down
- [ ] Confirmation dialog handles actions

---

## Widget Specifications

### Bottom Navigation Destinations

```dart
const destinations = [
  NavigationDestination(
    icon: Icon(Icons.dashboard_outlined),
    selectedIcon: Icon(Icons.dashboard),
    label: 'Dashboard',
  ),
  NavigationDestination(
    icon: Icon(Icons.account_balance_wallet_outlined),
    selectedIcon: Icon(Icons.account_balance_wallet),
    label: 'Portfolio',
  ),
  NavigationDestination(
    icon: Icon(Icons.analytics_outlined),
    selectedIcon: Icon(Icons.analytics),
    label: 'Analytics',
  ),
  NavigationDestination(
    icon: Icon(Icons.psychology_outlined),
    selectedIcon: Icon(Icons.psychology),
    label: 'Intel',
  ),
  NavigationDestination(
    icon: Icon(Icons.settings_outlined),
    selectedIcon: Icon(Icons.settings),
    label: 'Settings',
  ),
];
```

### Error Types Mapping

| Error Code | Icon | Title |
|------------|------|-------|
| CONNECTION_ERROR | wifi_off | No Connection |
| TIMEOUT | wifi_off | No Connection |
| UNAUTHORIZED | lock_outline | Session Expired |
| FORBIDDEN | block | Access Denied |
| NOT_FOUND | search_off | Not Found |
| SERVER_ERROR | cloud_off | Server Error |
| Default | error_outline | Error |

---

## Technical Notes

- Use const constructors where possible
- All widgets support dark mode
- Accessible labels for screen readers
- Animation duration: 300ms default
- Skeleton shimmer: baseColor/highlightColor from theme
