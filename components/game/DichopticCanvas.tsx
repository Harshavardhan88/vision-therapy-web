"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls, DeviceOrientationControls } from "@react-three/drei";

interface DichopticCanvasProps {
    children: React.ReactNode;
    weakEye: "left" | "right";
    strongEyeOpacity: number; // 0.0 to 1.0 (0 = Total Suppression Break)
    ipd?: number; // Inter-pupillary distance shift (default 0.06)
}

const StereoRenderer = ({ weakEye, ipd = 0.06 }: Omit<DichopticCanvasProps, "children" | "strongEyeOpacity">) => {
    const { gl, scene, camera } = useThree();

    // Create two separate cameras for stereo
    const cameraL = useRef(new THREE.PerspectiveCamera(60, 1, 0.1, 100));
    const cameraR = useRef(new THREE.PerspectiveCamera(60, 1, 0.1, 100));

    useFrame(() => {
        const width = gl.domElement.width;
        const height = gl.domElement.height;

        // Ensure integer pixel values for viewport to avoid subpixel aliasing/gaps
        const halfWidth = Math.floor(width / 2);
        const remainingWidth = width - halfWidth;

        gl.autoClear = false;
        gl.clear();
        gl.setClearColor('#000000'); // Ensure black background

        // Sync Stereo Cameras with Main Camera (controlled by Orbit or DeviceOrientation)
        cameraL.current.copy(camera as THREE.PerspectiveCamera);
        cameraR.current.copy(camera as THREE.PerspectiveCamera);

        // Fix aspect ratio for split viewports
        const aspectRatio = halfWidth / height;
        cameraL.current.aspect = aspectRatio;
        cameraR.current.aspect = aspectRatio;
        cameraL.current.updateProjectionMatrix();
        cameraR.current.updateProjectionMatrix();

        // Offset for IPD
        const halfIPD = ipd / 2;
        cameraL.current.position.x -= halfIPD;
        cameraR.current.position.x += halfIPD;

        // --- LAYER LOGIC ---
        const CAM_L_LAYERS = weakEye === "left" ? [0, 1] : [0];
        const CAM_R_LAYERS = weakEye === "right" ? [0, 1] : [0];

        // Setup Layers
        cameraL.current.layers.disableAll();
        CAM_L_LAYERS.forEach(l => cameraL.current.layers.enable(l));

        cameraR.current.layers.disableAll();
        CAM_R_LAYERS.forEach(l => cameraR.current.layers.enable(l));

        // --- RENDER LEFT EYE (0 to halfWidth) ---
        gl.setViewport(0, 0, halfWidth, height);
        gl.setScissor(0, 0, halfWidth, height);
        gl.setScissorTest(true);

        gl.render(scene, cameraL.current);

        // --- RENDER RIGHT EYE (halfWidth to width) ---
        // Start exactly where Left ended to ensure no gap
        gl.setViewport(halfWidth, 0, remainingWidth, height);
        gl.setScissor(halfWidth, 0, remainingWidth, height);
        gl.setScissorTest(true);

        gl.render(scene, cameraR.current);

        gl.setScissorTest(false);
    }, 1); // CRITICAL: Run after default render

    return null;
};

export default function DichopticCanvas({ children, weakEye = "left", strongEyeOpacity = 1.0, ipd = 0.06 }: DichopticCanvasProps) {
    const [isVR, setIsVR] = useState(false);
    const [hasGyroscope, setHasGyroscope] = useState(false);
    const [controlMode, setControlMode] = useState<'gyro' | 'touch'>('touch');
    const [debugInfo, setDebugInfo] = useState<string>("");

    // Enhanced Gyroscope Detection
    useEffect(() => {
        if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {

            // Check if permission is needed (iOS 13+)
            // @ts-ignore
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                setDebugInfo("iOS Device Detected. Needs Permission.");
            } else {
                setDebugInfo("Standard Device Orientation API available. Waiting for data...");
            }

            const checkOrientation = (event: DeviceOrientationEvent) => {
                if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
                    setHasGyroscope(true);
                    setControlMode('gyro'); // Auto-switch to gyro if detected
                    // setDebugInfo(`Gyro Active! Alpha: ${event.alpha?.toFixed(1)}`);
                    setDebugInfo("Gyro Active!");
                }
            };

            window.addEventListener('deviceorientation', checkOrientation);

            return () => {
                window.removeEventListener('deviceorientation', checkOrientation);
            };
        } else {
            setDebugInfo("DeviceOrientationEvent NOT supported.");
        }
    }, []);

    const toggleVR = async () => {
        if (!isVR) {
            // Enter VR Mode
            try {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                } else if ((elem as any).webkitRequestFullscreen) {
                    await (elem as any).webkitRequestFullscreen();
                }
            } catch (err) {
                console.warn("Fullscreen denied:", err);
            }

            if ('wakeLock' in navigator) {
                try {
                    await (navigator as any).wakeLock.request('screen');
                } catch (err) {
                    console.warn("Wake Lock failed:", err);
                }
            }

            // Request device orientation permission logic for iOS 13+
            // @ts-ignore
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                setDebugInfo("Requesting iOS Permission...");
                try {
                    // @ts-ignore
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        setHasGyroscope(true);
                        setControlMode('gyro');
                        setDebugInfo("iOS Permission GRANTED!");
                    } else {
                        setDebugInfo("iOS Permission DENIED.");
                        console.warn('Device orientation permission denied');
                    }
                } catch (err) {
                    setDebugInfo(`iOS Permission Error: ${err}`);
                    console.warn('Device orientation permission error:', err);
                }
            }
        } else {
            // Exit VR Mode
            if (document.exitFullscreen) document.exitFullscreen();
        }
        setIsVR(!isVR);
    };

    // Calculate dimming opacities for CSS overlay
    const leftOverlayOpacity = weakEye === "right" ? (1.0 - strongEyeOpacity) : 0;
    const rightOverlayOpacity = weakEye === "left" ? (1.0 - strongEyeOpacity) : 0;

    return (
        <div className="w-full h-full relative bg-black">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                {children}
                <StereoRenderer weakEye={weakEye} ipd={ipd} />

                {/* Smart Controls: Use gyroscope in VR if selected, otherwise OrbitControls */}
                {isVR && controlMode === 'gyro' ? (
                    <DeviceOrientationControls />
                ) : (
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        enableRotate={!isVR} // Allow rotation normally if not in VR, or if in VR but touch mode
                        rotateSpeed={0.5}
                    />
                )}
            </Canvas>

            {/* CSS DIMMING OVERLAYS (More Robust for Mobile) */}
            {/* Left Eye Dimming */}
            <div
                className="absolute top-0 left-0 w-1/2 h-full bg-black pointer-events-none transition-opacity duration-300"
                style={{ opacity: leftOverlayOpacity }}
            />
            {/* Right Eye Dimming */}
            <div
                className="absolute top-0 right-0 w-1/2 h-full bg-black pointer-events-none transition-opacity duration-300"
                style={{ opacity: rightOverlayOpacity }}
            />

            {/* Alignment Line */}
            <div className={`absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2 pointer-events-none transition-opacity duration-300 ${isVR ? 'opacity-100' : 'opacity-20'}`} />

            {/* Control Toggle Button (Top Right) */}
            <button
                onClick={() => setControlMode(prev => prev === 'gyro' ? 'touch' : 'gyro')}
                className="absolute top-4 right-4 z-50 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm hover:bg-white/20 transition-all font-bold"
            >
                Mode: {controlMode === 'gyro' ? 'GYRO' : 'TOUCH'}
            </button>

            {/* Debug Info */}
            <div className="absolute top-4 left-4 z-50 bg-black/50 text-white text-xs p-2 rounded max-w-[200px] pointer-events-none">
                {debugInfo}
            </div>

            {/* VR Toggle Button */}
            <button
                onClick={toggleVR}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-bold tracking-widest hover:bg-white/20 transition-all z-50 flex items-center gap-2"
            >
                {isVR ? (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        EXIT VR
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        ENTER VR {controlMode === 'gyro' && <span className="text-xs text-green-400">(Gyro)</span>}
                    </>
                )}
            </button>
        </div>
    );
}
