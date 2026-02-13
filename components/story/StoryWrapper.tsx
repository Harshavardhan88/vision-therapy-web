"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StoryWrapperProps {
    children: ReactNode;
    title: string;
    narrativeIntro: string;
    onExit: () => void;
}

export default function StoryWrapper({ children, title, narrativeIntro, onExit }: StoryWrapperProps) {
    const [isPaused, setIsPaused] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [dialogueStep, setDialogueStep] = useState(0);
    const [currentNarrative, setCurrentNarrative] = useState(narrativeIntro);

    // Watch for prop updates (e.g. new level dialogue)
    useEffect(() => {
        if (narrativeIntro) {
            setCurrentNarrative(narrativeIntro);
            setShowIntro(true);
            setDialogueStep(0);
        }
    }, [narrativeIntro]);

    // Split intro into sentences for progressive reveal/TTS
    const dialogueLines = currentNarrative.split('. ').filter(line => line.length > 0);

    // TTS Logic
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop previous
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9; // Slightly slower for kids
            utterance.pitch = 1.1; // Friendly tone
            window.speechSynthesis.speak(utterance);
        }
    };

    // Auto-speak current line
    useEffect(() => {
        if (showIntro && dialogueLines[dialogueStep]) {
            speak(dialogueLines[dialogueStep]);
        }
        return () => window.speechSynthesis.cancel();
    }, [showIntro, dialogueStep, currentNarrative]);

    const handleNext = () => {
        if (dialogueStep < dialogueLines.length - 1) {
            setDialogueStep(prev => prev + 1);
        } else {
            setShowIntro(false);
            window.speechSynthesis.cancel();
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Game Layer */}
            <div className={`w-full h-full transition-all duration-500 ${isPaused ? 'blur-sm scale-95' : ''}`}>
                {children}
            </div>

            {/* Pause Button */}
            <button
                onClick={() => setIsPaused(true)}
                className="absolute top-4 left-4 z-50 p-3 bg-slate-900/50 backdrop-blur rounded-full text-white hover:bg-slate-800 transition-colors border border-white/10"
            >
                ⏸️
            </button>

            {/* Intro Overlay / Visual Novel Mode */}
            <AnimatePresence>
                {showIntro && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 text-center"
                    >
                        {/* Character Portrait Placeholder */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-32 h-32 mb-6 rounded-full bg-blue-500/20 border-4 border-blue-400 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                        >
                            🤖
                        </motion.div>

                        <div className="max-w-2xl bg-slate-900/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                                {title}
                            </h1>

                            <div className="min-h-[100px] flex items-center justify-center">
                                <motion.p
                                    key={dialogueStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl text-white leading-relaxed font-medium"
                                >
                                    "{dialogueLines[dialogueStep]}{!dialogueLines[dialogueStep].endsWith('.') ? '.' : ''}"
                                </motion.p>
                            </div>

                            <div className="flex gap-4 justify-center mt-8">
                                <button
                                    onClick={() => speak(dialogueLines[dialogueStep])}
                                    className="p-4 rounded-full bg-slate-800 text-blue-400 hover:bg-slate-700 transition"
                                >
                                    🔊
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all animate-pulse shadow-lg shadow-blue-500/30"
                                >
                                    {dialogueStep < dialogueLines.length - 1 ? "Next ▶" : "Start Mission 🚀"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pause Menu Overlay */}
            <AnimatePresence>
                {isPaused && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">Mission Paused</h2>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setIsPaused(false)}
                                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    ▶️ Resume
                                </button>
                                <button
                                    onClick={onExit}
                                    className="w-full py-4 bg-red-600/20 hover:bg-red-600/30 text-red-200 rounded-xl font-bold transition-all border border-red-500/20"
                                >
                                    Quit Mission
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
