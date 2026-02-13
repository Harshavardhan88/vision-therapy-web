"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { Eye } from "lucide-react"; // Loader2 and ArrowRight are now handled by the Button component
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        if (!email || !password) {
            setError("Please fill in all fields.");
            setIsLoading(false);
            return;
        }

        try {
            // Connect to backend
            const response = await auth.login(email, password);

            if (response.data.access_token) {
                const token = response.data.access_token;
                localStorage.setItem("token", token);
                // Set cookie for Middleware (Effective for 7 days)
                document.cookie = `auth_token = ${token}; path =/; max-age=604800; SameSite=Lax`;

                // Redirect based on role
                const role = response.data.role;
                if (role === 'doctor') {
                    router.push("/dashboard/doctor");
                } else if (role === 'parent') {
                    router.push("/dashboard/parent");
                } else {
                    router.push("/dashboard/patient");
                }
            }
        } catch (err: any) {
            console.error(err);
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail[0]?.msg || "Login failed.");
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError("Login failed. Please check your credentials.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
            {/* Floating Background Elements were handled globally, but let's make the card float too */}
            <Card className="w-full max-w-md glass-panel border-0 animate-bounce-subtle animate-glow-pulse transition-transform duration-500 hover:scale-[1.02]">
                <CardHeader className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4">
                        <Eye className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
                    <CardDescription>Sign in to continue your therapy</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            required
                            placeholder="john@example.com"
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                        />

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-blue-400 hover:text-blue-300">
                            Create one
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
