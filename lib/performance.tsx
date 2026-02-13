"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    memory?: number;
    renderTime: number;
}

/**
 * usePerformanceMonitor - Hook to monitor app performance
 */
export function usePerformanceMonitor(enabled = true) {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        fps: 60,
        frameTime: 16.67,
        renderTime: 0
    });

    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const rafIdRef = useRef<number>();

    useEffect(() => {
        if (!enabled) return;

        const measurePerformance = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTimeRef.current;

            frameCountRef.current++;

            // Update metrics every second
            if (deltaTime >= 1000) {
                const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
                const frameTime = deltaTime / frameCountRef.current;

                setMetrics({
                    fps,
                    frameTime,
                    memory: (performance as any).memory?.usedJSHeapSize / 1048576, // MB
                    renderTime: frameTime
                });

                frameCountRef.current = 0;
                lastTimeRef.current = currentTime;
            }

            rafIdRef.current = requestAnimationFrame(measurePerformance);
        };

        rafIdRef.current = requestAnimationFrame(measurePerformance);

        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [enabled]);

    return metrics;
}

/**
 * PerformanceMonitor - Visual performance overlay
 */
export function PerformanceMonitor({
    position = "top-right"
}: {
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
    const metrics = usePerformanceMonitor(true);

    const positionClasses = {
        "top-left": "top-4 left-4",
        "top-right": "top-4 right-4",
        "bottom-left": "bottom-4 left-4",
        "bottom-right": "bottom-4 right-4"
    };

    const fpsColor = metrics.fps >= 55 ? "text-green-400" : metrics.fps >= 30 ? "text-yellow-400" : "text-red-400";

    return (
        <div className={`fixed ${positionClasses[position]} z-50 bg-black/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 font-mono text-xs`}>
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">FPS:</span>
                    <span className={`font-bold ${fpsColor}`}>{metrics.fps}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Frame:</span>
                    <span className="text-cyan-400">{metrics.frameTime.toFixed(2)}ms</span>
                </div>
                {metrics.memory && (
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Memory:</span>
                        <span className="text-purple-400">{metrics.memory.toFixed(1)}MB</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Lazy load component wrapper
 */
export function LazyLoad({
    children,
    placeholder,
    threshold = 0.1
}: {
    children: React.ReactNode;
    placeholder?: React.ReactNode;
    threshold?: number;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    return (
        <div ref={ref}>
            {isVisible ? children : placeholder}
        </div>
    );
}

/**
 * Image preloader
 */
export function preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
        urls.map(url => {
            return new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = url;
            });
        })
    );
}

/**
 * Asset preloader hook
 */
export function useAssetPreloader(assets: string[]) {
    const [loaded, setLoaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let loadedCount = 0;

        const loadAsset = async (url: string) => {
            try {
                await new Promise<void>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve();
                    img.onerror = reject;
                    img.src = url;
                });
                loadedCount++;
                setProgress((loadedCount / assets.length) * 100);
            } catch (err) {
                setError(err as Error);
            }
        };

        Promise.all(assets.map(loadAsset))
            .then(() => setLoaded(true))
            .catch(setError);
    }, [assets]);

    return { loaded, progress, error };
}

/**
 * Debounce hook for performance
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Throttle hook for performance
 */
export function useThrottle<T>(value: T, limit: number): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const lastRan = useRef(Date.now());

    useEffect(() => {
        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, limit - (Date.now() - lastRan.current));

        return () => {
            clearTimeout(handler);
        };
    }, [value, limit]);

    return throttledValue;
}

/**
 * Bundle size analyzer
 */
export function logBundleSize() {
    if (typeof window !== 'undefined' && 'performance' in window) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        const scripts = resources.filter(r => r.name.endsWith('.js'));
        const styles = resources.filter(r => r.name.endsWith('.css'));

        const totalScriptSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const totalStyleSize = styles.reduce((sum, r) => sum + (r.transferSize || 0), 0);

        console.group('📦 Bundle Analysis');
        console.log(`Scripts: ${(totalScriptSize / 1024).toFixed(2)} KB (${scripts.length} files)`);
        console.log(`Styles: ${(totalStyleSize / 1024).toFixed(2)} KB (${styles.length} files)`);
        console.log(`Total: ${((totalScriptSize + totalStyleSize) / 1024).toFixed(2)} KB`);
        console.groupEnd();
    }
}
