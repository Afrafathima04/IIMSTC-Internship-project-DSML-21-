"use client"

import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/dashboard-context"
import {
  LayoutDashboard,
  TrendingUp,
  MessageSquareText,
  Users,
  AlertTriangle,
  FileText,
  Settings,
  Sparkles,
  WandSparkles,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const adminNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sentiment Analysis", href: "/dashboard/sentiment", icon: TrendingUp },
  { name: "Topic Analysis", href: "/dashboard/topics", icon: MessageSquareText },
  { name: "Faculty Comparison", href: "/dashboard/faculty", icon: Users },
  { name: "Alerts", href: "/dashboard/alerts", icon: AlertTriangle },
  { name: "AI Summary", href: "/dashboard/ai-summary", icon: Sparkles },
  { name: "Feedback Explorer", href: "/dashboard/feedback", icon: FileText },
  { name: "Feedback Actions", href: "/dashboard/feedback-actions", icon: WandSparkles },
  { name: "Settings", href: "/dashboard/settings", icon: Settings }
]

const facultyNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sentiment Analysis", href: "/dashboard/sentiment", icon: TrendingUp },
  { name: "Feedback Explorer", href: "/dashboard/feedback", icon: FileText },
  { name: "Faculty Tools", href: "/dashboard/feedback-actions", icon: WandSparkles },
  { name: "Settings", href: "/dashboard/settings", icon: Settings }
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { userRole, sidebarOpen, setSidebarOpen } = useDashboard()
  
  const navItems = userRole === "admin" ? adminNavItems : facultyNavItems

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border transition-all duration-300 shadow-xl",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold text-sidebar-foreground">
                EDU-FEED
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  !sidebarOpen && "justify-center"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary-foreground")} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Role Badge */}
        <div className="border-t border-sidebar-border p-4">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2",
              !sidebarOpen && "justify-center"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                userRole === "admin"
                  ? "bg-primary text-primary-foreground"
                  : "bg-chart-2 text-background"
              )}
            >
              {userRole === "admin" ? "A" : "F"}
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {userRole === "admin" ? "Admin" : "Faculty"}
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  {userRole === "admin" ? "Full Access" : "Limited Access"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
