"use client";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useEffect } from "react";

/**
 * Accessible game components
 */

/**
 * AccessibleButton - Button with full accessibility support
 */
export function AccessibleButton({
    children,
    onClick,
    variant = "primary",
    size = "md",
    disabled = false,
    ariaLabel,
    ariaPressed,
    ariaExpanded,
    className = ""
}: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    ariaLabel?: string;
    ariaPressed?: boolean;
    ariaExpanded?: boolean;
    className?: string;
}) {
    const { settings } = useAccessibility();

    const variantClasses = {
        primary: "bg-cyan-500 hover:bg-cyan-600 text-white",
        secondary: "bg-slate-700 hover:bg-slate-600 text-white",
        danger: "bg-red-500 hover:bg-red-600 text-white"
    };

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-pressed={ariaPressed}
            aria-expanded={ariaExpanded}
            aria-disabled={disabled}
            className={`
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                rounded-lg font-semibold
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${settings.highContrast ? 'border-2 border-white' : ''}
                ${className}
            `}
        >
            {children}
        </button>
    );
}

/**
 * AccessibleCard - Card with proper landmarks
 */
export function AccessibleCard({
    title,
    children,
    ariaLabel,
    className = ""
}: {
    title?: string;
    children: React.ReactNode;
    ariaLabel?: string;
    className?: string;
}) {
    return (
        <article
            aria-label={ariaLabel || title}
            className={`bg-slate-800 border border-slate-700 rounded-xl p-6 ${className}`}
        >
            {title && (
                <h3 className="text-lg font-semibold text-white mb-4">
                    {title}
                </h3>
            )}
            {children}
        </article>
    );
}

/**
 * AccessibleInput - Form input with full a11y
 */
export function AccessibleInput({
    label,
    type = "text",
    value,
    onChange,
    error,
    helpText,
    required = false,
    disabled = false,
    placeholder,
    id
}: {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    helpText?: string;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    id?: string;
}) {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    return (
        <div className="space-y-2">
            <label
                htmlFor={inputId}
                className="block text-sm font-medium text-slate-200"
            >
                {label}
                {required && <span className="text-red-400 ml-1" aria-label="required">*</span>}
            </label>

            <input
                id={inputId}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                required={required}
                aria-invalid={!!error}
                aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
                aria-required={required}
                className={`
                    w-full px-3 py-2 rounded-lg
                    bg-slate-700 text-white
                    border-2 ${error ? 'border-red-500' : 'border-slate-600'}
                    focus:outline-none focus:ring-2 focus:ring-cyan-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            />

            {helpText && (
                <p id={helpId} className="text-xs text-slate-400">
                    {helpText}
                </p>
            )}

            {error && (
                <p id={errorId} className="text-xs text-red-400" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * AccessibleProgress - Progress bar with announcements
 */
export function AccessibleProgress({
    value,
    max = 100,
    label,
    showPercentage = true
}: {
    value: number;
    max?: number;
    label: string;
    showPercentage?: boolean;
}) {
    const percentage = Math.round((value / max) * 100);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-200">{label}</span>
                {showPercentage && (
                    <span className="text-sm font-mono text-cyan-400">
                        {percentage}%
                    </span>
                )}
            </div>
            <div
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={label}
                className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"
            >
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

/**
 * AccessibleAlert - Alert with proper role
 */
export function AccessibleAlert({
    type = "info",
    title,
    message,
    onDismiss
}: {
    type?: "info" | "success" | "warning" | "error";
    title?: string;
    message: string;
    onDismiss?: () => void;
}) {
    const styles = {
        info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "ℹ️" },
        success: { bg: "bg-green-500/10", border: "border-green-500/30", icon: "✅" },
        warning: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "⚠️" },
        error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "❌" }
    };

    const style = styles[type];
    const roleType = type === "error" ? "alert" : "status";

    return (
        <div
            role={roleType}
            aria-live={type === "error" ? "assertive" : "polite"}
            className={`${style.bg} ${style.border} border rounded-lg p-4`}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">{style.icon}</span>
                <div className="flex-1">
                    {title && <h4 className="font-semibold text-white mb-1">{title}</h4>}
                    <p className="text-sm text-slate-200">{message}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        aria-label="Dismiss alert"
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * GameAccessibilityAnnouncer - Announces game events to screen readers
 */
export function GameAccessibilityAnnouncer({
    score,
    level,
    timeRemaining
}: {
    score?: number;
    level?: number;
    timeRemaining?: number;
}) {
    const { settings } = useAccessibility();

    useEffect(() => {
        if (!settings.screenReaderOptimized) return;

        // Announce score changes
        if (score !== undefined) {
            const announcement = document.createElement("div");
            announcement.setAttribute("role", "status");
            announcement.setAttribute("aria-live", "polite");
            announcement.className = "sr-only";
            announcement.textContent = `Score: ${score}`;
            document.body.appendChild(announcement);
            setTimeout(() => document.body.removeChild(announcement), 1000);
        }
    }, [score, settings.screenReaderOptimized]);

    return (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
            {score !== undefined && `Current score: ${score}. `}
            {level !== undefined && `Level: ${level}. `}
            {timeRemaining !== undefined && `Time remaining: ${timeRemaining} seconds.`}
        </div>
    );
}
