"use client";

import { forwardRef } from "react";

export const buttonMotionClasses =
  "cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg))] dark:focus-visible:ring-offset-surface motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:-translate-y-0 motion-reduce:active:scale-100";

const VARIANTS = {
  primary: "bg-primary text-bg shadow-sm hover:bg-primary-hover hover:shadow-md",
  secondary: "border border-border/80 bg-[hsl(var(--bg))] text-text shadow-sm hover:bg-surface hover:shadow-md",
  ghost: "text-text hover:bg-surface/70",
  destructive: "bg-danger text-bg shadow-sm hover:bg-danger/85 hover:shadow-md",
} as const;

const SIZES = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9 p-0",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  includeDisabled?: boolean;
};

const baseInline = "select-none inline-flex items-center justify-center font-semibold tracking-tight cursor-pointer";
const disabledClasses = "disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed";

function radiusForSize(size: ButtonSize) {
  return size === "icon" ? "rounded-full" : "rounded-2xl";
}

function gapForSize(size: ButtonSize) {
  return size === "icon" ? "gap-0" : "gap-2";
}

export function buttonClassNames({
  variant = "primary",
  size = "md",
  className = "",
  includeDisabled = true,
}: ButtonClassOptions = {}) {
  const classes = [
    baseInline,
    gapForSize(size),
    radiusForSize(size),
    buttonMotionClasses,
    VARIANTS[variant],
    SIZES[size],
    includeDisabled ? disabledClasses : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return classes;
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const spinner = (
      <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-bg border-t-transparent" aria-hidden />
    );

    return (
      <button
        ref={ref}
        data-variant={variant}
        className={buttonClassNames({
          variant,
          size,
          className: `${isLoading ? "cursor-progress" : ""} ${className}`.trim(),
        })}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && spinner}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
