import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export const Input = forwardRef(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      type = "text",
      id,
      name,
      value,
      onChange,
      placeholder,
      disabled = false,
      required = false,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const inputId = id || name || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-slate-700 tracking-wide select-none"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            required={required}
            className={`
              w-full min-h-[44px] py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white
              rounded-2xl border transition-all duration-200 outline-none
              ${Icon ? "pl-10 pr-4" : "px-4"}
              ${
                error
                  ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              }
              disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {hint && !error && (
          <p className="text-[11px] text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
