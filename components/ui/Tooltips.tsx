"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Tooltip - Hover/focus tooltip component
 */
export function Tooltip({
    children,
    content,
    position = "top",
    delay = 300
}: {
    children: React.ReactNode;
    content: string | React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setShouldShow(true);
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setShouldShow(false);
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2"
    };

    const arrowClasses = {
        top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800",
        bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800",
        left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800",
        right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800"
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleMouseEnter}
            onBlur={handleMouseLeave}
        >
            {children}
            {shouldShow && (
                <div
                    className={`absolute z-50 ${positionClasses[position]} transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap max-w-xs">
                        {content}
                    </div>
                    <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
                </div>
            )}
        </div>
    );
}

/**
 * HelpIcon - Question mark icon with tooltip
 */
export function HelpIcon({
    content,
    size = "sm"
}: {
    content: string | React.ReactNode;
    size?: "sm" | "md";
}) {
    const sizeClasses = {
        sm: "w-4 h-4 text-xs",
        md: "w-5 h-5 text-sm"
    };

    return (
        <Tooltip content={content} position="top">
            <button
                className={`${sizeClasses[size]} rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors inline-flex items-center justify-center cursor-help`}
                aria-label="Help"
            >
                ?
            </button>
        </Tooltip>
    );
}

/**
 * InfoBanner - Informational banner with icon
 */
export function InfoBanner({
    type = "info",
    title,
    message,
    onDismiss
}: {
    type?: "info" | "warning" | "success" | "error";
    title?: string;
    message: string;
    onDismiss?: () => void;
}) {
    const styles = {
        info: {
            bg: "bg-blue-500/10",
            border: "border-blue-500/30",
            text: "text-blue-300",
            icon: "ℹ️"
        },
        warning: {
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/30",
            text: "text-yellow-300",
            icon: "⚠️"
        },
        success: {
            bg: "bg-green-500/10",
            border: "border-green-500/30",
            text: "text-green-300",
            icon: "✅"
        },
        error: {
            bg: "bg-red-500/10",
            border: "border-red-500/30",
            text: "text-red-300",
            icon: "❌"
        }
    };

    const style = styles[type];

    return (
        <div className={`${style.bg} ${style.border} border rounded-lg p-4 ${style.text} relative`}>
            <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{style.icon}</span>
                <div className="flex-1">
                    {title && <h4 className="font-semibold mb-1">{title}</h4>}
                    <p className="text-sm opacity-90">{message}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-slate-400 hover:text-white transition-colors"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * FeatureHighlight - Highlight new features with pulsing indicator
 */
export function FeatureHighlight({
    children,
    label = "NEW",
    color = "cyan"
}: {
    children: React.ReactNode;
    label?: string;
    color?: "cyan" | "purple" | "green";
}) {
    const colorClasses = {
        cyan: "bg-cyan-500 text-cyan-900",
        purple: "bg-purple-500 text-purple-900",
        green: "bg-green-500 text-green-900"
    };

    return (
        <div className="relative inline-block">
            {children}
            <span className={`absolute -top-2 -right-2 ${colorClasses[color]} text-xs font-bold px-2 py-0.5 rounded-full animate-pulse`}>
                {label}
            </span>
        </div>
    );
}
