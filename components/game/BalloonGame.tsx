"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

// Glowing Ring Cursor - REFINED & ALWAYS VISIBLE
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

    // ALWAYS set layer to 0 (visible to both eyes)
    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.layers.set(0);
                }
            });
        }
    }, []);

    // Increased size and opacity for visibility
    const size = dichoptic ? 0.5 : 0.4;

    return (
        <group ref={groupRef} position={[x, y, 0]} scale={size}>
            {/* Main thinner ring - NO DEPTH TEST (Always on Top) */}
            <mesh ref={ref}>
                <ringGeometry args={[0.3, 0.35, 32]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={1.0} depthTest={false} depthWrite={false} />
            </mesh>
            {/* Center dot - NO DEPTH TEST */}
            <mesh>
                <circleGeometry args={[0.08, 16]} />
                <meshBasicMaterial color="#ffffff" opacity={1.0} transparent depthTest={false} depthWrite={false} />
            </mesh>
        </group>
    )
}

// Helper to get World Position of a Reticle that is Head-Locked
function getReticleWorldPosition(camera: THREE.Camera, gazeX: number, gazeY: number): THREE.Vector3 {
    // Reticle is at (0,0,-2) relative to camera (very close)
    const vec = new THREE.Vector3((gazeX - 0.5) * 4, -(gazeY - 0.5) * 4, -2);
    vec.applyMatrix4(camera.matrixWorld);
    return vec;
}

function BalloonWrapper({ data, gazeX, gazeY, hitRadius = 2.0, onPop, onMiss, dichoptic = false }: {
    data: any,
    gazeX: number,
    gazeY: number,
    hitRadius?: number,
    onPop: () => void,
    onMiss: () => void,
    dichoptic?: boolean
}) {
    const meshRef = useRef<THREE.Group>(null);
    const [popped, setPopped] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const { camera } = useThree();

    // Dwell time tracking
    const dwellTimeRef = useRef(0);
    // SUPER FAST POP: 0.2s 
    const REQUIRED_DWELL_TIME = 0.2;

    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Set layer for dichoptic rendering
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

            // 3D COLLISION DETECTION (Moving Camera support)
            // 1. Get Reticle World Position
            const reticlePos = getReticleWorldPosition(camera, gazeX, gazeY);

            // 2. Get Balloon World Position (it's at z=0, so meshRef.current.position is correct usually)
            // But we should verify distance
            const balloonPos = meshRef.current.position;

            // 3. Check distance in 3D?
            // Wait, Reticle is at z=-3 (relative to cam). Balloon is at z=0 (world).
            // Camera starts at z=5.
            // If Camera is at z=5, Reticle is at z=2.
            // Balloon is at z=0.
            // They don't touch in Z.
            // So we need Raycast / Angle alignment check.

            // RAYCAST LOGIC SIMULATION:
            // Is the Balloon "behind" the Reticle from the Camera's perspective?

            // Vector from Camera to Balloon
            const camToBalloon = new THREE.Vector3().subVectors(balloonPos, camera.position).normalize();

            // Vector from Camera to Reticle
            const camToReticle = new THREE.Vector3().subVectors(reticlePos, camera.position).normalize();

            // Dot Product -> Angle
            // If Dot is close to 1, they are aligned.
            const dot = camToBalloon.dot(camToReticle);

            // Angle in radians = acos(dot)
            // Threshold?
            // If hitRadius is large... let's say 5 degrees tolerance.
            // cos(5 deg) ~ 0.996

            // Hit Radius Logic conversion:
            // hitRadius 2.0 in world units at distance ~5?
            // atan(2/5) = ~21 degrees. That's huge. 
            // Previous logic: checkCollision(bx, by, rx, ry, radius). This ignored Z.
            // It projected to 2D plane effectively.

            // New Logic: Angle check.
            const threshold = 0.99 - (hitRadius * 0.005); // Rough approximation tuning
            // 0.98 is about 11 degrees.

            const isHovering = dot > 0.98; // Liberal hit box

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
                // Decay dwell time
                dwellTimeRef.current = Math.max(0, dwellTimeRef.current - delta * 2);
            }
        }
    });

    return (
        <group>
            {!popped ? (
                <group ref={meshRef} position={[data.x, data.y, 0]}>
                    {/* Balloon Body - EVEN SMALLER (0.3) */}
                    <mesh>
                        <sphereGeometry args={[0.3, 32, 32]} />
                        <meshStandardMaterial color={data.color} roughness={0.2} metalness={0.1} emissive={data.color} emissiveIntensity={0.4} />
                    </mesh>
                    {/* Balloon Knot - Scaled down */}
                    <mesh position={[0, -0.3, 0]}>
                        <cylinderGeometry args={[0.04, 0.015, 0.08]} />
                        <meshStandardMaterial color={data.color} />
                    </mesh>
                    {/* String - Scaled down */}
                    <mesh position={[0, -0.5, 0]}>
                        <cylinderGeometry args={[0.008, 0.008, 0.5]} />
                        <meshBasicMaterial color="white" transparent opacity={0.6} />
                    </mesh>
                    {/* Shine/Reflection - Scaled down */}
                    <mesh position={[0.12, 0.12, 0.25]}>
                        <sphereGeometry args={[0.08]} />
                        <meshBasicMaterial color="white" transparent opacity={0.4} />
                    </mesh>

                    {/* Progress Ring - Scaled down */}
                    {dwellTimeRef.current > 0 && (
                        <mesh rotation={[0, 0, 0]} position={[0, 0, 0.35]}>
                            <ringGeometry args={[0.1, 0.14, 32, 1, 0, (dwellTimeRef.current / REQUIRED_DWELL_TIME) * Math.PI * 2]} />
                            <meshBasicMaterial
                                color="#ffffff"
                                transparent
                                opacity={0.9}
                                side={THREE.DoubleSide}
                                depthTest={false} // Ensure ring renders on top
                            />
                        </mesh>
                    )}
                </group>
            ) : (
                <>
                    {/* Confetti Rendered in World Space */}
                    {showConfetti && <Confetti x={data.x} y={data.y} color={data.color} />}
                </>
            )}
        </group>
    )
}

function RotatingGrating({ opacity = 0.1, color = "white", dichoptic = false }: { opacity?: number, color?: string, dichoptic?: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();

    useFrame((state, delta) => {
        if (meshRef.current) {
            // HEAD-LOCK Logic:
            // Follow camera EXACTLY to appear static on screen
            meshRef.current.position.copy(camera.position);
            meshRef.current.quaternion.copy(camera.quaternion);

            // Re-apply Z-spin (relative to camera local axis)
            meshRef.current.rotateZ(state.clock.elapsedTime * 0.05);

            // Push back
            meshRef.current.translateZ(-10);
        }
    });

    // Set layer for dichoptic rendering - ALWAYS set to Layer 0 (visible to both eyes)
    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.layers.set(0);
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
        <mesh ref={meshRef} scale={[40, 40, 1]}> {/* Increased scale to guarantee coverage */}
            {/* Position is handled by useFrame now */}
            <planeGeometry />
            <meshBasicMaterial map={texture} transparent opacity={opacity} color={color} blending={THREE.AdditiveBlending} depthWrite={false} />
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

    // RETICLE IS NOW CENTERED (0,0) RELATIVE TO CAMERA?
    // Wait, if we use Gyro Camera, the "Gaze" is effectively the center of the screen (what user looks at).
    // Eye Tracker is an offset from center.
    // If gazeX/Y are 0.5 (center), then reticle is at (0,0).
    // Balloons are in World Space.
    // User rotates Camera to overlap Reticle (Center) with Balloon.

    // Coordinate Mapping
    // If Gaze is 0.5,0.5 -> Reticle is at 0,0 locally attached to camera?
    // No, Reticle is rendered in BalloonScene. BalloonScene is WORLD space?
    // If Reticle is in BalloonScene (World), and Camera moves, Reticle stays in World? No!
    // Reticle should be HEAD LOCKED (Child of Camera).
    // But BalloonScene is wrapped in DichopticCanvas...

    // FIX: Make Reticle HEAD LOCKED too!

    return (
        <>
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} />

            {/* Background Stimulation - Now Head Locked */}
            <RotatingGrating
                opacity={settings.dichoptic ? 0.05 : 0.05}
                color={settings.dichoptic ? (settings.weakEye === 'left' ? '#00FFFF' : '#FF0000') : 'white'}
                dichoptic={settings.dichoptic}
            />

            {balloonData.map((b) => (
                <BalloonWrapper
                    key={b.id}
                    data={{ ...b, speed: b.baseSpeed * multiplier, color: settings.dichoptic ? getBalloonColor() : b.color }}
                    gazeX={safeGazeX}
                    gazeY={safeGazeY}
                    hitRadius={diffConfig.hitRadius}
                    onPop={handlePop}
                    onMiss={handleMiss}
                    dichoptic={settings.dichoptic}
                />
            ))}

            {/* Reticle: Needs to be Head Locked so it stays in center of view as you look around */}
            <HeadLockedReticle gazeX={safeGazeX} gazeY={safeGazeY} dichoptic={settings.dichoptic} />

            {multiplier !== 1 && (
                <Text position={[0, 3, -5]} fontSize={0.4} color={multiplier > 1 ? "#ef4444" : "#3b82f6"}>
                    {multiplier > 1 ? `SPEED x${multiplier.toFixed(1)}` : `CHILL x${multiplier.toFixed(1)}`}
                </Text>
            )}
        </>
    );
}

// Helper for Head Locked Reticle
function HeadLockedReticle({ gazeX, gazeY, dichoptic }: { gazeX: number, gazeY: number, dichoptic: boolean }) {
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current) {
            // Follow camera
            groupRef.current.position.copy(camera.position);
            groupRef.current.quaternion.copy(camera.quaternion);

            // Offset by Gaze (if Eye Tracker is working, offset from center)
            // Gaze 0.5,0.5 = Center.
            const offsetX = (gazeX - 0.5) * 6; // Scale factor
            const offsetY = -(gazeY - 0.5) * 6;

            groupRef.current.translateX(offsetX);
            groupRef.current.translateY(offsetY);
            groupRef.current.translateZ(-3); // Distance
        }
    });

    return (
        <group ref={groupRef}>
            <GlowingReticle x={0} y={0} dichoptic={dichoptic} />
        </group>
    );
}

// Helper wrapper to update BalloonWrapper to use Camera-relative collision? 
// Actually, checkCollision logic in BalloonWrapper likely assumes static Reticle X/Y in World Space.
// If Reticle moves with Camera, we need to pass CURRENT Reticle World Position to BalloonWrapper.
// But BalloonWrapper runs its own useFrame.
// We can't easily pass dynamic props without re-render.
// Better: Pass a Ref to the Reticle? Or keep Reticle X/Y as "Center of Screen" logic for Collision?
// If Reticle is Center of Screen... raycast from Camera Center?
// Simplified Collision:
// Calculate angle between Camera-to-Balloon vector and Camera Forward vector.
// If angle is small -> Hit.



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
    // Simplified BalloonGame wrapper
    // Now Gaze is only used for Eye Tracking offset (optional)
    // Gyro is handled by Camera in DichopticCanvas

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
                        gazeX={gazeX}
                        gazeY={gazeY}
                        difficulty={difficulty}
                        score={score}
                        onScore={handleScore}
                        settings={settings}
                    />
                </DichopticCanvas>
            ) : (
                // Non-Dichoptic Mode: Standard Canvas
                <Canvas camera={{ position: [0, 0, 5] }}>
                    <ambientLight intensity={0.8} />
                    <pointLight position={[10, 10, 10]} />
                    <BalloonScene
                        gazeX={gazeX}
                        gazeY={gazeY}
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


