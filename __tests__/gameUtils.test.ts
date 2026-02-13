import {
    checkCollision,
    calculateMultiplier,
    calculateAccuracy,
    calculateScore
} from '@/lib/gameUtils';

describe('Game Logic Utilities', () => {

    describe('Collision Detection', () => {
        it('detects hit within radius', () => {
            // (0,0) to (1,0) distance is 1. Radius 1.5 -> Hit
            expect(checkCollision(0, 0, 1, 0, 1.5)).toBe(true);
        });

        it('ignores miss outside radius', () => {
            // (0,0) to (2,0) distance is 2. Radius 1.5 -> Miss
            expect(checkCollision(0, 0, 2, 0, 1.5)).toBe(false);
        });

        it('handles boundary condition', () => {
            // Distance 1.5. Radius 1.5. Strictly less? checkCollision is < radius
            expect(checkCollision(0, 0, 1.5, 0, 1.5)).toBe(false);
        });
    });

    describe('Difficulty Multiplier', () => {
        it('increases multiplier on streak of 5', () => {
            // Current 1.0, Streak 5, Hit -> 1.1
            expect(calculateMultiplier(1.0, 5, true)).toBe(1.1);
        });

        it('caps multiplier at 1.5', () => {
            expect(calculateMultiplier(1.5, 5, true)).toBe(1.5);
        });

        it('does not increase on non-multiple streak', () => {
            expect(calculateMultiplier(1.0, 4, true)).toBe(1.0);
        });

        it('decreases multiplier on losing streak of 3', () => {
            // Current 1.0, Streak -3, Miss -> 0.9
            expect(calculateMultiplier(1.0, -3, false)).toBe(0.9);
        });

        it('floors multiplier at 0.5', () => {
            expect(calculateMultiplier(0.5, -3, false)).toBe(0.5);
        });
    });

    describe('Scoring', () => {
        it('calculates accuracy correctly', () => {
            expect(calculateAccuracy(10, 0)).toBe(1.0);
            expect(calculateAccuracy(5, 5)).toBe(0.5);
            expect(calculateAccuracy(0, 10)).toBe(0.0);
        });

        it('calculates score with multiplier', () => {
            expect(calculateScore(100, 1.5)).toBe(150);
            expect(calculateScore(10, 1.1)).toBe(11);
        });
    });
});
