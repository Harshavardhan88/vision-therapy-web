"use client";

/**
 * VRModeIndicator - Unified component to show VR/Dichoptic mode status
 * Used across all therapy games for consistent UX
 */
export function VRModeIndicator({
    mode,
    weakEye,
    dichoptic = false,
    className = ""
}: {
    mode?: "vr" | "webcam" | string;
    weakEye?: "left" | "right";
    dichoptic?: boolean;
    className?: string;
}) {
    if (!dichoptic && !mode) return null;

    return (
        <div className={`absolute top-20 left-4 flex gap-2 pointer-events-none ${className}`}>
            {/* Mode Indicator */}
            {mode && (
                <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30 backdrop-blur-sm">
                    {mode.toUpperCase()}
                </span>
            )}

            {/* Dichoptic Mode Indicator */}
            {dichoptic && weakEye && (
                <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30 backdrop-blur-sm">
                    DICHOPTIC: {weakEye.toUpperCase()} EYE TARGET
                </span>
            )}
        </div>
    );
}

/**
 * VRAlignmentLine - Center alignment guide for VR headsets
 * Shows the split between left and right eye views
 */
export function VRAlignmentLine({
    visible = true,
    opacity = 0.2
}: {
    visible?: boolean;
    opacity?: number;
}) {
    if (!visible) return null;

    return (
        <div
            className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 pointer-events-none transition-opacity duration-300 bg-white"
            style={{ opacity }}
        />
    );
}
