"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useMemo, useEffect } from "react";
import { Text, Sky, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import { checkCollision, calculateMultiplier } from "@/lib/gameUtils";
import { GameOverlay } from "./GameOverlay";
import DichopticCanvas from "./DichopticCanvas";

// --- Amblyopia Settings Interface ---
export interface BalloonGameSettings {
    weakEye: 'left' | 'right';
    strongEyeOpacity: number;
    dichoptic: boolean;
}

// Simple particle explosion
function Confetti({ x, y, color }: { x: number, y: number, color: string }) {
    const particles = useMemo(() => Array.from({ length: 8 }).map(() => ({
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: color
    })), [color]);

    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                const p = particles[i];
                child.position.x += p.vx * delta;
                child.position.y += p.vy * delta;
                child.position.z += delta; // Move towards camera slightly
                child.rotation.x += delta * 5;
                child.rotation.z += delta * 5;
                // Gravity
                p.vy -= 15 * delta;
            });
            // Fade out
            groupRef.current.scale.multiplyScalar(0.95);
        }
    });

    return (
        <group position={[x, y, 0]} ref={groupRef}>
            {particles.map((p, i) => (
                <mesh key={i}>
                    <planeGeometry args={[0.2, 0.2]} />
                    <meshBasicMaterial color={p.color} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </group>
    );
}

// Glowing Ring Cursor - REFINED & LESS DISTRACTING
function GlowingReticle({ x, y, dichoptic = false }: { x: number, y: number, dichoptic?: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.z -= 0.02; // Slower rotation
            // Subtle pulse
            const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
            ref.current.scale.set(scale, scale, 1);
        }
    });

    // ALWAYS set layer to 0 (visible to both eyes) - critical for VR visibility
    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.layers.set(0); // Layer 0 = visible to both eyes
                }
            });
        }
    }, []);

    // Much smaller size as requested
    const size = dichoptic ? 0.3 : 0.25;

    return (
        <group ref={groupRef} position={[x, y, 3]} scale={size}>
            {/* Main thinner ring */}
            <mesh ref={ref}>
                <ringGeometry args={[0.3, 0.35, 32]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
            </mesh>
            {/* Very subtle center dot */}
            <mesh>
                <circleGeometry args={[0.05, 16]} />
                <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
            </mesh>
        </group>
    )
}

function BalloonWrapper({ data, reticleX, reticleY, hitRadius = 2.0, onPop, onMiss, dichoptic = false }: {
    data: any,
    reticleX: number,
    reticleY: number,
    hitRadius?: number,
    onPop: () => void,
    onMiss: () => void,
    dichoptic?: boolean
}) {
    const meshRef = useRef<THREE.Group>(null);
    const [popped, setPopped] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Dwell time tracking
    const dwellTimeRef = useRef(0);
    // SUPER FAST POP: 0.2s (User wanted "working properly" -> feels responsive)
    const REQUIRED_DWELL_TIME = 0.2;

    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Set layer for dichoptic rendering - ALWAYS set layers
    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    if (dichoptic) {
                        obj.layers.set(1); // Layer 1 = Visible only to weak eye
                    } else {
                        obj.layers.set(0); // Layer 0 = Visible to both eyes
                    }
                }
            });
        }
    }, [dichoptic]);

    useFrame((state, delta) => {
        if (popped) return;

        if (meshRef.current) {
            meshRef.current.position.y += data.speed * delta;
            // Slight sway
            meshRef.current.position.x += Math.sin(state.clock.elapsedTime * 2 + data.id) * 0.01;

            // Miss Logic
            if (meshRef.current.position.y > 6) {
                onMiss();
                dwellTimeRef.current = 0; // Reset dwell time
                if (isMounted.current && meshRef.current) {
                    meshRef.current.position.y = -4 - Math.random() * 3; // Respawn lower
                    meshRef.current.position.x = (Math.random() - 0.5) * 6; // Narrower spread
                }
            }

            // Dwell time collision detection
            const isHovering = checkCollision(meshRef.current.position.x, meshRef.current.position.y, reticleX, reticleY, hitRadius);

            if (isHovering) {
                // Accumulate dwell time
                dwellTimeRef.current += delta;

                // Only pop after required dwell time
                if (dwellTimeRef.current >= REQUIRED_DWELL_TIME) {
                    setPopped(true);
                    setShowConfetti(true);
                    onPop();
                    dwellTimeRef.current = 0; // Reset

                    setTimeout(() => {
                        if (!isMounted.current) return;
                        setPopped(false);
                        setShowConfetti(false);
                        if (meshRef.current) {
                            meshRef.current.position.y = -4 - Math.random() * 3; // Respawn lower
                            meshRef.current.position.x = (Math.random() - 0.5) * 6;
                        }
                    }, 500);
                }
            } else {
                // Decay dwell time instead of instant reset (feels smoother)
                dwellTimeRef.current = Math.max(0, dwellTimeRef.current - delta * 2);
            }
        }
    });

    return (
        <group>
            {!popped ? (
                <group ref={meshRef} position={[data.x, data.y, 0]}>
                    {/* Balloon Body - Slightly Larger */}
                    <mesh>
                        <sphereGeometry args={[0.55, 32, 32]} />
                        <meshStandardMaterial color={data.color} roughness={0.2} metalness={0.1} emissive={data.color} emissiveIntensity={0.4} />
                    </mesh>
                    {/* Balloon Knot */}
                    <mesh position={[0, -0.5, 0]}>
                        <cylinderGeometry args={[0.08, 0.03, 0.15]} />
                        <meshStandardMaterial color={data.color} />
                    </mesh>
                    {/* String */}
                    <mesh position={[0, -0.9, 0]}>
                        <cylinderGeometry args={[0.015, 0.015, 0.8]} />
                        <meshBasicMaterial color="white" transparent opacity={0.6} />
                    </mesh>
                    {/* Shine/Reflection */}
                    <mesh position={[0.25, 0.25, 0.45]}>
                        <sphereGeometry args={[0.15]} />
                        <meshBasicMaterial color="white" transparent opacity={0.4} />
                    </mesh>

                    {/* Progress Ring - Shows dwell time progress */}
                    {dwellTimeRef.current > 0 && (
                        <mesh rotation={[0, 0, 0]} position={[0, 0, 0.6]}>
                            <ringGeometry args={[0.2, 0.25, 32, 1, 0, (dwellTimeRef.current / REQUIRED_DWELL_TIME) * Math.PI * 2]} />
                            <meshBasicMaterial
                                color="#ffffff"
                                transparent
                                opacity={0.9}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    )}
                </group>
            ) : (
                <>
                    {showConfetti && <Confetti x={data.x} y={reticleY} color={data.color} />}
                    {/* Simplified Pop Effect */}
                </>
            )}
        </group>
    )
}

function RotatingGrating({ opacity = 0.1, color = "white", dichoptic = false }: { opacity?: number, color?: string, dichoptic?: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.z += delta * 0.05; // Slower rotation
        }
    });

    // Set layer for dichoptic rendering - ALWAYS set to Layer 0 (visible to both eyes)
    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.layers.set(0); // Background always visible to both eyes
        }
    }, []);

    // Create a texture for the grating
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 256; i += 32) {
                ctx.fillRect(i, 0, 16, 256);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }, []);

    return (
        <mesh ref={meshRef} position={[0, 0, -10]} scale={[30, 30, 1]}>
            <planeGeometry />
            <meshBasicMaterial map={texture} transparent opacity={opacity} color={color} blending={THREE.AdditiveBlending} />
        </mesh>
    );
}

function BalloonScene({ gazeX, gazeY, difficulty = "medium", score, onScore, settings }: {
    gazeX: number,
    gazeY: number,
    difficulty?: "easy" | "medium" | "hard",
    score: number,
    onScore: (score: number) => void,
    settings: BalloonGameSettings
}) {
    // Removed local score state
    const [multiplier, setMultiplier] = useState(1.0);
    const [streak, setStreak] = useState(0);

    // Difficulty settings
    const difficultySettings = {
        easy: { speedMultiplier: 0.5, hitRadius: 2.5 },   // Easier: larger radius
        medium: { speedMultiplier: 0.8, hitRadius: 2.0 },
        hard: { speedMultiplier: 1.2, hitRadius: 1.5 }
    };

    const diffConfig = difficultySettings[difficulty];

    // Determine Balloon Colors based on Dichoptic Settings
    const getBalloonColor = () => {
        if (!settings.dichoptic) {
            return ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#54A0FF', '#FD79A8'][Math.floor(Math.random() * 6)];
        }
        // Dichoptic: Target Weak Eye
        if (settings.weakEye === 'left') return '#FF0000'; // Red
        return '#00FFFF'; // Cyan
    };

    // Initial Balloons - Spawn in visible range
    const balloonData = useMemo(() => Array.from({ length: 8 }).map(() => ({
        id: Math.random(),
        x: (Math.random() - 0.5) * 8,
        y: -3 - Math.random() * 5, // Spawn from -3 to -8 (visible range)
        baseSpeed: (0.8 + Math.random() * 1.0) * diffConfig.speedMultiplier, // Slightly faster base speed
        color: getBalloonColor()
    })), [diffConfig.speedMultiplier, settings.dichoptic, settings.weakEye]);

    // Verify Gaze Inputs
    const safeGazeX = isNaN(gazeX) ? 0.5 : gazeX;
    const safeGazeY = isNaN(gazeY) ? 0.5 : gazeY;

    // Coordinate Mapping
    const reticleX = (safeGazeX - 0.5) * 12;
    const reticleY = -(safeGazeY - 0.5) * 12;

    const handlePop = () => {
        const newScore = score + 1;
        onScore(newScore);
        setStreak(prev => {
            const newStreak = prev >= 0 ? prev + 1 : 1;
            setMultiplier(m => calculateMultiplier(m, newStreak, true));
            return newStreak;
        });

        // Play pop sound
        if (typeof window !== 'undefined') {
            import('@/lib/audio').then(({ gameAudio }) => gameAudio.playPop());
        }
    };

    const handleMiss = () => {
        setStreak(prev => {
            const newStreak = prev <= 0 ? prev - 1 : -1;
            setMultiplier(m => calculateMultiplier(m, newStreak, false));
            return newStreak;
        });
    }

    return (
        <>
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} />

            {/* Background Stimulation */}
            <RotatingGrating
                opacity={settings.dichoptic ? 0.05 : 0.05} // Less distracting background
                color={settings.dichoptic ? (settings.weakEye === 'left' ? '#00FFFF' : '#FF0000') : 'white'}
                dichoptic={settings.dichoptic}
            />

            {balloonData.map((b) => (
                <BalloonWrapper
                    key={b.id}
                    data={{ ...b, speed: b.baseSpeed * multiplier, color: settings.dichoptic ? getBalloonColor() : b.color }}
                    reticleX={reticleX}
                    reticleY={reticleY}
                    hitRadius={diffConfig.hitRadius}
                    onPop={handlePop}
                    onMiss={handleMiss}
                    dichoptic={settings.dichoptic}
                />
            ))}

            <GlowingReticle x={reticleX} y={reticleY} dichoptic={settings.dichoptic} />

            {multiplier !== 1 && (
                <Text position={[0, 3, -5]} fontSize={0.4} color={multiplier > 1 ? "#ef4444" : "#3b82f6"}>
                    {multiplier > 1 ? `SPEED x${multiplier.toFixed(1)}` : `CHILL x${multiplier.toFixed(1)}`}
                </Text>
            )}
        </>
    );
}

export default function BalloonGame({
    gazeX,
    gazeY,
    onScoreUpdate,
    difficulty = "medium",
    onExit,
    formattedTime,
    settings = { weakEye: 'left', strongEyeOpacity: 1.0, dichoptic: false }
}: {
    gazeX: number,
    gazeY: number,
    onScoreUpdate?: (score: number) => void,
    difficulty?: "easy" | "medium" | "hard",
    onExit?: () => void,
    formattedTime?: string,
    settings?: BalloonGameSettings
}) {
    const [score, setScore] = useState(0);
    const [mouseGaze, setMouseGaze] = useState({ x: 0.5, y: 0.5 });
    const [usingMouse, setUsingMouse] = useState(false);

    // Mouse tracking fallback for VR mode
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            setMouseGaze({ x, y });
            setUsingMouse(true);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Use mouse gaze if eye tracking gives invalid values
    const effectiveGazeX = (gazeX === 0.5 && gazeY === 0.5 && usingMouse) ? mouseGaze.x : gazeX;
    const effectiveGazeY = (gazeX === 0.5 && gazeY === 0.5 && usingMouse) ? mouseGaze.y : gazeY;

    const handleScore = (newScore: number) => {
        setScore(newScore);
        onScoreUpdate?.(newScore);
    };

    return (
        <div className="w-full h-full relative bg-black">
            {/* Changed bg-blue-300 to bg-black for better contrast/dichoptic */}
            {settings.dichoptic ? (
                <DichopticCanvas
                    weakEye={settings.weakEye}
                    strongEyeOpacity={settings.strongEyeOpacity}
                >
                    <ambientLight intensity={0.8} />
                    <pointLight position={[10, 10, 10]} />
                    <BalloonScene
                        gazeX={effectiveGazeX}
                        gazeY={effectiveGazeY}
                        difficulty={difficulty}
                        score={score}
                        onScore={handleScore}
                        settings={settings}
                    />
                </DichopticCanvas>
            ) : (
                <Canvas camera={{ position: [0, 0, 5] }}>
                    <Sky sunPosition={[100, 20, 100]} />
                    <ambientLight intensity={0.8} />
                    <pointLight position={[10, 10, 10]} />
                    <BalloonScene
                        gazeX={effectiveGazeX}
                        gazeY={effectiveGazeY}
                        difficulty={difficulty}
                        score={score}
                        onScore={handleScore}
                        settings={settings}
                    />
                </Canvas>
            )}

            <div className="absolute inset-0 pointer-events-none">
                <GameOverlay
                    title="Balloon Pop"
                    score={score}
                    difficulty={difficulty}
                    onExit={onExit}
                    formattedTime={formattedTime}
                />
                {settings.dichoptic && (
                    <div className="absolute top-20 left-4 pointer-events-none">
                        <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
                            DICHOPTIC: {settings.weakEye.toUpperCase()} EYE TARGET
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


