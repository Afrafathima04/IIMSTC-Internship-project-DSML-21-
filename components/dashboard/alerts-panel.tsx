"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertTriangle, AlertCircle, CheckCircle, X, Clock, ArrowRight } from "lucide-react"
import { useMemo, useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { buildAlerts, type DashboardAlert } from "@/lib/dashboard-insights"

function AlertIcon({ type }: { type: DashboardAlert["type"] }) {
  switch (type) {
    case "critical":
      return <AlertTriangle className="h-5 w-5 text-negative" />
    case "warning":
      return <AlertCircle className="h-5 w-5 text-neutral" />
    case "stable":
      return <CheckCircle className="h-5 w-5 text-positive" />
  }
}

function AlertBadge({ type }: { type: DashboardAlert["type"] }) {
  const styles = {
    critical: "bg-negative/20 text-negative",
    warning: "bg-neutral/20 text-neutral",
    stable: "bg-positive/20 text-positive"
  }

  const labels = {
    critical: "Critical",
    warning: "Warning",
    stable: "Stable"
  }

  return (
    <Badge className={cn("border-0 font-medium", styles[type])}>
      {labels[type]}
    </Badge>
  )
}

export function AlertsPanel({ compact = false }: { compact?: boolean }) {
  const { data } = useDashboard()
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const datasetAlerts = useMemo(() => buildAlerts(data), [data])

  const visibleAlerts = datasetAlerts.filter((alert) => !dismissedAlerts.includes(alert.id))

  const displayAlerts = compact ? visibleAlerts.slice(0, 3) : visibleAlerts

  const handleDismiss = (id: string) => {
    setDismissedAlerts([...dismissedAlerts, id])
  }

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Alerts
        </CardTitle>
        {compact && (
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-positive mb-3" />
            <p className="text-foreground font-medium">All Clear!</p>
            <p className="text-sm text-muted-foreground">No active alerts at the moment</p>
          </div>
        ) : (
          displayAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "group flex items-start gap-4 rounded-lg p-4 transition-all",
                alert.type === "critical" && "bg-negative/10 border border-negative/20",
                alert.type === "warning" && "bg-neutral/10 border border-neutral/20",
                alert.type === "stable" && "bg-positive/10 border border-positive/20"
              )}
            >
              <AlertIcon type={alert.type} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertBadge type={alert.type} />
                  {alert.department && (
                    <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                      {alert.department}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{alert.message}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {alert.timestamp}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                onClick={() => handleDismiss(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function AlertsSummary() {
  const { data } = useDashboard()
  const scopedAlerts = useMemo(() => buildAlerts(data), [data])
  const criticalCount = scopedAlerts.filter((a) => a.type === "critical").length
  const warningCount = scopedAlerts.filter((a) => a.type === "warning").length
  const stableCount = scopedAlerts.filter((a) => a.type === "stable").length

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Alert Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 rounded-lg bg-negative/10">
            <AlertTriangle className="h-8 w-8 text-negative mb-2" />
            <span className="text-2xl font-bold text-negative">{criticalCount}</span>
            <span className="text-xs text-muted-foreground">Critical</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-neutral/10">
            <AlertCircle className="h-8 w-8 text-neutral mb-2" />
            <span className="text-2xl font-bold text-neutral">{warningCount}</span>
            <span className="text-xs text-muted-foreground">Warning</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-positive/10">
            <CheckCircle className="h-8 w-8 text-positive mb-2" />
            <span className="text-2xl font-bold text-positive">{stableCount}</span>
            <span className="text-xs text-muted-foreground">Stable</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
