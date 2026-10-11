import React from "react";

/**
 * Standard Metric / Stat Card Component
 * Consistently used across Customer, Vendor, and Admin Dashboards
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = "up", // 'up' | 'down' | 'neutral'
  color = "indigo", // 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose'
  className = "",
  onClick,
}) => {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-50/70",
      text: "text-indigo-600",
      border: "border-indigo-100",
    },
    emerald: {
      bg: "bg-emerald-50/70",
      text: "text-emerald-600",
      border: "border-emerald-100",
    },
    amber: {
      bg: "bg-amber-50/70",
      text: "text-amber-600",
      border: "border-amber-100",
    },
    sky: {
      bg: "bg-sky-50/70",
      text: "text-sky-600",
      border: "border-sky-100",
    },
    rose: {
      bg: "bg-rose-50/70",
      text: "text-rose-600",
      border: "border-rose-100",
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200
        ${onClick ? "cursor-pointer hover:border-indigo-300 active:scale-[0.99]" : ""}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-2xl ${scheme.bg} ${scheme.text} flex items-center justify-center shrink-0 shadow-inner`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-bold ml-auto flex items-center gap-0.5 ${
                trendDirection === "up"
                  ? "text-emerald-600"
                  : trendDirection === "down"
                  ? "text-rose-600"
                  : "text-slate-600"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
