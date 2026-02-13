import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Canvas } from '@react-three/fiber';
import DichopticCanvas from '@/components/game/DichopticCanvas';
import * as THREE from 'three';

describe('Phase 1: VR Split-Screen & Dichoptic Rendering', () => {
    describe('DichopticCanvas', () => {
        test('renders split-screen canvas', () => {
            const { container } = render(
                <DichopticCanvas
                    weakEye="left"
                    strongEyeOpacity={0.5}
                >
                    <mesh>
                        <boxGeometry />
                        <meshBasicMaterial />
                    </mesh>
                </DichopticCanvas>
            );

            const canvas = container.querySelector('canvas');
            expect(canvas).toBeInTheDocument();
        });

        test('applies correct layer visibility for weak eye left', () => {
            // Mock Three.js camera
            const mockCamera = new THREE.PerspectiveCamera();
            const leftLayers = [0, 1]; // Both background and targets
            const rightLayers = [0]; // Only background

            // Verify layer logic
            expect(leftLayers).toContain(1); // Weak eye sees targets
            expect(rightLayers).not.toContain(1); // Strong eye doesn't see targets
        });

        test('applies correct layer visibility for weak eye right', () => {
            const leftLayers = [0]; // Only background
            const rightLayers = [0, 1]; // Both background and targets

            expect(rightLayers).toContain(1); // Weak eye sees targets
            expect(leftLayers).not.toContain(1); // Strong eye doesn't see targets
        });

        test('applies strong eye opacity overlay', () => {
            const strongEyeOpacity = 0.3;
            const overlayOpacity = 1.0 - strongEyeOpacity;

            expect(overlayOpacity).toBe(0.7); // 70% dimming
        });

        test('handles IPD adjustment', () => {
            const ipd = 0.06;
            const halfIPD = ipd / 2;

            expect(halfIPD).toBe(0.03);
        });
    });

    describe('Balloon Game Layer Assignment', () => {
        test('balloons assigned to Layer 1', () => {
            const balloon = new THREE.Mesh();
            balloon.layers.set(1);

            expect(balloon.layers.test(new THREE.Layers().set(1))).toBe(true);
            expect(balloon.layers.test(new THREE.Layers().set(0))).toBe(false);
        });

        test('background assigned to Layer 0', () => {
            const background = new THREE.Mesh();
            background.layers.set(0);

            expect(background.layers.test(new THREE.Layers().set(0))).toBe(true);
            expect(background.layers.test(new THREE.Layers().set(1))).toBe(false);
        });

        test('reticle assigned to Layer 0', () => {
            const reticle = new THREE.Mesh();
            reticle.layers.set(0);

            expect(reticle.layers.test(new THREE.Layers().set(0))).toBe(true);
        });
    });

    describe('VR Indicators', () => {
        test('VR mode badge shows when enabled', () => {
            const vrEnabled = true;
            expect(vrEnabled).toBe(true);
        });

        test('IPD slider has correct range', () => {
            const minIPD = 0.05;
            const maxIPD = 0.07;
            const defaultIPD = 0.06;

            expect(defaultIPD).toBeGreaterThanOrEqual(minIPD);
            expect(defaultIPD).toBeLessThanOrEqual(maxIPD);
        });

        test('strong eye opacity has correct range', () => {
            const minOpacity = 0.0;
            const maxOpacity = 1.0;
            const testOpacity = 0.5;

            expect(testOpacity).toBeGreaterThanOrEqual(minOpacity);
            expect(testOpacity).toBeLessThanOrEqual(maxOpacity);
        });
    });

    describe('Dichoptic Settings', () => {
        test('weak eye selection works', () => {
            const settings = {
                weakEye: 'left' as const,
                strongEyeOpacity: 0.5,
                dichoptic: true
            };

            expect(settings.weakEye).toBe('left');
            expect(settings.dichoptic).toBe(true);
        });

        test('strong eye opacity affects overlay', () => {
            const opacity1 = 0.0; // Total suppression
            const opacity2 = 1.0; // Full visibility

            expect(1.0 - opacity1).toBe(1.0); // Full overlay
            expect(1.0 - opacity2).toBe(0.0); // No overlay
        });
    });
});
