"use client"

import { useDashboard } from "@/lib/dashboard-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Moon, Sun, Menu, LogOut, User, Settings } from "lucide-react"
import { getDepartment } from "@/lib/access-control"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { DASHBOARD_SESSION_KEY } from "@/lib/access-control"

export function DashboardNavbar() {
  const {
    currentUser,
    userRole,
    rawData,
    selectedDepartment,
    setSelectedDepartment,
    sidebarOpen,
    setSidebarOpen
  } = useDashboard()

  const [isDark, setIsDark] = useState(false)
  const router = useRouter()
  const availableDepartments = Array.from(
    new Set(
      rawData
        .map((item) => getDepartment(item))
        .filter(Boolean)
    )
  ).sort()

  const handleLogout = () => {
    localStorage.removeItem(DASHBOARD_SESSION_KEY)
    router.push("/")
  }

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 backdrop-blur-md px-6 transition-all duration-300 shadow-sm",
        sidebarOpen ? "left-64" : "left-20"
      )}
    >
      {/* Left Section - Mobile Menu */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Center Section - Filters */}
      <div className="hidden md:flex items-center gap-3">
        {userRole === "admin" && (
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-44 bg-secondary border-0">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Departments">All Departments</SelectItem>
              {availableDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Right Section - Actions & Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {userRole === "admin" ? "Admin Access" : "Faculty Access"}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDark(!isDark)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {(currentUser?.name || "User").split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{currentUser?.name || "Dashboard User"}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.email || "Not available"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
