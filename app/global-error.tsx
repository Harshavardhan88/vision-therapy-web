"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Critical System Failure</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>We encountered a core layout error. Please restart the session.</p>
                    <button
                        onClick={() => reset()}
                        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Reboot System
                    </button>
                </div>
            </body>
        </html>
    );
}
