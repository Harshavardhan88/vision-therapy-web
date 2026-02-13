"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Accessibility settings context
 */

export interface AccessibilitySettings {
    // Visual
    highContrast: boolean;
    fontSize: "small" | "medium" | "large" | "xlarge";
    reducedMotion: boolean;
    colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";

    // Navigation
    keyboardOnly: boolean;
    showFocusIndicators: boolean;

    // Audio
    screenReaderOptimized: boolean;
    audioDescriptions: boolean;
}

const defaultSettings: AccessibilitySettings = {
    highContrast: false,
    fontSize: "medium",
    reducedMotion: false,
    colorBlindMode: "none",
    keyboardOnly: false,
    showFocusIndicators: true,
    screenReaderOptimized: false,
    audioDescriptions: false
};

const AccessibilityContext = createContext<{
    settings: AccessibilitySettings;
    updateSettings: (settings: Partial<AccessibilitySettings>) => void;
}>({
    settings: defaultSettings,
    updateSettings: () => { }
});

/**
 * AccessibilityProvider - Manages accessibility settings
 */
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AccessibilitySettings>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("accessibility-settings");
            if (saved) {
                return { ...defaultSettings, ...JSON.parse(saved) };
            }

            // Detect system preferences
            return {
                ...defaultSettings,
                reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                highContrast: window.matchMedia("(prefers-contrast: high)").matches
            };
        }
        return defaultSettings;
    });

    const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem("accessibility-settings", JSON.stringify(updated));
            return updated;
        });
    };

    // Apply settings to document
    useEffect(() => {
        const root = document.documentElement;

        // High contrast
        root.classList.toggle("high-contrast", settings.highContrast);

        // Font size
        root.setAttribute("data-font-size", settings.fontSize);

        // Reduced motion
        root.classList.toggle("reduce-motion", settings.reducedMotion);

        // Color blind mode
        root.setAttribute("data-colorblind-mode", settings.colorBlindMode);

        // Focus indicators
        root.classList.toggle("show-focus", settings.showFocusIndicators);

    }, [settings]);

    return (
        <AccessibilityContext.Provider value={{ settings, updateSettings }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

/**
 * useAccessibility - Hook to access settings
 */
export function useAccessibility() {
    return useContext(AccessibilityContext);
}

/**
 * AccessibilitySettings - Settings panel component
 */
export function AccessibilitySettingsPanel() {
    const { settings, updateSettings } = useAccessibility();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Visual Settings</h3>
                <div className="space-y-4">
                    {/* High Contrast */}
                    <label className="flex items-center justify-between">
                        <span className="text-slate-200">High Contrast Mode</span>
                        <input
                            type="checkbox"
                            checked={settings.highContrast}
                            onChange={(e) => updateSettings({ highContrast: e.target.checked })}
                            className="w-5 h-5"
                        />
                    </label>

                    {/* Font Size */}
                    <div>
                        <label className="text-slate-200 block mb-2">Text Size</label>
                        <select
                            value={settings.fontSize}
                            onChange={(e) => updateSettings({ fontSize: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg"
                        >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                            <option value="xlarge">Extra Large</option>
                        </select>
                    </div>

                    {/* Reduced Motion */}
                    <label className="flex items-center justify-between">
                        <span className="text-slate-200">Reduce Motion</span>
                        <input
                            type="checkbox"
                            checked={settings.reducedMotion}
                            onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
                            className="w-5 h-5"
                        />
                    </label>

                    {/* Color Blind Mode */}
                    <div>
                        <label className="text-slate-200 block mb-2">Color Blind Mode</label>
                        <select
                            value={settings.colorBlindMode}
                            onChange={(e) => updateSettings({ colorBlindMode: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg"
                        >
                            <option value="none">None</option>
                            <option value="protanopia">Protanopia (Red-Blind)</option>
                            <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                            <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
                <div className="space-y-4">
                    {/* Keyboard Only */}
                    <label className="flex items-center justify-between">
                        <span className="text-slate-200">Keyboard Navigation Only</span>
                        <input
                            type="checkbox"
                            checked={settings.keyboardOnly}
                            onChange={(e) => updateSettings({ keyboardOnly: e.target.checked })}
                            className="w-5 h-5"
                        />
                    </label>

                    {/* Focus Indicators */}
                    <label className="flex items-center justify-between">
                        <span className="text-slate-200">Show Focus Indicators</span>
                        <input
                            type="checkbox"
                            checked={settings.showFocusIndicators}
                            onChange={(e) => updateSettings({ showFocusIndicators: e.target.checked })}
                            className="w-5 h-5"
                        />
                    </label>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Screen Reader</h3>
                <div className="space-y-4">
                    {/* Screen Reader Optimized */}
                    <label className="flex items-center justify-between">
                        <span className="text-slate-200">Screen Reader Optimized</span>
                        <input
                            type="checkbox"
                            checked={settings.screenReaderOptimized}
                            onChange={(e) => updateSettings({ screenReaderOptimized: e.target.checked })}
                            className="w-5 h-5"
                        />
                    </label>

                    {/* Audio Descriptions */}
                    <label className="flex items-center justify-between">
                        <span className="text-slate-200">Audio Descriptions</span>
                        <input
                            type="checkbox"
                            checked={settings.audioDescriptions}
                            onChange={(e) => updateSettings({ audioDescriptions: e.target.checked })}
                            className="w-5 h-5"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
