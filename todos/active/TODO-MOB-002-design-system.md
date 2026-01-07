# TODO-MOB-002: Mobile Design System

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-MOB-001

---

## Objective

Implement the Flutter design system with design tokens, theme configuration, and base components following the unified ARC design language.

---

## Tasks

### 1. Design Tokens - Colors
- [ ] Create `lib/core/design/colors.dart`:
  - Primary: Professional Blue (#1976D2)
  - Secondary: Teal (#26A69A)
  - Semantic: Success, Warning, Error, Info
  - Neutrals: Background, Surface, Border, Divider
  - Text: Primary, Secondary, Hint
- [ ] Create `AppColorsDark` for dark theme colors

### 2. Design Tokens - Typography
- [ ] Create `lib/core/design/typography.dart`:
  - Headings: h1-h6 with Inter font
  - Body: bodyLarge, bodyMedium, bodySmall
  - Labels: labelLarge, labelMedium, labelSmall
  - Caption and Overline
  - Monospace for numbers (Roboto Mono)
- [ ] Configure Google Fonts

### 3. Design Tokens - Spacing
- [ ] Create `lib/core/design/spacing.dart`:
  - Raw values: xs(4), sm(8), md(16), lg(24), xl(32), xxl(48)
  - EdgeInsets: allXs, allSm, allMd, allLg, allXl
  - Horizontal/Vertical EdgeInsets
  - SizedBox gaps: gapXs, gapSm, gapMd, gapLg
  - BorderRadius: borderRadiusSm, borderRadiusMd, borderRadiusLg, borderRadiusFull

### 4. Design Tokens - Shadows
- [ ] Create `lib/core/design/shadows.dart`:
  - Card shadow (subtle)
  - Raised shadow
  - Elevated shadow
  - Modal shadow
  - Focus ring shadow

### 5. Theme Configuration
- [ ] Create `lib/core/config/theme_config.dart`:
  ```dart
  class ThemeConfig {
    static ThemeData get lightTheme => ThemeData(
      colorScheme: ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        // ... rest of colors
      ),
      textTheme: _buildTextTheme(),
      // ... component themes
    );

    static ThemeData get darkTheme => ThemeData.dark().copyWith(
      // Dark theme configuration
    );
  }
  ```

### 6. Unified Export
- [ ] Create `lib/core/design/design_system.dart`:
  ```dart
  library design_system;

  export 'colors.dart';
  export 'typography.dart';
  export 'spacing.dart';
  export 'shadows.dart';
  export 'components/app_button.dart';
  export 'components/app_card.dart';
  export 'components/app_input.dart';
  // ... more exports
  ```

### 7. Base Button Component
- [ ] Create `lib/core/design/components/app_button.dart`:
  - Variants: primary, secondary, outline, ghost, destructive
  - Sizes: small, medium, large
  - States: loading, disabled
  - Optional icon support
  - Full width option

### 8. Base Card Component
- [ ] Create `lib/core/design/components/app_card.dart`:
  - Optional header and footer
  - Custom padding
  - Tap handler
  - Elevated variant
  - Custom background color

### 9. Base Input Component
- [ ] Create `lib/core/design/components/app_input.dart`:
  - Label and hint text
  - Error and helper text
  - Prefix/suffix icons
  - Variants: search, email, password, phone
  - Validation support

### 10. Badge and Chip Components
- [ ] Create `lib/core/design/components/app_badge.dart`:
  - Variants: default, success, warning, error, info
  - Sizes: small, medium
- [ ] Create `lib/core/design/components/app_chip.dart`:
  - Selectable chip
  - Filter chip with remove action

---

## Acceptance Criteria

- [ ] All color tokens defined for light/dark
- [ ] Typography scale complete
- [ ] Spacing tokens used consistently
- [ ] Shadow definitions complete
- [ ] AppButton works with all variants
- [ ] AppCard renders correctly
- [ ] AppInput validates correctly
- [ ] Dark mode toggles properly
- [ ] Components accessible (VoiceOver/TalkBack)

---

## Color Reference

```dart
// Light Theme
primary: #1976D2
primaryLight: #63A4FF
primaryDark: #004BA0
secondary: #26A69A
success: #4CAF50
warning: #FF9800
error: #F44336
info: #2196F3
background: #F5F5F5
surface: #FFFFFF
textPrimary: #212121
textSecondary: #757575

// Dark Theme
primary: #90CAF9
background: #121212
surface: #1E1E1E
textPrimary: #FFFFFF
textSecondary: #B0B0B0
```

---

## Technical Notes

- Use const constructors for all components
- Support both light and dark themes
- Follow Material 3 design principles
- Ensure accessibility (contrast ratios)
- Test on multiple screen sizes
