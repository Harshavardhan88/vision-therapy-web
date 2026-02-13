"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
    interface Window {
        FaceMesh: any;
        Camera: any;
    }
}

export default function EyeTracker({ onGazeUpdate }: { onGazeUpdate: (x: number, y: number) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState("Initializing...");
    const [useMouse, setUseMouse] = useState(false);

    // Mouse Input Effect
    useEffect(() => {
        if (!useMouse) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Invert X not needed for mouse usually, but if game mirrors it...
            // Game expects 0..1. 
            // If the game mirrors logic (dichoptic/webcam mode usually mirrors), we might need to be careful?
            // Actually, TherapyPage.tsx uses straight values. VRGame maps them. 
            // Let's assume standard 0-1 mapping.
            onGazeUpdate(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
        };

        window.addEventListener('mousemove', handleMouseMove);
        setStatus("Mouse Mode Active");

        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [useMouse, onGazeUpdate]);

    // Camera Input Effect
    useEffect(() => {
        if (useMouse) return;

        let camera: any;
        let faceMesh: any;
        let isActive = true;

        const loadModels = async () => {
            if (!window.FaceMesh || !window.Camera) {
                // Retry loop
                if (isActive) setTimeout(loadModels, 500);
                return;
            }

            try {
                faceMesh = new window.FaceMesh({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                faceMesh.onResults((results: any) => {
                    if (!isActive) return;

                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const landmarks = results.multiFaceLandmarks[0];
                        const noseTip = landmarks[1];
                        // Mirror the X coordinate for webcam feel
                        const x = 1 - noseTip.x;
                        const y = noseTip.y;

                        onGazeUpdate(x, y);
                        setStatus("Tracking Active");
                    } else {
                        setStatus("Face not found");
                    }
                });

                if (videoRef.current) {
                    camera = new window.Camera(videoRef.current, {
                        onFrame: async () => {
                            if (faceMesh && isActive) await faceMesh.send({ image: videoRef.current });
                        },
                        width: 640,
                        height: 480
                    });
                    await camera.start();
                }
            } catch (err) {
                console.error("Camera Init Error:", err);
                if (isActive) setStatus("Camera Error");
            }
        };

        loadModels();

        return () => {
            isActive = false;
            if (camera) camera.stop();
            if (faceMesh) faceMesh.close();
        };
    }, [useMouse, onGazeUpdate]);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Scripts */}
            {/* Scripts moved to layout.tsx */}

            <div className="bg-slate-900/90 border border-white/20 p-3 rounded-xl backdrop-blur-md shadow-2xl w-56 flex flex-col gap-3">

                {/* Visual Feedback / Camera View */}
                {!useMouse && (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
                        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" playsInline muted />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full transform -scale-x-100" />
                    </div>
                )}

                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] ${status === 'Tracking Active' || status === 'Mouse Mode Active' ? 'bg-green-500 shadow-green-500/50 animate-pulse' : 'bg-yellow-500 shadow-yellow-500/50'}`} />
                        <span className="text-[11px] text-slate-200 font-bold font-mono uppercase tracking-wide truncate max-w-[120px]">{status}</span>
                    </div>
                </div>

                {/* Manual Fallback Toggle */}
                <button
                    onClick={() => setUseMouse(!useMouse)}
                    className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-200 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                >
                    {useMouse ? (
                        <><span>📷</span> Try Camera</>
                    ) : (
                        <><span>🖱️</span> Switch to Mouse</>
                    )}
                </button>
            </div>
        </div>
    );
}
