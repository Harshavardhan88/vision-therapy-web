"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { GameOverlay } from "./GameOverlay";

// Calibration Points (Screen Coordinates: -5 to 5 approx)
const POINTS = [
    { x: 0, y: 0 },       // Center
    { x: -4, y: 2.2 },      // Top Left
    { x: 4, y: 2.2 },       // Top Right
    { x: -4, y: -2.2 },     // Bottom Left
    { x: 4, y: -2.2 },      // Bottom Right
];

function Firefly({ position, onCaught }: { position: [number, number, number], onCaught: () => void }) {
    const meshRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const [catchProgress, setCatchProgress] = useState(0);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Bobbing animation
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.005;

        // Catch Logic
        if (hovered) {
            setCatchProgress(prev => {
                const newProgress = prev + delta * 1.5; // 0.6 seconds to catch
                if (newProgress >= 1) {
                    onCaught();
                    return 0;
                }
                return newProgress;
            });
        } else {
            setCatchProgress(0);
        }
    });

    return (
        <group ref={meshRef} position={position}>
            {/* The Firefly Body */}
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial
                    color={hovered ? "#fbbf24" : "#f59e0b"}
                    emissive="#f59e0b"
                    emissiveIntensity={2}
                />
            </mesh>

            {/* Wings */}
            <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, 0.5]}>
                <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
                <meshStandardMaterial color="white" transparent opacity={0.6} />
            </mesh>
            <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, -0.5]}>
                <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
                <meshStandardMaterial color="white" transparent opacity={0.6} />
            </mesh>

            {/* Catch Progress Ring */}
            {hovered && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.4, 0.45 + (catchProgress * 0.1), 32]} />
                    <meshBasicMaterial color="#34d399" />
                </mesh>
            )}

            {/* Glow Light */}
            <pointLight distance={3} intensity={5} color="#fbbf24" />
        </group>
    );
}

function CalibrationScene({ gazeX, gazeY, onComplete, onPointHit }: { gazeX: number, gazeY: number, onComplete: () => void, onPointHit: () => void }) {
    const [currentPointIndex, setCurrentPointIndex] = useState(0);
    // const [score, setScore] = useState(0); // Removed local score

    const handleCaught = () => {
        onPointHit(); // Notify parent
        // Play sound effect could go here
        if (currentPointIndex < POINTS.length - 1) {
            setCurrentPointIndex(prev => prev + 1);
            // setScore(prev => prev + 100);
        } else {
            // Finished
            onComplete();
        }
    };

    // Calculate Reticle Position
    const reticleX = (gazeX - 0.5) * 10;
    const reticleY = -(gazeY - 0.5) * 8 + 2;

    const targetPos = POINTS[currentPointIndex];

    // Check collision manually (since Gaze isn't a mouse pointer)
    const isLookingAtTarget = () => {
        const dx = reticleX - targetPos.x;
        const dy = reticleY - targetPos.y;
        return Math.sqrt(dx * dx + dy * dy) < 1.0; // Hit radius
    };

    // Auto-progress if generic gaze collision logic is used inside Firefly? 
    // Actually, passing 'hovered' state down is tricky with pure react props from parent logic.
    // Let's rely on the Firefly's internal logic but we need to pass a "isGazeHit" prop.

    // Simpler: Just render the Reticle and let basic collision work if we used raycasting.
    // For this prototype, we will infer "hover" state here and pass it down.
    const isHit = isLookingAtTarget();

    return (
        <>
            <ambientLight intensity={0.5} />

            <Text position={[0, 3.5, -2]} fontSize={0.5} color="white">
                Catch the Firefly!
            </Text>

            {/* The Target Firefly */}
            <Firefly
                position={[targetPos.x, targetPos.y, -2]}
                onCaught={handleCaught}
            />

            {/* Invisible Hitbox trigger for Gaze */}
            <mesh position={[targetPos.x, targetPos.y, -2]} visible={false}>
                <sphereGeometry args={[1]} />
                {/* We need Raycaster for IsHit, or just pass prop */}
            </mesh>

            {/* We cheat: We pass a "GazeCursor" that physically moves to the gaze coordinates. 
                If that cursor overlaps the Firefly, we trigger the logic. */}
            <mesh position={[reticleX, reticleY, -1.8]}>
                <ringGeometry args={[0.05, 0.1, 16]} />
                <meshBasicMaterial color={isHit ? "#34d399" : "white"} />
            </mesh>

            {/* Logic shim: If isHit is true, we simulate the 'hover' effect on the component 
                To do this cleanly in React Three Fiber without Raycaster complexity:
            */}
            <EffectShim isHit={isHit} onCaught={handleCaught} />
        </>
    );
}

function EffectShim({ isHit, onCaught }: { isHit: boolean, onCaught: () => void }) {
    const [progress, setProgress] = useState(0);

    useFrame((state, delta) => {
        if (isHit) {
            setProgress(p => {
                const np = p + delta * 1.5;
                if (np >= 1) {
                    onCaught();
                    return 0;
                }
                return np;
            });
        } else {
            setProgress(0);
        }
    });

    if (!isHit) return null;

    return (
        <mesh position={[0, 0, 0]}>
            {/* Feedback ring around cursor? Handling inside Scene is better */}
        </mesh>
    );
}


export default function CalibrationGame({ gazeX, gazeY, onComplete, onExit }: { gazeX: number, gazeY: number, onComplete: () => void, onExit?: () => void }) {
    // Calibration doesn't really have a 'score', but we can track points hit (0-5)
    const [pointsHit, setPointsHit] = useState(0);

    return (
        <div className="w-full h-full relative bg-slate-900">
            <Canvas>
                <CalibrationScene
                    gazeX={gazeX}
                    gazeY={gazeY}
                    onComplete={onComplete}
                    onPointHit={() => setPointsHit(p => p + 1)}
                />
            </Canvas>

            <div className="absolute inset-0 pointer-events-none">
                <GameOverlay
                    title="CALIBRATION"
                    score={pointsHit}
                    onExit={onExit}
                />
            </div>

            {/* Visual cursor indicator - Keep this as it's specific to calibration */}
            <div
                className="absolute w-8 h-8 border-2 border-green-400 rounded-full pointer-events-none transition-transform duration-75"
                style={{
                    left: `${gazeX * 100}%`,
                    top: `${gazeY * 100}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            />
        </div>
    );
}
