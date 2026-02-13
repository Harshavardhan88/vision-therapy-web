"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Gamification system - Achievements, Progress, Rewards
 */

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: "gameplay" | "progress" | "streak" | "milestone";
    requirement: number;
    progress: number;
    unlocked: boolean;
    unlockedAt?: Date;
    points: number;
}

export interface PlayerProgress {
    level: number;
    xp: number;
    xpToNextLevel: number;
    totalScore: number;
    gamesPlayed: number;
    achievements: Achievement[];
    currentStreak: number;
    longestStreak: number;
    dailyChallengeCompleted: boolean;
}

const defaultProgress: PlayerProgress = {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalScore: 0,
    gamesPlayed: 0,
    achievements: [],
    currentStreak: 0,
    longestStreak: 0,
    dailyChallengeCompleted: false
};

const GamificationContext = createContext<{
    progress: PlayerProgress;
    addXP: (amount: number) => void;
    unlockAchievement: (id: string) => void;
    updateStreak: () => void;
    completeDailyChallenge: () => void;
}>({
    progress: defaultProgress,
    addXP: () => { },
    unlockAchievement: () => { },
    updateStreak: () => { },
    completeDailyChallenge: () => { }
});

/**
 * GamificationProvider - Manages player progress and achievements
 */
export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [progress, setProgress] = useState<PlayerProgress>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("player-progress");
            if (saved) {
                const parsed = JSON.parse(saved);
                // Convert date strings back to Date objects
                if (parsed.achievements) {
                    parsed.achievements = parsed.achievements.map((a: any) => ({
                        ...a,
                        unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined
                    }));
                }
                return { ...defaultProgress, ...parsed };
            }
        }
        return { ...defaultProgress, achievements: getDefaultAchievements() };
    });

    // Save progress to localStorage
    useEffect(() => {
        localStorage.setItem("player-progress", JSON.stringify(progress));
    }, [progress]);

    const addXP = (amount: number) => {
        setProgress(prev => {
            let newXP = prev.xp + amount;
            let newLevel = prev.level;
            let xpToNext = prev.xpToNextLevel;

            // Level up logic
            while (newXP >= xpToNext) {
                newXP -= xpToNext;
                newLevel++;
                xpToNext = calculateXPForLevel(newLevel);
            }

            return {
                ...prev,
                xp: newXP,
                level: newLevel,
                xpToNextLevel: xpToNext
            };
        });
    };

    const unlockAchievement = (id: string) => {
        setProgress(prev => ({
            ...prev,
            achievements: prev.achievements.map(a =>
                a.id === id && !a.unlocked
                    ? { ...a, unlocked: true, unlockedAt: new Date(), progress: a.requirement }
                    : a
            )
        }));
    };

    const updateStreak = () => {
        setProgress(prev => {
            const newStreak = prev.currentStreak + 1;
            return {
                ...prev,
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, prev.longestStreak)
            };
        });
    };

    const completeDailyChallenge = () => {
        setProgress(prev => ({
            ...prev,
            dailyChallengeCompleted: true
        }));
        addXP(50); // Bonus XP for daily challenge
    };

    return (
        <GamificationContext.Provider value={{
            progress,
            addXP,
            unlockAchievement,
            updateStreak,
            completeDailyChallenge
        }}>
            {children}
        </GamificationContext.Provider>
    );
}

/**
 * useGamification - Hook to access gamification features
 */
export function useGamification() {
    return useContext(GamificationContext);
}

/**
 * Calculate XP required for next level
 */
function calculateXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Default achievements
 */
function getDefaultAchievements(): Achievement[] {
    return [
        {
            id: "first_game",
            title: "First Steps",
            description: "Complete your first therapy session",
            icon: "🎮",
            category: "gameplay",
            requirement: 1,
            progress: 0,
            unlocked: false,
            points: 10
        },
        {
            id: "ten_games",
            title: "Dedicated Player",
            description: "Complete 10 therapy sessions",
            icon: "🏆",
            category: "gameplay",
            requirement: 10,
            progress: 0,
            unlocked: false,
            points: 50
        },
        {
            id: "perfect_score",
            title: "Perfectionist",
            description: "Achieve a perfect score in any game",
            icon: "⭐",
            category: "gameplay",
            requirement: 1,
            progress: 0,
            unlocked: false,
            points: 25
        },
        {
            id: "week_streak",
            title: "Week Warrior",
            description: "Play for 7 days in a row",
            icon: "🔥",
            category: "streak",
            requirement: 7,
            progress: 0,
            unlocked: false,
            points: 100
        },
        {
            id: "level_5",
            title: "Rising Star",
            description: "Reach level 5",
            icon: "🌟",
            category: "milestone",
            requirement: 5,
            progress: 0,
            unlocked: false,
            points: 75
        },
        {
            id: "level_10",
            title: "Vision Master",
            description: "Reach level 10",
            icon: "👁️",
            category: "milestone",
            requirement: 10,
            progress: 0,
            unlocked: false,
            points: 150
        },
        {
            id: "daily_challenge",
            title: "Daily Dedication",
            description: "Complete a daily challenge",
            icon: "📅",
            category: "progress",
            requirement: 1,
            progress: 0,
            unlocked: false,
            points: 20
        },
        {
            id: "high_scorer",
            title: "High Scorer",
            description: "Score over 1000 points in a single game",
            icon: "💯",
            category: "gameplay",
            requirement: 1000,
            progress: 0,
            unlocked: false,
            points: 50
        }
    ];
}
