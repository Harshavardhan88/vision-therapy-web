"use client";

import { useClinical } from "@/contexts/ClinicalContext";
import { Line, Bar } from "recharts";
import { LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * Clinical UI Components
 */

/**
 * SessionAnalytics - Detailed session analytics
 */
export function SessionAnalytics({ patientId }: { patientId: string }) {
    const { getProgressMetrics } = useClinical();
    const metrics = getProgressMetrics(patientId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Sessions */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="text-sm text-slate-400 mb-2">Total Sessions</div>
                <div className="text-3xl font-bold text-cyan-400">{metrics.totalSessions}</div>
            </div>

            {/* Average Score */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="text-sm text-slate-400 mb-2">Average Score</div>
                <div className="text-3xl font-bold text-green-400">{Math.round(metrics.avgScore)}</div>
            </div>

            {/* Accuracy */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="text-sm text-slate-400 mb-2">Accuracy</div>
                <div className="text-3xl font-bold text-purple-400">{metrics.avgAccuracy.toFixed(1)}%</div>
            </div>

            {/* Compliance */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="text-sm text-slate-400 mb-2">Compliance Rate</div>
                <div className="text-3xl font-bold text-orange-400">{metrics.complianceRate.toFixed(1)}%</div>
            </div>
        </div>
    );
}

/**
 * ProgressChart - Visual progress over time
 */
export function ProgressChart({ patientId }: { patientId: string }) {
    const { getSessionHistory } = useClinical();
    const sessions = getSessionHistory(patientId, 20).reverse();

    const data = sessions.map((session, index) => ({
        session: index + 1,
        score: session.score,
        accuracy: session.accuracy
    }));

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Progress Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="session" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                        labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} name="Score" />
                    <Line type="monotone" dataKey="accuracy" stroke="#a855f7" strokeWidth={2} name="Accuracy %" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * SessionHistory - Table of recent sessions
 */
export function SessionHistory({ patientId }: { patientId: string }) {
    const { getSessionHistory } = useClinical();
    const sessions = getSessionHistory(patientId, 10);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Game</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Accuracy</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {sessions.map(session => (
                            <tr key={session.id} className="hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-300">
                                    {session.startTime.toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300">
                                    {session.gameType}
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-cyan-400">
                                    {session.score}
                                </td>
                                <td className="px-6 py-4 text-sm text-purple-400">
                                    {session.accuracy.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-400">
                                    {Math.floor(session.duration / 60)}m {session.duration % 60}s
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * ProgressReport - Comprehensive progress report for doctors
 */
export function ProgressReport({ patientId, patientName }: { patientId: string; patientName: string }) {
    const { getProgressMetrics, exportReport } = useClinical();
    const metrics = getProgressMetrics(patientId);

    const handleExport = () => {
        const report = exportReport(patientId);
        const blob = new Blob([report], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progress-report-${patientId}-${Date.now()}.json`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">{patientName}</h2>
                    <p className="text-sm text-slate-400">Patient ID: {patientId}</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors"
                >
                    Export Report
                </button>
            </div>

            {/* Key Metrics */}
            <SessionAnalytics patientId={patientId} />

            {/* Improvement Indicator */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Improvement Trend</h3>
                <div className="flex items-center gap-4">
                    <div className={`text-4xl ${metrics.improvementRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {metrics.improvementRate >= 0 ? '📈' : '📉'}
                    </div>
                    <div>
                        <div className={`text-2xl font-bold ${metrics.improvementRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {metrics.improvementRate >= 0 ? '+' : ''}{metrics.improvementRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-400">
                            {metrics.improvementRate >= 0 ? 'Improvement' : 'Decline'} over last 10 sessions
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Chart */}
            <ProgressChart patientId={patientId} />

            {/* Session History */}
            <SessionHistory patientId={patientId} />
        </div>
    );
}

/**
 * ComplianceTracker - Track patient compliance
 */
export function ComplianceTracker({ patientId }: { patientId: string }) {
    const { getProgressMetrics } = useClinical();
    const metrics = getProgressMetrics(patientId);

    const getComplianceColor = (rate: number) => {
        if (rate >= 80) return 'text-green-400';
        if (rate >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getComplianceStatus = (rate: number) => {
        if (rate >= 80) return 'Excellent';
        if (rate >= 60) return 'Good';
        if (rate >= 40) return 'Fair';
        return 'Needs Improvement';
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Compliance Tracking</h3>

            <div className="space-y-4">
                {/* Compliance Rate */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300">Compliance Rate</span>
                        <span className={`font-bold ${getComplianceColor(metrics.complianceRate)}`}>
                            {metrics.complianceRate.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${metrics.complianceRate >= 80 ? 'bg-green-500' :
                                    metrics.complianceRate >= 60 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                }`}
                            style={{ width: `${metrics.complianceRate}%` }}
                        />
                    </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className={`font-semibold ${getComplianceColor(metrics.complianceRate)}`}>
                        {getComplianceStatus(metrics.complianceRate)}
                    </span>
                </div>

                {/* Last Session */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Last Session</span>
                    <span className="text-slate-300">
                        {metrics.lastSessionDate
                            ? metrics.lastSessionDate.toLocaleDateString()
                            : 'No sessions yet'
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}
