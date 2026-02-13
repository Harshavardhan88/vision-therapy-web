"use client";

import { useEffect, useState } from "react";

export function GamifiedBackground() {
    const [stars, setStars] = useState<{ id: number; left: string; top: string; delay: string }[]>([]);

    useEffect(() => {
        const starCount = 50;
        const newStars = Array.from({ length: starCount }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`
        }));
        setStars(newStars);
    }, []);

    return (
        <div className="stars">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="star"
                    style={{
                        left: star.left,
                        top: star.top,
                        animationDelay: star.delay
                    }}
                />
            ))}
        </div>
    );
}
