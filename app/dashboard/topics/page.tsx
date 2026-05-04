"use client"

import { TopicCards, WordCloud, TopicSentimentTable } from "@/components/dashboard/topic-analysis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/lib/dashboard-context"

export default function TopicsPage() {
  const { userRole } = useDashboard()

  if (userRole !== "admin") {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Admin Access Required</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Topic analysis is reserved for admin users because it summarizes institution-wide feedback patterns.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Topic Analysis</h1>
        <p className="text-muted-foreground">
          Explore common themes and keywords extracted from student feedback using NLP
        </p>
      </div>

      {/* Topic Cards & Word Cloud */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopicCards />
        <WordCloud />
      </div>

      {/* Topic Sentiment Table */}
      <TopicSentimentTable />
    </div>
  )
}
