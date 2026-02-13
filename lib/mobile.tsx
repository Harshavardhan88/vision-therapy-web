"use client";

import { useState, useEffect, useRef, TouchEvent } from "react";

/**
 * Mobile optimization utilities and hooks
 */

/**
 * useIsMobile - Detect if device is mobile
 */
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}

/**
 * useOrientation - Detect device orientation
 */
export function useOrientation() {
    const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

    useEffect(() => {
        const checkOrientation = () => {
            setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape");
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    return orientation;
}

/**
 * useTouchGestures - Handle touch gestures
 */
export function useTouchGestures(callbacks: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onTap?: () => void;
    onDoubleTap?: () => void;
    onPinch?: (scale: number) => void;
}) {
    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
    const lastTap = useRef<number>(0);

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
            touchStart.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now()
            };
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (!touchStart.current) return;

        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
            time: Date.now()
        };

        const deltaX = touchEnd.x - touchStart.current.x;
        const deltaY = touchEnd.y - touchStart.current.y;
        const deltaTime = touchEnd.time - touchStart.current.time;

        // Detect tap
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
            // Check for double tap
            if (touchEnd.time - lastTap.current < 300) {
                callbacks.onDoubleTap?.();
            } else {
                callbacks.onTap?.();
            }
            lastTap.current = touchEnd.time;
        }
        // Detect swipe
        else if (deltaTime < 500) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 50) callbacks.onSwipeRight?.();
                if (deltaX < -50) callbacks.onSwipeLeft?.();
            } else {
                // Vertical swipe
                if (deltaY > 50) callbacks.onSwipeDown?.();
                if (deltaY < -50) callbacks.onSwipeUp?.();
            }
        }

        touchStart.current = null;
    };

    return { handleTouchStart, handleTouchEnd };
}

/**
 * MobileContainer - Responsive container component
 */
export function MobileContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const isMobile = useIsMobile();

    return (
        <div className={`
            ${isMobile ? 'px-4 py-2' : 'px-8 py-4'}
            ${className}
        `}>
            {children}
        </div>
    );
}

/**
 * OrientationGuard - Show message if wrong orientation
 */
export function OrientationGuard({
    required,
    children
}: {
    required: "portrait" | "landscape";
    children: React.ReactNode;
}) {
    const orientation = useOrientation();

    if (orientation !== required) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
                <div className="text-center px-6">
                    <div className="text-6xl mb-4">
                        {required === "landscape" ? "📱 ↻" : "📱"}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Please rotate your device
                    </h2>
                    <p className="text-slate-400">
                        This game works best in {required} mode
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * TouchButton - Mobile-optimized button
 */
export function TouchButton({
    children,
    onClick,
    variant = "primary",
    size = "md",
    className = ""
}: {
    children: React.ReactNode;
    onClick: () => void;
    variant?: "primary" | "secondary";
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    const sizeClasses = {
        sm: "px-4 py-2 text-sm min-h-[44px]",
        md: "px-6 py-3 text-base min-h-[48px]",
        lg: "px-8 py-4 text-lg min-h-[56px]"
    };

    const variantClasses = {
        primary: "bg-cyan-500 active:bg-cyan-600 text-white",
        secondary: "bg-slate-700 active:bg-slate-600 text-white"
    };

    return (
        <button
            onClick={onClick}
            className={`
                ${sizeClasses[size]}
                ${variantClasses[variant]}
                rounded-xl font-semibold
                transition-colors
                touch-manipulation
                ${className}
            `}
        >
            {children}
        </button>
    );
}

/**
 * SwipeableCard - Card with swipe gestures
 */
export function SwipeableCard({
    children,
    onSwipeLeft,
    onSwipeRight,
    className = ""
}: {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    className?: string;
}) {
    const { handleTouchStart, handleTouchEnd } = useTouchGestures({
        onSwipeLeft,
        onSwipeRight
    });

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`touch-manipulation ${className}`}
        >
            {children}
        </div>
    );
}

/**
 * MobileMenu - Mobile-optimized navigation menu
 */
export function MobileMenu({
    isOpen,
    onClose,
    children
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Menu */}
            <div className="absolute inset-y-0 left-0 w-80 max-w-[80vw] bg-slate-900 shadow-2xl animate-slideInRight">
                <div className="p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
                    >
                        ✕
                    </button>
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * BottomSheet - Mobile bottom sheet component
 */
export function BottomSheet({
    isOpen,
    onClose,
    children,
    title
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}) {
    const { handleTouchStart, handleTouchEnd } = useTouchGestures({
        onSwipeDown: onClose
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto animate-slideUp"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-slate-600 rounded-full" />
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    {title && (
                        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
