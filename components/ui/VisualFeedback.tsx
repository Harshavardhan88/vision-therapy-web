"use client";

import { useEffect, useState } from "react";

/**
 * SuccessAnimation - Checkmark success animation
 */
export function SuccessAnimation({
    message = "Success!",
    onComplete
}: {
    message?: string;
    onComplete?: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete?.();
        }, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center p-8 animate-fadeIn">
            <div className="relative w-24 h-24 mb-4">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <div className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center animate-scaleIn">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
            <p className="text-lg font-semibold text-green-400">{message}</p>
        </div>
    );
}

/**
 * ScorePopup - Animated score popup
 */
export function ScorePopup({
    points,
    position = { x: 0, y: 0 },
    color = "cyan"
}: {
    points: number;
    position?: { x: number; y: number };
    color?: "cyan" | "green" | "gold";
}) {
    const colorClasses = {
        cyan: "text-cyan-400",
        green: "text-green-400",
        gold: "text-yellow-400"
    };

    return (
        <div
            className={`absolute ${colorClasses[color]} font-bold text-2xl animate-scorePopup pointer-events-none`}
            style={{
                left: position.x,
                top: position.y
            }}
        >
            +{points}
        </div>
    );
}

/**
 * StreakCounter - Combo/streak counter
 */
export function StreakCounter({
    streak,
    maxStreak = 10
}: {
    streak: number;
    maxStreak?: number;
}) {
    const percentage = Math.min((streak / maxStreak) * 100, 100);
    const isMaxStreak = streak >= maxStreak;

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 min-w-[120px]">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Streak</span>
                <span className={`text-lg font-bold ${isMaxStreak ? 'text-yellow-400 animate-pulse' : 'text-cyan-400'}`}>
                    {streak}🔥
                </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${isMaxStreak
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

/**
 * ComboMultiplier - Multiplier indicator
 */
export function ComboMultiplier({
    multiplier
}: {
    multiplier: number;
}) {
    if (multiplier <= 1) return null;

    return (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg px-4 py-2 animate-bounce">
            <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <div>
                    <div className="text-xs text-purple-300">Multiplier</div>
                    <div className="text-xl font-bold text-purple-400">
                        {multiplier.toFixed(1)}x
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * ProgressRing - Circular progress indicator
 */
export function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    color = "cyan"
}: {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: "cyan" | "green" | "purple";
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    const colors = {
        cyan: "#06b6d4",
        green: "#10b981",
        purple: "#a855f7"
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgb(51 65 85)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colors[color]}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
}

/**
 * PulseIndicator - Pulsing dot indicator
 */
export function PulseIndicator({
    color = "green",
    label
}: {
    color?: "green" | "red" | "yellow";
    label?: string;
}) {
    const colorClasses = {
        green: "bg-green-500",
        red: "bg-red-500",
        yellow: "bg-yellow-500"
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <div className={`w-3 h-3 ${colorClasses[color]} rounded-full`} />
                <div className={`absolute inset-0 ${colorClasses[color]} rounded-full animate-ping opacity-75`} />
            </div>
            {label && <span className="text-sm text-slate-300">{label}</span>}
        </div>
    );
}

/**
 * CountdownTimer - Visual countdown
 */
export function CountdownTimer({
    seconds,
    onComplete
}: {
    seconds: number;
    onComplete?: () => void;
}) {
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete?.();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const isUrgent = timeLeft <= 10;

    return (
        <div className={`text-center ${isUrgent ? 'animate-pulse' : ''}`}>
            <div className={`text-6xl font-bold ${isUrgent ? 'text-red-400' : 'text-cyan-400'}`}>
                {timeLeft}
            </div>
            <div className="text-sm text-slate-400 mt-2">seconds remaining</div>
        </div>
    );
}

/**
 * LevelUpBanner - Level up celebration
 */
export function LevelUpBanner({
    level,
    onDismiss
}: {
    level: number;
    onDismiss?: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss?.();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-fadeIn">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-8 rounded-2xl shadow-2xl transform animate-scaleIn">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <div className="text-4xl font-bold mb-2">Level Up!</div>
                    <div className="text-2xl opacity-90">Level {level}</div>
                </div>
            </div>
        </div>
    );
}

/**
 * AchievementUnlocked - Achievement notification
 */
export function AchievementUnlocked({
    title,
    description,
    icon = "🏆",
    onDismiss
}: {
    title: string;
    description: string;
    icon?: string;
    onDismiss?: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss?.();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed top-4 right-4 z-50 animate-slideInRight">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg shadow-2xl p-4 max-w-sm">
                <div className="flex items-start gap-3">
                    <div className="text-4xl">{icon}</div>
                    <div className="flex-1">
                        <div className="text-xs font-semibold opacity-75 mb-1">ACHIEVEMENT UNLOCKED</div>
                        <div className="font-bold text-lg">{title}</div>
                        <div className="text-sm opacity-90 mt-1">{description}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
