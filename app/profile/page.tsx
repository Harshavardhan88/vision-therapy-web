"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await auth.getMe();
                setUser(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="max-w-md mx-auto mt-10 space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (!user) {
        return <div className="text-white text-center mt-10">User not found</div>;
    }

    return (
        <div className="max-w-2xl mx-auto mt-10">
            <h1 className="text-3xl font-bold text-white mb-6">User Profile</h1>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                            {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <CardTitle>{user.full_name}</CardTitle>
                            <CardDescription>Member since {new Date().getFullYear()}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4">
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <div>
                                <div className="text-sm text-slate-400">Email Address</div>
                                <div className="text-white font-medium">{user.email}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                            <Shield className="w-5 h-5 text-slate-400" />
                            <div>
                                <div className="text-sm text-slate-400">Account Role</div>
                                <div className="text-white font-medium capitalize">{user.role}</div>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full">Edit Profile (Coming Soon)</Button>
                </CardContent>
            </Card>
        </div>
    );
}
