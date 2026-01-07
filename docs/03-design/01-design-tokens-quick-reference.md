# ARC Design Tokens - Quick Reference

## Color Palette

### Primary (Brand Blue)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `primary.500` | `#3B82F6` | `#3B82F6` | Primary buttons, links |
| `primary.600` | `#2563EB` | `#60A5FA` | Hover states |
| `primary.100` | `#DBEAFE` | `#1E3A8A` | Backgrounds |

### Financial (Semantic)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `positive` | `#16A34A` | `#4ADE80` | Gains, success |
| `positive.bg` | `#DCFCE7` | `#166534` | Positive backgrounds |
| `negative` | `#DC2626` | `#F87171` | Losses, errors |
| `negative.bg` | `#FEE2E2` | `#991B1B` | Negative backgrounds |
| `warning` | `#D97706` | `#FBBF24` | Alerts |
| `neutral` | `#6B7280` | `#9CA3AF` | Unchanged |

### Gray Scale

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `gray.50` | `#FAFAFA` | `#18181B` | Page bg |
| `gray.100` | `#F4F4F5` | `#27272A` | Card bg |
| `gray.200` | `#E4E4E7` | `#3F3F46` | Borders |
| `gray.500` | `#71717A` | `#A1A1AA` | Secondary text |
| `gray.800` | `#27272A` | `#F4F4F5` | Primary text |

---

## Typography

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display` | 48px | 700 | Hero metrics |
| `h1` | 32px | 700 | Page titles |
| `h2` | 24px | 600 | Section titles |
| `h3` | 20px | 600 | Card titles |
| `body.lg` | 16px | 400 | Body text |
| `body.md` | 14px | 400 | Secondary text |
| `body.sm` | 12px | 400 | Captions |
| `mono` | 14px | 400 | Numbers |

**Font:** Inter (primary), JetBrains Mono (numbers)

---

## Spacing

| Token | Value | Use |
|-------|-------|-----|
| `space.1` | 4px | Tight gaps |
| `space.2` | 8px | Related elements |
| `space.3` | 12px | Component padding |
| `space.4` | 16px | Default padding |
| `space.6` | 24px | Card padding |
| `space.8` | 32px | Section gaps |
| `space.12` | 48px | Major sections |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius.sm` | 4px | Chips, badges |
| `radius.md` | 6px | Buttons, inputs |
| `radius.lg` | 8px | Cards |
| `radius.xl` | 12px | Modals |
| `radius.full` | 9999px | Pills, avatars |

---

## Shadows

| Token | Light Mode | Use |
|-------|------------|-----|
| `shadow.sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `shadow.md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards |
| `shadow.lg` | `0 10px 15px rgba(0,0,0,0.1)` | Dropdowns |
| `shadow.xl` | `0 20px 25px rgba(0,0,0,0.15)` | Modals |

---

## Breakpoints

| Name | Range | Columns |
|------|-------|---------|
| Mobile | < 640px | 1-2 |
| Tablet | 640-1023px | 2-3 |
| Desktop | 1024-1439px | 3-4 |
| Wide | >= 1440px | 4-6 |

---

## Component Quick Reference

### Buttons

| Variant | Height | Use |
|---------|--------|-----|
| Primary (filled) | 48px | Main CTA (1 per page) |
| Secondary (outlined) | 40px | Secondary actions |
| Tertiary (text) | 32px | Inline actions |
| Danger (red filled) | 40px | Destructive |

### Cards

```
Padding: 16-24px
Border: 1px gray.200
Radius: 8px (radius.lg)
Shadow: shadow.md (hover: shadow.lg)
```

### Inputs

```
Height: 40-48px
Padding: 12px horizontal
Border: 1px gray.200
Radius: 6px (radius.md)
Focus: 2px primary ring
```

---

## Financial Display Patterns

### Price with Change

```
$193.42  +$2.15 (+1.12%)  [up arrow]
         ^^^^^^ ^^^^^^^^   ^^^^^^^^^
         green  green      green icon
```

### Ratio Display

```
P/E Ratio: 15.67x
           ^^^^^ mono font, 2 decimals + "x"
```

### Large Numbers

```
< $100K:     $99,999.00
$100K-$1M:   $500.00K
$1M-$1B:     $50.00M
> $1B:       $1.23B
```

---

## Accessibility Checklist

- [ ] Color contrast >= 4.5:1 (text)
- [ ] Color contrast >= 3:1 (UI elements)
- [ ] Never color-only indicators (add icon)
- [ ] Visible focus indicators (2px outline)
- [ ] Keyboard navigable (Tab, Enter, Escape)
- [ ] Screen reader labels on icons
- [ ] Respect reduced-motion preference

---

## Dark Mode Rules

1. Invert gray scale (50 <-> 900)
2. Lighten semantic colors (green, red)
3. Increase shadow opacity (10% -> 40%)
4. Same primary brand blue
5. Test all charts/graphs

---

## Chart Colors

```
1. #3B82F6 (Blue)
2. #10B981 (Emerald)
3. #F59E0B (Amber)
4. #EF4444 (Red)
5. #8B5CF6 (Purple)
6. #EC4899 (Pink)
7. #06B6D4 (Cyan)
8. #84CC16 (Lime)
```

---

## Animation Timings

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover | 150ms | ease-out |
| Press | 100ms | ease-in-out |
| Page transition | 200ms | ease-out |
| Loading shimmer | 1.5s | linear |
| Data highlight | 500ms | ease-in-out |

---

## Z-Index Scale

| Layer | Value |
|-------|-------|
| Base | 0 |
| Dropdown | 1000 |
| Sticky | 1100 |
| Drawer | 1200 |
| Modal | 1300 |
| Toast | 1400 |
| Overlay | 1500 |
