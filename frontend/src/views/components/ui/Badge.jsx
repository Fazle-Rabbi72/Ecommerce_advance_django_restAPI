import React from "react";

/**
 * Standard StatusChip / Badge Component
 * Normalizes status strings and displays uniform color tokens across Customer, Vendor, and Admin
 */
export const Badge = ({
  status = "pending",
  label = null,
  showDot = true,
  size = "md",
  className = "",
}) => {
  const normalized = (status || "").toLowerCase().trim();

  // Status mapping
  const getStatusConfig = (val) => {
    if (val.includes("deliver") || val.includes("fulfill") || val === "completed" || val === "paid" || val === "active" || val === "published") {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        defaultLabel: "Delivered",
      };
    }
    if (val.includes("ship") || val.includes("transit") || val.includes("dispatched")) {
      return {
        bg: "bg-sky-50 text-sky-700 border-sky-200",
        dot: "bg-sky-500 animate-pulse",
        defaultLabel: "In Transit",
      };
    }
    if (val.includes("process") || val.includes("confirmed") || val.includes("packed")) {
      return {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dot: "bg-indigo-500 animate-pulse",
        defaultLabel: "Processing",
      };
    }
    if (val.includes("pend") || val === "unpaid" || val === "awaiting") {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
        defaultLabel: "Pending",
      };
    }
    if (val.includes("cancel") || val.includes("reject") || val === "failed" || val === "expired") {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
        defaultLabel: "Cancelled",
      };
    }
    if (val.includes("refund")) {
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        dot: "bg-purple-500",
        defaultLabel: "Refunded",
      };
    }
    if (val.includes("verif")) {
      return {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dot: "bg-indigo-600",
        defaultLabel: "Verified",
      };
    }
    return {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
      defaultLabel: status,
    };
  };

  const config = getStatusConfig(normalized);
  const displayText = label || config.defaultLabel;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-[11px] gap-1.5",
    lg: "px-3 py-1.5 text-xs gap-2",
  };

  return (
    <span
      className={`
        inline-flex items-center font-bold uppercase tracking-wider rounded-full border
        ${config.bg}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      )}
      <span className="truncate">{displayText}</span>
    </span>
  );
};

export const StatusChip = Badge;
export default Badge;
