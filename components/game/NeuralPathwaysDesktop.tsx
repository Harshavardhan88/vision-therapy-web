"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useMemo } from "react";
import { Stars, Text } from "@react-three/drei";
import * as THREE from "three";

// Neuron Node Component
function NeuronNode({ position, id, color, onConnect }: {
    position: [number, number, number],
    id: number,
    color: string,
    onConnect: (id: number) => void
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // Pulsing animation
            const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.1;
            meshRef.current.scale.setScalar(isHovered ? scale * 1.3 : scale);

            // Gentle rotation
            meshRef.current.rotation.y += 0.01;
        }
    });

    const handleClick = () => {
        if (!isConnected) {
            setIsConnected(true);
            onConnect(id);
        }
    };

    return (
        <mesh
            ref={meshRef}
            position={position}
            onClick={handleClick}
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
        >
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial
                color={isConnected ? "#00ff00" : color}
                emissive={isConnected ? "#00ff00" : color}
                emissiveIntensity={isHovered ? 0.8 : 0.3}
                metalness={0.5}
                roughness={0.2}
            />

            {/* Outer glow ring */}
            {isHovered && (
                <mesh>
                    <ringGeometry args={[0.4, 0.5, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.5} />
                </mesh>
            )}
        </mesh>
    );
}

// Pathway Trail Component
function PathwayTrail({ points, color }: { points: THREE.Vector3[], color: string }) {
    if (points.length < 2) return null;

    const curve = useMemo(() => {
        return new THREE.CatmullRomCurve3(points);
    }, [points]);

    const tubeGeometry = useMemo(() => {
        return new THREE.TubeGeometry(curve, points.length * 2, 0.05, 8, false);
    }, [curve, points.length]);

    return (
        <mesh geometry={tubeGeometry}>
            <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
    );
}

// Main Game Scene
function NeuralPathwaysScene({ onScoreUpdate }: { onScoreUpdate?: (score: number) => void }) {
    const [score, setScore] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isPainting, setIsPainting] = useState(false);
    const [pathwayPoints, setPathwayPoints] = useState<THREE.Vector3[]>([]);
    const [completedPathways, setCompletedPathways] = useState<THREE.Vector3[][]>([]);

    const { camera, size } = useThree();

    // Generate neurons in 3D space
    const neurons = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            position: [
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 4 - 3
            ] as [number, number, number],
            color: ['#00f3ff', '#ff00ff', '#ffff00', '#00ff00', '#ff6600'][i % 5]
        }));
    }, []);

    // Handle mouse movement for painting
    const handlePointerMove = (event: any) => {
        const x = (event.clientX / size.width) * 2 - 1;
        const y = -(event.clientY / size.height) * 2 + 1;
        setMousePos({ x, y });

        if (isPainting) {
            // Convert screen coordinates to 3D world position
            const vector = new THREE.Vector3(x, y, 0.5);
            vector.unproject(camera);
            const dir = vector.sub(camera.position).normalize();
            const distance = -camera.position.z / dir.z;
            const pos = camera.position.clone().add(dir.multiplyScalar(distance));

            setPathwayPoints(prev => [...prev, pos]);
        }
    };

    const handlePointerDown = () => {
        setIsPainting(true);
        setPathwayPoints([]);
    };

    const handlePointerUp = () => {
        setIsPainting(false);
        if (pathwayPoints.length > 0) {
            setCompletedPathways(prev => [...prev, pathwayPoints]);
            setPathwayPoints([]);
        }
    };

    const handleNeuronConnect = (id: number) => {
        const newScore = score + 10;
        setScore(newScore);
        onScoreUpdate?.(newScore);

        // Play connection sound
        if (typeof window !== 'undefined') {
            import('@/lib/audio').then(({ gameAudio }) => gameAudio.playSuccess());
        }
    };

    return (
        <group
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} color="#00f3ff" />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Neurons */}
            {neurons.map((neuron) => (
                <NeuronNode
                    key={neuron.id}
                    position={neuron.position}
                    id={neuron.id}
                    color={neuron.color}
                    onConnect={handleNeuronConnect}
                />
            ))}

            {/* Current painting pathway */}
            {isPainting && pathwayPoints.length > 1 && (
                <PathwayTrail points={pathwayPoints} color="#00f3ff" />
            )}

            {/* Completed pathways */}
            {completedPathways.map((pathway, index) => (
                <PathwayTrail key={index} points={pathway} color="#ff00ff" />
            ))}

            {/* Score display */}
            <Text
                position={[0, 3, -5]}
                fontSize={0.5}
                color="#00ff00"
                anchorX="center"
                anchorY="middle"
            >
                Score: {score}
            </Text>

            {/* Instructions */}
            <Text
                position={[0, -3, -5]}
                fontSize={0.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                maxWidth={6}
            >
                Click and drag to paint neural pathways{'\n'}
                Click neurons to connect them
            </Text>
        </group>
    );
}

// Main Component
export default function NeuralPathwaysDesktop({ onScoreUpdate, onExit }: {
    onScoreUpdate?: (score: number) => void,
    onExit?: () => void
}) {
    return (
        <div className="w-full h-full relative bg-black">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <NeuralPathwaysScene onScoreUpdate={onScoreUpdate} />
            </Canvas>

            <div className="absolute top-4 left-4 text-cyan-400 font-bold text-xl uppercase tracking-widest bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm">
                Neural Pathways
            </div>

            <div className="absolute bottom-4 left-4 text-white/60 text-sm font-mono bg-black/30 px-2 py-1 rounded">
                Desktop Mode
            </div>

            <button
                onClick={onExit}
                className="absolute top-4 right-4 z-50 px-6 py-2 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg backdrop-blur-sm transition-colors border border-white/10"
            >
                EXIT
            </button>
        </div>
    );
}
