"use client";

import { useState, useEffect } from "react";

/**
 * OnboardingStep - Single step in tutorial
 */
interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    target?: string; // CSS selector for highlighting
    position?: "top" | "bottom" | "left" | "right";
    action?: string; // Button text
}

/**
 * OnboardingTutorial - Interactive tutorial overlay
 */
export function OnboardingTutorial({
    steps,
    onComplete,
    onSkip,
    storageKey = "onboarding_completed"
}: {
    steps: OnboardingStep[];
    onComplete: () => void;
    onSkip: () => void;
    storageKey?: string;
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if onboarding was already completed
        const completed = localStorage.getItem(storageKey);
        if (!completed) {
            setIsVisible(true);
        }
    }, [storageKey]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem(storageKey, "true");
        setIsVisible(false);
        onComplete();
    };

    const handleSkipTutorial = () => {
        localStorage.setItem(storageKey, "true");
        setIsVisible(false);
        onSkip();
    };

    if (!isVisible) return null;

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fadeIn" />

            {/* Tutorial Card */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-slideUp">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Progress Bar */}
                    <div className="h-1 bg-slate-700">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Step Counter */}
                        <div className="text-xs font-mono text-cyan-400 mb-4">
                            Step {currentStep + 1} of {steps.length}
                        </div>

                        {/* Icon/Emoji */}
                        <div className="text-5xl mb-4">
                            {currentStep === 0 && "👋"}
                            {currentStep === 1 && "🎮"}
                            {currentStep === 2 && "👁️"}
                            {currentStep === 3 && "🎯"}
                            {currentStep >= 4 && "✨"}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {step.title}
                        </h2>

                        {/* Description */}
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            {step.description}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={handleSkipTutorial}
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Skip Tutorial
                            </button>

                            <div className="flex gap-2">
                                {currentStep > 0 && (
                                    <button
                                        onClick={handlePrevious}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    >
                                        Previous
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-cyan-500/20"
                                >
                                    {currentStep === steps.length - 1 ? "Get Started!" : step.action || "Next"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * QuickTip - Dismissible tip card
 */
export function QuickTip({
    title,
    message,
    icon = "💡",
    onDismiss
}: {
    title: string;
    message: string;
    icon?: string;
    onDismiss?: () => void;
}) {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4 animate-slideDown">
            <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div className="flex-1">
                    <h4 className="font-semibold text-cyan-300 mb-1">{title}</h4>
                    <p className="text-sm text-slate-300">{message}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={handleDismiss}
                        className="text-slate-400 hover:text-white transition-colors"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * FeatureTour - Highlight specific elements
 */
export function FeatureTour({
    isActive,
    targetSelector,
    title,
    description,
    onNext,
    onSkip
}: {
    isActive: boolean;
    targetSelector: string;
    title: string;
    description: string;
    onNext: () => void;
    onSkip: () => void;
}) {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (isActive && targetSelector) {
            const element = document.querySelector(targetSelector);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            }
        }
    }, [isActive, targetSelector]);

    if (!isActive || !targetRect) return null;

    return (
        <>
            {/* Spotlight overlay */}
            <div className="fixed inset-0 z-40 pointer-events-none">
                <svg className="w-full h-full">
                    <defs>
                        <mask id="spotlight-mask">
                            <rect width="100%" height="100%" fill="white" />
                            <rect
                                x={targetRect.left - 8}
                                y={targetRect.top - 8}
                                width={targetRect.width + 16}
                                height={targetRect.height + 16}
                                rx="8"
                                fill="black"
                            />
                        </mask>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill="rgba(0, 0, 0, 0.7)"
                        mask="url(#spotlight-mask)"
                    />
                </svg>
            </div>

            {/* Tooltip */}
            <div
                className="fixed z-50 bg-slate-800 border-2 border-cyan-500 rounded-lg p-4 max-w-xs shadow-xl"
                style={{
                    top: targetRect.bottom + 16,
                    left: targetRect.left
                }}
            >
                <h4 className="font-semibold text-white mb-2">{title}</h4>
                <p className="text-sm text-slate-300 mb-4">{description}</p>
                <div className="flex gap-2">
                    <button
                        onClick={onSkip}
                        className="px-3 py-1 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={onNext}
                        className="px-4 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </>
    );
}

/**
 * Default onboarding steps for therapy platform
 */
export const defaultOnboardingSteps: OnboardingStep[] = [
    {
        id: "welcome",
        title: "Welcome to AmblyoCare!",
        description: "Let's take a quick tour to help you get started with vision therapy. This will only take a minute.",
        action: "Let's Go"
    },
    {
        id: "games",
        title: "Choose Your Therapy Game",
        description: "We have 4 engaging games designed to strengthen your weak eye. Each game targets different aspects of vision therapy.",
        action: "Next"
    },
    {
        id: "settings",
        title: "Configure Your Settings",
        description: "Select your weak eye and adjust the difficulty. You can also enable VR mode for an immersive experience with a VR headset.",
        action: "Next"
    },
    {
        id: "calibration",
        title: "Eye Tracking Calibration",
        description: "Before starting, we'll calibrate the eye tracking system. Follow the on-screen instructions and look at each target.",
        action: "Next"
    },
    {
        id: "ready",
        title: "You're All Set!",
        description: "You're ready to begin your therapy session. Remember to take breaks every 15-20 minutes. Good luck!",
        action: "Start Therapy"
    }
];
