# ARC Mobile Widget Library

## Overview

This document specifies the reusable widget library for the ARC mobile application. All widgets follow the design system principles and provide consistent UI/UX across the application.

---

## 1. Design System Foundation

### 1.1 Design Tokens

```dart
// lib/core/design/design_system.dart

/// Single export file for all design system components
library design_system;

export 'colors.dart';
export 'typography.dart';
export 'spacing.dart';
export 'shadows.dart';
export 'components/app_button.dart';
export 'components/app_card.dart';
export 'components/app_input.dart';
export 'components/app_avatar.dart';
export 'components/app_badge.dart';
export 'components/app_chip.dart';
// ... more exports
```

### 1.2 Colors

```dart
// lib/core/design/colors.dart

import 'package:flutter/material.dart';

/// Light theme colors
abstract class AppColors {
  // Primary
  static const Color primary = Color(0xFF1976D2);         // Professional Blue
  static const Color primaryLight = Color(0xFF63A4FF);
  static const Color primaryDark = Color(0xFF004BA0);

  // Secondary
  static const Color secondary = Color(0xFF26A69A);       // Teal
  static const Color secondaryLight = Color(0xFF64D8CB);
  static const Color secondaryDark = Color(0xFF00766C);

  // Semantic
  static const Color success = Color(0xFF4CAF50);
  static const Color successLight = Color(0xFFE8F5E9);
  static const Color warning = Color(0xFFFF9800);
  static const Color warningLight = Color(0xFFFFF3E0);
  static const Color error = Color(0xFFF44336);
  static const Color errorLight = Color(0xFFFFEBEE);
  static const Color info = Color(0xFF2196F3);
  static const Color infoLight = Color(0xFFE3F2FD);

  // Neutrals
  static const Color background = Color(0xFFF5F5F5);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFFAFAFA);
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFEEEEEE);

  // Text
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textHint = Color(0xFFBDBDBD);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
}

/// Dark theme colors
abstract class AppColorsDark {
  // Primary
  static const Color primary = Color(0xFF90CAF9);
  static const Color primaryLight = Color(0xFFE3F2FD);
  static const Color primaryDark = Color(0xFF42A5F5);

  // Secondary
  static const Color secondary = Color(0xFF80CBC4);
  static const Color secondaryLight = Color(0xFFE0F2F1);
  static const Color secondaryDark = Color(0xFF4DB6AC);

  // Semantic
  static const Color success = Color(0xFF81C784);
  static const Color successLight = Color(0xFF1B5E20);
  static const Color warning = Color(0xFFFFB74D);
  static const Color warningLight = Color(0xFFE65100);
  static const Color error = Color(0xFFE57373);
  static const Color errorLight = Color(0xFFB71C1C);
  static const Color info = Color(0xFF64B5F6);
  static const Color infoLight = Color(0xFF0D47A1);

  // Neutrals
  static const Color background = Color(0xFF121212);
  static const Color surface = Color(0xFF1E1E1E);
  static const Color surfaceLight = Color(0xFF2C2C2C);
  static const Color border = Color(0xFF404040);
  static const Color divider = Color(0xFF2C2C2C);

  // Text
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB0B0B0);
  static const Color textHint = Color(0xFF757575);
  static const Color textOnPrimary = Color(0xFF000000);
}
```

### 1.3 Typography

```dart
// lib/core/design/typography.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract class AppTypography {
  static final String _fontFamily = GoogleFonts.inter().fontFamily!;

  // Headings
  static TextStyle h1 = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -0.5,
  );

  static TextStyle h2 = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 28,
    fontWeight: FontWeight.w600,
    height: 1.25,
    letterSpacing: -0.25,
  );

  static TextStyle h3 = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.3,
  );

  static TextStyle h4 = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.35,
  );

  static TextStyle h5 = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 1.4,
  );

  static TextStyle h6 = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.4,
  );

  // Body
  static TextStyle bodyLarge = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  static TextStyle bodyMedium = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  static TextStyle bodySmall = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  // Labels
  static TextStyle labelLarge = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 1.4,
    letterSpacing: 0.1,
  );

  static TextStyle labelMedium = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.4,
    letterSpacing: 0.5,
  );

  static TextStyle labelSmall = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    height: 1.4,
    letterSpacing: 0.5,
  );

  // Caption
  static TextStyle caption = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0.4,
  );

  // Overline
  static TextStyle overline = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w500,
    height: 1.5,
    letterSpacing: 1.5,
  );

  // Monospace (for numbers/code)
  static TextStyle mono = TextStyle(
    fontFamily: GoogleFonts.robotoMono().fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );
}
```

### 1.4 Spacing

```dart
// lib/core/design/spacing.dart

import 'package:flutter/material.dart';

abstract class AppSpacing {
  // Raw values
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
  static const double xxxl = 64;

  // EdgeInsets - All sides
  static const EdgeInsets allXs = EdgeInsets.all(xs);
  static const EdgeInsets allSm = EdgeInsets.all(sm);
  static const EdgeInsets allMd = EdgeInsets.all(md);
  static const EdgeInsets allLg = EdgeInsets.all(lg);
  static const EdgeInsets allXl = EdgeInsets.all(xl);

  // EdgeInsets - Horizontal
  static const EdgeInsets horizontalXs = EdgeInsets.symmetric(horizontal: xs);
  static const EdgeInsets horizontalSm = EdgeInsets.symmetric(horizontal: sm);
  static const EdgeInsets horizontalMd = EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets horizontalLg = EdgeInsets.symmetric(horizontal: lg);

  // EdgeInsets - Vertical
  static const EdgeInsets verticalXs = EdgeInsets.symmetric(vertical: xs);
  static const EdgeInsets verticalSm = EdgeInsets.symmetric(vertical: sm);
  static const EdgeInsets verticalMd = EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets verticalLg = EdgeInsets.symmetric(vertical: lg);

  // SizedBox gaps
  static const SizedBox gapXs = SizedBox(height: xs, width: xs);
  static const SizedBox gapSm = SizedBox(height: sm, width: sm);
  static const SizedBox gapMd = SizedBox(height: md, width: md);
  static const SizedBox gapLg = SizedBox(height: lg, width: lg);
  static const SizedBox gapXl = SizedBox(height: xl, width: xl);
  static const SizedBox gapXxl = SizedBox(height: xxl, width: xxl);

  // Border Radius
  static const BorderRadius borderRadiusXs = BorderRadius.all(Radius.circular(4));
  static const BorderRadius borderRadiusSm = BorderRadius.all(Radius.circular(8));
  static const BorderRadius borderRadiusMd = BorderRadius.all(Radius.circular(12));
  static const BorderRadius borderRadiusLg = BorderRadius.all(Radius.circular(16));
  static const BorderRadius borderRadiusXl = BorderRadius.all(Radius.circular(24));
  static const BorderRadius borderRadiusFull = BorderRadius.all(Radius.circular(9999));
}
```

### 1.5 Shadows

```dart
// lib/core/design/shadows.dart

import 'package:flutter/material.dart';

abstract class AppShadows {
  /// Subtle card shadow
  static BoxShadow card = BoxShadow(
    color: Colors.black.withOpacity(0.04),
    blurRadius: 8,
    offset: const Offset(0, 2),
  );

  /// Raised element shadow
  static BoxShadow raised = BoxShadow(
    color: Colors.black.withOpacity(0.08),
    blurRadius: 16,
    offset: const Offset(0, 4),
  );

  /// Elevated (floating) element shadow
  static BoxShadow elevated = BoxShadow(
    color: Colors.black.withOpacity(0.12),
    blurRadius: 24,
    offset: const Offset(0, 8),
  );

  /// Modal/dialog shadow
  static BoxShadow modal = BoxShadow(
    color: Colors.black.withOpacity(0.16),
    blurRadius: 32,
    offset: const Offset(0, 12),
  );

  /// Hover state shadow
  static BoxShadow hover = BoxShadow(
    color: Colors.black.withOpacity(0.10),
    blurRadius: 20,
    offset: const Offset(0, 6),
  );

  /// Focus ring shadow
  static BoxShadow focus = BoxShadow(
    color: AppColors.primary.withOpacity(0.25),
    blurRadius: 0,
    spreadRadius: 3,
  );

  /// List for common card decoration
  static List<BoxShadow> cardShadows = [card];

  /// List for elevated elements
  static List<BoxShadow> elevatedShadows = [raised, card];
}
```

---

## 2. Core Components

### 2.1 AppButton

```dart
// lib/core/design/components/app_button.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';

enum AppButtonVariant { primary, secondary, outline, ghost, destructive }
enum AppButtonSize { small, medium, large }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? icon;
  final bool isLoading;
  final bool isFullWidth;
  final bool isDestructive;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
    this.isDestructive = false,
  });

  // Named constructors for common variants
  const AppButton.primary({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
  })  : variant = AppButtonVariant.primary,
        size = AppButtonSize.medium,
        isDestructive = false;

  const AppButton.secondary({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
    this.isDestructive = false,
  })  : variant = AppButtonVariant.secondary,
        size = AppButtonSize.medium;

  const AppButton.outline({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
  })  : variant = AppButtonVariant.outline,
        size = AppButtonSize.medium,
        isDestructive = false;

  const AppButton.ghost({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
  })  : variant = AppButtonVariant.ghost,
        size = AppButtonSize.medium,
        isDestructive = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final (height, fontSize, iconSize, padding) = _getSizeParams();
    final (bgColor, fgColor, borderColor) = _getColors(isDark);

    Widget child = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: iconSize,
            height: iconSize,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation(fgColor),
            ),
          ),
          AppSpacing.gapSm,
        ] else if (icon != null) ...[
          Icon(icon, size: iconSize, color: fgColor),
          AppSpacing.gapSm,
        ],
        Text(
          label,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.w600,
            color: fgColor,
          ),
        ),
      ],
    );

    if (isFullWidth) {
      child = Center(child: child);
    }

    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: height,
      child: Material(
        color: bgColor,
        borderRadius: AppSpacing.borderRadiusSm,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: AppSpacing.borderRadiusSm,
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              borderRadius: AppSpacing.borderRadiusSm,
              border: borderColor != null
                  ? Border.all(color: borderColor, width: 1.5)
                  : null,
            ),
            child: child,
          ),
        ),
      ),
    );
  }

  (double, double, double, EdgeInsets) _getSizeParams() {
    switch (size) {
      case AppButtonSize.small:
        return (32, 12, 16, AppSpacing.horizontalMd);
      case AppButtonSize.medium:
        return (44, 14, 18, AppSpacing.horizontalMd);
      case AppButtonSize.large:
        return (52, 16, 20, AppSpacing.horizontalLg);
    }
  }

  (Color, Color, Color?) _getColors(bool isDark) {
    if (isDestructive) {
      return (
        variant == AppButtonVariant.primary ? AppColors.error : Colors.transparent,
        variant == AppButtonVariant.primary ? Colors.white : AppColors.error,
        variant == AppButtonVariant.outline ? AppColors.error : null,
      );
    }

    switch (variant) {
      case AppButtonVariant.primary:
        return (
          isDark ? AppColorsDark.primary : AppColors.primary,
          isDark ? AppColorsDark.textOnPrimary : AppColors.textOnPrimary,
          null,
        );
      case AppButtonVariant.secondary:
        return (
          isDark ? AppColorsDark.surfaceLight : AppColors.surfaceLight,
          isDark ? AppColorsDark.textPrimary : AppColors.textPrimary,
          null,
        );
      case AppButtonVariant.outline:
        return (
          Colors.transparent,
          isDark ? AppColorsDark.primary : AppColors.primary,
          isDark ? AppColorsDark.primary : AppColors.primary,
        );
      case AppButtonVariant.ghost:
        return (
          Colors.transparent,
          isDark ? AppColorsDark.primary : AppColors.primary,
          null,
        );
      case AppButtonVariant.destructive:
        return (
          AppColors.error,
          Colors.white,
          null,
        );
    }
  }
}
```

### 2.2 AppCard

```dart
// lib/core/design/components/app_card.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final Widget? header;
  final Widget? footer;
  final EdgeInsets? padding;
  final VoidCallback? onTap;
  final bool elevated;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;

  const AppCard({
    super.key,
    required this.child,
    this.header,
    this.footer,
    this.padding,
    this.onTap,
    this.elevated = false,
    this.backgroundColor,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final bgColor = backgroundColor ??
        (isDark ? AppColorsDark.surface : AppColors.surface);

    final border = Border.all(
      color: isDark ? AppColorsDark.border : AppColors.border,
      width: 1,
    );

    final shadows = elevated ? AppShadows.elevatedShadows : AppShadows.cardShadows;

    Widget content = Padding(
      padding: padding ?? AppSpacing.allMd,
      child: child,
    );

    if (header != null || footer != null) {
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (header != null) header!,
          Flexible(child: content),
          if (footer != null) ...[
            Divider(height: 1, color: isDark ? AppColorsDark.divider : AppColors.divider),
            footer!,
          ],
        ],
      );
    }

    final decoration = BoxDecoration(
      color: bgColor,
      borderRadius: borderRadius ?? AppSpacing.borderRadiusMd,
      border: border,
      boxShadow: shadows,
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: Ink(
          decoration: decoration,
          child: InkWell(
            onTap: onTap,
            borderRadius: borderRadius ?? AppSpacing.borderRadiusMd,
            child: content,
          ),
        ),
      );
    }

    return Container(
      decoration: decoration,
      child: content,
    );
  }
}
```

### 2.3 AppInput

```dart
// lib/core/design/components/app_input.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:arc_mobile/core/design/design_system.dart';

class AppInput extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? errorText;
  final String? helperText;
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool obscureText;
  final bool enabled;
  final bool isRequired;
  final bool readOnly;
  final int? maxLines;
  final int? maxLength;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final VoidCallback? onSuffixTap;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final String? Function(String?)? validator;
  final List<TextInputFormatter>? inputFormatters;

  const AppInput({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.controller,
    this.focusNode,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.enabled = true,
    this.isRequired = false,
    this.readOnly = false,
    this.maxLines = 1,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.onSuffixTap,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.inputFormatters,
  });

  /// Search input variant
  factory AppInput.search({
    Key? key,
    String? hint,
    TextEditingController? controller,
    ValueChanged<String>? onChanged,
    ValueChanged<String>? onSubmitted,
  }) {
    return AppInput(
      key: key,
      hint: hint ?? 'Search...',
      controller: controller,
      prefixIcon: Icons.search,
      textInputAction: TextInputAction.search,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
    );
  }

  /// Email input variant
  factory AppInput.email({
    Key? key,
    String? label,
    TextEditingController? controller,
    bool isRequired = false,
    String? Function(String?)? validator,
  }) {
    return AppInput(
      key: key,
      label: label ?? 'Email',
      controller: controller,
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.next,
      prefixIcon: Icons.email_outlined,
      isRequired: isRequired,
      validator: validator ?? _defaultEmailValidator,
    );
  }

  /// Password input variant
  factory AppInput.password({
    Key? key,
    String? label,
    TextEditingController? controller,
    bool isRequired = false,
    String? Function(String?)? validator,
  }) {
    return _PasswordInput(
      key: key,
      label: label ?? 'Password',
      controller: controller,
      isRequired: isRequired,
      validator: validator,
    );
  }

  /// Phone input variant
  factory AppInput.phone({
    Key? key,
    String? label,
    TextEditingController? controller,
    bool isRequired = false,
  }) {
    return AppInput(
      key: key,
      label: label ?? 'Phone',
      controller: controller,
      keyboardType: TextInputType.phone,
      prefixIcon: Icons.phone_outlined,
      isRequired: isRequired,
    );
  }

  static String? _defaultEmailValidator(String? value) {
    if (value == null || value.isEmpty) return null;
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }
    return null;
  }

  @override
  State<AppInput> createState() => _AppInputState();
}

class _AppInputState extends State<AppInput> {
  late FocusNode _focusNode;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_handleFocusChange);
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.dispose();
    }
    super.dispose();
  }

  void _handleFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasError = widget.errorText != null;

    final borderColor = hasError
        ? AppColors.error
        : _isFocused
            ? AppColors.primary
            : isDark
                ? AppColorsDark.border
                : AppColors.border;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Label
        if (widget.label != null) ...[
          Row(
            children: [
              Text(
                widget.label!,
                style: AppTypography.labelMedium.copyWith(
                  color: isDark ? AppColorsDark.textPrimary : AppColors.textPrimary,
                ),
              ),
              if (widget.isRequired)
                Text(
                  ' *',
                  style: AppTypography.labelMedium.copyWith(
                    color: AppColors.error,
                  ),
                ),
            ],
          ),
          AppSpacing.gapXs,
        ],

        // Input Field
        TextFormField(
          controller: widget.controller,
          focusNode: _focusNode,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          obscureText: widget.obscureText,
          enabled: widget.enabled,
          readOnly: widget.readOnly,
          maxLines: widget.maxLines,
          maxLength: widget.maxLength,
          onChanged: widget.onChanged,
          onFieldSubmitted: widget.onSubmitted,
          validator: widget.validator,
          inputFormatters: widget.inputFormatters,
          style: AppTypography.bodyMedium.copyWith(
            color: isDark ? AppColorsDark.textPrimary : AppColors.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: AppTypography.bodyMedium.copyWith(
              color: isDark ? AppColorsDark.textHint : AppColors.textHint,
            ),
            prefixIcon: widget.prefixIcon != null
                ? Icon(widget.prefixIcon, size: 20)
                : null,
            suffixIcon: widget.suffixIcon != null
                ? IconButton(
                    icon: Icon(widget.suffixIcon, size: 20),
                    onPressed: widget.onSuffixTap,
                  )
                : null,
            filled: true,
            fillColor: widget.enabled
                ? (isDark ? AppColorsDark.surface : AppColors.surface)
                : (isDark ? AppColorsDark.surfaceLight : AppColors.surfaceLight),
            contentPadding: AppSpacing.allMd,
            border: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: BorderSide(color: borderColor, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: const BorderSide(color: AppColors.error),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: const BorderSide(color: AppColors.error, width: 2),
            ),
            errorText: null, // We show error below
            counterText: '',
          ),
        ),

        // Error or Helper Text
        if (widget.errorText != null || widget.helperText != null) ...[
          AppSpacing.gapXs,
          Text(
            widget.errorText ?? widget.helperText!,
            style: AppTypography.caption.copyWith(
              color: widget.errorText != null
                  ? AppColors.error
                  : AppColors.textSecondary,
            ),
          ),
        ],
      ],
    );
  }
}

/// Password input with visibility toggle
class _PasswordInput extends StatefulWidget {
  final String? label;
  final TextEditingController? controller;
  final bool isRequired;
  final String? Function(String?)? validator;

  const _PasswordInput({
    super.key,
    this.label,
    this.controller,
    this.isRequired = false,
    this.validator,
  });

  @override
  State<_PasswordInput> createState() => _PasswordInputState();
}

class _PasswordInputState extends State<_PasswordInput> {
  bool _obscured = true;

  @override
  Widget build(BuildContext context) {
    return AppInput(
      label: widget.label,
      controller: widget.controller,
      obscureText: _obscured,
      isRequired: widget.isRequired,
      validator: widget.validator,
      prefixIcon: Icons.lock_outlined,
      suffixIcon: _obscured ? Icons.visibility_outlined : Icons.visibility_off_outlined,
      onSuffixTap: () => setState(() => _obscured = !_obscured),
    );
  }
}
```

---

## 3. Data Display Components

### 3.1 SectionHeader

```dart
// lib/shared/widgets/section_header.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final int? count;
  final String? viewAllLabel;
  final VoidCallback? onViewAll;

  const SectionHeader({
    super.key,
    required this.title,
    this.count,
    this.viewAllLabel,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(title, style: AppTypography.h5),
            if (count != null) ...[
              AppSpacing.gapSm,
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: AppSpacing.borderRadiusFull,
                ),
                child: Text(
                  count.toString(),
                  style: AppTypography.labelSmall.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ],
        ),
        if (onViewAll != null)
          TextButton(
            onPressed: onViewAll,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  viewAllLabel ?? 'View All',
                  style: AppTypography.labelMedium.copyWith(
                    color: AppColors.primary,
                  ),
                ),
                AppSpacing.gapXs,
                const Icon(Icons.chevron_right, size: 18, color: AppColors.primary),
              ],
            ),
          ),
      ],
    );
  }
}
```

### 3.2 StatCard

```dart
// lib/shared/widgets/stat_card.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/core/utils/formatters.dart';

class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final double? changeValue;
  final bool isPercentage;
  final IconData? icon;
  final Color? color;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.changeValue,
    this.isPercentage = false,
    this.icon,
    this.color,
    this.onTap,
  });

  /// Creates a currency stat card
  factory StatCard.currency({
    required String label,
    required double value,
    double? changeValue,
    VoidCallback? onTap,
  }) {
    return StatCard(
      label: label,
      value: Formatters.currency(value),
      changeValue: changeValue,
      icon: Icons.account_balance_wallet_outlined,
      onTap: onTap,
    );
  }

  /// Creates a percentage stat card
  factory StatCard.percentage({
    required String label,
    required double value,
    double? changeValue,
    VoidCallback? onTap,
  }) {
    return StatCard(
      label: label,
      value: Formatters.percent(value),
      changeValue: changeValue,
      isPercentage: true,
      icon: Icons.trending_up,
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with icon
          Row(
            children: [
              if (icon != null) ...[
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: (color ?? AppColors.primary).withOpacity(0.1),
                    borderRadius: AppSpacing.borderRadiusSm,
                  ),
                  child: Icon(
                    icon,
                    size: 18,
                    color: color ?? AppColors.primary,
                  ),
                ),
                AppSpacing.gapSm,
              ],
              Text(
                label,
                style: AppTypography.caption.copyWith(
                  color: isDark ? AppColorsDark.textSecondary : AppColors.textSecondary,
                ),
              ),
            ],
          ),

          AppSpacing.gapSm,

          // Value
          Text(
            value,
            style: AppTypography.h3.copyWith(
              color: color,
            ),
          ),

          // Change
          if (changeValue != null) ...[
            AppSpacing.gapXs,
            _ChangeIndicator(value: changeValue!),
          ],
        ],
      ),
    );
  }
}

class _ChangeIndicator extends StatelessWidget {
  final double value;

  const _ChangeIndicator({required this.value});

  @override
  Widget build(BuildContext context) {
    final isPositive = value >= 0;
    final color = isPositive ? AppColors.success : AppColors.error;
    final icon = isPositive ? Icons.trending_up : Icons.trending_down;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        AppSpacing.gapXs,
        Text(
          Formatters.percentChange(value),
          style: AppTypography.caption.copyWith(
            color: color,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
```

### 3.3 PortfolioSummaryCard

```dart
// lib/features/dashboard/presentation/widgets/portfolio_summary_card.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/core/utils/formatters.dart';

class PortfolioSummaryCard extends StatelessWidget {
  final double totalValue;
  final double dailyChange;
  final double dailyChangePct;
  final VoidCallback? onTap;

  const PortfolioSummaryCard({
    super.key,
    required this.totalValue,
    required this.dailyChange,
    required this.dailyChangePct,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isPositive = dailyChange >= 0;
    final changeColor = isPositive ? AppColors.success : AppColors.error;

    return AppCard(
      onTap: onTap,
      elevated: true,
      backgroundColor: isDark ? AppColorsDark.primary.withOpacity(0.1) : AppColors.primary.withOpacity(0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total Portfolio Value',
                style: AppTypography.labelMedium.copyWith(
                  color: isDark ? AppColorsDark.textSecondary : AppColors.textSecondary,
                ),
              ),
              Icon(
                Icons.account_balance_wallet,
                size: 20,
                color: AppColors.primary,
              ),
            ],
          ),

          AppSpacing.gapSm,

          // Total Value
          Text(
            Formatters.currency(totalValue),
            style: AppTypography.h2.copyWith(
              fontFamily: AppTypography.mono.fontFamily,
            ),
          ),

          AppSpacing.gapSm,

          // Daily Change
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: changeColor.withOpacity(0.1),
              borderRadius: AppSpacing.borderRadiusFull,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                  size: 16,
                  color: changeColor,
                ),
                AppSpacing.gapXs,
                Text(
                  '${Formatters.currencyCompact(dailyChange.abs())} (${Formatters.percentChange(dailyChangePct)})',
                  style: AppTypography.labelMedium.copyWith(
                    color: changeColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  ' today',
                  style: AppTypography.labelMedium.copyWith(
                    color: isDark ? AppColorsDark.textSecondary : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

### 3.4 AlertTile

```dart
// lib/features/analytics/presentation/widgets/alert_tile.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/core/utils/formatters.dart';

class AlertTile extends StatelessWidget {
  final Alert alert;
  final bool compact;
  final VoidCallback? onTap;
  final VoidCallback? onDismiss;

  const AlertTile({
    super.key,
    required this.alert,
    this.compact = false,
    this.onTap,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final (iconColor, bgColor, icon) = _getSeverityStyle(alert.severity);

    return Dismissible(
      key: Key(alert.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async => onDismiss != null,
      onDismissed: (_) => onDismiss?.call(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: AppSpacing.horizontalMd,
        color: AppColors.error,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      child: AppCard(
        onTap: onTap,
        padding: compact ? AppSpacing.allSm : AppSpacing.allMd,
        child: Row(
          children: [
            // Severity Icon
            Container(
              width: compact ? 36 : 44,
              height: compact ? 36 : 44,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: AppSpacing.borderRadiusSm,
              ),
              child: Icon(
                icon,
                size: compact ? 18 : 22,
                color: iconColor,
              ),
            ),

            AppSpacing.gapMd,

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    alert.title,
                    style: compact ? AppTypography.bodySmall : AppTypography.bodyMedium,
                    maxLines: compact ? 1 : 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (!compact && alert.message.isNotEmpty) ...[
                    AppSpacing.gapXs,
                    Text(
                      alert.message,
                      style: AppTypography.caption.copyWith(
                        color: isDark ? AppColorsDark.textSecondary : AppColors.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  AppSpacing.gapXs,
                  Row(
                    children: [
                      Text(
                        _getAlertTypeLabel(alert.type),
                        style: AppTypography.overline.copyWith(
                          color: iconColor,
                        ),
                      ),
                      AppSpacing.gapSm,
                      Text(
                        Formatters.relativeTime(alert.triggeredAt),
                        style: AppTypography.caption.copyWith(
                          color: isDark ? AppColorsDark.textHint : AppColors.textHint,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Chevron
            if (!compact)
              const Icon(
                Icons.chevron_right,
                color: AppColors.textSecondary,
              ),
          ],
        ),
      ),
    );
  }

  (Color, Color, IconData) _getSeverityStyle(String severity) {
    switch (severity) {
      case 'critical':
        return (
          AppColors.error,
          AppColors.errorLight,
          Icons.error,
        );
      case 'warning':
        return (
          AppColors.warning,
          AppColors.warningLight,
          Icons.warning_amber,
        );
      default:
        return (
          AppColors.info,
          AppColors.infoLight,
          Icons.info_outline,
        );
    }
  }

  String _getAlertTypeLabel(String type) {
    switch (type) {
      case 'threshold':
        return 'THRESHOLD';
      case 'anomaly':
        return 'ANOMALY';
      case 'news':
        return 'NEWS';
      case 'earnings':
        return 'EARNINGS';
      default:
        return type.toUpperCase();
    }
  }
}
```

---

## 4. Chart Components

### 4.1 AllocationPieChart

```dart
// lib/shared/widgets/charts/allocation_pie_chart.dart

import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:arc_mobile/core/design/design_system.dart';

class AllocationPieChart extends StatefulWidget {
  final Map<String, double> allocations;
  final Map<String, Color>? colorMap;
  final bool showLegend;
  final double size;

  const AllocationPieChart({
    super.key,
    required this.allocations,
    this.colorMap,
    this.showLegend = true,
    this.size = 200,
  });

  @override
  State<AllocationPieChart> createState() => _AllocationPieChartState();
}

class _AllocationPieChartState extends State<AllocationPieChart> {
  int _touchedIndex = -1;

  static const _defaultColors = [
    Color(0xFF1976D2),
    Color(0xFF26A69A),
    Color(0xFFAB47BC),
    Color(0xFFFF7043),
    Color(0xFF5C6BC0),
    Color(0xFFFFB300),
    Color(0xFF66BB6A),
    Color(0xFFEC407A),
  ];

  @override
  Widget build(BuildContext context) {
    final sorted = widget.allocations.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Pie Chart
        SizedBox(
          width: widget.size,
          height: widget.size,
          child: PieChart(
            PieChartData(
              pieTouchData: PieTouchData(
                touchCallback: (event, response) {
                  setState(() {
                    if (event is FlLongPressEnd || event is FlPanEndEvent) {
                      _touchedIndex = -1;
                    } else {
                      _touchedIndex = response?.touchedSection?.touchedSectionIndex ?? -1;
                    }
                  });
                },
              ),
              startDegreeOffset: -90,
              sectionsSpace: 2,
              centerSpaceRadius: widget.size * 0.25,
              sections: sorted.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                final isTouched = index == _touchedIndex;
                final color = widget.colorMap?[item.key] ?? _defaultColors[index % _defaultColors.length];

                return PieChartSectionData(
                  value: item.value * 100,
                  title: isTouched ? '${(item.value * 100).toStringAsFixed(1)}%' : '',
                  color: color,
                  radius: isTouched ? widget.size * 0.35 : widget.size * 0.3,
                  titleStyle: AppTypography.labelSmall.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        // Legend
        if (widget.showLegend) ...[
          AppSpacing.gapLg,
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: sorted.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final color = widget.colorMap?[item.key] ?? _defaultColors[index % _defaultColors.length];

              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    AppSpacing.gapSm,
                    Text(
                      item.key,
                      style: AppTypography.bodySmall,
                    ),
                    AppSpacing.gapSm,
                    Text(
                      '${(item.value * 100).toStringAsFixed(1)}%',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}
```

### 4.2 TrendSparkline

```dart
// lib/shared/widgets/charts/trend_sparkline.dart

import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:arc_mobile/core/design/design_system.dart';

class TrendSparkline extends StatelessWidget {
  final List<double> values;
  final Color? lineColor;
  final Color? fillColor;
  final double height;
  final double width;
  final bool showDots;

  const TrendSparkline({
    super.key,
    required this.values,
    this.lineColor,
    this.fillColor,
    this.height = 40,
    this.width = 100,
    this.showDots = false,
  });

  @override
  Widget build(BuildContext context) {
    if (values.isEmpty) {
      return SizedBox(height: height, width: width);
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isPositive = values.isNotEmpty && values.last >= values.first;
    final color = lineColor ??
        (isPositive ? AppColors.success : AppColors.error);

    final spots = values.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value);
    }).toList();

    final minY = values.reduce((a, b) => a < b ? a : b);
    final maxY = values.reduce((a, b) => a > b ? a : b);
    final padding = (maxY - minY) * 0.1;

    return SizedBox(
      height: height,
      width: width,
      child: LineChart(
        LineChartData(
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          minY: minY - padding,
          maxY: maxY + padding,
          lineTouchData: const LineTouchData(enabled: false),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              curveSmoothness: 0.3,
              color: color,
              barWidth: 2,
              isStrokeCapRound: true,
              dotData: FlDotData(show: showDots),
              belowBarData: BarAreaData(
                show: fillColor != null,
                color: fillColor ?? color.withOpacity(0.1),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 5. Feedback Components

### 5.1 EmptyState

```dart
// lib/shared/widgets/empty_state.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Center(
      child: Padding(
        padding: AppSpacing.allLg,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: (isDark ? AppColorsDark.primary : AppColors.primary)
                    .withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 40,
                color: isDark ? AppColorsDark.primary : AppColors.primary,
              ),
            ),

            AppSpacing.gapMd,

            Text(
              title,
              style: AppTypography.h4,
              textAlign: TextAlign.center,
            ),

            if (message != null) ...[
              AppSpacing.gapSm,
              Text(
                message!,
                style: AppTypography.bodyMedium.copyWith(
                  color: isDark ? AppColorsDark.textSecondary : AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],

            if (onAction != null && actionLabel != null) ...[
              AppSpacing.gapLg,
              AppButton.primary(
                label: actionLabel!,
                onPressed: onAction,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

### 5.2 LoadingSkeleton

```dart
// lib/shared/widgets/loading_skeleton.dart

import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:arc_mobile/core/design/design_system.dart';

class LoadingSkeleton extends StatelessWidget {
  final double? width;
  final double height;
  final BorderRadius? borderRadius;

  const LoadingSkeleton({
    super.key,
    this.width,
    required this.height,
    this.borderRadius,
  });

  /// Text line skeleton
  factory LoadingSkeleton.text({double width = 100, double height = 14}) {
    return LoadingSkeleton(
      width: width,
      height: height,
      borderRadius: AppSpacing.borderRadiusXs,
    );
  }

  /// Circle skeleton (for avatars)
  factory LoadingSkeleton.circle({double size = 48}) {
    return LoadingSkeleton(
      width: size,
      height: size,
      borderRadius: AppSpacing.borderRadiusFull,
    );
  }

  /// Card skeleton
  factory LoadingSkeleton.card({double height = 100}) {
    return LoadingSkeleton(
      height: height,
      borderRadius: AppSpacing.borderRadiusMd,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Shimmer.fromColors(
      baseColor: isDark ? AppColorsDark.surface : AppColors.surfaceLight,
      highlightColor: isDark ? AppColorsDark.surfaceLight : AppColors.surface,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: borderRadius ?? AppSpacing.borderRadiusSm,
        ),
      ),
    );
  }
}

/// Portfolio list skeleton
class PortfolioListSkeleton extends StatelessWidget {
  const PortfolioListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: AppSpacing.allMd,
      itemCount: 4,
      separatorBuilder: (_, __) => AppSpacing.gapMd,
      itemBuilder: (_, __) => const _PortfolioTileSkeleton(),
    );
  }
}

class _PortfolioTileSkeleton extends StatelessWidget {
  const _PortfolioTileSkeleton();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              LoadingSkeleton.text(width: 180, height: 20),
              LoadingSkeleton.text(width: 50, height: 20),
            ],
          ),
          AppSpacing.gapMd,
          LoadingSkeleton.text(width: 120, height: 28),
          AppSpacing.gapSm,
          LoadingSkeleton.text(width: 200, height: 14),
          AppSpacing.gapMd,
          LoadingSkeleton.text(height: 8),
        ],
      ),
    );
  }
}

/// Dashboard skeleton
class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: AppSpacing.allMd,
      children: [
        LoadingSkeleton.card(height: 120),
        AppSpacing.gapMd,
        Row(
          children: [
            Expanded(child: LoadingSkeleton.card(height: 80)),
            AppSpacing.gapSm,
            Expanded(child: LoadingSkeleton.card(height: 80)),
            AppSpacing.gapSm,
            Expanded(child: LoadingSkeleton.card(height: 80)),
          ],
        ),
        AppSpacing.gapLg,
        LoadingSkeleton.text(width: 120, height: 20),
        AppSpacing.gapSm,
        LoadingSkeleton.card(height: 200),
      ],
    );
  }
}
```

---

## 6. Intelligence Components

### 6.1 ChatBubble

```dart
// lib/features/intelligence/presentation/widgets/chat_bubble.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

class ChatBubble extends StatelessWidget {
  final ChatMessage message;

  const ChatBubble({
    super.key,
    required this.message,
  });

  /// Loading indicator bubble
  const ChatBubble.loading({super.key})
      : message = const ChatMessage(
          id: 'loading',
          text: '',
          isUser: false,
          isLoading: true,
          timestamp: null,
        );

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // AI Avatar
          if (!isUser) ...[
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.psychology,
                size: 18,
                color: Colors.white,
              ),
            ),
            AppSpacing.gapSm,
          ],

          // Message Content
          Flexible(
            child: Container(
              padding: AppSpacing.allMd,
              decoration: BoxDecoration(
                color: isUser
                    ? AppColors.primary
                    : isDark
                        ? AppColorsDark.surfaceLight
                        : AppColors.surfaceLight,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: message.isLoading
                  ? _buildLoadingIndicator()
                  : _buildContent(context, isUser, isDark),
            ),
          ),

          // User spacer
          if (isUser) AppSpacing.gapSm,
        ],
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _LoadingDot(delay: Duration.zero),
        AppSpacing.gapXs,
        _LoadingDot(delay: const Duration(milliseconds: 150)),
        AppSpacing.gapXs,
        _LoadingDot(delay: const Duration(milliseconds: 300)),
      ],
    );
  }

  Widget _buildContent(BuildContext context, bool isUser, bool isDark) {
    final textColor = isUser
        ? Colors.white
        : isDark
            ? AppColorsDark.textPrimary
            : AppColors.textPrimary;

    if (message.text.contains('```') || message.text.contains('**')) {
      // Render as Markdown
      return MarkdownBody(
        data: message.text,
        styleSheet: MarkdownStyleSheet(
          p: AppTypography.bodyMedium.copyWith(color: textColor),
          code: AppTypography.mono.copyWith(
            color: textColor,
            backgroundColor: Colors.black12,
          ),
          strong: AppTypography.bodyMedium.copyWith(
            color: textColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        shrinkWrap: true,
      );
    }

    return Text(
      message.text,
      style: AppTypography.bodyMedium.copyWith(color: textColor),
    );
  }
}

class _LoadingDot extends StatefulWidget {
  final Duration delay;

  const _LoadingDot({required this.delay});

  @override
  State<_LoadingDot> createState() => _LoadingDotState();
}

class _LoadingDotState extends State<_LoadingDot> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _animation = Tween(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    Future.delayed(widget.delay, () {
      if (mounted) {
        _controller.repeat(reverse: true);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: AppColors.textSecondary.withOpacity(0.3 + _animation.value * 0.7),
            shape: BoxShape.circle,
          ),
        );
      },
    );
  }
}
```

### 6.2 VoiceInputButton

```dart
// lib/features/intelligence/presentation/widgets/voice_input_button.dart

import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:arc_mobile/core/design/design_system.dart';

class VoiceInputButton extends StatefulWidget {
  final ValueChanged<String> onResult;

  const VoiceInputButton({
    super.key,
    required this.onResult,
  });

  @override
  State<VoiceInputButton> createState() => _VoiceInputButtonState();
}

class _VoiceInputButtonState extends State<VoiceInputButton>
    with SingleTickerProviderStateMixin {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;
  String _lastWords = '';
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _pulseAnimation = Tween(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _toggleListening() async {
    if (_isListening) {
      await _stopListening();
    } else {
      await _startListening();
    }
  }

  Future<void> _startListening() async {
    final available = await _speech.initialize();

    if (available) {
      setState(() => _isListening = true);
      _pulseController.repeat(reverse: true);

      await _speech.listen(
        onResult: (result) {
          setState(() {
            _lastWords = result.recognizedWords;
          });

          if (result.finalResult) {
            _stopListening();
            if (_lastWords.isNotEmpty) {
              widget.onResult(_lastWords);
            }
          }
        },
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
      );
    } else {
      _showPermissionError();
    }
  }

  Future<void> _stopListening() async {
    await _speech.stop();
    _pulseController.stop();
    _pulseController.reset();
    setState(() => _isListening = false);
  }

  void _showPermissionError() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Microphone permission required for voice input'),
        action: SnackBarAction(label: 'Settings', onPressed: null),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: _toggleListening,
      backgroundColor: _isListening ? AppColors.primary.withOpacity(0.1) : null,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _isListening ? _pulseAnimation.value : 1.0,
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _isListening
                        ? AppColors.error
                        : AppColors.primary,
                    shape: BoxShape.circle,
                    boxShadow: _isListening
                        ? [
                            BoxShadow(
                              color: AppColors.error.withOpacity(0.4),
                              blurRadius: 16,
                              spreadRadius: 2,
                            ),
                          ]
                        : null,
                  ),
                  child: Icon(
                    _isListening ? Icons.stop : Icons.mic,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              );
            },
          ),
          AppSpacing.gapSm,
          Text(
            _isListening ? 'Listening...' : 'Voice',
            style: AppTypography.bodySmall,
          ),
          Text(
            _isListening ? '' : 'Query',
            style: AppTypography.labelMedium,
          ),
          if (_isListening && _lastWords.isNotEmpty) ...[
            AppSpacing.gapSm,
            Text(
              _lastWords,
              style: AppTypography.caption.copyWith(
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
}
```

---

## 7. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] **WID-001**: Design system setup (colors, typography, spacing, shadows)
- [ ] **WID-002**: AppButton with all variants
- [ ] **WID-003**: AppCard component
- [ ] **WID-004**: AppInput with variants (search, email, password, phone)
- [ ] **WID-005**: SectionHeader
- [ ] **WID-006**: EmptyState
- [ ] **WID-007**: LoadingSkeleton with variants

### Phase 2: Data Display (Week 2)
- [ ] **WID-008**: StatCard with currency/percentage variants
- [ ] **WID-009**: PortfolioSummaryCard
- [ ] **WID-010**: AlertTile
- [ ] **WID-011**: RatioCard
- [ ] **WID-012**: HoldingListTile

### Phase 3: Charts (Week 3)
- [ ] **WID-013**: AllocationPieChart
- [ ] **WID-014**: TrendSparkline
- [ ] **WID-015**: PerformanceChart
- [ ] **WID-016**: PercentileBar

### Phase 4: Intelligence (Week 4)
- [ ] **WID-017**: ChatBubble with markdown support
- [ ] **WID-018**: ChatInput
- [ ] **WID-019**: VoiceInputButton
- [ ] **WID-020**: BriefCard
- [ ] **WID-021**: SuggestedQueryChip

### Phase 5: Settings & Polish (Week 5)
- [ ] **WID-022**: SettingsSection
- [ ] **WID-023**: SettingsTile (toggle, dropdown, navigation, info)
- [ ] **WID-024**: ProfileCard
- [ ] **WID-025**: Dark mode for all components

---

## 8. Acceptance Criteria

### Design System
- [ ] All colors defined for light and dark themes
- [ ] Typography scale with heading, body, label, caption
- [ ] Spacing tokens consistently used
- [ ] Shadow definitions for card, raised, elevated, modal

### Component Quality
- [ ] All components support dark mode
- [ ] Const constructors used where possible
- [ ] Accessibility labels for interactive elements
- [ ] Loading and error states for async widgets
- [ ] Responsive sizing (no hardcoded widths)

### Documentation
- [ ] Each component has doc comments
- [ ] Named constructors for common variants
- [ ] Example usage in component file
- [ ] Widget tests for key components

---

**Document Version**: 1.0
**Last Updated**: 2026-01-07
**Author**: ARC Development Team
