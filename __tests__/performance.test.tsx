import { renderHook, act } from '@testing-library/react';
import {
    usePerformanceMonitor,
    useAssetPreloader,
    useDebounce,
    useThrottle
} from '@/lib/performance';

describe('Phase 3: Performance Utilities', () => {
    describe('usePerformanceMonitor', () => {
        test('tracks FPS and frame time', () => {
            const { result } = renderHook(() => usePerformanceMonitor(true));

            expect(result.current).toHaveProperty('fps');
            expect(result.current).toHaveProperty('frameTime');
            expect(result.current.fps).toBeGreaterThan(0);
        });

        test('can be disabled', () => {
            const { result } = renderHook(() => usePerformanceMonitor(false));
            expect(result.current.fps).toBe(60); // Default value
        });
    });

    describe('useAssetPreloader', () => {
        test('preloads assets and tracks progress', async () => {
            const assets = [
                '/test-image-1.png',
                '/test-image-2.png'
            ];

            const { result, waitForNextUpdate } = renderHook(() =>
                useAssetPreloader(assets)
            );

            expect(result.current.loaded).toBe(false);
            expect(result.current.progress).toBe(0);

            // Wait for loading to complete
            await waitForNextUpdate({ timeout: 3000 });

            expect(result.current.progress).toBeGreaterThan(0);
        });
    });

    describe('useDebounce', () => {
        jest.useFakeTimers();

        test('debounces value changes', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebounce(value, 500),
                { initialProps: { value: 'initial' } }
            );

            expect(result.current).toBe('initial');

            // Update value
            rerender({ value: 'updated' });
            expect(result.current).toBe('initial'); // Still old value

            // Fast forward time
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(result.current).toBe('updated'); // Now updated
        });

        jest.useRealTimers();
    });

    describe('useThrottle', () => {
        jest.useFakeTimers();

        test('throttles value changes', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useThrottle(value, 1000),
                { initialProps: { value: 0 } }
            );

            expect(result.current).toBe(0);

            // Update multiple times quickly
            rerender({ value: 1 });
            rerender({ value: 2 });
            rerender({ value: 3 });

            // Should still be throttled
            expect(result.current).toBe(0);

            // Fast forward time
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(result.current).toBeGreaterThan(0);
        });

        jest.useRealTimers();
    });
});
