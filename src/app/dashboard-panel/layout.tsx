"use client";

import AuthGuard from "@/components/AuthGuard";

export default function DashboardPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {children}
      </div>
    </AuthGuard>
  );
}
