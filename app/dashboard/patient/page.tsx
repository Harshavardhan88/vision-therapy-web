"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, Trophy, Calendar, Play } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Session {
    id: number;
    game_type: string;
    difficulty: string;
    score: number;
    duration_seconds: number;
    created_at: string;
    balloons_popped: number;
    fixation_accuracy?: number;
    avg_response_time?: number;
}

export default function PatientDashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalMinutes: 0,
        avgScore: 0,
        avgScore: 0,
        bestScore: 0,
        avgFixation: 0
    });

    const [patientName, setPatientName] = useState("Patient");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                // 1. Get Current User
                const userRes = await auth.getMe();
                setPatientName(userRes.data.full_name);

                if (!userRes.data || !userRes.data.id) {
                    throw new Error("User not found");
                }
                const userId = userRes.data.id;

                // 2. Get User's Sessions
                const response = await auth.getSessions(userId);
                // ... (rest of logic)
                // ... (inside return)

                const data = response.data;

                if (Array.isArray(data)) {
                    setSessions(data);

                    // Calculate Stats
                    if (data.length > 0) {
                        const totalMins = Math.floor(data.reduce((acc: number, s: Session) => acc + s.duration_seconds, 0) / 60);
                        const totalScore = data.reduce((acc: number, s: Session) => acc + s.score, 0);
                        const maxScore = Math.max(...data.map((s: Session) => s.score));

                        const validFixationSessions = data.filter((s: Session) => s.fixation_accuracy !== undefined && s.fixation_accuracy > 0);
                        const avgFixationVal = validFixationSessions.length > 0
                            ? Math.round((validFixationSessions.reduce((acc: number, s: Session) => acc + (s.fixation_accuracy || 0), 0) / validFixationSessions.length) * 100)
                            : 0;

                        setStats({
                            totalSessions: data.length,
                            totalMinutes: totalMins,
                            avgScore: Math.round(totalScore / data.length),
                            bestScore: maxScore,
                            avgFixation: avgFixationVal
                        });
                    }
                } else {
                    console.error("API returned non-array data:", data);
                    setSessions([]);
                }
            } catch (err) {
                console.error("Failed to load dashboard", err);
                // Optional: Redirect to login if auth fails
                // window.location.href = "/login";
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    interface StatsCardProps {
        title: string;
        value: string | number;
        icon: React.ElementType;
        color: string;
    }

    const StatsCard = ({ title, value, icon: Icon, color }: StatsCardProps) => (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-400">{title}</div>
        </div>
    );

    // Filter sessions for chart (reverse to show oldest to newest)
    const chartData = [...sessions].reverse().slice(-10).map(s => ({
        date: new Date(s.created_at).toLocaleDateString(),
        score: s.score,
        game: s.game_type
    }));

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Progress</h1>
                        <p className="text-slate-400">Welcome back, {patientName}</p>
                    </div>
                    <Link
                        href="/therapy"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <Play className="w-5 h-5" />
                        Start Therapy
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatsCard title="Total Sessions" value={stats.totalSessions} icon={Calendar} color="bg-blue-500" />
                    <StatsCard title="Practice Time" value={`${stats.totalMinutes}m`} icon={Clock} color="bg-purple-500" />
                    <StatsCard title="Avg Score" value={stats.avgScore} icon={Activity} color="bg-green-500" />
                    <StatsCard title="Fixation Accuracy" value={`${stats.avgFixation}%`} icon={Trophy} color="bg-yellow-500" />
                </div>

                {/* Charts Area */}
                <div className="bg-slate-900 border border-white/10 rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Performance Trend</h2>
                    <div className="h-80 w-full">
                        {sessions.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4">
                                <p>No data available yet.</p>
                                <Link href="/therapy" className="text-blue-400 hover:text-blue-300 font-semibold">
                                    Start playing to see your progress!
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Session History Table */}
                <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
                    </div>

                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-[250px]" />
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                    <Skeleton className="h-12 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Game</th>
                                        <th className="px-6 py-4">Difficulty</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Score</th>
                                        <th className="px-6 py-4">Fixation</th>
                                        <th className="px-6 py-4">Resp. Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {new Date(session.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-white font-medium capitalize">
                                                {session.game_type === 'neural' ? '🧠 Neural Pathways' :
                                                    session.game_type === 'balloon' ? '🎈 Balloon Pop' :
                                                        session.game_type === 'eye_quest_vr' ? '🕶️ Eye Quest VR' :
                                                            '🚀 Space Defender'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize
                                                    ${session.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
                                                        session.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                                            'bg-green-500/10 text-green-400'}`}>
                                                    {session.difficulty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm font-mono">
                                                {Math.floor(session.duration_seconds / 60)}:{(session.duration_seconds % 60).toString().padStart(2, '0')}
                                            </td>
                                            <td className="px-6 py-4 text-white font-bold">
                                                {session.score}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {session.fixation_accuracy ? `${Math.round(session.fixation_accuracy * 100)}%` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {session.avg_response_time ? `${session.avg_response_time}s` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {sessions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                No sessions found. Start playing!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
