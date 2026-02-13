"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Dynamic import for VR component to avoid SSR issues with window/webgl
const TargetTapVR = dynamic(() => import("@/components/game/TargetTapVR"), { ssr: false });

export default function TargetTapPage() {
    const router = useRouter();
    const [isPlaying, setIsPlaying] = useState(false);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
    const [settings, setSettings] = useState({
        weakEye: "left" as "left" | "right",
        strongEyeOpacity: 0.3,
        gaborFrequency: 10,
        gaborOrientation: 0,
        crowding: true
    });

    return (
        <div className="w-full h-screen bg-slate-950 text-white flex flex-col">
            {!isPlaying ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
                    <button
                        onClick={() => router.back()}
                        className="self-start mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to Dashboard
                    </button>

                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                        Depth Reach VR
                    </h1>
                    <p className="text-slate-400 mb-4 text-center">
                        Immersive 3D depth perception training for amblyopia therapy
                    </p>

                    {/* How to Play */}
                    <div className="w-full bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-4 mb-6">
                        <h3 className="text-cyan-300 font-bold mb-2 text-sm">🥽 VR Instructions</h3>
                        <ul className="text-xs text-slate-300 space-y-1">
                            <li>• <strong>Put on your VR headset</strong> and click "ENTER VR"</li>
                            <li>• <strong>Reach out with your hands</strong> to touch the glowing targets</li>
                            <li>• Targets appear at different <strong>depths</strong> (near/mid/far)</li>
                            <li>• Only your <span className="text-cyan-400 font-bold">{settings.weakEye.toUpperCase()}</span> eye sees the targets</li>
                            <li>• This trains depth perception and eye coordination</li>
                        </ul>
                    </div>

                    <div className="w-full bg-slate-900/50 p-6 rounded-2xl border border-slate-800 mb-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Difficulty</label>
                            <div className="flex gap-2">
                                {["easy", "medium", "hard"].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d as any)}
                                        className={`flex-1 py-2 rounded-lg capitalize transition-all ${difficulty === d
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Weak Eye</label>
                            <div className="flex gap-2">
                                {["left", "right"].map((eye) => (
                                    <button
                                        key={eye}
                                        onClick={() => setSettings(s => ({ ...s, weakEye: eye as any }))}
                                        className={`flex-1 py-2 rounded-lg capitalize transition-all ${settings.weakEye === eye
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                            }`}
                                    >
                                        {eye}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300">
                                Strong Eye Dimming
                                <span className="block text-xs text-slate-500 font-normal">Controls suppression (Lower = Dimmer)</span>
                            </label>
                            <span className="font-mono text-blue-400">{Math.round(settings.strongEyeOpacity * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="1" step="0.1"
                            value={settings.strongEyeOpacity}
                            onChange={(e) => setSettings(s => ({ ...s, strongEyeOpacity: parseFloat(e.target.value) }))}
                            className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="crowding"
                                checked={settings.crowding}
                                onChange={(e) => setSettings(s => ({ ...s, crowding: e.target.checked }))}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="crowding" className="text-sm text-slate-300 select-none cursor-pointer">
                                Enable Crowding (Distractors)
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPlaying(true)}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-cyan-500/20 transition-all transform hover:scale-[1.02]"
                    >
                        🥽 ENTER VR THERAPY
                    </button>

                    <p className="mt-4 text-xs text-cyan-400/60 text-center">
                        Requires VR headset for depth perception training
                    </p>
                </div>
            ) : (
                <div className="w-full h-full">
                    <TargetTapVR
                        difficulty={difficulty}
                        settings={settings}
                        onExit={() => setIsPlaying(false)}
                    />
                </div>
            )}
        </div>
    );
}
