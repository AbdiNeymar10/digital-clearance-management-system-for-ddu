import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "outline-light"
    | "ghost"
    | "teal"
    | "subtle";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs tracking-wide gap-1.5",
      md: "h-11 px-5 text-sm tracking-wide gap-2",
      lg: "h-12 px-6 text-base tracking-wide gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow focus-visible:ring-blue-600 border border-blue-600/30",
      secondary:
        "bg-[#0b1a2e] hover:bg-[#102642] text-white shadow-sm hover:shadow focus-visible:ring-slate-800 border border-slate-700/40",
      outline:
        "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm focus-visible:ring-blue-500",
      "outline-light":
        "border border-white/20 bg-white/10 hover:bg-white/15 text-white backdrop-blur-sm focus-visible:ring-white/50",
      ghost:
        "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 focus-visible:ring-slate-400",
      teal:
        "bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow focus-visible:ring-teal-600 border border-teal-500/30",
      subtle:
        "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-800 focus-visible:ring-blue-400",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
