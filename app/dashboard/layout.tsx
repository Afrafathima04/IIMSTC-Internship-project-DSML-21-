"use client"

import { DashboardProvider } from "@/lib/dashboard-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardNavbar } from "@/components/dashboard/navbar"
import { useDashboard } from "@/lib/dashboard-context"
import { cn } from "@/lib/utils"

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useDashboard()
  
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardNavbar />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarOpen ? "pl-64" : "pl-20"
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  )
}
