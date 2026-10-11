import React from "react";

/**
 * Standard Accessible Horizontal Tabs Component
 */
export const Tabs = ({
  tabs = [], // [{ id: 'all', label: 'All Orders', count: 12, icon: Icon }]
  activeTab,
  onChange,
  className = "",
}) => {
  return (
    <div
      role="tablist"
      aria-label="Filter Tabs"
      className={`flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl overflow-x-auto scrollbar-none w-fit max-w-full ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap select-none cursor-pointer
              ${
                isActive
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }
            `}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
