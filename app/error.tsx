"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Error Caught:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-red-500/20 bg-slate-900/50">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <CardTitle className="text-xl text-white">System Malfunction</CardTitle>
                    <CardDescription>
                        Our sensors picked up an unexpected error.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-950 rounded-lg border border-white/5">
                        <code className="text-xs text-red-300 font-mono break-all">
                            {error.message || "Unknown Error Occurred"}
                        </code>
                    </div>
                    <Button
                        onClick={() => reset()}
                        className="w-full"
                        variant="default"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reboot System
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
