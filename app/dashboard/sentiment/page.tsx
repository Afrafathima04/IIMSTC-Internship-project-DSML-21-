"use client"

import { KPICards } from "@/components/dashboard/kpi-cards"
import { 
  SentimentPieChart, 
  MiniSentimentChart, 
  DepartmentComparisonChart 
} from "@/components/dashboard/sentiment-charts"
import { FacultyTable } from "@/components/dashboard/faculty-table"
import { useDashboard } from "@/lib/dashboard-context"

export default function SentimentPage() {
  const { userRole, data, currentUser } = useDashboard()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sentiment Analysis</h1>
        <p className="text-muted-foreground">
          {userRole === "admin"
            ? "Deep dive into student feedback sentiment patterns and trends"
            : `Department-level sentiment trends for ${currentUser?.department || "your assigned scope"}`}
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards data={data}/>

      {/* Sentiment Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SentimentPieChart data={data} />
        <MiniSentimentChart data={data} />
      </div>

      {/* Department Comparison (Admin only) */}
      {userRole === "admin" && <DepartmentComparisonChart data={data} />}

      {/* Faculty Sentiment Table */}
      {userRole === "admin" && <FacultyTable data={data} />}
    </div>
  )
}
