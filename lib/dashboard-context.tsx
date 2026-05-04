"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { UserRole, mockUsers, type User } from "./dashboard-data"
import {
  DASHBOARD_SESSION_KEY,
  type DashboardRecord,
  type DashboardSession,
  getDepartment,
  buildUserFromSession,
  canAccessRecord,
  sanitizeRecordForRole,
} from "./access-control"
 
function normalizeRecordValue(value: unknown) {
  return value?.toString().trim().toLowerCase() || ""
}

function dedupeRecords(records: DashboardRecord[]) {
  const seen = new Set<string>()

  return records.filter((record) => {
    const key = [
      normalizeRecordValue(record.comments),
      normalizeRecordValue(record.sentiment_label),
      normalizeRecordValue(record.department_name),
      normalizeRecordValue(record.professor_name),
      normalizeRecordValue(record.student_name),
      normalizeRecordValue(record.email),
      normalizeRecordValue(record.usn),
      normalizeRecordValue(record.star_rating),
    ].join("|")

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

interface DashboardContextType {
  setCurrentUser: (user: User) => void
  userRole: UserRole
  setUserRole: (role: UserRole) => void
  currentUser: User | null
  addFeedback: (item: DashboardRecord) => void
  refreshData: () => Promise<void>
  data: DashboardRecord[]
  rawData: DashboardRecord[]
  isLoading: boolean
  selectedDepartment: string
  setSelectedDepartment: (dept: string) => void
  selectedCourse: string
  setSelectedCourse: (course: string) => void
  selectedDateRange: string
  setSelectedDateRange: (range: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)


export function DashboardProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DashboardSession | null>(null)
  const [userRole, setUserRole] = useState<UserRole>("admin")
  const [rawData, setRawData] = useState<DashboardRecord[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedCourse, setSelectedCourse] = useState("All Courses")
  const [selectedDateRange, setSelectedDateRange] = useState("Last 30 Days")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[0])
  const [isLoading, setIsLoading] = useState(true)

  const addFeedback = (item: DashboardRecord) => {
    setRawData((prev) => [item, ...prev])
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const storedSession = window.localStorage.getItem(DASHBOARD_SESSION_KEY)

    if (!storedSession) {
      setSession({
        role: "admin",
        email: mockUsers[0].email,
        name: mockUsers[0].name,
      })
      return
    }

    try {
      setSession(JSON.parse(storedSession) as DashboardSession)
    } catch (error) {
      console.error("SESSION PARSE ERROR:", error)
      setSession({
        role: "admin",
        email: mockUsers[0].email,
        name: mockUsers[0].name,
      })
    }
  }, [])

  const refreshData = async () => {
    setIsLoading(true)

    try {
      const apiResponse = await fetch("http://localhost:5000/api/data")
      const json = await apiResponse.json()
      const apiRecords = Array.isArray(json) ? json : []

      setRawData(apiRecords)
    } catch (error) {
      console.error("API ERROR:", error)
      setRawData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  useEffect(() => {
    if (!session) {
      return
    }

    setUserRole(session.role)
  }, [session])

  useEffect(() => {
    setCurrentUser(buildUserFromSession(session, mockUsers, rawData))
  }, [session, rawData])

  const data = useMemo(() => {
    return rawData
      .filter((item) => canAccessRecord(item, userRole, currentUser))
      .filter((item) => selectedDepartment === "All Departments" || getDepartment(item) === selectedDepartment)
      .map((item) => sanitizeRecordForRole(item, userRole))
  }, [rawData, userRole, currentUser, selectedDepartment])

  return (
    <DashboardContext.Provider
      value={{
        userRole,
        setUserRole,
        currentUser,
        addFeedback,
        refreshData,
        setCurrentUser,
        data,
        rawData,
        isLoading,
        selectedDepartment,
        setSelectedDepartment,
        selectedCourse,
        setSelectedCourse,
        selectedDateRange,
        setSelectedDateRange,
        searchQuery,
        setSearchQuery,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider")
  }
  return context
}
