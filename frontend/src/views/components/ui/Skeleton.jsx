import React from 'react';

/**
 * Lightweight, accessible Skeleton shimmer component.
 */
export const Skeleton = ({
    variant = 'rectangular', // 'text' | 'circular' | 'rectangular' | 'rounded'
    width,
    height,
    className = '',
    style = {},
}) => {
    let variantStyles = 'rounded-md';
    if (variant === 'circular') {
        variantStyles = 'rounded-full';
    } else if (variant === 'rounded') {
        variantStyles = 'rounded-2xl';
    } else if (variant === 'text') {
        variantStyles = 'rounded h-4 my-1';
    }

    const inlineStyle = {
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        ...style,
    };

    return (
        <div
            className={`animate-pulse bg-slate-200/80 ${variantStyles} ${className}`}
            style={inlineStyle}
            aria-hidden="true"
        />
    );
};
