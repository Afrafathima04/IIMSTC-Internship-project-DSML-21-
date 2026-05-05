"use client"

import PredictBox from "@/components/dashboard/predictbox"
import RecentFeedback from "@/components/dashboard/RecentFeedback"
import { DatasetManager } from "@/components/dashboard/dataset-manager"
import { useDashboard } from "@/lib/dashboard-context"

export default function FeedbackActionsPage() {
  const { userRole } = useDashboard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {userRole === "admin" ? "Feedback Actions" : "Recent Feedback"}
        </h1>
        <p className="text-muted-foreground">
          {userRole === "admin"
            ? "Manage live feedback actions, test sentiment predictions, and review the latest submissions."
            : "Review your most recent feedback in a dedicated workspace."}
        </p>
      </div>

      {userRole === "admin" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <PredictBox />
          <RecentFeedback />
        </div>
      ) : (
        <RecentFeedback />
      )}

      {userRole === "admin" && <DatasetManager />}
    </div>
  )
}
