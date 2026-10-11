import React from "react";

/**
 * Standard Surface Card Component & subcomponents
 */
export const Card = ({
  children,
  className = "",
  header,
  footer,
  padding = true,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden
        ${onClick ? "cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.99]" : ""}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {header}
        </div>
      )}

      <div className={padding ? "p-5 sm:p-6" : ""}>{children}</div>

      {footer && (
        <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export const CardHeader = ({ children, className = "" }) => (
  <div className={`p-5 sm:p-6 border-b border-slate-100 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-base sm:text-lg font-bold text-slate-900 ${className}`}>{children}</h3>
);

export const CardDescription = ({ children, className = "" }) => (
  <p className={`text-xs text-slate-500 mt-0.5 ${className}`}>{children}</p>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-5 sm:p-6 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = "" }) => (
  <div className={`p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100 ${className}`}>{children}</div>
);

export default Card;
