import React from 'react';
import { Button } from './Button';

/**
 * Standardized EmptyState component for data views across Customer, Vendor, and Admin.
 */
export const EmptyState = ({
    icon: Icon,
    title = 'No items found',
    description = 'There are no records to display at this moment.',
    actionLabel,
    onAction,
    actionHref,
    secondaryActionLabel,
    onSecondaryAction,
    className = '',
}) => {
    return (
        <div
            className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-3xl border border-dashed border-slate-200 ${className}`}
            role="status"
            aria-live="polite"
        >
            {Icon && (
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-8 h-8" aria-hidden="true" />
                </div>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                {title}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                {description}
            </p>

            {(actionLabel || secondaryActionLabel) && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {secondaryActionLabel && (
                        <Button
                            variant="secondary"
                            onClick={onSecondaryAction}
                        >
                            {secondaryActionLabel}
                        </Button>
                    )}
                    {actionLabel && (
                        actionHref ? (
                            <a
                                href={actionHref}
                                className="inline-flex items-center justify-center font-medium rounded-xl transition-all min-h-[44px] min-w-[44px] px-5 py-2.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-100"
                            >
                                {actionLabel}
                            </a>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={onAction}
                            >
                                {actionLabel}
                            </Button>
                        )
                    )}
                </div>
            )}
        </div>
    );
};
