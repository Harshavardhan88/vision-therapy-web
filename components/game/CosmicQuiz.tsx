"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Text, OrbitControls } from "@react-three/drei";
import DichopticCanvas from "./DichopticCanvas";
import { GameOverlay } from "./GameOverlay";

// --- Types ---
export interface Question {
    text: string;
    answers: { id: number; text: string; isCorrect: boolean }[];
}

interface CosmicQuizProps {
    gazeX: number;
    gazeY: number;
    onExit?: () => void;
    difficulty?: "easy" | "medium" | "hard";
    settings?: {
        opacity?: number;
        weakEye?: "left" | "right";
        strongEyeOpacity?: number;
        dichoptic?: boolean;
        onScoreUpdate?: (score: number) => void;
    };
}

// --- Logic ---
export const generateQuestion = (diff: string): Question => {
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    const sum = a + b;

    const answers = [
        { id: 1, text: sum.toString(), isCorrect: true },
        { id: 2, text: (sum + 1 + Math.floor(Math.random() * 2)).toString(), isCorrect: false },
        { id: 3, text: (sum - 1 - Math.floor(Math.random() * 2)).toString(), isCorrect: false },
    ].sort(() => Math.random() - 0.5);

    return { text: `${a} + ${b} = ?`, answers };
};

// --- Components ---

// Reticle now positioned by Raycasting to match true Gaze Vector
function HeadLockedReticle({ gazeX, gazeY }: { gazeX: number, gazeY: number }) {
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const raycaster = useMemo(() => new THREE.Raycaster(), []);

    useFrame(() => {
        if (groupRef.current) {
            // 1. Setup Ray from Camera based on Gaze
            // raycaster.setFromCamera expects NDC (-1 to +1)
            const ndcX = (gazeX - 0.5) * 2;
            const ndcY = (0.5 - gazeY) * 2; // Invert Y for NDC? (Top=1, Bottom=-1). gazeY 0=top. Correct.

            raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

            // 2. Position Reticle along the Ray at fixed distance
            const distance = 4; // Visual distance
            raycaster.ray.at(distance, groupRef.current.position);

            // 3. Orient Reticle to face camera
            groupRef.current.lookAt(camera.position);
        }
    });

    return (
        <group ref={groupRef}>
            <mesh>
                <ringGeometry args={[0.08, 0.1, 32]} />
                <meshBasicMaterial color="#06b6d4" opacity={0.9} transparent depthTest={false} />
            </mesh>
            <mesh>
                <circleGeometry args={[0.02, 16]} />
                <meshBasicMaterial color="white" opacity={1} transparent depthTest={false} />
            </mesh>
            {/* Glow effect */}
            <mesh position={[0, 0, -0.01]}>
                <ringGeometry args={[0.07, 0.12, 16]} />
                <meshBasicMaterial color="#06b6d4" opacity={0.3} transparent depthTest={false} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
}

const Balloon = ({ id, position, text, isCorrect, onPop, gazeX, gazeY }: { id: number, position: [number, number, number], text: string, isCorrect: boolean, onPop: () => void, gazeX: number, gazeY: number }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const [dwellTime, setDwellTime] = useState(0);
    const [popped, setPopped] = useState(false);

    // Use local raycaster for collision check
    const { camera } = useThree();
    const raycaster = useMemo(() => new THREE.Raycaster(), []);

    const REQUIRED_DWELL = 1.0;

    useFrame((state, delta) => {
        if (popped || !groupRef.current) return;

        // Bobbing
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
        groupRef.current.position.x = position[0];
        groupRef.current.position.z = position[2];

        // --- PRECISE COLLISION LOGIC ---
        // 1. Setup Ray
        const ndcX = (gazeX - 0.5) * 2;
        const ndcY = (0.5 - gazeY) * 2;
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

        // 2. Intersect this balloon?
        // Note: intersectObject works on children (meshes)
        const intersects = raycaster.intersectObject(groupRef.current, true);

        if (intersects.length > 0) {
            setHovered(true);
            setDwellTime(prev => {
                const newTime = prev + delta;
                if (newTime > REQUIRED_DWELL && !popped) {
                    setPopped(true);
                    onPop();
                    // Play pop sound if possible
                    return 0;
                }
                return newTime;
            });

            // Visual feedback
            const scale = 1 + (dwellTime / REQUIRED_DWELL) * 0.2;
            groupRef.current.scale.setScalar(scale);

        } else {
            setHovered(false);
            setDwellTime(0);
            groupRef.current.scale.setScalar(1);
        }
    });

    if (popped) return null;

    const progress = Math.min(dwellTime / REQUIRED_DWELL, 1);

    return (
        <group ref={groupRef} position={position}>
            {/* Balloon Body - Larger Hitbox implicitly via sphere */}
            <mesh>
                <sphereGeometry args={[0.85, 32, 32]} />
                <meshStandardMaterial
                    color={hovered ? "#fbbf24" : (isCorrect ? "#60A5FA" : "#F472B6")}
                    metalness={0.3}
                    roughness={0.4}
                />
            </mesh>

            {/* Dwell Progress Ring */}
            {hovered && (
                <mesh position={[0, 0, 0.9]} rotation={[0, 0, 0]}>
                    <ringGeometry args={[0.9, 1.0, 32, 1, 0, progress * Math.PI * 2]} />
                    <meshBasicMaterial color="#a3e635" side={THREE.DoubleSide} transparent opacity={1} />
                </mesh>
            )}

            <Text position={[0, 0, 1.0]} fontSize={0.6} color="white" outlineWidth={0.08} outlineColor="#000000" fontWeight="bold">
                {text}
            </Text>
        </group>
    );
};

const QuizScene = ({ gazeX, gazeY, onScore }: any) => {
    const [question, setQuestion] = useState<Question>(generateQuestion("easy"));
    const [questionId, setQuestionId] = useState(0);
    // const [score, setScore] = useState(0); 
    const [balloons, setBalloons] = useState<any[]>([]);

    useEffect(() => {
        // Spread balloons horizontally
        // -3, 0, +3
        const newBalloons = question.answers.map((ans, i) => ({
            ...ans,
            x: (i - 1) * 3, // Spacing
            y: 0,
            z: -6 // Distance
        }));
        setBalloons(newBalloons);
    }, [question]);

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            // setScore(s => s + 10);
            if (onScore) onScore(10); // Notify parent
            setTimeout(() => {
                setQuestion(generateQuestion("easy"));
                setQuestionId(prev => prev + 1);
            }, 500);
        }
    };

    return (
        <>
            <ambientLight intensity={1} />
            <pointLight position={[10, 10, 10]} />

            {/* Background - Simple Plane */}
            <mesh position={[0, 0, -20]}>
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial color="#1e1b4b" />
            </mesh>

            {/* Question Text */}
            <Text position={[0, 3, -8]} fontSize={1} color="white" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="black">
                {question.text}
            </Text>

            {/* Balloons */}
            {balloons.map(b => (
                <Balloon
                    key={`${questionId}-${b.id}`}
                    id={b.id}
                    position={[b.x, b.y, b.z]}
                    text={b.text}
                    isCorrect={b.isCorrect}
                    onPop={() => handleAnswer(b.isCorrect)}
                    gazeX={gazeX}
                    gazeY={gazeY}
                />
            ))}

            {/* Head Locked Reticle */}
            <HeadLockedReticle gazeX={gazeX} gazeY={gazeY} />
        </>
    );
};

export default function CosmicQuiz({ gazeX, gazeY, onExit, settings = {} }: CosmicQuizProps) {
    const { dichoptic = false, weakEye = "left", strongEyeOpacity = 1.0 } = settings;

    return (
        <div className="w-full h-full relative bg-black">
            {dichoptic ? (
                <DichopticCanvas
                    weakEye={weakEye}
                    strongEyeOpacity={strongEyeOpacity}
                >
                    <QuizScene gazeX={gazeX} gazeY={gazeY} onScore={settings.onScoreUpdate} />
                </DichopticCanvas>
            ) : (
                <Canvas camera={{ position: [0, 0, 0] }}>
                    <QuizScene gazeX={gazeX} gazeY={gazeY} onScore={settings.onScoreUpdate} />
                </Canvas>
            )}

            {/* Always-visible EXIT button via GameOverlay */}
            <div className="absolute inset-0 pointer-events-none">
                <GameOverlay
                    title="Cosmic Quiz"
                    score={0}
                    onExit={onExit}
                />
            </div>

            {dichoptic && (
                <div className="absolute top-20 left-4 pointer-events-none">
                    <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
                        {weakEye.toUpperCase()} EYE TARGET
                    </div>
                </div>
            )}
        </div>
    );
}
