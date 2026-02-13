"use client";

import { useEffect, useState } from "react";

interface Sparkle {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
}

export function MagicCursor() {
    const [sparkles, setSparkles] = useState<Sparkle[]>([]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Add a new sparkle
            const newSparkle: Sparkle = {
                id: Date.now(),
                x: e.clientX,
                y: e.clientY,
                size: Math.random() * 10 + 5,
                color: Math.random() > 0.5 ? "#22d3ee" : "#3b82f6" // Cyan or Blue
            };

            setSparkles(prev => [...prev.slice(-15), newSparkle]); // Keep last 15
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Cleanup old sparkles
    useEffect(() => {
        const interval = setInterval(() => {
            setSparkles(prev => prev.filter(s => Date.now() - s.id < 500)); // Alive for 500ms
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {sparkles.map(s => (
                <div
                    key={s.id}
                    className="absolute rounded-full animate-ping opacity-75"
                    style={{
                        left: s.x,
                        top: s.y,
                        width: s.size,
                        height: s.size,
                        backgroundColor: s.color,
                        transform: "translate(-50%, -50%)",
                        animationDuration: "0.5s"
                    }}
                />
            ))}
        </div>
    );
}
