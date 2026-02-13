"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Wifi, WifiOff } from "lucide-react";

export default function LiveSessionView() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id;

    interface LiveSessionData {
        game: string;
        score: number;
        duration: number;
        gaze?: { x: number; y: number };
    }

    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
    const [data, setData] = useState<LiveSessionData | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws/doctor/${patientId}`);

        ws.onopen = () => setStatus("connected");
        ws.onclose = () => setStatus("disconnected");
        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                setData(payload);
            } catch (e) {
                console.error("Failed to parse WS data", e);
            }
        };

        return () => ws.close();
    }, [patientId]);

    // Visualizer Loop
    useEffect(() => {
        if (!canvasRef.current || !data) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw Game Background (Simplified)
        ctx.fillStyle = data.game === 'balloon' ? '#0c4a6e' : '#020617';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw Gaze Point
        if (data.gaze) {
            const x = data.gaze.x * canvasRef.current.width;
            const y = data.gaze.y * canvasRef.current.height;

            // Pulse Effect
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
            ctx.fill();

            // Core Dot
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = "#3b82f6";
            ctx.fill();

            // Crosshair
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.beginPath();
            ctx.moveTo(x - 100, y);
            ctx.lineTo(x + 100, y);
            ctx.moveTo(x, y - 100);
            ctx.lineTo(x, y + 100);
            ctx.stroke();
        }

    }, [data]);

    return (
        <div className="min-h-screen bg-slate-950 p-4 flex flex-col">
            <header className="flex items-center justify-between mb-4 bg-slate-900 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Ghost Mode Monitor</h1>
                        <p className="text-sm text-slate-400">Viewing Patient ID: {patientId}</p>
                    </div>
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${status === 'connected'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {status === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    <span className="text-sm font-bold uppercase">{status}</span>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Main Visualizer */}
                <div className="lg:col-span-3 bg-slate-900 border border-white/10 rounded-2xl p-4 relative overflow-hidden flex items-center justify-center">
                    {!data ? (
                        <div className="text-center text-slate-500">
                            <div className="mb-2 text-4xl animate-pulse">📡</div>
                            <p>Waiting for live signal...</p>
                        </div>
                    ) : (
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={600}
                            className="bg-black rounded-xl shadow-2xl max-w-full aspect-[4/3]"
                        />
                    )}
                </div>

                {/* Live Stats */}
                <div className="space-y-4">
                    <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                        <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Current Session</h3>

                        <div className="space-y-6">
                            <div>
                                <div className="text-slate-500 text-sm mb-1">Game</div>
                                <div className="text-xl font-bold text-white capitalize">
                                    {data?.game || "---"}
                                </div>
                            </div>

                            <div>
                                <div className="text-slate-500 text-sm mb-1">Live Score</div>
                                <div className="text-4xl font-mono font-bold text-green-400">
                                    {data?.score ?? 0}
                                </div>
                            </div>

                            <div>
                                <div className="text-slate-500 text-sm mb-1">Duration</div>
                                <div className="text-xl font-mono text-white">
                                    {data ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : "0:00"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
