"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GraduationCap, Lock, Mail, User, Sparkles, BarChart3, Shield, MessageSquare } from "lucide-react"
import { DASHBOARD_SESSION_KEY, buildFacultyDirectory, createSession, type DashboardRecord } from "@/lib/access-control"

const ADMIN_EMAIL = "admin@university.edu"
const DEFAULT_PASSWORD = "demo123"
const FACULTY_DIRECTORY_CACHE_KEY = "edufeed-faculty-directory"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "faculty">("admin")
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [directoryData, setDirectoryData] = useState<DashboardRecord[]>([])
  const [directoryError, setDirectoryError] = useState("")
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(true)

  useEffect(() => {
    async function loadFacultyDirectory() {
      setIsDirectoryLoading(true)
      setDirectoryError("")

      if (typeof window !== "undefined") {
        const cachedValue = window.localStorage.getItem(FACULTY_DIRECTORY_CACHE_KEY)
        if (cachedValue) {
          try {
            const parsed = JSON.parse(cachedValue) as DashboardRecord[]
            if (Array.isArray(parsed) && parsed.length) {
              setDirectoryData(parsed)
              setIsDirectoryLoading(false)
            }
          } catch (error) {
            console.error("FACULTY CACHE PARSE ERROR:", error)
          }
        }
      }

      try {
        let payload: DashboardRecord[] = []

        for (let attempt = 0; attempt < 4; attempt += 1) {
          const response = await fetch("http://localhost:5000/api/faculty-directory", { cache: "no-store" })
          if (response.ok) {
            const json = await response.json()
            payload = Array.isArray(json) ? json : []
            break
          }

          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 900))
          } else {
            throw new Error(`Faculty directory request failed with ${response.status}`)
          }
        }

        setDirectoryData(payload)
        if (typeof window !== "undefined" && payload.length) {
          window.localStorage.setItem(FACULTY_DIRECTORY_CACHE_KEY, JSON.stringify(payload))
        }
      } catch (error) {
        console.error("LOGIN DIRECTORY ERROR:", error)
        setDirectoryError(
          directoryData.length
            ? "Using cached faculty accounts while the backend warms up."
            : "Faculty accounts could not be loaded. Please make sure the backend is running on port 5000."
        )
      } finally {
        setIsDirectoryLoading(false)
      }
    }

    loadFacultyDirectory()
  }, [])

  const facultyUsers = useMemo(() => buildFacultyDirectory(directoryData), [directoryData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")

    await new Promise((resolve) => setTimeout(resolve, 600))

    if (password !== DEFAULT_PASSWORD) {
      setLoginError(`Use the default password "${DEFAULT_PASSWORD}" for demo access.`)
      setIsLoading(false)
      return
    }

    if (role === "admin") {
      if (email.toLowerCase() !== ADMIN_EMAIL) {
        setLoginError(`Admin login uses ${ADMIN_EMAIL}.`)
        setIsLoading(false)
        return
      }

      localStorage.setItem(
        DASHBOARD_SESSION_KEY,
        JSON.stringify(createSession("admin", ADMIN_EMAIL, "Dr. Admin User"))
      )
      router.push("/dashboard")
      return
    }

    const matchedFaculty = facultyUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    )

    if (!matchedFaculty) {
      setLoginError(
        facultyUsers.length
          ? "Faculty email was not found in the dataset-derived accounts."
          : "Faculty directory is empty right now. Start the backend first, then try again."
      )
      setIsLoading(false)
      return
    }

    localStorage.setItem(
      DASHBOARD_SESSION_KEY,
      JSON.stringify(createSession("faculty", matchedFaculty.email, matchedFaculty.name))
    )
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/80 to-accent p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ED-FEED</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Student Feedback
            <br />
            <span className="text-white/90">Analytics Dashboard</span>
          </h1>

          <p className="text-lg text-white/80 mb-12 max-w-md">
            Transform student feedback into actionable insights using AI-powered sentiment analysis and NLP.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Real-time Analytics</h3>
                <p className="text-sm text-white/70">Track sentiment trends and department performance</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI-Powered Insights</h3>
                <p className="text-sm text-white/70">Automated analysis and recommendations</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Complete Anonymity</h3>
                <p className="text-sm text-white/70">Student privacy is fully protected</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Topic Extraction</h3>
                <p className="text-sm text-white/70">Identify common themes using NLP</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/60">
          © 2024 ED-FEED. Empowering education through data-driven insights.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md bg-card border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
            <CardDescription>Use the default password to access your role-based dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={role === "admin" ? ADMIN_EMAIL : "mahesh@dufeed.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary border-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={DEFAULT_PASSWORD}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-secondary border-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Login As</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <Select value={role} onValueChange={(value: "admin" | "faculty") => setRole(value)}>
                    <SelectTrigger className="pl-10 bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
                Admin login: {ADMIN_EMAIL}
                <br />
                Default password: {DEFAULT_PASSWORD}
              </div>

              {role === "faculty" && (
                <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-sm text-muted-foreground">
                  {isDirectoryLoading
                    ? "Loading faculty accounts from the current dataset..."
                    : directoryError || `Loaded ${facultyUsers.length} faculty login account(s) from the active dataset.`}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              {loginError && <p className="text-sm text-destructive">{loginError}</p>}

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Demo Access</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    setEmail(ADMIN_EMAIL)
                    setPassword(DEFAULT_PASSWORD)
                    setRole("admin")
                  }}
                >
                  Admin Demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-chart-2/30 text-chart-2 hover:bg-chart-2/10"
                  onClick={() => {
                    setEmail(facultyUsers[0]?.email || "faculty@dufeed.com")
                    setPassword(DEFAULT_PASSWORD)
                    setRole("faculty")
                  }}
                >
                  Faculty Demo
                </Button>
              </div>

              {role === "faculty" && facultyUsers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Faculty emails are auto-generated from the active dataset by taking the lowercase first name and using the `@dufeed.com` domain.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
