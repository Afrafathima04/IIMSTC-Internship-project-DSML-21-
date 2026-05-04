"use client"

import { AISummaryCards } from "@/components/dashboard/ai-summary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/lib/dashboard-context"

export default function AISummaryPage() {
  const { userRole } = useDashboard()

  if (userRole !== "admin") {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Admin Access Required</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          AI summary is limited to admins because it includes broader institutional recommendations and full analytics context.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Summary & Insights</h1>
        <p className="text-muted-foreground">
          Automated analysis and recommendations generated using NLP and machine learning
        </p>
      </div>

      {/* AI Summary Cards */}
      <AISummaryCards />
    </div>
  )
}
