
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverlay } from '../components/game/GameOverlay';
import '@testing-library/jest-dom';

// Mock Lucide icons to avoid rendering issues in test environment
jest.mock('lucide-react', () => ({
    X: () => <span data-testid="icon-x">X</span>,
    Pause: () => <span data-testid="icon-pause">||</span>,
    Play: () => <span data-testid="icon-play">></span>,
}));

describe('Game UI Preview (GameOverlay)', () => {

    test('renders standard game header correctly', () => {
        render(
            <GameOverlay
                title="Balloon Pop"
                score={150}
                difficulty="medium"
            />
        );

        // Verify Title
        const titleElement = screen.getByText('Balloon Pop');
        expect(titleElement).toBeInTheDocument();
        expect(titleElement).toHaveClass('text-2xl', 'font-black', 'uppercase');

        // Verify Score
        const scoreLabel = screen.getByText('Score');
        const scoreValue = screen.getByText('150');
        expect(scoreLabel).toBeInTheDocument();
        expect(scoreValue).toBeInTheDocument();
        expect(scoreValue).toHaveClass('text-3xl', 'font-black');

        // Verify Difficulty Badge
        const difficultyBadge = screen.getByText('DIFFICULTY: MEDIUM');
        expect(difficultyBadge).toBeInTheDocument();
    });

    test('renders interactive controls (Pause/Exit)', () => {
        const handleExit = jest.fn();
        const handlePause = jest.fn();

        render(
            <GameOverlay
                title="Neon Voyage"
                score={0}
                onExit={handleExit}
                onPause={handlePause}
                isPaused={false}
            />
        );

        // Check Exit Button
        const exitBtn = screen.getByText('EXIT');
        expect(exitBtn).toBeInTheDocument();
        fireEvent.click(exitBtn);
        expect(handleExit).toHaveBeenCalledTimes(1);

        // Check Pause Button (via aria-label since icon is mocked)
        const pauseBtn = screen.getByLabelText('Pause');
        expect(pauseBtn).toBeInTheDocument();
        fireEvent.click(pauseBtn);
        expect(handlePause).toHaveBeenCalledTimes(1);
    });

    test('renders Pause Screen overlay when paused', () => {
        render(
            <GameOverlay
                title="VR Space"
                score={42}
                isPaused={true}
                onPause={() => { }}
            />
        );

        // Check for Pause Modal
        expect(screen.getByText('PAUSED')).toBeInTheDocument();
        expect(screen.getByText('Take a breather!')).toBeInTheDocument();
        expect(screen.getByText('RESUME')).toBeInTheDocument();
        expect(screen.getByText('QUIT GAME')).toBeInTheDocument();
    });
});
