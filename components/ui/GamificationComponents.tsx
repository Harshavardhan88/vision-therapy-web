"use client";

import { useGamification } from "@/contexts/GamificationContext";
import { ProgressRing } from "./VisualFeedback";
import { AccessibleCard } from "./AccessibleComponents";

/**
 * Gamification UI Components
 */

/**
 * AchievementCard - Display single achievement
 */
export function AchievementCard({ achievement }: { achievement: any }) {
    const percentage = (achievement.progress / achievement.requirement) * 100;

    return (
        <div className={`
            relative p-4 rounded-lg border-2 transition-all
            ${achievement.unlocked
                ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500'
                : 'bg-slate-800/50 border-slate-700'
            }
        `}>
            {/* Icon */}
            <div className="text-4xl mb-2">{achievement.icon}</div>

            {/* Title */}
            <h4 className={`font-semibold ${achievement.unlocked ? 'text-yellow-400' : 'text-white'}`}>
                {achievement.title}
            </h4>

            {/* Description */}
            <p className="text-sm text-slate-400 mt-1">
                {achievement.description}
            </p>

            {/* Progress */}
            {!achievement.unlocked && (
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.requirement}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Unlocked Badge */}
            {achievement.unlocked && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                    UNLOCKED
                </div>
            )}

            {/* Points */}
            <div className="mt-2 text-xs text-cyan-400">
                +{achievement.points} XP
            </div>
        </div>
    );
}

/**
 * AchievementsList - Grid of achievements
 */
export function AchievementsList() {
    const { progress } = useGamification();

    const categories = {
        gameplay: progress.achievements.filter(a => a.category === "gameplay"),
        progress: progress.achievements.filter(a => a.category === "progress"),
        streak: progress.achievements.filter(a => a.category === "streak"),
        milestone: progress.achievements.filter(a => a.category === "milestone")
    };

    return (
        <div className="space-y-6">
            {Object.entries(categories).map(([category, achievements]) => (
                <div key={category}>
                    <h3 className="text-lg font-semibold text-white capitalize mb-3">
                        {category} Achievements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievements.map(achievement => (
                            <AchievementCard key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * ProgressDashboard - Player stats and progress
 */
export function ProgressDashboard() {
    const { progress } = useGamification();
    const xpPercentage = (progress.xp / progress.xpToNextLevel) * 100;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Level Card */}
            <AccessibleCard title="Level" className="text-center">
                <div className="flex flex-col items-center">
                    <div className="text-5xl font-bold text-cyan-400 mb-2">
                        {progress.level}
                    </div>
                    <div className="text-sm text-slate-400">Current Level</div>
                    <div className="w-full mt-4">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>XP</span>
                            <span>{progress.xp}/{progress.xpToNextLevel}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                style={{ width: `${xpPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </AccessibleCard>

            {/* Total Score */}
            <AccessibleCard title="Total Score" className="text-center">
                <div className="text-4xl font-bold text-purple-400">
                    {progress.totalScore.toLocaleString()}
                </div>
                <div className="text-sm text-slate-400 mt-2">All-Time Points</div>
            </AccessibleCard>

            {/* Games Played */}
            <AccessibleCard title="Games Played" className="text-center">
                <div className="text-4xl font-bold text-green-400">
                    {progress.gamesPlayed}
                </div>
                <div className="text-sm text-slate-400 mt-2">Sessions Completed</div>
            </AccessibleCard>

            {/* Streak */}
            <AccessibleCard title="Streak" className="text-center">
                <div className="text-4xl font-bold text-orange-400">
                    {progress.currentStreak}🔥
                </div>
                <div className="text-sm text-slate-400 mt-2">
                    Best: {progress.longestStreak} days
                </div>
            </AccessibleCard>
        </div>
    );
}

/**
 * Leaderboard - Top players
 */
export function Leaderboard({ players }: { players: any[] }) {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">🏆 Leaderboard</h3>
            </div>
            <div className="divide-y divide-slate-700">
                {players.map((player, index) => (
                    <div
                        key={player.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className={`
                                text-2xl font-bold
                                ${index === 0 ? 'text-yellow-400' : ''}
                                ${index === 1 ? 'text-slate-300' : ''}
                                ${index === 2 ? 'text-orange-400' : ''}
                                ${index > 2 ? 'text-slate-500' : ''}
                            `}>
                                #{index + 1}
                            </div>

                            {/* Player Info */}
                            <div>
                                <div className="font-semibold text-white">{player.name}</div>
                                <div className="text-sm text-slate-400">Level {player.level}</div>
                            </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                            <div className="font-bold text-cyan-400">
                                {player.score.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400">points</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * DailyChallenge - Daily challenge card
 */
export function DailyChallenge({ challenge }: { challenge: any }) {
    const { progress, completeDailyChallenge } = useGamification();

    return (
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                        📅 Daily Challenge
                    </h3>
                    <p className="text-sm text-purple-300">
                        Complete for bonus XP!
                    </p>
                </div>
                {progress.dailyChallengeCompleted && (
                    <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        ✓ COMPLETE
                    </div>
                )}
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-white mb-2">{challenge.title}</h4>
                <p className="text-sm text-slate-300">{challenge.description}</p>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-purple-300">
                    Reward: <span className="font-bold text-yellow-400">+50 XP</span>
                </div>
                {!progress.dailyChallengeCompleted && (
                    <button
                        onClick={completeDailyChallenge}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
                    >
                        Start Challenge
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * RewardAnimation - Animated reward popup
 */
export function RewardAnimation({
    type,
    amount,
    onComplete
}: {
    type: "xp" | "achievement" | "level";
    amount?: number;
    onComplete?: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete?.();
        }, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const icons = {
        xp: "⭐",
        achievement: "🏆",
        level: "🎉"
    };

    const messages = {
        xp: `+${amount} XP`,
        achievement: "Achievement Unlocked!",
        level: `Level Up! Level ${amount}`
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-fadeIn">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-6 rounded-2xl shadow-2xl transform animate-scaleIn">
                <div className="text-center">
                    <div className="text-6xl mb-3">{icons[type]}</div>
                    <div className="text-2xl font-bold">{messages[type]}</div>
                </div>
            </div>
        </div>
    );
}
