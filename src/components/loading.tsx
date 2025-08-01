"use client";

import { motion } from "framer-motion";
import { forwardRef, useEffect } from "react";

type LoadingSize = "small" | "medium" | "large";
type LoadingColor = "primary";

interface LoadingSpinnerProps {
    size?: LoadingSize;
    text?: string;
    color?: LoadingColor;
    fullScreen?: boolean;
    showText?: boolean;
    className?: string;
}

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
    (
        {
            size = "medium",
            text = "Carregando...",
            color = "primary",
            fullScreen = false,
            showText = true,
            className = "",
        },
        ref
    ) => {
        // Bloqueia scroll do body quando em fullscreen
        useEffect(() => {
            if (fullScreen) {
                const previous = document.body.style.overflow;
                document.body.style.overflow = "hidden";
                return () => {
                    document.body.style.overflow = previous;
                };
            }
        }, [fullScreen]);

        // Size mappings
        const sizeMap: Record<LoadingSize, string> = {
            small: "h-8 w-8",
            medium: "h-12 w-12",
            large: "h-16 w-16",
        };

        // Apenas a cor primary
        const colorMap: Record<
            LoadingColor,
            { outer: string; inner: string; dot: string; text: string }
        > = {
            primary: {
                outer: "border-t-[#75FABD]",
                inner: "border-t-[#7C54BD]",
                dot: "bg-[#75FABD]",
                text: "text-[#7C54BD]",
            },
        };

        const containerClasses = fullScreen
            ? "fixed inset-0 flex items-center justify-center bg-[#F9F7F7] overflow-hidden w-full h-full"
            : "flex items-center justify-center py-8";

        return (
            <div
                className={`${containerClasses} ${className}`}
                ref={ref}
                role="status"
                aria-busy="true"
            >
                <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={`relative ${sizeMap[size]}`}>
                        <motion.div
                            className={`absolute inset-0 border-4 border-transparent ${colorMap[color].outer} rounded-full`}
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 1,
                                ease: "linear",
                                repeat: Infinity,
                            }}
                        />

                        <motion.div
                            className={`absolute inset-2 border-4 border-transparent ${colorMap[color].inner} rounded-full`}
                            animate={{ rotate: -360 }}
                            transition={{
                                duration: 1.5,
                                ease: "linear",
                                repeat: Infinity,
                            }}
                        />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                className={`w-2 h-2 ${colorMap[color].dot} rounded-full`}
                                aria-label="ponto de carregamento"
                            />
                        </div>
                    </div>

                    {showText && (
                        <motion.p
                            className={`mt-4 font-medium text-lg ${colorMap[color].text}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            {text}
                        </motion.p>
                    )}
                </motion.div>
            </div>
        );
    }
);

LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner as Loading };

