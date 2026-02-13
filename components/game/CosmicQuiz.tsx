"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import DichopticCanvas from "./DichopticCanvas";

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

const Balloon = ({ position, text, isCorrect, onClick }: { position: [number, number, number], text: string, isCorrect: boolean, onClick: () => void }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const [dwellTime, setDwellTime] = useState(0);
    const [popped, setPopped] = useState(false);

    // Config
    const REQUIRED_DWELL = 1.0;

    useFrame((state, delta) => {
        if (popped) return;

        if (groupRef.current) {
            // Simple Bobbing
            groupRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.002;
        }

        // Gaze Dwell Logic
        if (hovered) {
            console.log("Hovering balloon:", text); // Debug
            setDwellTime(prev => {
                const newTime = prev + delta;
                if (newTime > REQUIRED_DWELL && !popped) {
                    setPopped(true);
                    onClick();
                    return 0;
                }
                return newTime;
            });
            // Scale feedback
            if (groupRef.current) {
                const scale = 1 + (dwellTime / REQUIRED_DWELL) * 0.3;
                groupRef.current.scale.setScalar(scale);
            }
        } else {
            setDwellTime(0);
            if (groupRef.current) groupRef.current.scale.setScalar(1);
        }
    });

    if (popped) return null;

    const progress = Math.min(dwellTime / REQUIRED_DWELL, 1);

    return (
        <group
            ref={groupRef}
            position={position}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={() => { setPopped(true); onClick(); }}
        >
            {/* Balloon Body - Simple Sphere */}
            <mesh>
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshStandardMaterial
                    color={hovered ? "#fbbf24" : (isCorrect ? "#60A5FA" : "#F472B6")}
                />
            </mesh>

            {/* Dwell Progress Ring */}
            {hovered && (
                <mesh position={[0, 0, 0.9]}>
                    <ringGeometry args={[0.9, 1.0, 32, 1, 0, progress * Math.PI * 2]} />
                    <meshBasicMaterial color="#4ADE80" side={THREE.DoubleSide} transparent opacity={0.8} />
                </mesh>
            )}

            {/* Text - No Font Prop */}
            <Text position={[0, 0, 0.9]} fontSize={0.7} color="white" outlineWidth={0.05} outlineColor="#000000">
                {text}
            </Text>
        </group>
    );
};

const QuizScene = ({ gazeX, gazeY, onScore }: any) => {
    const [question, setQuestion] = useState<Question>(generateQuestion("easy"));
    const [questionId, setQuestionId] = useState(0);
    const [score, setScore] = useState(0);
    const [balloons, setBalloons] = useState<any[]>([]);

    useEffect(() => {
        const newBalloons = question.answers.map((ans, i) => ({
            ...ans,
            x: (i - 1) * 2,
            y: 0,
            z: -5
        }));
        setBalloons(newBalloons);
    }, [question]);

    const handleAnswer = (isCorrect: boolean, pos: [number, number, number]) => {
        if (isCorrect) {
            setScore(s => s + 10);
            setTimeout(() => {
                setQuestion(generateQuestion("easy"));
                setQuestionId(prev => prev + 1);
            }, 1000);
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

            {/* Question Text - No Font Prop */}
            <Text position={[0, 3, -10]} fontSize={1} color="white" anchorX="center" anchorY="middle">
                {question.text}
            </Text>

            {/* Balloons */}
            {balloons.map(b => (
                <Balloon
                    key={`${questionId}-${b.id}`}
                    position={[b.x, b.y, b.z]}
                    text={b.text}
                    isCorrect={b.isCorrect}
                    onClick={() => handleAnswer(b.isCorrect, [b.x, b.y, b.z])}
                />
            ))}

            {/* Reticle */}
            <mesh position={[0, 0, -2]}>
                <ringGeometry args={[0.02, 0.04, 32]} />
                <meshBasicMaterial color="lime" opacity={0.8} transparent />
            </mesh>
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
                    <QuizScene gazeX={gazeX} gazeY={gazeY} />
                </DichopticCanvas>
            ) : (
                <Canvas camera={{ position: [0, 0, 0] }}>
                    <QuizScene gazeX={gazeX} gazeY={gazeY} />
                    <ambientLight intensity={1} />
                </Canvas>
            )}

            {dichoptic && (
                <div className="absolute top-20 left-4 pointer-events-none">
                    <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
                        DICHOPTIC: {weakEye.toUpperCase()} EYE TARGET
                    </div>
                </div>
            )}
        </div>
    );
}
