/**
 * Pure functions for game logic to enable unit testing.
 */

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
};

export const checkCollision = (
    objX: number,
    objY: number,
    targetX: number,
    targetY: number,
    radius: number
): boolean => {
    return calculateDistance(objX, objY, targetX, targetY) < radius;
};

export const calculateMultiplier = (currentMultiplier: number, streak: number, isHit: boolean): number => {
    if (isHit) {
        // Increase if streak is multiple of 5
        if (streak > 0 && streak % 5 === 0) {
            return Math.min(currentMultiplier + 0.1, 1.5);
        }
        return currentMultiplier;
    } else {
        // Decrease if losing streak is multiple of 3 (streak is negative)
        if (streak < 0 && Math.abs(streak) % 3 === 0) {
            return Math.max(currentMultiplier - 0.1, 0.5);
        }
        return currentMultiplier;
    }
};

export const calculateAccuracy = (hits: number, misses: number): number => {
    const total = hits + misses;
    if (total === 0) return 0;
    return Number((hits / total).toFixed(2)); // Return as 0.00 - 1.00
};

export const calculateScore = (baseScore: number, multiplier: number): number => {
    return Math.floor(baseScore * multiplier);
};
