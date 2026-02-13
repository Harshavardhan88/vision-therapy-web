import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TargetTapVR from '../components/game/TargetTapVR';

// Mock Three.js and React Three Fiber
jest.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useFrame: jest.fn(),
    useThree: () => ({
        camera: {
            layers: { enable: jest.fn(), set: jest.fn() },
            cameras: [{ layers: { enable: jest.fn() } }, { layers: { enable: jest.fn() } }]
        }
    }),
    extend: jest.fn(),
}));

// Mock React Three XR
jest.mock('@react-three/xr', () => ({
    XR: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Controllers: () => <div data-testid="vr-controllers" />,
    Hands: () => <div data-testid="vr-hands" />,
    VRButton: () => <button>ENTER VR</button>,
    useXR: () => ({ isPresenting: false, player: { children: [] } }),
    Interactive: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Drei
jest.mock('@react-three/drei', () => ({
    Text: () => null,
    Stars: () => null,
    OrbitControls: () => null,
}));

describe('TargetTapVR', () => {
    it('renders the VR entry button', () => {
        render(<TargetTapVR />);
        expect(screen.getByText('ENTER VR')).toBeInTheDocument();
    });

    it('renders VR controllers and hands', () => {
        render(<TargetTapVR />);
        expect(screen.getByTestId('vr-controllers')).toBeInTheDocument();
        expect(screen.getByTestId('vr-hands')).toBeInTheDocument();
    });

    it('initializes with default settings', () => {
        render(<TargetTapVR />);
        // Check if overlays are present
        expect(screen.getByText('Target Tap VR')).toBeInTheDocument();
        expect(screen.getByText(/THERAPY MODE: ACTIVE/i)).toBeInTheDocument();
    });
});
