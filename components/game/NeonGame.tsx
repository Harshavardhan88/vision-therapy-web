"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { GameOverlay } from "./GameOverlay";

// --- Types ---
interface NeonGameProps {
    gazeX: number;
    gazeY: number;
    onScoreUpdate?: (score: number) => void;
    onExit?: () => void;
    onLevelComplete?: (level: number) => void;
    onSessionComplete?: (metrics: { accuracy: number, responseTime: number }) => void;
}

interface ObstacleData {
    id: number;
    x: number;
    y: number;
    z: number;
    active: boolean;
    scale: number;
    color: string;
    spawnTime: number;
}

// --- Components ---

const TunnelSegment = ({ z, speed, rotationOffset }: { z: number, speed: number, rotationOffset: number }) => {
    const meshRef = useRef<THREE.Group>(null);
    const scale = 5;

    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const r = scale;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return new THREE.EdgesGeometry(new THREE.ShapeGeometry(shape));
    }, []);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.position.z += speed * delta * 15;
            if (meshRef.current.position.z > 10) {
                meshRef.current.position.z = -60;
            }
            meshRef.current.rotation.z = rotationOffset + state.clock.getElapsedTime() * 0.2;
        }
    });

    return (
        <group ref={meshRef} position={[0, 0, z]}>
            <lineSegments geometry={geometry}>
                <lineBasicMaterial color="#d946ef" toneMapped={false} blending={THREE.AdditiveBlending} />
            </lineSegments>
            <mesh rotation={[0, 0, Math.PI / 6]}>
                <ringGeometry args={[4.8, 5.2, 6]} />
                <meshBasicMaterial color="#d946ef" transparent opacity={0.1} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
        </group>
    );
};

const Reticle = ({ x, y, isFiring }: { x: number; y: number; isFiring: boolean }) => {
    const posX = (x - 0.5) * 14;
    const posY = -(y - 0.5) * 10;

    return (
        <group position={[posX, posY, -2]}>
            <mesh>
                <circleGeometry args={[0.05, 16]} />
                <meshBasicMaterial color={isFiring ? "#ef4444" : "#00ff00"} toneMapped={false} />
            </mesh>
            <mesh rotation={[0, 0, Date.now() / 500]}>
                <ringGeometry args={[0.2, 0.25, 4]} />
                <meshBasicMaterial color={isFiring ? "#ef4444" : "#00ff00"} transparent opacity={0.6} toneMapped={false} blending={THREE.AdditiveBlending} />
            </mesh>
            {isFiring && (
                <mesh position={[0, 0, -10]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 20]} />
                    <meshBasicMaterial color="#ef4444" transparent opacity={0.8} blending={THREE.AdditiveBlending} toneMapped={false} />
                </mesh>
            )}
        </group>
    );
};

// Sub-component for individual rotating obstacles
const Obstacle = ({ data }: { data: ObstacleData }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.getElapsedTime();
            // Spin effect
            meshRef.current.rotation.x = time * 2;
            meshRef.current.rotation.y = time;
        }
    });

    return (
        <mesh ref={meshRef} position={[data.x, data.y, data.z]}>
            <octahedronGeometry args={[1.0]} />
            <meshBasicMaterial color={data.color} wireframe={true} blending={THREE.AdditiveBlending} toneMapped={false} />
            {/* Inner Glow Mesh */}
            <mesh scale={[1.2, 1.2, 1.2]}>
                <octahedronGeometry args={[1.0]} />
                <meshBasicMaterial color={data.color} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
        </mesh>
    );
};

const Particles = ({ particles }: { particles: React.MutableRefObject<any[]> }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        particles.current.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= delta * 3.0;
                p.x += p.vx * delta;
                p.y += p.vy * delta;
                p.z += p.vz * delta;
                dummy.position.set(p.x, p.y, p.z);
                dummy.scale.setScalar(p.life * 0.8);
                dummy.rotation.x += delta * 5;
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
            } else {
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 1000]}>
            <dodecahedronGeometry args={[0.15]} />
            <meshBasicMaterial color="#fbbf24" toneMapped={false} blending={THREE.AdditiveBlending} />
        </instancedMesh>
    );
};

function GameScene({ gazeX, gazeY, score, onScore, onMetricsUpdate }: {
    gazeX: number,
    gazeY: number,
    score: number,
    onScore: (score: number) => void,
    onMetricsUpdate?: (acc: number, rt: number) => void
}) {
    const obstacleRefs = useRef<ObstacleData[]>([]);
    const particleRefs = useRef<any[]>([]);
    // const [score, setScore] = useState(0); // Removed local state
    const [difficulty, setDifficulty] = useState(1);
    const lastSpawn = useRef(0);
    const [isFiring, setIsFiring] = useState(false);

    // Metrics State
    const [totalHits, setTotalHits] = useState(0);
    const [totalMisses, setTotalMisses] = useState(0);
    const [responseTimes, setResponseTimes] = useState<number[]>([]);

    // Report metrics
    useEffect(() => {
        const total = totalHits + totalMisses;
        const acc = total > 0 ? totalHits / total : 0;
        const avgRt = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
        onMetricsUpdate?.(acc, avgRt);
    }, [totalHits, totalMisses, responseTimes, onMetricsUpdate]);

    const tunnelSegments = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({ z: -i * 3, rot: i * 0.1 })), []);

    const explode = (x: number, y: number, z: number) => {
        for (let i = 0; i < 15; i++) {
            particleRefs.current.push({
                x, y, z,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                vz: (Math.random() - 0.5) * 8,
                life: 1.0
            });
        }
    };

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();
        if (time - lastSpawn.current > (1.2 / difficulty)) {
            lastSpawn.current = time;
            const newObstacle: ObstacleData = {
                id: Math.random(),
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 8,
                z: -60,
                active: true,
                scale: 1,
                color: Math.random() > 0.5 ? "#06b6d4" : "#d946ef",
                spawnTime: time
            };
            obstacleRefs.current.push(newObstacle);
            setDifficulty(prev => Math.min(prev + 0.02, 4.0));
        }

        const playerX = (gazeX - 0.5) * 14;
        const playerY = -(gazeY - 0.5) * 10;
        let hitFrame = false;

        obstacleRefs.current.forEach(obs => {
            if (!obs.active) return;
            obs.z += delta * (15 + difficulty * 3);
            if (obs.z > 5) {
                obs.active = false;
                setTotalMisses(m => m + 1);
            }

            if (obs.z > -25 && obs.z < -2) {
                const dx = obs.x - playerX;
                const dy = obs.y - playerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 1.8) {
                    obs.active = false;
                    hitFrame = true;
                    // setScore(s => { // Use prop logic
                    const newScore = score + 100;
                    if (onScore) onScore(newScore);
                    // return newScore;
                    // });
                    explode(obs.x, obs.y, obs.z);

                    setTotalHits(h => h + 1);
                    setResponseTimes(rt => [...rt, time - obs.spawnTime]);
                }
            }
        });
        setIsFiring(hitFrame);
        obstacleRefs.current = obstacleRefs.current.filter(o => o.active);
    });

    return (
        <>
            <color attach="background" args={['#050510']} />
            <fog attach="fog" args={['#050510', 10, 50]} />
            <ambientLight intensity={0.2} />

            {tunnelSegments.map((seg, i) => (
                <TunnelSegment key={i} z={seg.z} speed={1.0 + difficulty * 0.1} rotationOffset={seg.rot} />
            ))}

            {obstacleRefs.current.map(obs => (
                obs.active && <Obstacle key={obs.id} data={obs} />
            ))}

            <Particles particles={particleRefs} />
            <Reticle x={gazeX} y={gazeY} isFiring={isFiring} />

            {/* 3D Score Removed - Moved to HUD */}
        </>
    );
}

export default function NeonGame(props: NeonGameProps) {
    const [score, setScore] = useState(0);

    const handleScore = (newScore: number) => {
        setScore(newScore);
        props.onScoreUpdate?.(newScore);
    };

    return (
        <div className="w-full h-full relative bg-black">
            <Canvas camera={{ position: [0, 0, 0], fov: 70 }} gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}>
                <GameScene
                    gazeX={props.gazeX}
                    gazeY={props.gazeY}
                    score={score} // Pass score down
                    onScore={handleScore} // Pass handler down
                    onMetricsUpdate={(acc, rt) => {
                        if (props.onSessionComplete) {
                            props.onSessionComplete({ accuracy: acc, responseTime: rt });
                        }
                    }}
                />
            </Canvas>

            <div className="absolute inset-0 pointer-events-none">
                <GameOverlay
                    title="Neon Voyage"
                    score={score}
                    onExit={props.onExit}
                />
            </div>
        </div>
    );
}
