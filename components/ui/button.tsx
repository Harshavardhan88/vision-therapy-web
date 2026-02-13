import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'gamified';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group"

        const variants = {
            default: "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]",
            outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
            ghost: "hover:bg-white/10 text-slate-300 hover:text-white",
            danger: "bg-red-600 text-white hover:bg-red-500",
            gamified: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.8)] border-2 border-white/20 transition-all duration-300 hover:scale-105",
        }

        const sizes = {
            sm: "h-9 px-3 text-xs",
            md: "h-11 px-8 text-sm",
            lg: "h-12 px-8 text-base",
        }

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={isLoading || disabled}
                {...props}
            >
                {/* Shine Animation for gamified buttons */}
                {variant === 'gamified' && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                )}

                <span className="relative z-10 flex items-center">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {children}
                </span>
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
