"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, Trophy, Calendar, ArrowLeft, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/api";

interface Session {
    id: number;
    game_type: string;
    difficulty: string;
    score: number;
    duration_seconds: number;
    created_at: string;
    balloons_popped: number;
}

export default function PatientDetails({ params }: { params: { id: string } }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [patientName, setPatientName] = useState("Patient");
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalMinutes: 0,
        avgScore: 0,
        bestScore: 0
    });

    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState({ content: "", type: "suggestion" });
    const [submittingNote, setSubmittingNote] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const patientId = Number(params.id);
                // Fetch Sessions
                const res = await auth.getSessions(patientId);
                const sessionData = res.data;

                // Fetch Notes
                try {
                    const notesRes = await auth.getDoctorNotes(patientId);
                    setNotes(notesRes.data);
                } catch (e) {
                    console.error("Failed to fetch notes", e);
                }

                if (Array.isArray(sessionData)) {
                    setSessions(sessionData);

                    // Fetch User Details (Mock or Real)
                    setPatientName(`Patient #${params.id}`);

                    // Calculate Stats
                    if (sessionData.length > 0) {
                        const totalMins = Math.floor(sessionData.reduce((acc: number, s: Session) => acc + s.duration_seconds, 0) / 60);
                        const totalScore = sessionData.reduce((acc: number, s: Session) => acc + s.score, 0);
                        const maxScore = Math.max(...sessionData.map((s: Session) => s.score));

                        setStats({
                            totalSessions: sessionData.length,
                            totalMinutes: totalMins,
                            avgScore: Math.round(totalScore / sessionData.length),
                            bestScore: maxScore
                        });
                    }
                } else {
                    console.error("API returned non-array data:", sessionData);
                    setSessions([]);
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.content.trim()) return;

        setSubmittingNote(true);
        try {
            await auth.createDoctorNote({
                patient_id: Number(params.id),
                note_type: newNote.type,
                content: newNote.content
            });

            // Refresh notes
            const res = await auth.getDoctorNotes(Number(params.id));
            setNotes(res.data);
            setNewNote({ ...newNote, content: "" });
        } catch (err) {
            console.error("Failed to add note", err);
        } finally {
            setSubmittingNote(false);
        }
    };

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

    const chartData = [...sessions].reverse().slice(-10).map(s => ({
        date: new Date(s.created_at).toLocaleDateString(),
        score: s.score,
        game: s.game_type
    }));

    const handleExport = () => {
        if (!sessions.length) return;

        const headers = ["Date", "Game", "Difficulty", "Duration (sec)", "Score"];
        const csvContent = [
            headers.join(","),
            ...sessions.map(s => [
                new Date(s.created_at).toLocaleString(),
                s.game_type,
                s.difficulty,
                s.duration_seconds,
                s.score
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `patient_report_${params.id}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/doctor" className="p-2 bg-slate-900 border border-white/10 rounded-lg hover:bg-slate-800 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">{patientName}</h1>
                            <p className="text-slate-400">Clinical Review</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/doctor/live/${params.id}`}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition-colors animate-pulse"
                        >
                            <Activity className="w-4 h-4" />
                            Watch Live Session
                        </Link>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatsCard title="Total Sessions" value={stats.totalSessions} icon={Calendar} color="bg-blue-500" />
                    <StatsCard title="Practice Time" value={`${stats.totalMinutes}m`} icon={Clock} color="bg-purple-500" />
                    <StatsCard title="Avg Score" value={stats.avgScore} icon={Activity} color="bg-green-500" />
                    <StatsCard title="Best Score" value={stats.bestScore} icon={Trophy} color="bg-yellow-500" />
                </div>

                {/* Clinical Notes Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Add Note Form */}
                    <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Add Clinical Note</h2>
                        <form onSubmit={handleAddNote} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Note Type</label>
                                <div className="flex bg-slate-950 p-1 rounded-lg border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setNewNote({ ...newNote, type: 'suggestion' })}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${newNote.type === 'suggestion' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Suggestion
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewNote({ ...newNote, type: 'report' })}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${newNote.type === 'report' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Report
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Content</label>
                                <textarea
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    placeholder={newNote.type === 'suggestion' ? "e.g. Recommended increasing difficulty..." : "e.g. Patient is showing improvement in..."}
                                    value={newNote.content}
                                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submittingNote}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
                            >
                                {submittingNote ? "Saving..." : "Save Note"}
                            </button>
                        </form>
                    </div>

                    {/* Notes List */}
                    <div className="md:col-span-2 bg-slate-900 border border-white/10 rounded-xl p-6 h-[400px] flex flex-col">
                        <h2 className="text-lg font-semibold text-white mb-4">Recent Notes</h2>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {notes.length === 0 ? (
                                <div className="text-center text-slate-500 mt-10">No notes recorded yet.</div>
                            ) : (
                                notes.map((note) => (
                                    <div key={note.id} className="bg-slate-950/50 p-4 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${note.note_type === 'suggestion' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                                                }`}>
                                                {note.note_type}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(note.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
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
                            <div className="flex items-center justify-center h-full text-slate-500">
                                No session data available for this patient.
                            </div>
                        )}
                    </div>
                </div>

                {/* Session History Table */}
                <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white">Session History</h2>
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
                                        </tr>
                                    ))}
                                    {sessions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                No sessions found.
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
