/**
 * Layout Components Index
 *
 * Central export point for all layout components.
 * Import from "@/components/layout" for a clean API.
 */

// Core layout components
export { AppShell } from "./AppShell";
export type { AppShellProps } from "./AppShell";

export { Header } from "./Header";
export type { HeaderProps } from "./Header";

export { Sidebar } from "./Sidebar";
export type { SidebarProps } from "./Sidebar";

export { MobileNav } from "./MobileNav";
export type { MobileNavProps } from "./MobileNav";

// Page components
export { PageContainer, PageContainerSkeleton } from "./PageContainer";
export type { PageContainerProps } from "./PageContainer";

// Grid system
export { Grid, GridItem } from "./Grid";
export type {
  GridProps,
  GridItemProps,
  Columns,
  ResponsiveColumns,
  SpanCount,
  ResponsiveSpan,
  GapSize,
} from "./Grid";

// Section components
export { Section, SectionGroup } from "./Section";
export type { SectionProps, SectionGroupProps } from "./Section";

// Navigation components
export { Breadcrumb, BreadcrumbSeparator } from "./Breadcrumb";
export type { BreadcrumbProps, BreadcrumbItem, BreadcrumbSeparatorProps } from "./Breadcrumb";
