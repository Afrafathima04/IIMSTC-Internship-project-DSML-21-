"use client"

import { KPICards } from "@/components/dashboard/kpi-cards"
import { SentimentPieChart, MiniSentimentChart, DepartmentComparisonChart } from "@/components/dashboard/sentiment-charts"
import { FacultyTable } from "@/components/dashboard/faculty-table"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { AISummaryCompact } from "@/components/dashboard/ai-summary"
import { TopicCards } from "@/components/dashboard/topic-analysis"
import { useDashboard } from "@/lib/dashboard-context"
import PredictBox from "@/components/dashboard/predictbox"
import RecentFeedback from "@/components/dashboard/RecentFeedback"

export default function DashboardHome() {
  const { userRole, data } = useDashboard()
  const filteredData = data
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          {userRole === "admin" 
            ? "Monitor overall student feedback and sentiment across all departments" 
            : "Track student feedback for your courses"}
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards data={filteredData}/>
      {userRole === "admin" ? <PredictBox /> : <RecentFeedback />}

      {userRole === "admin" && <RecentFeedback />}
      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SentimentPieChart data={filteredData} />
        <MiniSentimentChart data={filteredData} />
      </div>

      {/* Department Comparison & Topics */}
      {userRole === "admin" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <DepartmentComparisonChart data={filteredData} />
          <TopicCards />
        </div>
      )}

      {/* Faculty Table (Admin only) */}
      {userRole === "admin" && <FacultyTable />}

      {/* Bottom Row - Alerts & AI Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsPanel compact />
        <AISummaryCompact />
      </div>
    </div>
  )
}
