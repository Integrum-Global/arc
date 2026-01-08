import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Typography Components
 *
 * A comprehensive set of typography components for consistent text styling
 * throughout the ARC Investment Platform.
 */

// Shared props interface
interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Display - Large hero text for major headings
 */
export function Display({
  children,
  className,
  as: Component = "h1",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn(
        "text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl",
        className
      ),
      ...props,
    },
    children
  );
}

/**
 * H1 - Primary page heading
 */
export function H1({
  children,
  className,
  as: Component = "h1",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn(
        "scroll-m-20 text-4xl font-bold tracking-tight md:text-5xl",
        className
      ),
      ...props,
    },
    children
  );
}

/**
 * H2 - Section heading
 */
export function H2({
  children,
  className,
  as: Component = "h2",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn(
        "scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0",
        className
      ),
      ...props,
    },
    children
  );
}

/**
 * H3 - Subsection heading
 */
export function H3({
  children,
  className,
  as: Component = "h3",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      ),
      ...props,
    },
    children
  );
}

/**
 * H4 - Minor heading
 */
export function H4({
  children,
  className,
  as: Component = "h4",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className
      ),
      ...props,
    },
    children
  );
}

/**
 * Body - Standard body text
 */
export function Body({
  children,
  className,
  as: Component = "p",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn("leading-7 [&:not(:first-child)]:mt-6", className),
      ...props,
    },
    children
  );
}

/**
 * BodySmall - Smaller body text
 */
export function BodySmall({
  children,
  className,
  as: Component = "p",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn("text-sm leading-relaxed", className),
      ...props,
    },
    children
  );
}

/**
 * Caption - Small supplementary text
 */
export function Caption({
  children,
  className,
  as: Component = "span",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn("text-xs text-muted-foreground", className),
      ...props,
    },
    children
  );
}

/**
 * Mono - Monospace text for code, data, and numbers
 */
export function Mono({
  children,
  className,
  as: Component = "span",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn("font-mono text-sm tabular-nums", className),
      ...props,
    },
    children
  );
}

/**
 * TextLabel - Form labels and small headings (named TextLabel to avoid conflict with shadcn Label)
 */
export function TextLabel({
  children,
  className,
  as: Component = "span",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      ),
      ...props,
    },
    children
  );
}

/**
 * Lead - Large lead paragraph text
 */
export function Lead({
  children,
  className,
  as: Component = "p",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn("text-xl text-muted-foreground", className),
      ...props,
    },
    children
  );
}

/**
 * Large - Large text for emphasis
 */
export function Large({
  children,
  className,
  as: Component = "div",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn("text-lg font-semibold", className),
      ...props,
    },
    children
  );
}

/**
 * Small - Small text
 */
export function Small({
  children,
  className,
  as: Component = "small",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn("text-sm font-medium leading-none", className),
      ...props,
    },
    children
  );
}

/**
 * Muted - Muted/secondary text
 */
export function Muted({
  children,
  className,
  as: Component = "p",
  ...props
}: TypographyProps) {
  return React.createElement(
    Component,
    {
      className: cn("text-sm text-muted-foreground", className),
      ...props,
    },
    children
  );
}

/**
 * Blockquote - Quoted text
 */
export function Blockquote({
  children,
  className,
  ...props
}: Omit<TypographyProps, "as">) {
  return (
    <blockquote
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    >
      {children}
    </blockquote>
  );
}

/**
 * InlineCode - Inline code snippets
 */
export function InlineCode({
  children,
  className,
  ...props
}: Omit<TypographyProps, "as">) {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}

/**
 * List - Unordered list
 */
export function List({
  children,
  className,
  ...props
}: Omit<TypographyProps, "as">) {
  return (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)} {...props}>
      {children}
    </ul>
  );
}

// Export all components
export const Typography = {
  Display,
  H1,
  H2,
  H3,
  H4,
  Body,
  BodySmall,
  Caption,
  Mono,
  TextLabel,
  Lead,
  Large,
  Small,
  Muted,
  Blockquote,
  InlineCode,
  List,
};
