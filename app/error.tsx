"use client";

import { useEffect } from "react";
import { GamifiedBackground } from "@/components/ui/gamified-background";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            <GamifiedBackground />

            <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-8 rounded-2xl max-w-md w-full text-center relative z-10 shadow-2xl shadow-cyan-900/20">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">A Glitch in the Matrix</h2>
                <p className="text-slate-400 mb-8">
                    We encountered an unexpected error while trying to process that request. Don't worry, your progress is safe.
                </p>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
}
