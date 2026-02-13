"use client";

import { useEffect, useState, useRef } from "react";
import { gameAudio } from "@/lib/audio";

interface AchievementNotificationProps {
    achievement: {
        id?: number;
        name: string;
        description: string;
        icon: string;
    } | null;
    onClose: () => void;
}

export default function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
    const [visible, setVisible] = useState(false);
    const lastShownId = useRef<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear any existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (achievement && achievement.id !== lastShownId.current) {
            // Only show and play sound for NEW achievements
            lastShownId.current = achievement.id || null;
            setVisible(true);
            gameAudio.playAchievement();

            // Auto-dismiss after 4 seconds
            timerRef.current = setTimeout(() => {
                setVisible(false);
                // Wait for fade-out animation before calling onClose
                setTimeout(() => {
                    onClose();
                }, 300);
            }, 4000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [achievement?.id, onClose]);

    if (!achievement) return null;

    return (
        <div className={`fixed top-4 right-4 z-[100] transition-all duration-300 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl shadow-2xl p-4 min-w-[300px] border-2 border-yellow-300">
                <div className="flex items-center gap-3">
                    <div className="text-4xl animate-bounce">
                        {achievement.icon}
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
                            Achievement Unlocked!
                        </div>
                        <div className="text-lg font-bold">
                            {achievement.name}
                        </div>
                        <div className="text-sm opacity-90">
                            {achievement.description}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
