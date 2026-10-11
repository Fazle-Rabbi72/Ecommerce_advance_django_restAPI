import React from "react";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

/**
 * Responsive DataTable Component
 * - Desktop (>= 768px): Polished table with sticky header and hover transitions
 * - Mobile (< 768px): Automatically transforms into stacked touch-friendly cards!
 */
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = "No data found",
  emptyDescription = "There are no records to display at this time.",
  emptyIcon,
  emptyAction,
  keyField = "id",
  renderMobileCard,
  stickyHeader = true,
  className = "",
}) => {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 w-full rounded-2xl bg-slate-100 skeleton-shimmer"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* ------------------------------------------------------------- */}
      {/* DESKTOP TABLE VIEW (>= 768px)                                */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              className={`bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px] ${
                stickyHeader ? "sticky top-0 z-10 backdrop-blur-md" : ""
              }`}
            >
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`p-4 font-extrabold ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {data.map((row, rIdx) => {
              const rowKey = row[keyField] || row.oid || row.id || rIdx;
              return (
                <tr
                  key={rowKey}
                  className="hover:bg-slate-50/70 transition-colors duration-150"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      className={`p-4 align-middle ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE STACKED CARDS VIEW (< 768px)                          */}
      {/* ------------------------------------------------------------- */}
      <div className="md:hidden divide-y divide-slate-100 p-2 space-y-3">
        {data.map((row, rIdx) => {
          const rowKey = row[keyField] || row.oid || row.id || rIdx;

          if (renderMobileCard) {
            return (
              <div key={rowKey} className="p-1">
                {renderMobileCard(row)}
              </div>
            );
          }

          // Default auto-generated card for mobile
          return (
            <div
              key={rowKey}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3"
            >
              {columns.map((col, cIdx) => {
                if (col.hideOnMobile) return null;
                const value = col.render ? col.render(row) : row[col.key];

                // If column is action or full width
                if (col.isAction) {
                  return (
                    <div
                      key={col.key || cIdx}
                      className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2"
                    >
                      {value}
                    </div>
                  );
                }

                return (
                  <div
                    key={col.key || cIdx}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                      {col.mobileLabel || col.header}
                    </span>
                    <div className="font-semibold text-slate-800 text-right">
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataTable;
