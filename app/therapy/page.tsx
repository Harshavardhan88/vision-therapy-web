"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AchievementNotification from "@/components/AchievementNotification";
import StoryWrapper from "@/components/story/StoryWrapper";
import { checkAchievements, MOCK_ACHIEVEMENTS, type Achievement } from "@/lib/achievements";
import { auth } from "@/lib/api";

// Static import to debug loading issues
const VRGame = dynamic(() => import("@/components/game/VRGame"), {
    ssr: false,
    loading: () => <div className="absolute inset-0 flex items-center justify-center text-white font-mono animate-pulse">Initializing VR Core...</div>
});

const EyeTracker = dynamic(() => import("@/components/eye-tracking/EyeTracker"), {
    ssr: false,
    loading: () => <div className="fixed bottom-4 right-4 text-white">Loading Tracker...</div>
});

// const NeonGame = dynamic(() => import("@/components/game/NeonGame"), { ssr: false });

const CalibrationGame = dynamic(() => import("@/components/game/CalibrationGame"), { ssr: false });
const BalloonGame = dynamic(() => import("@/components/game/BalloonGame"), { ssr: false });
const NeuralPathwaysDesktop = dynamic(() => import("@/components/game/NeuralPathwaysDesktop"), { ssr: false });
const CosmicQuiz = dynamic(() => import("@/components/game/CosmicQuiz"), { ssr: false });

export default function TherapyPage() {
    const router = useRouter();
    // Session State
    const [userId, setUserId] = useState<number>(1);
    const [gaze, setGaze] = useState({ x: 0.5, y: 0.5 });
    const [isCalibrated, setIsCalibrated] = useState(true); // Forced TRUE for preview
    const [selectedGame, setSelectedGame] = useState<"space" | "balloon" | "neural" | "quiz" | null>(null);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

    // Therapy Settings State
    const [therapySettings, setTherapySettings] = useState({ weakEye: "left" as "left" | "right", opacity: 0.5, dichoptic: false });
    const [settingsConfirmed, setSettingsConfirmed] = useState(false);

    // Timer & Stats
    const [sessionStart, setSessionStart] = useState<Date | null>(null);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [score, setScore] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [lastSession, setLastSession] = useState<{ game: string, duration: number, score: number } | null>(null);
    const [sessionMetrics, setSessionMetrics] = useState({ accuracy: 0, responseTime: 0 });

    // Achievements
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
    const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<Set<number>>(new Set());
    const [playerStats, setPlayerStats] = useState({
        totalBalloons: 0,
        totalSessions: 0,
        totalMinutes: 0,
        currentStreak: 0
    });

    // Narrative State
    const [narrativeText, setNarrativeText] = useState("Welcome, Guardian. The galaxy is under siege by the Red Drones. We need your focusing power to lock onto them. Synchronize your vision and neutralize the threat!");

    // Level Handler
    const handleLevelComplete = useCallback((level: number) => {
        if (level === 2) {
            setNarrativeText("Good shooting! But scanning indicates a Drone Swarm approaching properly. These will be faster. Stay sharp!");
        } else if (level === 3) {
            setNarrativeText("Incredible focus! ...Wait, I'm detecting a massive energy signature. It's the Mothership! Take it down before it charges its main cannon!");
        } else if (level > 3) {
            setNarrativeText("Sector clear! You have defended the galaxy today. Outstanding work, Guardian.");
        }
    }, []);

    // Fetch User
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await auth.getMe();
                setUserId(res.data.id);
            } catch (err) {
                console.warn("Using default user ID 1 (Not logged in)", err);
            }
        };
        fetchUser();
    }, []);

    // Ghost Mode (WebSocket)
    const targetGaze = useRef({ x: 0.5, y: 0.5 });
    useEffect(() => {
        if (!selectedGame) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const wsUrl = apiUrl.replace(/^http/, 'ws');
        const ws = new WebSocket(`${wsUrl}/ws/patient/${userId}`);

        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: "stats_update",
                    game: selectedGame,
                    gaze: targetGaze.current,
                    score: score,
                    duration: sessionDuration
                }));
            }
        }, 100);
        return () => { clearInterval(interval); ws.close(); };
    }, [selectedGame, userId, score, sessionDuration]);

    // Smooth Gaze
    const handleGazeUpdate = useCallback((x: number, y: number) => {
        targetGaze.current = { x, y };
    }, []);

    useEffect(() => {
        let frameId: number;
        const animate = () => {
            setGaze(prev => ({
                x: prev.x + (targetGaze.current.x - prev.x) * 0.1,
                y: prev.y + (targetGaze.current.y - prev.y) * 0.1
            }));
            frameId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frameId);
    }, []);

    // Timer
    useEffect(() => {
        if (!sessionStart || !selectedGame) return;
        const interval = setInterval(() => {
            setSessionDuration(Math.floor((Date.now() - sessionStart.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionStart, selectedGame]);

    // Achievements
    useEffect(() => {
        const currentStats = { ...playerStats, sessionScore: score, difficulty };
        const potentialUnlocks = checkAchievements(currentStats, MOCK_ACHIEVEMENTS);
        const newUnlocks = potentialUnlocks.filter(a => !unlockedAchievementIds.has(a.id));
        if (newUnlocks.length > 0) {
            setUnlockedAchievement(newUnlocks[0]);
            setUnlockedAchievementIds(prev => new Set([...prev, newUnlocks[0].id]));
        }
    }, [score, playerStats, unlockedAchievementIds, difficulty]);

    const handleGameSelect = (game: "space" | "balloon" | "neural") => {
        setSelectedGame(game);
        setSessionStart(new Date());
        setScore(0);
        setSessionDuration(0);
        setSessionMetrics({ accuracy: 0, responseTime: 0 });
    };

    const handleExitGame = async () => {
        if (sessionStart && selectedGame) {
            const duration = Math.floor((Date.now() - sessionStart.getTime()) / 1000);
            const minutes = Math.floor(duration / 60);

            // Update local stats
            setPlayerStats(prev => ({
                ...prev,
                totalBalloons: prev.totalBalloons + score,
                totalSessions: prev.totalSessions + 1,
                totalMinutes: prev.totalMinutes + minutes
            }));

            // Save to Backend
            try {
                await auth.saveSession({
                    user_id: userId,
                    game_type: selectedGame,
                    difficulty: difficulty,
                    duration_seconds: duration,
                    score: score,
                    balloons_popped: selectedGame === 'balloon' ? score : 0,
                    accuracy: sessionMetrics.accuracy,
                    fixation_accuracy: sessionMetrics.accuracy,
                    avg_response_time: sessionMetrics.responseTime
                });
            } catch (error) {
                console.error("Failed to save session:", error);
            }

            setLastSession({ game: selectedGame, duration, score });
            setShowSummary(true);
        }
        setSelectedGame(null);
        setSessionStart(null);
        setSessionDuration(0);
    };



    if (showSummary && lastSession) {
        return (
            <div className="w-full h-screen bg-slate-950 flex items-center justify-center p-8">
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Mission Debrief</h2>
                        <div className="text-4xl font-bold text-green-400 mb-2">+{lastSession.score} XP</div>
                        <p className="text-slate-400">Great work, Guardian.</p>
                    </div>
                    <button onClick={() => {
                        setShowSummary(false);
                        setSelectedGame("space"); // Restart
                        setSessionStart(new Date());
                        setSelectedGame("space"); // Restart
                        setSessionStart(new Date());
                        setScore(0);
                        setSessionDuration(0);
                        setSessionMetrics({ accuracy: 0, responseTime: 0 });
                    }} className="w-full py-4 bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl font-bold text-white">
                        Replay Mission
                    </button>
                    <button onClick={() => router.push('/dashboard/patient')} className="w-full mt-4 py-4 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl font-bold text-slate-300">
                        Return to Base
                    </button>
                </div>
            </div>
        );
    }

    if (!isCalibrated) {
        return (
            <div className="w-full h-screen relative bg-slate-950 overflow-hidden cursor-none">
                <EyeTracker onGazeUpdate={handleGazeUpdate} />
                <CalibrationGame gazeX={gaze.x} gazeY={gaze.y} onComplete={() => setIsCalibrated(true)} />
                <div
                    className="fixed w-4 h-4 border-2 border-green-500 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-75"
                    style={{ left: `${gaze.x * 100}%`, top: `${gaze.y * 100}%` }}
                />
            </div>
        );
    }



    // ... existing imports ...

    // Game Selection UI
    if (!selectedGame || ((selectedGame === 'quiz' || selectedGame === 'balloon') && !settingsConfirmed)) {
        return (
            <div className="w-full h-screen bg-slate-950 flex items-center justify-center p-8">
                {/* Therapy Settings for Quiz & Balloon */}
                {(selectedGame === 'quiz' || selectedGame === 'balloon') ? (
                    <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-900/20">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {selectedGame === 'quiz' ? 'Cosmic Quiz Protocol' : 'Balloon Pop Protocol'}
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Weak Eye (Target)</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setTherapySettings(p => ({ ...p, weakEye: 'left' }))}
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${therapySettings.weakEye === 'left' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                    >
                                        Left Eye
                                    </button>
                                    <button
                                        onClick={() => setTherapySettings(p => ({ ...p, weakEye: 'right' }))}
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${therapySettings.weakEye === 'right' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                    >
                                        Right Eye
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm mb-2">
                                    Strong Eye Opacity: {(therapySettings.opacity * 100).toFixed(0)}%
                                </label>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={therapySettings.opacity}
                                    onChange={(e) => setTherapySettings(p => ({ ...p, opacity: parseFloat(e.target.value) }))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Lower opacity = Stronger suppression break.</p>
                            </div>

                            {/* Dichoptic Toggle for Balloon Game */}
                            {selectedGame === 'balloon' && (
                                <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                    <div>
                                        <div className="text-white font-bold">Dichoptic Mode</div>
                                        <div className="text-xs text-slate-400">Red/Cyan Anaglyph Glasses</div>
                                    </div>
                                    <button
                                        onClick={() => setTherapySettings(p => ({ ...p, dichoptic: !p.dichoptic }))}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${therapySettings.dichoptic ? 'bg-green-500' : 'bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${therapySettings.dichoptic ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setSettingsConfirmed(true)}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold mt-4"
                            >
                                Start Therapy Session
                            </button>
                            <button
                                onClick={() => setSelectedGame(null)}
                                className="w-full py-2 text-slate-500 hover:text-slate-400 text-sm"
                            >
                                Back to Selection
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl w-full">
                        <h1 className="text-4xl font-bold text-white text-center mb-12">Select Sync Protocol</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Neon Voyage Card */}
                            <button
                                onClick={() => handleGameSelect("space")}
                                className="group relative h-80 bg-slate-900 rounded-2xl border border-cyan-500/30 overflow-hidden hover:border-cyan-400 transition-all hover:scale-105"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 to-transparent" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                                    <div className="w-20 h-20 mb-6 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/40 transition-colors">
                                        <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Space Defender VR</h3>
                                    <p className="text-slate-400 text-center">Pure VR Experience. Use Head Gaze to defend the sector.</p>
                                </div>
                            </button>

                            {/* Cosmic Quiz Card */}
                            <button
                                onClick={() => handleGameSelect("quiz" as any)}
                                className="group relative h-80 bg-slate-900 rounded-2xl border border-purple-500/30 overflow-hidden hover:border-purple-400 transition-all hover:scale-105"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                                    <div className="w-20 h-20 mb-6 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/40 transition-colors">
                                        <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Cosmic Quiz VR</h3>
                                    <p className="text-slate-400 text-center">Dichoptic Amblyopia Therapy. Requires Google Cardboard.</p>
                                </div>
                            </button>

                            {/* Balloon Game Card */}
                            <button
                                onClick={() => handleGameSelect("balloon")}
                                className="group relative h-80 bg-slate-900 rounded-2xl border border-pink-500/30 overflow-hidden hover:border-pink-400 transition-all hover:scale-105"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-pink-900/20 to-transparent" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                                    <div className="w-20 h-20 mb-6 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/40 transition-colors">
                                        <svg className="w-10 h-10 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Balloon Pop</h3>
                                    <p className="text-slate-400 text-center">Fun, child-friendly tracking exercise. Pop balloons!</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Default Render (Game Active)
    return (
        <div className="w-full h-screen relative bg-black overflow-hidden">
            <StoryWrapper
                title={selectedGame === 'quiz' ? "Cosmic Quiz" : selectedGame === 'balloon' ? "Balloon Pop" : "Neon Voyage"}
                narrativeIntro={selectedGame === 'quiz' ? "Activating Dichoptic Engine. Merge the images to find the answers." : selectedGame === 'balloon' ? "Pop the balloons to train your eye-hand coordination! Watch out for the confetti!" : narrativeText}
                onExit={handleExitGame}
            >
                <EyeTracker onGazeUpdate={handleGazeUpdate} />

                {selectedGame === 'quiz' ? (
                    <CosmicQuiz
                        gazeX={gaze.x}
                        gazeY={gaze.y}
                        onExit={handleExitGame}
                        settings={therapySettings}
                    />
                ) : selectedGame === 'balloon' ? (
                    <BalloonGame
                        gazeX={gaze.x}
                        gazeY={gaze.y}
                        onScoreUpdate={setScore}
                        difficulty={difficulty}
                        onExit={handleExitGame}
                        formattedTime={`${Math.floor(sessionDuration / 60)}:${(sessionDuration % 60).toString().padStart(2, '0')}`}
                        settings={{ weakEye: therapySettings.weakEye, strongEyeOpacity: therapySettings.opacity, dichoptic: therapySettings.dichoptic }}
                    />
                ) : (
                    <VRGame
                        gazeX={gaze.x}
                        gazeY={gaze.y}
                        difficulty={difficulty}
                        mode="webcam" // Or 'vr' if user clicks enter VR
                        settings={{ weakEye: therapySettings.weakEye, strongEyeOpacity: therapySettings.opacity }}
                        onExit={handleExitGame}
                        onScoreUpdate={setScore}
                        onLevelComplete={handleLevelComplete}
                        onSessionComplete={setSessionMetrics}
                    />
                )}
            </StoryWrapper>
        </div>
    );
}

