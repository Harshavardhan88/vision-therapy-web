"use client";

import { useEffect, useState } from "react";

/**
 * LoadingSpinner - Reusable loading indicator
 */
export function LoadingSpinner({
    size = "md",
    color = "cyan"
}: {
    size?: "sm" | "md" | "lg";
    color?: "cyan" | "purple" | "blue";
}) {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4"
    };

    const colorClasses = {
        cyan: "border-cyan-500 border-t-transparent",
        purple: "border-purple-500 border-t-transparent",
        blue: "border-blue-500 border-t-transparent"
    };

    return (
        <div
            className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
        />
    );
}

/**
 * GameLoadingScreen - Full screen loading for games
 */
export function GameLoadingScreen({
    gameName,
    progress = 0,
    message = "Loading..."
}: {
    gameName: string;
    progress?: number;
    message?: string;
}) {
    const [dots, setDots] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "" : prev + ".");
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center z-50">
            <div className="text-center space-y-6 max-w-md px-8">
                {/* Animated Logo/Icon */}
                <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                </div>

                {/* Game Name */}
                <h2 className="text-2xl font-bold text-white">
                    {gameName}
                </h2>

                {/* Loading Message */}
                <p className="text-cyan-300 text-sm">
                    {message}{dots}
                </p>

                {/* Progress Bar */}
                {progress > 0 && (
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Spinner */}
                <div className="flex justify-center">
                    <LoadingSpinner size="lg" color="cyan" />
                </div>

                {/* Tip */}
                <p className="text-slate-400 text-xs italic">
                    💡 Tip: Make sure you're in a well-lit area for best eye tracking
                </p>
            </div>
        </div>
    );
}

/**
 * SkeletonLoader - Placeholder for content loading
 */
export function SkeletonLoader({
    className = "",
    variant = "rectangular"
}: {
    className?: string;
    variant?: "rectangular" | "circular" | "text";
}) {
    const baseClasses = "animate-pulse bg-slate-700/50";
    const variantClasses = {
        rectangular: "rounded-lg",
        circular: "rounded-full",
        text: "rounded h-4"
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
    );
}

/**
 * PageTransition - Smooth page transitions
 */
export function PageTransition({
    children,
    className = ""
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div
            className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${className}`}
        >
            {children}
        </div>
    );
}
