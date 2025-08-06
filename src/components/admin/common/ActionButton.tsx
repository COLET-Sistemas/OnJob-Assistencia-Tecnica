'use client'

import Link from 'next/link';
import React, { ReactNode } from 'react';

interface ActionButtonProps {
    href?: string;
    onClick?: () => void;
    icon: ReactNode;
    label: string;
    variant?: 'primary' | 'secondary' | 'outline';
}

const ActionButton: React.FC<ActionButtonProps> = ({
    href,
    onClick,
    icon,
    label,
    variant = 'primary'
}) => {
    const buttonClasses = {
        primary: "bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5",
        secondary: "inline-flex items-center px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg transition-colors gap-1.5",
        outline: "border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
    };

    const classes = buttonClasses[variant];

    if (href) {
        return (
            <Link href={href} className={classes}>
                {icon}
                {label}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={classes}>
            {icon}
            {label}
        </button>
    );
};

export default ActionButton;
