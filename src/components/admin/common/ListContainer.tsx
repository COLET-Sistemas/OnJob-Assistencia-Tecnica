'use client'

import React, { ReactNode } from 'react';

interface ListContainerProps {
    children: ReactNode;
}

const ListContainer: React.FC<ListContainerProps> = ({ children }) => {
    return (
        <div className="bg-[#F9F7F7] p-1">
            <div className="max-w-8xl mx-auto">
                <div className="bg-[var(--neutral-white)] rounded-xl shadow-md overflow-hidden border border-gray-100">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ListContainer;
