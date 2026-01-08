# Design System

## Overview

The ARC Mobile design system provides consistent styling across the app. Import everything from a single file:

```dart
import 'package:arc_mobile/core/design/design_system.dart';
```

## Colors

### Light Theme (`AppColors`)

```dart
// Primary
AppColors.primary        // #1976D2 - Professional Blue
AppColors.primaryLight   // #63A4FF
AppColors.primaryDark    // #004BA0

// Secondary
AppColors.secondary      // #26A69A - Teal

// Semantic
AppColors.success        // #4CAF50 - Green
AppColors.warning        // #FF9800 - Orange
AppColors.error          // #F44336 - Red
AppColors.info           // #2196F3 - Blue

// Neutrals
AppColors.background     // #F5F5F5
AppColors.surface        // #FFFFFF
AppColors.border         // #E0E0E0
AppColors.divider        // #EEEEEE

// Text
AppColors.textPrimary    // #212121
AppColors.textSecondary  // #757575
AppColors.textHint       // #BDBDBD
```

### Dark Theme (`AppColorsDark`)

Same properties with dark-mode appropriate values.

## Typography

```dart
// Headings
AppTypography.h1    // 32px, bold
AppTypography.h2    // 28px, semibold
AppTypography.h3    // 24px, semibold
AppTypography.h4    // 20px, semibold
AppTypography.h5    // 18px, semibold
AppTypography.h6    // 16px, semibold

// Body
AppTypography.bodyLarge   // 16px
AppTypography.bodyMedium  // 14px
AppTypography.bodySmall   // 12px

// Labels
AppTypography.labelLarge  // 14px, 500 weight
AppTypography.labelMedium // 12px, 500 weight
AppTypography.labelSmall  // 11px, 500 weight

// Utility
AppTypography.caption     // 12px
AppTypography.overline    // 10px, uppercase
AppTypography.mono        // Monospace for numbers
```

## Spacing

```dart
// Values
AppSpacing.xs    // 4
AppSpacing.sm    // 8
AppSpacing.md    // 16
AppSpacing.lg    // 24
AppSpacing.xl    // 32
AppSpacing.xxl   // 48

// EdgeInsets
AppSpacing.allMd         // EdgeInsets.all(16)
AppSpacing.horizontalMd  // EdgeInsets.symmetric(horizontal: 16)
AppSpacing.verticalMd    // EdgeInsets.symmetric(vertical: 16)

// SizedBox gaps
AppSpacing.gapSm  // SizedBox(height: 8, width: 8)
AppSpacing.gapMd  // SizedBox(height: 16, width: 16)

// Border Radius
AppSpacing.borderRadiusSm   // BorderRadius.circular(8)
AppSpacing.borderRadiusMd   // BorderRadius.circular(12)
AppSpacing.borderRadiusFull // BorderRadius.circular(9999)
```

## Core Components

### AppButton

```dart
// Primary button
AppButton.primary(
  label: 'Submit',
  onPressed: () {},
  icon: Icons.send,
  isLoading: false,
  isFullWidth: true,
)

// Other variants
AppButton.secondary(label: 'Cancel', onPressed: () {})
AppButton.outline(label: 'Details', onPressed: () {})
AppButton.ghost(label: 'Skip', onPressed: () {})
AppButton.destructive(label: 'Delete', onPressed: () {})
```

### AppCard

```dart
AppCard(
  child: Text('Content'),
  header: Text('Title'),
  footer: Text('Footer'),
  elevated: true,
  onTap: () {},
)
```

### AppInput

```dart
// Standard input
AppInput(
  label: 'Name',
  hint: 'Enter your name',
  controller: controller,
  isRequired: true,
)

// Specialized inputs
AppInput.search(hint: 'Search...', onChanged: (v) {})
AppInput.email(label: 'Email', isRequired: true)
AppInput.password(label: 'Password', isRequired: true)
AppInput.phone(label: 'Phone')
```

## Usage Example

```dart
import 'package:arc_mobile/core/design/design_system.dart';

class LoginScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: AppSpacing.allLg,
      child: Column(
        children: [
          Text('Login', style: AppTypography.h4),
          AppSpacing.gapLg,
          AppInput.email(label: 'Email', isRequired: true),
          AppSpacing.gapMd,
          AppInput.password(label: 'Password', isRequired: true),
          AppSpacing.gapXl,
          AppButton.primary(
            label: 'Sign In',
            isFullWidth: true,
            onPressed: handleLogin,
          ),
        ],
      ),
    );
  }
}
```
