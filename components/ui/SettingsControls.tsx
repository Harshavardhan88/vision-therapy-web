"use client";

import { useState } from "react";
import { Tooltip, HelpIcon } from "./Tooltips";

/**
 * SettingsCard - Container for settings sections
 */
export function SettingsCard({
    title,
    description,
    children,
    icon
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    icon?: string;
}) {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
                {icon && <span className="text-3xl">{icon}</span>}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {description && (
                        <p className="text-sm text-slate-400 mt-1">{description}</p>
                    )}
                </div>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

/**
 * ToggleSwitch - Animated toggle switch
 */
export function ToggleSwitch({
    label,
    checked,
    onChange,
    helpText,
    disabled = false
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    helpText?: string;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className={`text-sm ${disabled ? 'text-slate-500' : 'text-slate-200'}`}>
                    {label}
                </span>
                {helpText && <HelpIcon content={helpText} />}
            </div>
            <button
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${checked ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}
                role="switch"
                aria-checked={checked}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
}

/**
 * Slider - Range slider with value display
 */
export function Slider({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    unit = "",
    helpText,
    showValue = true
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    helpText?: string;
    showValue?: boolean;
}) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-200">{label}</span>
                    {helpText && <HelpIcon content={helpText} />}
                </div>
                {showValue && (
                    <span className="text-sm font-mono text-cyan-400">
                        {value}{unit}
                    </span>
                )}
            </div>
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                        background: `linear-gradient(to right, rgb(6 182 212) 0%, rgb(6 182 212) ${percentage}%, rgb(51 65 85) ${percentage}%, rgb(51 65 85) 100%)`
                    }}
                />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
}

/**
 * RadioGroup - Radio button group
 */
export function RadioGroup({
    label,
    options,
    value,
    onChange,
    helpText
}: {
    label: string;
    options: { value: string; label: string; description?: string }[];
    value: string;
    onChange: (value: string) => void;
    helpText?: string;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-200">{label}</span>
                {helpText && <HelpIcon content={helpText} />}
            </div>
            <div className="space-y-2">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${value === option.value
                                ? 'bg-cyan-500/10 border-cyan-500'
                                : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                            }`}
                    >
                        <input
                            type="radio"
                            name={label}
                            value={option.value}
                            checked={value === option.value}
                            onChange={(e) => onChange(e.target.value)}
                            className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                        />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                                {option.label}
                            </div>
                            {option.description && (
                                <div className="text-xs text-slate-400 mt-1">
                                    {option.description}
                                </div>
                            )}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}

/**
 * DifficultySelector - Visual difficulty selector
 */
export function DifficultySelector({
    value,
    onChange
}: {
    value: "easy" | "medium" | "hard";
    onChange: (value: "easy" | "medium" | "hard") => void;
}) {
    const difficulties = [
        {
            value: "easy" as const,
            label: "Easy",
            icon: "🟢",
            color: "green",
            description: "Slower pace, larger targets"
        },
        {
            value: "medium" as const,
            label: "Medium",
            icon: "🟡",
            color: "yellow",
            description: "Balanced challenge"
        },
        {
            value: "hard" as const,
            label: "Hard",
            icon: "🔴",
            color: "red",
            description: "Fast pace, smaller targets"
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-3">
            {difficulties.map((diff) => (
                <button
                    key={diff.value}
                    onClick={() => onChange(diff.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${value === diff.value
                            ? 'border-cyan-500 bg-cyan-500/10 scale-105'
                            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                        }`}
                >
                    <div className="text-3xl mb-2">{diff.icon}</div>
                    <div className="text-sm font-semibold text-white">{diff.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{diff.description}</div>
                </button>
            ))}
        </div>
    );
}

/**
 * EyeSelector - Visual eye selection
 */
export function EyeSelector({
    value,
    onChange
}: {
    value: "left" | "right";
    onChange: (value: "left" | "right") => void;
}) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <button
                onClick={() => onChange("left")}
                className={`p-6 rounded-lg border-2 transition-all ${value === "left"
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
            >
                <div className="text-4xl mb-2">👁️</div>
                <div className="text-sm font-semibold text-white">Left Eye</div>
                <div className="text-xs text-slate-400 mt-1">Weak eye (amblyopic)</div>
            </button>
            <button
                onClick={() => onChange("right")}
                className={`p-6 rounded-lg border-2 transition-all ${value === "right"
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
            >
                <div className="text-4xl mb-2">👁️</div>
                <div className="text-sm font-semibold text-white">Right Eye</div>
                <div className="text-xs text-slate-400 mt-1">Weak eye (amblyopic)</div>
            </button>
        </div>
    );
}
