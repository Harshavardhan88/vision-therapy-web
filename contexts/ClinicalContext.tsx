"use client";

import { createContext, useContext, useState, useEffect } from "react";

/**
 * Clinical analytics and session tracking
 */

export interface SessionData {
    id: string;
    patientId: string;
    gameType: string;
    startTime: Date;
    endTime: Date;
    duration: number; // seconds
    score: number;
    accuracy: number; // percentage
    difficulty: "easy" | "medium" | "hard";
    eyeTracked: "left" | "right" | "both";
    dichopticMode: boolean;
    calibrationQuality: number; // 0-100
    avgGazeStability: number; // pixels
    completionRate: number; // percentage
    errorsCount: number;
}

export interface ProgressMetrics {
    sessions: SessionData[];
    totalSessions: number;
    avgScore: number;
    avgAccuracy: number;
    avgDuration: number;
    improvementRate: number; // percentage
    complianceRate: number; // percentage
    lastSessionDate: Date | null;
}

const ClinicalContext = createContext<{
    recordSession: (session: Omit<SessionData, "id">) => void;
    getProgressMetrics: (patientId: string) => ProgressMetrics;
    getSessionHistory: (patientId: string, limit?: number) => SessionData[];
    exportReport: (patientId: string) => string;
}>({
    recordSession: () => { },
    getProgressMetrics: () => ({
        sessions: [],
        totalSessions: 0,
        avgScore: 0,
        avgAccuracy: 0,
        avgDuration: 0,
        improvementRate: 0,
        complianceRate: 0,
        lastSessionDate: null
    }),
    getSessionHistory: () => [],
    exportReport: () => ""
});

/**
 * ClinicalProvider - Manages clinical data and analytics
 */
export function ClinicalProvider({ children }: { children: React.ReactNode }) {
    const [sessions, setSessions] = useState<SessionData[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("clinical-sessions");
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map((s: any) => ({
                    ...s,
                    startTime: new Date(s.startTime),
                    endTime: new Date(s.endTime)
                }));
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem("clinical-sessions", JSON.stringify(sessions));
    }, [sessions]);

    const recordSession = (sessionData: Omit<SessionData, "id">) => {
        const newSession: SessionData = {
            ...sessionData,
            id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        setSessions(prev => [...prev, newSession]);
    };

    const getSessionHistory = (patientId: string, limit = 10) => {
        return sessions
            .filter(s => s.patientId === patientId)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, limit);
    };

    const getProgressMetrics = (patientId: string): ProgressMetrics => {
        const patientSessions = sessions.filter(s => s.patientId === patientId);

        if (patientSessions.length === 0) {
            return {
                sessions: [],
                totalSessions: 0,
                avgScore: 0,
                avgAccuracy: 0,
                avgDuration: 0,
                improvementRate: 0,
                complianceRate: 0,
                lastSessionDate: null
            };
        }

        const totalSessions = patientSessions.length;
        const avgScore = patientSessions.reduce((sum, s) => sum + s.score, 0) / totalSessions;
        const avgAccuracy = patientSessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
        const avgDuration = patientSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions;

        // Calculate improvement rate (compare first 5 vs last 5 sessions)
        let improvementRate = 0;
        if (totalSessions >= 10) {
            const firstFive = patientSessions.slice(-5).reduce((sum, s) => sum + s.score, 0) / 5;
            const lastFive = patientSessions.slice(0, 5).reduce((sum, s) => sum + s.score, 0) / 5;
            improvementRate = ((lastFive - firstFive) / firstFive) * 100;
        }

        // Calculate compliance rate (sessions per week)
        const daysSinceFirst = (Date.now() - patientSessions[patientSessions.length - 1].startTime.getTime()) / (1000 * 60 * 60 * 24);
        const expectedSessions = Math.ceil(daysSinceFirst / 7) * 3; // 3 sessions per week expected
        const complianceRate = Math.min((totalSessions / expectedSessions) * 100, 100);

        return {
            sessions: patientSessions,
            totalSessions,
            avgScore,
            avgAccuracy,
            avgDuration,
            improvementRate,
            complianceRate,
            lastSessionDate: patientSessions[0].startTime
        };
    };

    const exportReport = (patientId: string): string => {
        const metrics = getProgressMetrics(patientId);
        const history = getSessionHistory(patientId, 20);

        return JSON.stringify({
            patientId,
            generatedAt: new Date().toISOString(),
            metrics,
            recentSessions: history
        }, null, 2);
    };

    return (
        <ClinicalContext.Provider value={{
            recordSession,
            getProgressMetrics,
            getSessionHistory,
            exportReport
        }}>
            {children}
        </ClinicalContext.Provider>
    );
}

/**
 * useClinical - Hook to access clinical features
 */
export function useClinical() {
    return useContext(ClinicalContext);
}

/**
 * Adaptive difficulty system
 */
export function calculateAdaptiveDifficulty(recentSessions: SessionData[]): "easy" | "medium" | "hard" {
    if (recentSessions.length < 3) return "easy";

    const avgAccuracy = recentSessions.slice(0, 3).reduce((sum, s) => sum + s.accuracy, 0) / 3;

    if (avgAccuracy >= 85) return "hard";
    if (avgAccuracy >= 70) return "medium";
    return "easy";
}

/**
 * Calibration quality assessment
 */
export function assessCalibrationQuality(gazePoints: { x: number; y: number }[]): number {
    if (gazePoints.length < 10) return 0;

    // Calculate variance in gaze points
    const avgX = gazePoints.reduce((sum, p) => sum + p.x, 0) / gazePoints.length;
    const avgY = gazePoints.reduce((sum, p) => sum + p.y, 0) / gazePoints.length;

    const variance = gazePoints.reduce((sum, p) => {
        return sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2);
    }, 0) / gazePoints.length;

    // Lower variance = better quality
    const quality = Math.max(0, 100 - variance);
    return Math.min(100, quality);
}
