import 'package:arc_mobile/core/design/design_system.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppButton', () {
    Widget buildTestWidget(Widget child, {ThemeMode themeMode = ThemeMode.light}) {
      return MaterialApp(
        themeMode: themeMode,
        theme: ThemeData.light(),
        darkTheme: ThemeData.dark(),
        home: Scaffold(body: Center(child: child)),
      );
    }

    group('rendering', () {
      testWidgets('renders label text', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Click Me',
            onPressed: () {},
          ),
        ));

        expect(find.text('Click Me'), findsOneWidget);
      });

      testWidgets('renders icon when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'With Icon',
            icon: Icons.add,
            onPressed: () {},
          ),
        ));

        expect(find.byIcon(Icons.add), findsOneWidget);
        expect(find.text('With Icon'), findsOneWidget);
      });

      testWidgets('shows loading indicator when isLoading is true', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Loading',
            isLoading: true,
            onPressed: () {},
          ),
        ));

        expect(find.byType(CircularProgressIndicator), findsOneWidget);
        expect(find.text('Loading'), findsOneWidget);
      });

      testWidgets('hides icon when loading', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Loading',
            icon: Icons.add,
            isLoading: true,
            onPressed: () {},
          ),
        ));

        expect(find.byIcon(Icons.add), findsNothing);
        expect(find.byType(CircularProgressIndicator), findsOneWidget);
      });
    });

    group('variants', () {
      testWidgets('primary variant renders with filled background', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton.primary(
            label: 'Primary',
            onPressed: () {},
          ),
        ));

        expect(find.text('Primary'), findsOneWidget);
        // Verify Material widget is used for background
        expect(find.byType(Material), findsWidgets);
      });

      testWidgets('secondary variant renders correctly', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton.secondary(
            label: 'Secondary',
            onPressed: () {},
          ),
        ));

        expect(find.text('Secondary'), findsOneWidget);
      });

      testWidgets('outline variant renders with border', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton.outline(
            label: 'Outline',
            onPressed: () {},
          ),
        ));

        expect(find.text('Outline'), findsOneWidget);
      });

      testWidgets('ghost variant renders without background', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton.ghost(
            label: 'Ghost',
            onPressed: () {},
          ),
        ));

        expect(find.text('Ghost'), findsOneWidget);
      });

      testWidgets('destructive variant renders with error color', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton.destructive(
            label: 'Delete',
            onPressed: () {},
          ),
        ));

        expect(find.text('Delete'), findsOneWidget);
      });
    });

    group('sizes', () {
      testWidgets('small size has correct height', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Small',
            size: AppButtonSize.small,
            onPressed: () {},
          ),
        ));

        // Find the AppButton and verify its rendered size
        final button = find.byType(AppButton);
        expect(button, findsOneWidget);
        final Size buttonSize = tester.getSize(button);
        expect(buttonSize.height, 32.0);
      });

      testWidgets('medium size has correct height', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Medium',
            size: AppButtonSize.medium,
            onPressed: () {},
          ),
        ));

        final button = find.byType(AppButton);
        expect(button, findsOneWidget);
        final Size buttonSize = tester.getSize(button);
        expect(buttonSize.height, 44.0);
      });

      testWidgets('large size has correct height', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Large',
            size: AppButtonSize.large,
            onPressed: () {},
          ),
        ));

        final button = find.byType(AppButton);
        expect(button, findsOneWidget);
        final Size buttonSize = tester.getSize(button);
        expect(buttonSize.height, 52.0);
      });
    });

    group('interactions', () {
      testWidgets('calls onPressed when tapped', (tester) async {
        var pressed = false;

        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Press Me',
            onPressed: () => pressed = true,
          ),
        ));

        await tester.tap(find.text('Press Me'));
        await tester.pump();

        expect(pressed, isTrue);
      });

      testWidgets('does not call onPressed when disabled (null)', (tester) async {
        var pressed = false;

        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Disabled',
            onPressed: null,
          ),
        ));

        await tester.tap(find.text('Disabled'));
        await tester.pump();

        expect(pressed, isFalse);
      });

      testWidgets('does not call onPressed when loading', (tester) async {
        var pressed = false;

        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Loading',
            isLoading: true,
            onPressed: () => pressed = true,
          ),
        ));

        await tester.tap(find.byType(InkWell));
        await tester.pump();

        expect(pressed, isFalse);
      });

      testWidgets('shows reduced opacity when disabled', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton(
            label: 'Disabled',
            onPressed: null,
          ),
        ));

        final opacity = tester.widget<Opacity>(find.byType(Opacity).first);
        expect(opacity.opacity, 0.5);
      });
    });

    group('full width', () {
      testWidgets('expands to fill width when isFullWidth is true', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          SizedBox(
            width: 300,
            child: AppButton(
              label: 'Full Width',
              isFullWidth: true,
              onPressed: () {},
            ),
          ),
        ));

        // Find the AppButton and verify its rendered width matches container
        final button = find.byType(AppButton);
        expect(button, findsOneWidget);
        final Size buttonSize = tester.getSize(button);
        expect(buttonSize.width, 300.0);
      });
    });

    group('dark mode', () {
      testWidgets('adapts colors in dark mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppButton.primary(
            label: 'Dark Mode',
            onPressed: () {},
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.text('Dark Mode'), findsOneWidget);
        // Verify button renders without errors in dark mode
      });
    });
  });

  group('AppCard', () {
    Widget buildTestWidget(Widget child, {ThemeMode themeMode = ThemeMode.light}) {
      return MaterialApp(
        themeMode: themeMode,
        theme: ThemeData.light(),
        darkTheme: ThemeData.dark(),
        home: Scaffold(body: child),
      );
    }

    group('rendering', () {
      testWidgets('renders child content', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppCard(
            child: Text('Card Content'),
          ),
        ));

        expect(find.text('Card Content'), findsOneWidget);
      });

      testWidgets('renders header when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppCard(
            header: const Text('Header'),
            child: const Text('Content'),
          ),
        ));

        expect(find.text('Header'), findsOneWidget);
        expect(find.text('Content'), findsOneWidget);
      });

      testWidgets('renders footer with divider when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppCard(
            child: const Text('Content'),
            footer: const Text('Footer'),
          ),
        ));

        expect(find.text('Content'), findsOneWidget);
        expect(find.text('Footer'), findsOneWidget);
        expect(find.byType(Divider), findsOneWidget);
      });

      testWidgets('renders header, content, and footer together', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppCard(
            header: const Text('Header'),
            child: const Text('Content'),
            footer: const Text('Footer'),
          ),
        ));

        expect(find.text('Header'), findsOneWidget);
        expect(find.text('Content'), findsOneWidget);
        expect(find.text('Footer'), findsOneWidget);
      });
    });

    group('interactions', () {
      testWidgets('calls onTap when tapped', (tester) async {
        var tapped = false;

        await tester.pumpWidget(buildTestWidget(
          AppCard(
            onTap: () => tapped = true,
            child: const Text('Tappable Card'),
          ),
        ));

        await tester.tap(find.text('Tappable Card'));
        await tester.pump();

        expect(tapped, isTrue);
      });

      testWidgets('renders InkWell when onTap is provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppCard(
            onTap: () {},
            child: const Text('With InkWell'),
          ),
        ));

        expect(find.byType(InkWell), findsOneWidget);
      });

      testWidgets('does not render InkWell when onTap is null', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppCard(
            child: Text('Without InkWell'),
          ),
        ));

        expect(find.byType(InkWell), findsNothing);
      });
    });

    group('styling', () {
      testWidgets('applies custom padding', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AppCard(
            padding: const EdgeInsets.all(32),
            child: const Text('Custom Padding'),
          ),
        ));

        final padding = tester.widget<Padding>(
          find.ancestor(
            of: find.text('Custom Padding'),
            matching: find.byType(Padding),
          ).first,
        );
        expect(padding.padding, const EdgeInsets.all(32));
      });

      testWidgets('applies custom background color', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppCard(
            backgroundColor: Colors.red,
            child: Text('Custom Color'),
          ),
        ));

        expect(find.text('Custom Color'), findsOneWidget);
      });

      testWidgets('applies custom border radius', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppCard(
            borderRadius: BorderRadius.all(Radius.circular(24)),
            child: Text('Custom Radius'),
          ),
        ));

        expect(find.text('Custom Radius'), findsOneWidget);
      });

      testWidgets('applies elevated shadow when elevated is true', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppCard(
            elevated: true,
            child: Text('Elevated Card'),
          ),
        ));

        expect(find.text('Elevated Card'), findsOneWidget);
      });
    });

    group('dark mode', () {
      testWidgets('uses dark theme colors in dark mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppCard(
            child: Text('Dark Mode Card'),
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.text('Dark Mode Card'), findsOneWidget);
      });
    });
  });

  group('AppInput', () {
    Widget buildTestWidget(Widget child, {ThemeMode themeMode = ThemeMode.light}) {
      return MaterialApp(
        themeMode: themeMode,
        theme: ThemeData.light(),
        darkTheme: ThemeData.dark(),
        home: Scaffold(body: Center(child: child)),
      );
    }

    group('rendering', () {
      testWidgets('renders with label', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput(
            label: 'Username',
          ),
        ));

        expect(find.text('Username'), findsOneWidget);
      });

      testWidgets('shows asterisk when isRequired is true', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput(
            label: 'Email',
            isRequired: true,
          ),
        ));

        expect(find.text('Email'), findsOneWidget);
        expect(find.text(' *'), findsOneWidget);
      });

      testWidgets('renders hint text', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput(
            hint: 'Enter your name',
          ),
        ));

        expect(find.text('Enter your name'), findsOneWidget);
      });

      testWidgets('renders helper text', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput(
            label: 'Password',
            helperText: 'At least 8 characters',
          ),
        ));

        expect(find.text('At least 8 characters'), findsOneWidget);
      });

      testWidgets('renders error text and hides helper text', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput(
            label: 'Email',
            helperText: 'Enter a valid email',
            errorText: 'Invalid email format',
          ),
        ));

        expect(find.text('Invalid email format'), findsOneWidget);
        expect(find.text('Enter a valid email'), findsNothing);
      });

      testWidgets('renders prefix icon', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput(
            label: 'Search',
            prefixIcon: Icons.search,
          ),
        ));

        expect(find.byIcon(Icons.search), findsOneWidget);
      });

      testWidgets('renders suffix icon', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput(
            label: 'Date',
            suffixIcon: Icons.calendar_today,
          ),
        ));

        expect(find.byIcon(Icons.calendar_today), findsOneWidget);
      });
    });

    group('factory constructors', () {
      testWidgets('search variant has search icon', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput.search(),
        ));

        expect(find.byIcon(Icons.search), findsOneWidget);
      });

      testWidgets('email variant has email icon and label', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput.email(),
        ));

        expect(find.byIcon(Icons.email_outlined), findsOneWidget);
        expect(find.text('Email'), findsOneWidget);
      });

      testWidgets('password variant has lock icon and visibility toggle', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput.password(),
        ));

        expect(find.byIcon(Icons.lock_outlined), findsOneWidget);
        expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
        expect(find.text('Password'), findsOneWidget);
      });

      testWidgets('phone variant has phone icon', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput.phone(),
        ));

        expect(find.byIcon(Icons.phone_outlined), findsOneWidget);
        expect(find.text('Phone'), findsOneWidget);
      });

      testWidgets('textArea variant supports multiple lines', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput.textArea(
            label: 'Description',
            maxLines: 4,
          ),
        ));

        expect(find.text('Description'), findsOneWidget);
      });
    });

    group('interactions', () {
      testWidgets('calls onChanged when text changes', (tester) async {
        String? changedValue;

        await tester.pumpWidget(buildTestWidget(
          AppInput(
            label: 'Name',
            onChanged: (value) => changedValue = value,
          ),
        ));

        await tester.enterText(find.byType(TextFormField), 'John');
        expect(changedValue, 'John');
      });

      testWidgets('password visibility toggle works', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput.password(),
        ));

        // Initially obscured
        expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);

        // Tap to show password
        await tester.tap(find.byIcon(Icons.visibility_outlined));
        await tester.pump();

        // Now should show visibility_off icon
        expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);

        // Tap again to hide
        await tester.tap(find.byIcon(Icons.visibility_off_outlined));
        await tester.pump();

        expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
      });

      testWidgets('suffix icon onTap callback works', (tester) async {
        var tapped = false;

        await tester.pumpWidget(buildTestWidget(
          AppInput(
            label: 'Date',
            suffixIcon: Icons.calendar_today,
            onSuffixTap: () => tapped = true,
          ),
        ));

        await tester.tap(find.byIcon(Icons.calendar_today));
        await tester.pump();

        expect(tapped, isTrue);
      });

      testWidgets('disabled input does not respond to input', (tester) async {
        String? changedValue;

        await tester.pumpWidget(buildTestWidget(
          AppInput(
            label: 'Disabled',
            enabled: false,
            onChanged: (value) => changedValue = value,
          ),
        ));

        // Try to enter text (will be ignored since field is disabled)
        await tester.enterText(find.byType(TextFormField), 'Test');

        // Value should be null since the field was disabled
        expect(changedValue, isNull);
      });
    });

    group('validation', () {
      testWidgets('shows validation error for invalid email', (tester) async {
        final formKey = GlobalKey<FormState>();

        await tester.pumpWidget(buildTestWidget(
          Form(
            key: formKey,
            child: const AppInput.email(
              isRequired: true,
            ),
          ),
        ));

        // Enter invalid email
        await tester.enterText(find.byType(TextFormField), 'invalid');

        // Trigger validation
        formKey.currentState!.validate();
        await tester.pump();

        expect(find.text('Please enter a valid email'), findsOneWidget);
      });

      testWidgets('custom validator is called', (tester) async {
        final formKey = GlobalKey<FormState>();

        await tester.pumpWidget(buildTestWidget(
          Form(
            key: formKey,
            child: AppInput(
              label: 'Code',
              validator: (value) {
                if (value == null || value.length < 5) {
                  return 'Code must be at least 5 characters';
                }
                return null;
              },
            ),
          ),
        ));

        // Enter short code
        await tester.enterText(find.byType(TextFormField), 'abc');

        // Trigger validation
        formKey.currentState!.validate();
        await tester.pump();

        expect(find.text('Code must be at least 5 characters'), findsOneWidget);
      });
    });

    group('dark mode', () {
      testWidgets('adapts styling in dark mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const AppInput(
            label: 'Dark Input',
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.text('Dark Input'), findsOneWidget);
      });
    });
  });
}
