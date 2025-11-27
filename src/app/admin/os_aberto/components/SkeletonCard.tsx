import React from "react";

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between">
          {/* Left side - Main info */}
          <div className="flex items-center space-x-4 lg:space-x-6 flex-1">
            {/* Status indicator */}
            <div className="w-2 h-16 rounded-sm hidden sm:block bg-gray-200"></div>

            {/* Primary Info Container */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 min-w-0">
              {/* OS Number */}
              <div className="md:col-span-1 flex items-center">
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>

              {/* Client Info */}
              <div className="md:col-span-4">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-gray-200"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>

              {/* Equipment Info */}
              <div className="md:col-span-4">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-gray-200"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>

              {/* Date and Tech Info */}
              <div className="md:col-span-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-36"></div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Status and Actions */}
          <div className="flex flex-col items-end gap-2 ml-3">
            <div className="h-6 bg-gray-200 rounded w-24"></div>
            <div className="w-8 h-8 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SkeletonCard);
