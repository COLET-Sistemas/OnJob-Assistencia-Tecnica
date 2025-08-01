'use client'  

import Navbar from '@/components/admin/Navbar'
import Sidebar from '@/components/admin/Sidebar'

interface AdminLayoutProps {
    children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>
        </div>
    )
}
