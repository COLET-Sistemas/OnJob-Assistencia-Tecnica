'use client'

import { Plus } from 'lucide-react';
import React, { ReactNode } from 'react';
import ActionButton from './ActionButton';

interface PageHeaderProps {
    title: string;
    itemCount: number;
    newButtonLink?: string;
    newButtonLabel?: string;
    onNewButtonClick?: () => void;
    actions?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    itemCount,
    newButtonLink,
    newButtonLabel,
    onNewButtonClick,
    actions
}) => {
    return (
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/10">
            <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
                <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
                {title}
                <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">{itemCount}</span>
            </h2>

            <div className="flex items-center gap-3">
                {actions}

                {(newButtonLink || onNewButtonClick) && (
                    <ActionButton
                        href={newButtonLink}
                        onClick={onNewButtonClick}
                        icon={<Plus size={18} />}
                        label={newButtonLabel || 'Novo'}
                        variant="primary"
                    />
                )}
            </div>
        </div>
    );
};

export default PageHeader;
