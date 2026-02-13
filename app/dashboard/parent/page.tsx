"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

// Types for Dashboard Data
interface DashboardStats {
    totalSessions: number;
    totalTime: number;
    streak: number;
    lastSessionDate: string;
}

export default function ParentDashboard() {
    const router = useRouter();
    // Real Data State
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [parentName, setParentName] = useState("Parent");
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<any>(null);

    const [notes, setNotes] = useState<any[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                // 1. Get Parent Info
                const meRes = await auth.getMe();
                setParentName(meRes.data.full_name);

                // 2. Get Children
                const childRes = await auth.getParentChildren();
                setChildren(childRes.data);

                if (childRes.data.length > 0) {
                    const child = childRes.data[0]; // Default to first child
                    setSelectedChild(child);

                    // 3. Get Child Sessions
                    const sessionsRes = await auth.getSessions(child.id);
                    const data = sessionsRes.data;

                    // 4. Get Doctor Notes
                    try {
                        const notesRes = await auth.getDoctorNotes(child.id);
                        setNotes(notesRes.data);
                    } catch (e) {
                        console.error("Failed to fetch doctor notes", e);
                    }

                    if (Array.isArray(data) && data.length > 0) {
                        const totalMins = Math.floor(data.reduce((acc: number, s: any) => acc + s.duration_seconds, 0) / 60);

                        setStats({
                            totalSessions: data.length,
                            totalTime: totalMins,
                            streak: 1, // Mock streak
                            lastSessionDate: new Date(data[0].created_at).toLocaleDateString()
                        });
                    } else {
                        setStats({
                            totalSessions: 0,
                            totalTime: 0,
                            streak: 0,
                            lastSessionDate: "Never"
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to load parent dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <header className="max-w-5xl mx-auto flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                        Parent Dashboard
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Welcome back, <span className="text-white font-bold">{parentName}</span>
                        {selectedChild && <span className="ml-2 text-slate-500">| Monitoring: {selectedChild.full_name}</span>}
                    </p>
                </div>
                <button
                    onClick={() => router.push('/therapy')}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/10 transition-colors"
                >
                    Switch to Child View
                </button>
            </header>

            <main className="max-w-5xl mx-auto space-y-8">
                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                        <div className="text-slate-400 text-sm mb-1">Total Sessions</div>
                        <div className="text-3xl font-bold">{loading ? "..." : stats?.totalSessions}</div>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                        <div className="text-slate-400 text-sm mb-1">Total Minutes</div>
                        <div className="text-3xl font-bold text-blue-400">{loading ? "..." : stats?.totalTime}</div>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                        <div className="text-slate-400 text-sm mb-1">Current Streak</div>
                        <div className="text-3xl font-bold text-green-400">{loading ? "..." : stats?.streak} days</div>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                        <div className="text-slate-400 text-sm mb-1">Last Active</div>
                        <div className="text-xl font-semibold">{loading ? "..." : stats?.lastSessionDate}</div>
                    </div>
                </div>

                {/* Progress Chart Placeholder */}
                <div className="bg-slate-900 p-8 rounded-2xl border border-white/5">
                    <h3 className="text-xl font-bold mb-6">Weekly Adherence</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {[60, 45, 30, 0, 45, 60, 30].map((mins, i) => (
                            <div key={i} className="w-full flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-blue-500/20 rounded-t-lg transition-all duration-500 group-hover:bg-blue-500/40 relative"
                                    style={{ height: `${(mins / 60) * 100}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                        {mins}m
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Doctor's Notes / Notifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            🧑‍⚕️ Doctor's Notes
                        </h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {notes.length === 0 ? (
                                <div className="text-sm text-slate-500 italic">No notes from the doctor yet.</div>
                            ) : (
                                notes.map((note) => (
                                    <div key={note.id} className={`p-4 bg-slate-950 rounded-lg border-l-4 ${note.note_type === 'suggestion' ? 'border-blue-500' : 'border-purple-500'
                                        }`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-xs uppercase font-bold ${note.note_type === 'suggestion' ? 'text-blue-400' : 'text-purple-400'
                                                }`}>{note.note_type}</span>
                                            <span className="text-xs text-slate-500">{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-slate-300 text-sm">
                                            "{note.content}"
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            📅 Upcoming Schedule
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        🎮
                                    </div>
                                    <div>
                                        <div className="font-medium">Space Defender</div>
                                        <div className="text-xs text-slate-500">Daily Goal: 20 mins</div>
                                    </div>
                                </div>
                                <button className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full hover:bg-blue-600/30">
                                    Start Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
