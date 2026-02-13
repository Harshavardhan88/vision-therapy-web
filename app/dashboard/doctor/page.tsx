"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/api";
import { Users, Activity, Eye, Play, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
    id: number;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
}

export default function DoctorDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const router = useRouter();

    // New Patient Form State
    const [newPatient, setNewPatient] = useState({
        full_name: "",
        email: "",
        password: "password123", // Default password for now
        role: "patient"
    });

    const fetchPatients = async () => {
        try {
            // Updated to use the new endpoint that returns only assigned patients
            const res = await auth.getMyPatients();
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch patients", err);
        } finally {
            setLoading(false);
        }
    };

    const [doctorName, setDoctorName] = useState("Doctor");

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await auth.getMe();
                setDoctorName(res.data.full_name);
            } catch (err) {
                console.error("Failed to fetch user info", err);
            }
        };
        fetchMe();
        fetchPatients();
    }, []);

    // ... existing code ...
    const handleAddPatient = async (e: React.FormEvent) => {
        // ... (keep existing)
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8 relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Clinical Dashboard</h1>
                        <p className="text-slate-400">Welcome back, {doctorName}</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        Add New Patient
                    </button>
                </div>
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs text-slate-400 font-mono">LIVE</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{users.length}</div>
                        <div className="text-sm text-slate-400">Active Patients</div>
                    </div>
                    {/* ... other stats static for now to avoid complexity ... */}
                </div>


                <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white">Patient Roster</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading records...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Patient Name</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Joined Date</th>
                                        <th className="px-6 py-4">Diagnosis</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 text-white font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-300">
                                                        {patient.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div>{patient.full_name}</div>
                                                        <div className="text-xs text-slate-500">{patient.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">
                                                    Active Protocol
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {new Date(patient.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                Amblyopia (OS)
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/dashboard/doctor/patient/${patient.id}`}
                                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                No patients found. Add one to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Patient Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-6">Register New Patient</h2>

                        <form onSubmit={handleAddPatient} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    value={newPatient.full_name}
                                    onChange={e => setNewPatient({ ...newPatient, full_name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    value={newPatient.email}
                                    onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Temporary Password</label>
                                <input
                                    type="text"
                                    readOnly
                                    value="password123"
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-4 py-2 text-slate-500 font-mono text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-1">Default password. Patient will reset on login.</p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold mt-4 transition-colors"
                            >
                                Create Patient Account
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
