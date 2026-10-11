import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Standard Accessible Button Component
 * - Variants: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
 * - Sizes: 'sm' | 'md' | 'lg'
 * - Guarantees minimum touch target >= 44px on mobile
 */
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-bold transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]";

  const sizeClasses = {
    sm: "text-xs px-3.5 py-2 min-h-[36px] sm:min-h-[38px] rounded-full gap-1.5",
    md: "text-xs sm:text-sm px-5 py-2.5 min-h-[44px] rounded-full gap-2",
    lg: "text-sm sm:text-base px-7 py-3 min-h-[48px] rounded-full gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 border border-transparent",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 shadow-xs",
    outline:
      "bg-transparent hover:bg-indigo-50/60 text-indigo-600 border border-indigo-200 hover:border-indigo-300",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 border border-transparent",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 border border-transparent",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
