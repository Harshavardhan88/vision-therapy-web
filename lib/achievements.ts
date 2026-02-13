// Achievement checking logic
export interface Achievement {
    id: number;
    name: string;
    description: string;
    icon: string;
    requirement_type: string;
    requirement_value: number;
}

export interface PlayerStats {
    totalBalloons: number;
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
    sessionScore: number;
    difficulty: string;
}

export function checkAchievements(stats: PlayerStats, achievements: Achievement[]): Achievement[] {
    const unlocked: Achievement[] = [];

    for (const achievement of achievements) {
        let isUnlocked = false;

        switch (achievement.requirement_type) {
            case "balloons_popped":
                isUnlocked = stats.totalBalloons >= achievement.requirement_value;
                break;
            case "session_score":
                isUnlocked = stats.sessionScore >= achievement.requirement_value;
                break;
            case "total_balloons":
                isUnlocked = stats.totalBalloons >= achievement.requirement_value;
                break;
            case "sessions_completed":
                isUnlocked = stats.totalSessions >= achievement.requirement_value;
                break;
            case "streak_days":
                isUnlocked = stats.currentStreak >= achievement.requirement_value;
                break;
            case "hard_mode_complete":
                isUnlocked = stats.difficulty === "hard" && stats.sessionScore > 0;
                break;
            case "total_minutes":
                isUnlocked = stats.totalMinutes >= achievement.requirement_value;
                break;
        }

        if (isUnlocked) {
            unlocked.push(achievement);
        }
    }

    return unlocked;
}

// Mock achievements for frontend (until backend is connected)
export const MOCK_ACHIEVEMENTS: Achievement[] = [
    {
        id: 1,
        name: "First Pop",
        description: "Pop your first balloon",
        icon: "🎈",
        requirement_type: "session_score",
        requirement_value: 1
    },
    {
        id: 2,
        name: "Sharpshooter",
        description: "Pop 50 balloons in a single session",
        icon: "🎯",
        requirement_type: "session_score",
        requirement_value: 50
    },
    {
        id: 3,
        name: "Century Club",
        description: "Pop 100 balloons total",
        icon: "💯",
        requirement_type: "total_balloons",
        requirement_value: 100
    },
    {
        id: 4,
        name: "Speed Demon",
        description: "Complete a session on Hard difficulty",
        icon: "⚡",
        requirement_type: "hard_mode_complete",
        requirement_value: 1
    }
];
