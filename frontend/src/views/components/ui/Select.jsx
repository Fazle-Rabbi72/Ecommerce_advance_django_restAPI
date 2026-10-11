import React, { forwardRef } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

export const Select = forwardRef(
  (
    {
      label,
      options = [],
      error,
      hint,
      id,
      name,
      value,
      onChange,
      disabled = false,
      required = false,
      placeholder = "Select an option",
      className = "",
      containerClassName = "",
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || name || `select-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold text-slate-700 tracking-wide select-none"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={`
              w-full min-h-[44px] py-2.5 pl-4 pr-10 text-xs sm:text-sm text-slate-900 bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white
              rounded-2xl border transition-all duration-200 outline-none appearance-none cursor-pointer
              ${
                error
                  ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              }
              disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children
              ? children
              : options.map((opt) => (
                  <option
                    key={typeof opt === "object" ? opt.value : opt}
                    value={typeof opt === "object" ? opt.value : opt}
                  >
                    {typeof opt === "object" ? opt.label : opt}
                  </option>
                ))}
          </select>

          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
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

Select.displayName = "Select";

export default Select;
