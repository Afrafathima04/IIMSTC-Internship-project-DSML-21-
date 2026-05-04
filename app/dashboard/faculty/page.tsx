"use client"

import { FacultyTable } from "@/components/dashboard/faculty-table"
import { DepartmentComparisonChart } from "@/components/dashboard/sentiment-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/lib/dashboard-context"
import { Award, TrendingDown, TrendingUp, Users } from "lucide-react"
import { useMemo } from "react"

export default function FacultyPage() {
  const { userRole, data } = useDashboard()

  const facultyRows = useMemo(() => {
    const facultyMap: Record<string, { positive: number; total: number; ratings: number[] }> = {}

    data.forEach((item, index) => {
      const name = item.professor_name?.toString().trim() || `Faculty ${index + 1}`
      const sentiment = item.sentiment_label?.toString().toLowerCase().trim()
      const rating = Number(item.star_rating?.toString().replace("/5", "").trim())

      if (!facultyMap[name]) {
        facultyMap[name] = { positive: 0, total: 0, ratings: [] }
      }

      facultyMap[name].total += 1

      if (sentiment === "positive") {
        facultyMap[name].positive += 1
      }

      if (!Number.isNaN(rating) && rating > 0) {
        facultyMap[name].ratings.push(rating)
      }
    })

    return Object.entries(facultyMap).map(([name, value]) => {
      const averageRating = value.ratings.length
        ? value.ratings.reduce((sum, rating) => sum + rating, 0) / value.ratings.length
        : 0

      return {
        name,
        positivePercent: value.total ? (value.positive / value.total) * 100 : 0,
        averageRating,
      }
    })
  }, [data])

  if (userRole !== "admin") {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Admin Access Required</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Faculty users cannot view cross-faculty comparisons. This page is limited to admins because it exposes other faculty performance data.
        </CardContent>
      </Card>
    )
  }

  const avgRating = facultyRows.length
    ? facultyRows.reduce((sum, item) => sum + item.averageRating, 0) / facultyRows.length
    : 0
  const excellentCount = facultyRows.filter((item) => item.positivePercent >= 80).length
  const needsAttention = facultyRows.filter((item) => item.positivePercent < 65).length
  const topPerformer = facultyRows.reduce(
    (best, item) => (item.averageRating > best.averageRating ? item : best),
    facultyRows[0] || { name: "No faculty data", positivePercent: 0, averageRating: 0 }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Faculty Comparison</h1>
        <p className="text-muted-foreground">
          Compare faculty performance across departments based on student feedback
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{facultyRows.length}</p>
                <p className="text-sm text-muted-foreground">Total Faculty</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral/20">
                <TrendingUp className="h-6 w-6 text-neutral" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-positive/20">
                <Award className="h-6 w-6 text-positive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{excellentCount}</p>
                <p className="text-sm text-muted-foreground">Excellent Ratings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-negative/20">
                <TrendingDown className="h-6 w-6 text-negative" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{needsAttention}</p>
                <p className="text-sm text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-positive/10 to-positive/5 border-positive/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-positive" />
            Top Performer This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xl font-bold text-foreground">{topPerformer.name}</p>
              <p className="text-sm text-muted-foreground">Based on current visible feedback records</p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold text-positive">{topPerformer.positivePercent.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Positive</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral">{topPerformer.averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DepartmentComparisonChart data={data} />
      <FacultyTable data={data} />
    </div>
  )
}
