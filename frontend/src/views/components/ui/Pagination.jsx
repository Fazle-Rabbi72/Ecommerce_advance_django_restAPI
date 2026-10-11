import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Accessible, touch-friendly Pagination component.
 */
export const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalItems,
    pageSize,
    className = '',
}) => {
    if (totalPages <= 1) return null;

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Calculate start and end items count
    const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
    const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

    // Build page numbers (condensed on small screens)
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <nav
            aria-label="Pagination Navigation"
            className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 ${className}`}
        >
            {totalItems !== undefined && (
                <p className="text-xs sm:text-sm text-slate-500 order-2 sm:order-1 text-center sm:text-left">
                    Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
                    <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
                    <span className="font-semibold text-slate-700">{totalItems}</span> results
                </p>
            )}

            <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentPage <= 1}
                    style={{ borderRadius: "9999px" }}
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] px-3.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    aria-label="Go to previous page"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1">
                    {pages[0] > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={() => onPageChange(1)}
                                style={{ borderRadius: "9999px" }}
                                className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                aria-label="Go to page 1"
                            >
                                1
                            </button>
                            {pages[0] > 2 && <span className="px-1 text-slate-400">…</span>}
                        </>
                    )}

                    {pages.map((p) => {
                        const isActive = p === currentPage;
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange(p)}
                                aria-current={isActive ? 'page' : undefined}
                                style={{ borderRadius: "9999px" }}
                                className={`flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {p}
                            </button>
                        );
                    })}

                    {pages[pages.length - 1] < totalPages && (
                        <>
                            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
                            <button
                                type="button"
                                onClick={() => onPageChange(totalPages)}
                                style={{ borderRadius: "9999px" }}
                                className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                aria-label={`Go to page ${totalPages}`}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentPage >= totalPages}
                    style={{ borderRadius: "9999px" }}
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] px-3.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    aria-label="Go to next page"
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                </button>
            </div>
        </nav>
    );
};
