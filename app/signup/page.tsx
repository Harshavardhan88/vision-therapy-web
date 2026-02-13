"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { Eye, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        role: "patient", // Default role
        doctor_id: "", // For patient-doctor assignment
        child_name: "", // For parent signup (new child)
        child_email: "" // For parent signup (existing child)
    });

    // Parent Mode: 'create' | 'link'
    const [childMode, setChildMode] = useState<'create' | 'link'>('create');

    const [doctors, setDoctors] = useState<any[]>([]);

    useEffect(() => {
        // Fetch doctors for the dropdown
        const fetchDoctors = async () => {
            try {
                const res = await auth.getPublicDoctors();
                setDoctors(res.data);
            } catch (err) {
                console.error("Failed to load doctors", err);
            }
        };
        fetchDoctors();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess(false);

        try {
            // Call FastAPI Backend
            await auth.signup({
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                doctor_id: formData.role === 'patient' && formData.doctor_id ? parseInt(formData.doctor_id) : undefined,
                child_name: formData.role === 'parent' && childMode === 'create' ? formData.child_name : undefined,
                child_email: formData.role === 'parent' && childMode === 'link' ? formData.child_email : undefined
            });

            // Success!
            setSuccess(true);
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: any) {
            console.error(err);
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Handle Pydantic validation errors (array of objects)
                setError(detail[0]?.msg || "Validation error occurred.");
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md glass-panel border-0 animate-bounce-subtle animate-glow-pulse transition-transform duration-500 hover:scale-[1.02]">
                <CardHeader className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4">
                        <Eye className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white">Create Account</CardTitle>
                    <CardDescription>Join AmblyoCare to access therapy</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Success Banner */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-200 text-sm text-center">
                            Account created! Redirecting to login...
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            name="full_name"
                            required
                            placeholder="John Doe"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        />
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            required
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">I am a...</label>
                            <select
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                                <option value="parent">Parent</option>
                            </select>
                        </div>

                        {/* Doctor Selection (Only for Patients) */}
                        {formData.role === 'patient' && (
                            <div className="animate-fade-in-up">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Select Your Doctor (Optional)</label>
                                <select
                                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                    value={formData.doctor_id}
                                    onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}
                                >
                                    <option value="">-- No Doctor / I'll add later --</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.doctor_profile?.id}>
                                            {doc.full_name} {doc.doctor_profile?.clinic_name ? `(${doc.doctor_profile.clinic_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Child Name (For Parents) */}
                        {formData.role === 'parent' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="flex bg-slate-900 p-1 rounded-lg border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setChildMode('create')}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${childMode === 'create' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Create New Child
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChildMode('link')}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${childMode === 'link' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Link Existing
                                    </button>
                                </div>

                                {childMode === 'create' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Child's Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <input
                                                type="text"
                                                required={childMode === 'create'}
                                                className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Enter your child's name"
                                                value={formData.child_name}
                                                onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">We'll create a patient account automatically.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Child's Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <input
                                                type="email"
                                                required={childMode === 'link'}
                                                className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="child@example.com"
                                                value={formData.child_email}
                                                onChange={(e) => setFormData({ ...formData, child_email: e.target.value })}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">We'll link their existing account to yours.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <Button type="submit" variant="gamified" className="w-full" isLoading={isLoading}>
                            Start Your Journey! 🚀
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-400 hover:text-blue-300">
                            Log in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
