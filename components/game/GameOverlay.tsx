"use client";

import React from "react";
import { X, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameOverlayProps {
    title: string;
    score: number;
    difficulty?: string;
    onExit?: () => void;
    onPause?: () => void;
    isPaused?: boolean;
    formattedTime?: string;
    className?: string; // For custom theme overrides
}

export function GameOverlay({
    title,
    score,
    difficulty,
    onExit,
    onPause,
    isPaused,
    formattedTime,
    className
}: GameOverlayProps) {
    return (
        <div className={cn("absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-50", className)}>
            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
                {/* Title & Stats */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-md bg-black/20 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/10">
                        {title}
                    </h1>
                    {difficulty && (
                        <div className="bg-black/40 text-white/80 text-xs font-mono px-2 py-1 rounded-lg w-fit backdrop-blur-sm">
                            DIFFICULTY: {difficulty.toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Score (Center-ish/Right-ish) logic can go here, 
                    but often game scores look better prominent. 
                    Let's put a big score counter in the top-center or next to title.
                    For now, top-center floating is common, but let's keep it simple: Top Right grouping.
                */}

                <div className="flex items-center gap-3">
                    {/* Timer */}
                    {formattedTime && (
                        <div className="bg-black/40 text-white/90 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 font-mono text-lg font-bold">
                            ⏱️ {formattedTime}
                        </div>
                    )}

                    {/* Score Card */}
                    <div className="bg-white/90 text-slate-900 px-6 py-2 rounded-2xl shadow-lg border-2 border-white flex flex-col items-center min-w-[100px]">
                        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Score</span>
                        <span className="text-3xl font-black leading-none font-mono">{score}</span>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                        {onPause && (
                            <button
                                onClick={onPause}
                                className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95"
                                aria-label={isPaused ? "Resume" : "Pause"}
                            >
                                {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                            </button>
                        )}

                        <button
                            onClick={onExit}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-red-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border-2 border-red-400 group"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform" />
                            <span>EXIT</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Bar (Optional) */}
            <div className="mt-auto pointer-events-none">
                {/* Could put debug stats or instructions here */}
            </div>

            {/* Pause Screen Overlay */}
            {isPaused && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-3xl font-black text-slate-800 mb-2">PAUSED</h2>
                        <p className="text-slate-500 mb-8">Take a breather!</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onPause}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all"
                            >
                                RESUME
                            </button>
                            <button
                                onClick={onExit}
                                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-lg transition-all"
                            >
                                QUIT GAME
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
