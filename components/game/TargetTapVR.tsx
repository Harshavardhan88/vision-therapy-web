"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { XR, Controllers, Hands, VRButton, useXR, useController } from "@react-three/xr";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Text, Sphere, Box, OrbitControls } from "@react-three/drei";
import { GameOverlay } from "./GameOverlay";

// --- Types ---
type Eye = "left" | "right";

interface DepthReachProps {
    settings?: {
        weakEye: Eye;
        strongEyeOpacity: number;
    };
    difficulty?: "easy" | "medium" | "hard";
    onScoreUpdate?: (score: number) => void;
    onExit?: () => void;
}

// --- Hand Visualization ---
function VRHand({ hand }: { hand: "left" | "right" }) {
    const controller = useController(hand);
    const handRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (controller && handRef.current) {
            handRef.current.position.copy(controller.controller.position);
            handRef.current.quaternion.copy(controller.controller.quaternion);
        }
    });

    return (
        <group ref={handRef}>
            {/* Palm */}
            <Sphere args={[0.05]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
            </Sphere>
            {/* Pointer finger */}
            <Box args={[0.02, 0.1, 0.02]} position={[0, 0, -0.08]}>
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.3} />
            </Box>
        </group>
    );
}

// --- Spatial Target ---
function SpatialTarget({
    position,
    onTouch,
    layer,
    size = 0.3,
    depth,
    previewMode = false,
}: {
    position: [number, number, number];
    onTouch: () => void;
    layer: number;
    size?: number;
    depth: "near" | "mid" | "far";
    previewMode?: boolean;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [touched, setTouched] = useState(false);
    const leftController = useController("left");
    const rightController = useController("right");

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.layers.set(layer);
        }
    }, [layer]);

    useFrame((state) => {
        if (!meshRef.current || touched) return;

        // Pulsing animation based on depth
        const pulseSpeed = depth === "near" ? 3 : depth === "mid" ? 2 : 1;
        const scale = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.1;
        meshRef.current.scale.setScalar(scale);

        // Only check hand proximity in VR mode
        if (!previewMode) {
            const checkHand = (controller: any) => {
                if (!controller) return;
                const handPos = controller.controller.position;
                const targetPos = meshRef.current!.position;
                const distance = handPos.distanceTo(targetPos);

                if (distance < size + 0.1) {
                    setTouched(true);
                    onTouch();
                }
            };

            checkHand(leftController);
            checkHand(rightController);
        }
    });

    const handleClick = () => {
        if (previewMode && !touched) {
            setTouched(true);
            onTouch();
        }
    };

    if (touched) return null;

    // Color based on depth
    const color = depth === "near" ? "#ff6b6b" : depth === "mid" ? "#ffd93d" : "#6bcf7f";

    return (
        <Sphere
            ref={meshRef}
            args={[size]}
            position={position}
            onClick={handleClick}
        >
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.6}
                roughness={0.3}
                metalness={0.2}
            />
        </Sphere>
    );
}

// --- Dichoptic Camera Setup ---
function DichopticRig({ weakEye }: { weakEye: Eye }) {
    const { camera } = useThree();
    const { isPresenting } = useXR();

    useEffect(() => {
        if (!isPresenting) return;

        const arrayCam = camera as THREE.ArrayCamera;
        if (arrayCam.cameras && arrayCam.cameras.length === 2) {
            const leftCam = arrayCam.cameras[0];
            const rightCam = arrayCam.cameras[1];

            leftCam.layers.enable(1);
            rightCam.layers.enable(2);
        }
    }, [camera, isPresenting]);

    return null;
}

// --- Environment ---
function TherapyEnvironment({ weakEye }: { weakEye: Eye }) {
    const strongEyeLayer = weakEye === "left" ? 2 : 1;

    return (
        <>
            {/* Grid floor - visible to strong eye for depth reference */}
            <gridHelper
                args={[20, 20, 0x444444, 0x222222]}
                position={[0, -1.5, 0]}
                layers={strongEyeLayer}
            />

            {/* Depth rings - visible to strong eye */}
            {[0.5, 1.5, 3].map((depth, i) => (
                <mesh
                    key={i}
                    position={[0, 0, -depth]}
                    rotation={[0, 0, 0]}
                    layers={strongEyeLayer}
                >
                    <ringGeometry args={[1.5, 1.6, 32]} />
                    <meshBasicMaterial color="#333333" transparent opacity={0.3} />
                </mesh>
            ))}

            {/* Ambient lighting */}
            <ambientLight intensity={0.6} />
            <pointLight position={[5, 5, 5]} intensity={0.8} />
            <pointLight position={[-5, 5, -5]} intensity={0.5} />
        </>
    );
}

// --- Game Scene ---
function GameScene({ settings, difficulty, score, onScore }: any) {
    const [targets, setTargets] = useState<
        { id: number; pos: [number, number, number]; depth: "near" | "mid" | "far" }[]
    >([]);
    const { isPresenting } = useXR();
    const [previewMode, setPreviewMode] = useState(false);

    // Check if VR is available after a delay
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isPresenting) {
                setPreviewMode(true);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [isPresenting]);

    // Spawn targets in 3D space
    useFrame(() => {
        // In preview mode, always spawn. In VR mode, only when presenting
        if ((!isPresenting && !previewMode) || targets.length >= 3) return;

        if (Math.random() < 0.02) {
            const depth = Math.random() < 0.33 ? "near" : Math.random() < 0.66 ? "mid" : "far";
            const depthZ = depth === "near" ? -0.5 : depth === "mid" ? -1.5 : -3;

            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 0.5;

            setTargets((prev) => [
                ...prev,
                {
                    id: Math.random(),
                    pos: [
                        Math.cos(angle) * radius,
                        -0.5 + Math.random() * 1.5,
                        depthZ,
                    ],
                    depth,
                },
            ]);
        }
    });

    const handleTouch = (id: number) => {
        setTargets((prev) => prev.filter((t) => t.id !== id));
        onScore(score + 10);
    };

    const weakEyeLayer = settings.weakEye === "left" ? 1 : 2;

    return (
        <>
            <DichopticRig weakEye={settings.weakEye} />
            <TherapyEnvironment weakEye={settings.weakEye} />

            {/* VR Hands - only in VR mode */}
            {isPresenting && (
                <>
                    <VRHand hand="left" />
                    <VRHand hand="right" />
                </>
            )}

            {/* Desktop Preview Controls */}
            {previewMode && (
                <>
                    <OrbitControls enablePan={true} enableZoom={true} />
                    <Text position={[0, 2.5, -2]} fontSize={0.12} color="#ff6b6b" anchorX="center">
                        PREVIEW MODE - Click targets to test
                    </Text>
                    <Text position={[0, 2.2, -2]} fontSize={0.08} color="#888888" anchorX="center">
                        (VR headset required for full therapy experience)
                    </Text>
                </>
            )}

            {/* Spatial Targets */}
            {targets.map((t) => (
                <SpatialTarget
                    key={t.id}
                    position={t.pos}
                    layer={previewMode ? 0 : weakEyeLayer} // Layer 0 for preview mode
                    onTouch={() => handleTouch(t.id)}
                    depth={t.depth}
                    size={t.depth === "near" ? 0.2 : t.depth === "mid" ? 0.15 : 0.1}
                    previewMode={previewMode}
                />
            ))}

            {/* Instructions text */}
            {isPresenting && (
                <Text position={[0, 2, -2]} fontSize={0.15} color="#00ffff" anchorX="center">
                    Reach out and touch the glowing targets
                </Text>
            )}
        </>
    );
}

export default function DepthReachVR(props: DepthReachProps) {
    const {
        settings = { weakEye: "left", strongEyeOpacity: 0.3 },
        difficulty = "medium",
        onExit,
    } = props;

    const [score, setScore] = useState(0);
    const [previewModeActive, setPreviewModeActive] = useState(false);
    const { isPresenting } = useXR();

    const handleScore = (s: number) => {
        setScore(s);
        props.onScoreUpdate?.(s);
    };

    // Track when preview mode activates
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isPresenting) {
                setPreviewModeActive(true);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [isPresenting]);

    return (
        <div className="w-full h-full relative bg-black">
            <Canvas>
                <XR>
                    <Controllers />
                    <Hands />
                    <GameScene
                        settings={settings}
                        difficulty={difficulty}
                        score={score}
                        onScore={handleScore}
                    />
                </XR>
            </Canvas>

            <div className="absolute inset-0 pointer-events-none">
                <GameOverlay
                    title="Depth Reach VR"
                    score={score}
                    difficulty={difficulty}
                    onExit={onExit}
                />
            </div>

            <div className="absolute bottom-4 right-4 z-10">
                <VRButton />
            </div>

            {/* VR Required Message - Only show before preview mode activates */}
            {!previewModeActive && !isPresenting && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md p-8 rounded-2xl border border-cyan-500/30 max-w-md text-center">
                        <div className="text-6xl mb-4">🥽</div>
                        <h2 className="text-2xl font-bold text-cyan-400 mb-2">VR Headset Required</h2>
                        <p className="text-slate-300 text-sm mb-4">
                            This is a pure VR therapy experience. Put on your VR headset and click "ENTER VR" to begin.
                        </p>
                        <div className="text-xs text-slate-500">
                            Depth perception training requires stereoscopic 3D
                        </div>
                        <div className="text-xs text-slate-400 mt-4">
                            (Desktop preview mode will activate in 2 seconds...)
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
