"use client";

import { forwardRef } from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  hint?: string;
  label?: string;
  id?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, hint, label, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id ?? props.name} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id ?? props.name}
          className={`w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-text shadow-sm placeholder:text-muted transition focus:outline-none focus:ring-2 focus:ring-ring ${
            error ? "border-danger ring-danger/40" : ""
          } ${className}`.trim()}
          {...props}
        />
        {(hint || error) && (
          <p className={`text-xs ${error ? "text-danger" : "text-muted"}`}>{error ?? hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
