/**
 * Performance Benchmarking Suite
 */

interface BenchmarkResult {
    name: string;
    duration: number;
    fps?: number;
    memory?: number;
}

class PerformanceBenchmark {
    private results: BenchmarkResult[] = [];

    /**
     * Benchmark a function execution time
     */
    async benchmark(name: string, fn: () => void | Promise<void>): Promise<number> {
        const start = performance.now();
        await fn();
        const duration = performance.now() - start;

        this.results.push({ name, duration });
        return duration;
    }

    /**
     * Benchmark rendering performance
     */
    async benchmarkRender(name: string, renderFn: () => void): Promise<BenchmarkResult> {
        let frames = 0;
        const start = performance.now();

        // Run for 1 second
        while (performance.now() - start < 1000) {
            renderFn();
            frames++;
            await new Promise(resolve => requestAnimationFrame(resolve));
        }

        const duration = performance.now() - start;
        const fps = Math.round((frames / duration) * 1000);

        const result = { name, duration, fps };
        this.results.push(result);
        return result;
    }

    /**
     * Benchmark memory usage
     */
    benchmarkMemory(name: string): BenchmarkResult | null {
        if ('memory' in performance) {
            const memory = (performance as any).memory.usedJSHeapSize / 1048576; // MB
            const result = { name, duration: 0, memory };
            this.results.push(result);
            return result;
        }
        return null;
    }

    /**
     * Get all results
     */
    getResults(): BenchmarkResult[] {
        return this.results;
    }

    /**
     * Print results to console
     */
    printResults(): void {
        console.log('\n📊 Performance Benchmark Results\n');
        console.log('─'.repeat(60));

        this.results.forEach(result => {
            console.log(`\n${result.name}`);
            console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
            if (result.fps) console.log(`  FPS: ${result.fps}`);
            if (result.memory) console.log(`  Memory: ${result.memory.toFixed(2)}MB`);
        });

        console.log('\n' + '─'.repeat(60));
    }

    /**
     * Export results as JSON
     */
    exportJSON(): string {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            results: this.results
        }, null, 2);
    }
}

/**
 * Run comprehensive benchmarks
 */
export async function runBenchmarks() {
    const benchmark = new PerformanceBenchmark();

    console.log('🚀 Starting Performance Benchmarks...\n');

    // Component render benchmarks
    await benchmark.benchmark('React Component Mount', () => {
        // Simulate component mount
        const div = document.createElement('div');
        div.innerHTML = '<div>Test Component</div>';
    });

    // 3D rendering benchmark
    await benchmark.benchmarkRender('3D Scene Render', () => {
        // Simulate 3D rendering
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx?.fillRect(0, 0, 100, 100);
    });

    // Memory benchmark
    benchmark.benchmarkMemory('Initial Memory Usage');

    // Asset loading benchmark
    await benchmark.benchmark('Asset Preload', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Print results
    benchmark.printResults();

    return benchmark.getResults();
}

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
    componentMount: 50, // ms
    fps: 30,
    memory: 100, // MB
    assetLoad: 2000 // ms
};

/**
 * Validate performance against thresholds
 */
export function validatePerformance(results: BenchmarkResult[]): boolean {
    let passed = true;

    results.forEach(result => {
        if (result.name.includes('Mount') && result.duration > PERFORMANCE_THRESHOLDS.componentMount) {
            console.warn(`⚠️  ${result.name} exceeded threshold: ${result.duration}ms > ${PERFORMANCE_THRESHOLDS.componentMount}ms`);
            passed = false;
        }

        if (result.fps && result.fps < PERFORMANCE_THRESHOLDS.fps) {
            console.warn(`⚠️  ${result.name} FPS below threshold: ${result.fps} < ${PERFORMANCE_THRESHOLDS.fps}`);
            passed = false;
        }

        if (result.memory && result.memory > PERFORMANCE_THRESHOLDS.memory) {
            console.warn(`⚠️  ${result.name} memory exceeded threshold: ${result.memory}MB > ${PERFORMANCE_THRESHOLDS.memory}MB`);
            passed = false;
        }
    });

    return passed;
}

// Export for use in tests
export default PerformanceBenchmark;
