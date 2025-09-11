"use client";

import { Search } from "lucide-react";
import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Search size={24} className="text-gray-400" />,
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center py-16">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="bg-gray-100 p-3 rounded-full">{icon}</div>
        <div className="text-gray-500 font-medium">{title}</div>
        <p className="text-sm text-gray-400 max-w-md text-center">
          {description}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
