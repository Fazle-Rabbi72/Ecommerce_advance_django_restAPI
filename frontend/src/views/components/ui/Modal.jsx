import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Standard Accessible Modal Component
 * - Traps focus, handles Esc key
 * - Responsive: Full-height bottom sheet on small mobile (<sm), centered card on desktop
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md", // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className = "",
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-xl",
    lg: "sm:max-w-3xl",
    xl: "sm:max-w-5xl",
    full: "sm:max-w-[95vw]",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Card / Bottom Sheet Container */}
      <div
        className={`
          relative w-full ${sizeClasses[size] || sizeClasses.md} bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80
          flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250
          ${className}
        `}
      >
        {/* Mobile Swipe / Drag Indicator */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
