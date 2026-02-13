"use client";

import { useEffect, useState } from "react";

/**
 * Keyboard navigation utilities and hooks
 */

export type KeyboardShortcut = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    action: () => void;
};

/**
 * useKeyboardShortcuts - Register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
                const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
                const altMatch = shortcut.alt ? e.altKey : !e.altKey;
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    e.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [shortcuts]);
}

/**
 * useFocusTrap - Trap focus within a modal/dialog
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        // Focus first element
        firstElement?.focus();

        container.addEventListener("keydown", handleTabKey as any);
        return () => container.removeEventListener("keydown", handleTabKey as any);
    }, [containerRef, isActive]);
}

/**
 * useArrowNavigation - Navigate list with arrow keys
 */
export function useArrowNavigation(
    itemCount: number,
    onSelect: (index: number) => void,
    initialIndex = 0
) {
    const [selectedIndex, setSelectedIndex] = useState(initialIndex);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) => {
                        const next = (prev + 1) % itemCount;
                        onSelect(next);
                        return next;
                    });
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) => {
                        const next = (prev - 1 + itemCount) % itemCount;
                        onSelect(next);
                        return next;
                    });
                    break;
                case "Enter":
                case " ":
                    e.preventDefault();
                    onSelect(selectedIndex);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [itemCount, selectedIndex, onSelect]);

    return selectedIndex;
}

/**
 * KeyboardShortcutsHelp - Display available shortcuts
 */
export function KeyboardShortcutsHelp({
    shortcuts,
    isOpen,
    onClose
}: {
    shortcuts: KeyboardShortcut[];
    isOpen: boolean;
    onClose: () => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    useFocusTrap(containerRef, isOpen);

    if (!isOpen) return null;

    const formatShortcut = (shortcut: KeyboardShortcut) => {
        const keys = [];
        if (shortcut.ctrl) keys.push("Ctrl");
        if (shortcut.shift) keys.push("Shift");
        if (shortcut.alt) keys.push("Alt");
        keys.push(shortcut.key.toUpperCase());
        return keys.join(" + ");
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div
                ref={containerRef}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
                role="dialog"
                aria-labelledby="shortcuts-title"
                aria-modal="true"
            >
                <h2 id="shortcuts-title" className="text-xl font-bold text-white mb-4">
                    Keyboard Shortcuts
                </h2>
                <div className="space-y-2 mb-6">
                    {shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <span className="text-slate-300 text-sm">{shortcut.description}</span>
                            <kbd className="px-2 py-1 bg-slate-700 text-cyan-400 rounded text-xs font-mono">
                                {formatShortcut(shortcut)}
                            </kbd>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

/**
 * SkipToContent - Skip navigation link for screen readers
 */
export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
    const handleSkip = () => {
        const target = document.getElementById(targetId);
        if (target) {
            target.focus();
            target.scrollIntoView();
        }
    };

    return (
        <a
            href={`#${targetId}`}
            onClick={handleSkip}
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-white focus:rounded-lg"
        >
            Skip to main content
        </a>
    );
}

/**
 * Announce to screen readers
 */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * useScreenReaderAnnouncement - Hook for announcements
 */
export function useScreenReaderAnnouncement() {
    return (message: string, priority: "polite" | "assertive" = "polite") => {
        announceToScreenReader(message, priority);
    };
}

// Add missing import
import { useRef } from "react";
