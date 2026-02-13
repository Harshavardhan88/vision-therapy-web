"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { XR, Controllers, Hands, VRButton } from "@react-three/xr";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Stars, Text } from "@react-three/drei";
import { GameOverlay } from "./GameOverlay";

// --- Types ---
interface VRGameProps {
    gazeX: number;
    gazeY: number;
    difficulty?: "easy" | "medium" | "hard";
    mode?: "vr" | "webcam";
    settings?: {
        weakEye: "left" | "right";
        strongEyeOpacity: number;
    };
    onScoreUpdate?: (score: number) => void;
    onExit?: () => void;
    onLevelComplete?: (level: number) => void;
    onSessionComplete?: (metrics: { accuracy: number, responseTime: number }) => void;
}

// --- Constants ---
const LAYERS = {
    BOTH: 0,
    LEFT: 1,
    RIGHT: 2
};

// --- Components ---

function Reticle({ x, y, mode }: { x: number; y: number; mode: "vr" | "webcam" }) {
    const posX = (x - 0.5) * 10;
    const posY = -(y - 0.5) * 8 + 2;

    return (
        <group position={[posX, posY, -2]}>
            <mesh name="reticle-core">
                <ringGeometry args={[0.05, 0.08, 32]} />
                <meshBasicMaterial color="#00ff00" opacity={0.8} transparent depthTest={false} />
            </mesh>
            <mesh name="reticle-outer" rotation={[0, 0, Date.now() / 1000]}>
                <ringGeometry args={[0.12, 0.13, 4]} />
                <meshBasicMaterial color="#00ff00" opacity={0.3} transparent depthTest={false} />
            </mesh>
            <mesh position={[0, -5, 5]} rotation={[-0.2, 0, 0]}>
                <boxGeometry args={[0.02, 0.02, 10]} />
                <meshBasicMaterial color="#00ff00" opacity={0.1} transparent />
            </mesh>
        </group>
    );
}

function Cockpit() {
    return (
        <group position={[0, 0, 4]}>
            <mesh position={[0, -1.5, -1]}>
                <boxGeometry args={[4, 1, 1]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.8, -1]} rotation={[-0.5, 0, 0]}>
                <planeGeometry args={[2, 0.5]} />
                <meshBasicMaterial color="#0ea5e9" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

const Enemy = ({ position, speed, layer, gazeRef, hitRadius, onHit, onMiss, geometry, material, type }: {
    position: [number, number, number];
    speed: number;
    layer: number;
    gazeRef: React.MutableRefObject<{ x: number, y: number }>;
    hitRadius: number;
    onHit: () => void;
    onMiss: () => void;
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
    type: 'asteroid' | 'drone' | 'boss';
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [isHit, setIsHit] = useState(false);

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.layers.set(layer);
        }
    }, [layer]);

    useFrame((state, delta) => {
        if (meshRef.current && !isHit) {
            if (type === 'boss') {
                meshRef.current.position.z += delta * speed * 0.5;
                meshRef.current.position.x = Math.sin(state.clock.elapsedTime) * 3;
                meshRef.current.position.y = Math.cos(state.clock.elapsedTime * 0.5) * 2;
            } else {
                meshRef.current.rotation.x += delta;
                meshRef.current.rotation.y += delta;
                meshRef.current.position.z += delta * speed;
            }

            const cx = meshRef.current.position.x;
            const cy = meshRef.current.position.y;
            const cz = meshRef.current.position.z;

            if (cz > 2) {
                onMiss();
                meshRef.current.position.z = -20;
            }

            if (cz > -15 && cz < 2) {
                const reticleX = (gazeRef.current.x - 0.5) * 10;
                const reticleY = -(gazeRef.current.y - 0.5) * 8 + 2;

                const dx = cx - reticleX;
                const dy = cy - reticleY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < hitRadius) {
                    setIsHit(true);
                    onHit();
                }
            }
        }
    });

    useEffect(() => {
        setIsHit(false);
    }, [position]);

    return (
        <mesh
            ref={meshRef}
            position={position}
            visible={!isHit}
            onClick={onHit}
            onPointerOver={() => document.body.style.cursor = 'crosshair'}
            onPointerOut={() => document.body.style.cursor = 'default'}
            geometry={geometry}
            material={material}
        />
    );
};

function DichopticCameraRig({ settings, mode }: { settings: NonNullable<VRGameProps['settings']>, mode: string }) {
    const { camera } = useThree();

    useEffect(() => {
        const arrayCam = camera as THREE.ArrayCamera;
        if (arrayCam.cameras && arrayCam.cameras.length === 2) {
            const leftCam = arrayCam.cameras[0];
            const rightCam = arrayCam.cameras[1];
            leftCam.layers.enable(1);
            rightCam.layers.enable(2);
        }

        if (mode !== 'vr') {
            camera.layers.enable(1);
            camera.layers.enable(2);
        }
    }, [camera, settings, mode]);

    return null;
}

function GameScene({ gazeX, gazeY, difficulty, mode, settings = { weakEye: 'left', strongEyeOpacity: 1.0 }, score, onScore, onLevelComplete, onMetricsUpdate }:
    { gazeX: number, gazeY: number, difficulty: string, mode: string, settings: any, score: number, onScore: any, onLevelComplete?: (level: number) => void, onMetricsUpdate?: (acc: number, rt: number) => void }) {

    // const [score, setScore] = useState(0); // Removed local score
    const [level, setLevel] = useState(1);
    const [waveText, setWaveText] = useState("WAVE 1");

    const gazeRef = useRef({ x: gazeX, y: gazeY });
    useFrame(() => {
        gazeRef.current = { x: gazeX, y: gazeY };
    });

    const [multiplier, setMultiplier] = useState(1.0);
    const [streak, setStreak] = useState(0);

    // Safety check for difficulty
    const safeDiff = difficulty || "medium";
    const diffParams = {
        easy: { speed: 1.0, count: 5 },
        medium: { speed: 2.0, count: 10 },
        hard: { speed: 3.5, count: 15 }
    }[safeDiff as "easy" | "medium" | "hard"];

    const currentDiffParams = diffParams || { speed: 2.0, count: 10 };

    const [enemies, setEnemies] = useState<{ id: number, pos: [number, number, number], baseSpeed: number, layer: number, type: 'asteroid' | 'drone' | 'boss', hp: number, spawnTime: number }[]>([]);

    const [totalHits, setTotalHits] = useState(0);
    const [totalMisses, setTotalMisses] = useState(0);
    const [responseTimes, setResponseTimes] = useState<number[]>([]);

    useEffect(() => {
        const total = totalHits + totalMisses;
        const acc = total > 0 ? totalHits / total : 0;
        const avgRt = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
        onMetricsUpdate?.(acc, avgRt);
    }, [totalHits, totalMisses, responseTimes, onMetricsUpdate]);

    useEffect(() => {
        let count = 5;
        let type: 'asteroid' | 'drone' | 'boss' = 'asteroid';
        let speed = currentDiffParams.speed;
        let hp = 1;

        if (level === 1) { count = 5; type = 'asteroid'; setWaveText("WAVE 1: ASTEROID FIELD"); }
        else if (level === 2) { count = 8; type = 'drone'; speed *= 1.5; setWaveText("WAVE 2: DRONE SWARM"); }
        else if (level >= 3) { count = 1; type = 'boss'; hp = 20; speed *= 0.5; setWaveText("WARNING: MOTHERSHIP DETECTED"); }

        const newEnemies = Array.from({ length: count }).map((_, i) => ({
            id: i,
            pos: [(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 6 + 2, -10 - Math.random() * 20] as [number, number, number],
            baseSpeed: speed,
            layer: settings.weakEye === 'left' ? LAYERS.LEFT : LAYERS.RIGHT,
            type: type,
            hp: hp,
            spawnTime: Date.now() / 1000
        }));
        setEnemies(newEnemies);
    }, [level, currentDiffParams.speed, settings.weakEye]);

    const asteroidGeo = useMemo(() => new THREE.DodecahedronGeometry(0.6, 0), []);
    const droneGeo = useMemo(() => new THREE.IcosahedronGeometry(0.4, 0), []);
    const bossGeo = useMemo(() => new THREE.TorusKnotGeometry(1, 0.3, 100, 16), []);

    const enemyMat = useMemo(() => {
        const color = settings.weakEye === 'left' ? "#ff4444" : "#4444ff";
        return new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.6,
            roughness: 0.2
        });
    }, [settings.weakEye]);

    const handleHit = (id: number) => {
        setEnemies(prev => {
            const hitEnemy = prev.find(e => e.id === id);
            if (!hitEnemy) return prev;

            const newHp = hitEnemy.hp - 1;

            if (newHp > 0) {
                return prev.map(e => e.id === id ? { ...e, hp: newHp } : e);
            }

            const newScore = score + (hitEnemy.type === 'boss' ? 500 : 10);
            // setScore(newScore); // Removed local set
            onScore?.(newScore);

            setTotalHits(h => h + 1);
            const rTime = (Date.now() / 1000) - hitEnemy.spawnTime;
            setResponseTimes(rt => [...rt, rTime]);

            setStreak(p => {
                const ns = p >= 0 ? p + 1 : 1;
                return ns;
            });

            const aliveCount = prev.filter(e => e.hp > 0).length - 1;
            if (aliveCount <= 0) {
                setTimeout(() => {
                    setLevel(l => {
                        const nextLevel = l + 1;
                        onLevelComplete?.(nextLevel);
                        return nextLevel;
                    });
                }, 2000);
            }

            return prev.map(e => e.id === id ? {
                ...e,
                pos: [0, -50, -50],
                hp: 0
            } : e);
        });
    };

    const handleMiss = (id: number) => {
        setTotalMisses(m => m + 1);
        setStreak(prev => {
            const newStreak = prev <= 0 ? prev - 1 : -1;
            if (newStreak % 2 === 0) {
                setMultiplier(m => Math.max(m - 0.1, 0.5));
            }
            return newStreak;
        });
    };

    const hitRadius = difficulty === 'easy' ? 4.5 : difficulty === 'medium' ? 3.0 : 2.0;

    return (
        <>
            <DichopticCameraRig settings={settings} mode={mode} />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Cockpit />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Text position={[0, 3, -8]} fontSize={0.8} color="#0ea5e9" anchorX="center" anchorY="middle" fillOpacity={0.8}>
                {waveText}
            </Text>
            {enemies.map(e => (
                <Enemy
                    key={e.id}
                    position={e.pos}
                    speed={e.baseSpeed * multiplier}
                    layer={e.layer}
                    gazeRef={gazeRef}
                    hitRadius={e.type === 'boss' ? 3.0 : hitRadius}
                    onHit={() => handleHit(e.id)}
                    onMiss={() => handleMiss(e.id)}
                    geometry={e.type === 'drone' ? droneGeo : e.type === 'boss' ? bossGeo : asteroidGeo}
                    material={enemyMat}
                    type={e.type}
                />
            ))}
            <Reticle x={gazeX} y={gazeY} mode={mode as any} />
            {/* 3D Score removed in favor of HUD */}
            {multiplier !== 1 && (
                <Text position={[0, 3.2, -4]} fontSize={0.3} color={multiplier > 1 ? "#fbbf24" : "#94a3b8"} anchorX="center" anchorY="middle">
                    {multiplier > 1 ? `🔥 Speed x${multiplier.toFixed(1)}` : `❄️ Speed x${multiplier.toFixed(1)}`}
                </Text>
            )}
        </>
    );
}

export default function VRGame(props: VRGameProps) {
    const {
        difficulty = "medium",
        mode = "webcam",
        settings = { weakEye: "left", strongEyeOpacity: 1.0 }
    } = props;

    const [score, setScore] = useState(0);

    const handleScore = (newScore: number) => {
        setScore(newScore);
        props.onScoreUpdate?.(newScore);
    };

    return (
        <div className="w-full h-full relative bg-black">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <XR>
                    <Controllers />
                    <Hands />
                    <GameScene
                        {...props}
                        difficulty={difficulty}
                        mode={mode}
                        settings={settings}
                        score={score} // Pass score
                        onScore={handleScore} // Pass handler
                        onLevelComplete={props.onLevelComplete}
                        onMetricsUpdate={(acc, rt) => {
                            if (props.onSessionComplete) {
                                props.onSessionComplete({ accuracy: acc, responseTime: rt });
                            }
                        }}
                    />
                </XR>
            </Canvas>


            <div className="absolute inset-0 pointer-events-none">
                <GameOverlay
                    title="Space Defender"
                    score={score}
                    difficulty={difficulty}
                    onExit={props.onExit}
                />

                {/* Extra info for VR/Webcam mode */}
                <div className="absolute top-20 left-4 flex gap-2 pointer-events-none">
                    <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30 backdrop-blur-sm">
                        {mode.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30 backdrop-blur-sm">
                        {settings.weakEye.toUpperCase()} EYE TARGET
                    </span>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10">
                <VRButton />
            </div>
        </div >
    );
}
