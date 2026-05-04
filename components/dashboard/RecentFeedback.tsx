"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/lib/dashboard-context"
import { getComment, getDepartment, getProfessor } from "@/lib/access-control"

export default function RecentFeedback() {
  const { data, userRole } = useDashboard()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.length > 0 ? (
            data.slice(0, 8).map((item, index) => (
              <div key={item.id || index} className="rounded-lg border p-3 text-sm">
                <p className="text-foreground">{getComment(item)}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.sentiment_label} • {getProfessor(item) || "Unassigned"} • {getDepartment(item) || "Unknown"}
                </p>
                {userRole === "faculty" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Student identity remains hidden for faculty access.
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No feedback available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
