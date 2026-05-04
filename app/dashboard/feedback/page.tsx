"use client"

import { FeedbackExplorer } from "@/components/dashboard/feedback-explorer"
import { useDashboard } from "@/lib/dashboard-context"

export default function FeedbackPage() {
  const { userRole } = useDashboard()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feedback Explorer</h1>
        <p className="text-muted-foreground">
          {userRole === "admin"
            ? "Browse and filter student feedback with student identity, faculty, and department context"
            : "Browse only your visible feedback. Student identity is hidden and comments remain masked."}
        </p>
      </div>

      {/* Feedback Explorer */}
      <FeedbackExplorer />
    </div>
  )
}
