"use client"

import { AlertsPanel, AlertsSummary } from "@/components/dashboard/alerts-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/lib/dashboard-context"

export default function AlertsPage() {
  const { userRole } = useDashboard()

  if (userRole !== "admin") {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Admin Access Required</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Alerts with full cross-department visibility are only available to admins.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alerts & Notifications</h1>
        <p className="text-muted-foreground">
          Monitor critical feedback alerts and system notifications
        </p>
      </div>

      {/* Alert Summary */}
      <AlertsSummary />

      {/* Full Alerts Panel */}
      <AlertsPanel />
    </div>
  )
}
