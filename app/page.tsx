import Link from "next/link";
import { ArrowRight, Activity, Eye, ShieldCheck, Gamepad2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30">
      {/* Navigation */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/5 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span>Amblyo<span className="text-blue-400">Care</span></span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
          <Link href="#features" className="hover:text-blue-400 transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-blue-400 transition-colors">How it Works</Link>
          <Link href="#research" className="hover:text-blue-400 transition-colors">Research</Link>
        </nav>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-full transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-full transition-all shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)]"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-24 pb-12">
        {/* Hero Section */}
        <section className="px-6 py-20 max-w-7xl mx-auto flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-300 mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next-Gen Vision Therapy
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent max-w-4xl">
            Treat Amblyopia with <br className="hidden md:block" />
            <span className="text-blue-500">Immersive VR</span> & AI
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
            A scientifically backed, gamified therapy platform that runs directly in your browser.
            No expensive hardware required—just a webcam and a desire to improve.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/therapy"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)]"
            >
              Start Game & AI Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/patient"
              className="px-8 py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            >
              View Dashboard
            </Link>
          </div>

          {/* Stats / Proof */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl border-t border-white/5 pt-10">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-white">20 min</span>
              <span className="text-sm text-slate-500">Daily Session</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-white">AI-Powered</span>
              <span className="text-sm text-slate-500">Real-time Eye Tracking</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-white">WebXR</span>
              <span className="text-sm text-slate-500">No App Store Needed</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="px-6 py-20 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Why Choose AmblyoCare?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Gamepad2 className="w-8 h-8 text-purple-400" />}
              title="Gamified Therapy"
              description="Forget boring patches. Play engaging 3D space games designed to stimulate your weaker eye while having fun."
            />
            <FeatureCard
              icon={<Activity className="w-8 h-8 text-green-400" />}
              title="Real-time Analytics"
              description="Track fixation stability, reaction time, and progress daily. Data is visualized for doctors and parents."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8 text-blue-400" />}
              title="Doctor Supervised"
              description="Share your progress automatically with your specialist. They can adjust game difficulty remotely."
            />
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-white/5 text-center text-slate-600 text-sm">
        <p>&copy; 2025 AmblyoCare. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all hover:bg-slate-900/80 group">
      <div className="mb-6 p-4 rounded-xl bg-slate-950 w-fit group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}
