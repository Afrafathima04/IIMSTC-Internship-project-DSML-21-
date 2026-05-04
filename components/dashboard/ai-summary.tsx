"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Sparkles, ThumbsUp, AlertTriangle, Lightbulb, Bot } from "lucide-react"
import { useDashboard } from "@/lib/dashboard-context"
import { buildLocalSummary, type DashboardSummary } from "@/lib/dashboard-insights"

interface SummaryCardProps {
  title: string
  items: string[]
  icon: React.ReactNode
  variant: "strength" | "problem" | "suggestion"
}

function SummaryCard({ title, items, icon, variant }: SummaryCardProps) {
  const variantStyles = {
    strength: {
      card: "from-positive/10 to-positive/5 border-positive/20",
      icon: "bg-positive/20 text-positive",
      bullet: "bg-positive",
    },
    problem: {
      card: "from-negative/10 to-negative/5 border-negative/20",
      icon: "bg-negative/20 text-negative",
      bullet: "bg-negative",
    },
    suggestion: {
      card: "from-primary/10 to-primary/5 border-primary/20",
      icon: "bg-primary/20 text-primary",
      bullet: "bg-primary",
    },
  }

  const styles = variantStyles[variant]

  return (
    <Card className={cn("bg-gradient-to-br border shadow-md hover:shadow-lg transition-shadow", styles.card)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", styles.icon)}>
            {icon}
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className={cn("mt-2 h-2 w-2 rounded-full shrink-0", styles.bullet)} />
              <span className="text-sm text-foreground/90 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function useAISummary() {
  const { data, userRole } = useDashboard()
  const localSummary = useMemo(() => buildLocalSummary(data), [data])
  const [summary, setSummary] = useState<DashboardSummary>(localSummary)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSummary(localSummary)
  }, [localSummary])

  useEffect(() => {
    if (!data.length) {
      return
    }

    let isMounted = true

    async function loadSummary() {
      setIsLoading(true)

      try {
        const response = await fetch("/api/ai-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, role: userRole }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate AI summary")
        }

        const payload = (await response.json()) as DashboardSummary

        if (isMounted) {
          setSummary(payload)
        }
      } catch (error) {
        console.error("AI SUMMARY ERROR:", error)
        if (isMounted) {
          setSummary(localSummary)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSummary()

    return () => {
      isMounted = false
    }
  }, [data, localSummary, userRole])

  return { summary, isLoading }
}

export function AISummaryCards() {
  const { summary, isLoading } = useAISummary()

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/30 via-chart-5/30 to-positive/30 border-primary/30 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                AI-Generated Insights
                <Sparkles className="h-5 w-5 text-primary" />
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Refreshing summary from the current dataset..."
                  : `Summary source: ${summary.provider || "Local analytics"}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Main Strengths"
          items={summary.strengths}
          icon={<ThumbsUp className="h-5 w-5" />}
          variant="strength"
        />
        <SummaryCard
          title="Key Problems"
          items={summary.problems}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="problem"
        />
        <SummaryCard
          title="Suggestions"
          items={summary.suggestions}
          icon={<Lightbulb className="h-5 w-5" />}
          variant="suggestion"
        />
      </div>
    </div>
  )
}

export function AISummaryCompact() {
  const { summary, isLoading } = useAISummary()

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">AI Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Refreshing insights..." : `Source: ${summary.provider || "Local analytics"}`}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-positive">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm font-medium">Top Strength</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6">{summary.strengths[0]}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-negative">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Key Issue</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6">{summary.problems[0]}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Lightbulb className="h-4 w-4" />
            <span className="text-sm font-medium">Top Suggestion</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6">{summary.suggestions[0]}</p>
        </div>
      </CardContent>
    </Card>
  )
}
