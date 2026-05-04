"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, MessageSquare, ThumbsUp, ThumbsDown, Star } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  suffix?: string
  trend: number
  trendLabel: string
  icon: React.ReactNode
  variant: "default" | "positive" | "negative" | "warning"
}

function KPICard({ title, value, suffix, trend, trendLabel, icon, variant }: KPICardProps) {
  const isPositiveTrend = trend > 0
  
  const variantStyles = {
    default: "from-primary/30 to-primary/10 border-primary/30 hover:from-primary/40 hover:to-primary/15",
    positive: "from-positive/30 to-positive/10 border-positive/30 hover:from-positive/40 hover:to-positive/15",
    negative: "from-negative/30 to-negative/10 border-negative/30 hover:from-negative/40 hover:to-negative/15",
    warning: "from-neutral/30 to-neutral/10 border-neutral/30 hover:from-neutral/40 hover:to-neutral/15"
  }

  const iconStyles = {
    default: "bg-primary/30 text-primary",
    positive: "bg-positive/30 text-positive",
    negative: "bg-negative/30 text-negative",
    warning: "bg-neutral/30 text-neutral"
  }

  return (
    <Card className={cn(
      "relative overflow-hidden bg-gradient-to-br border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer",
      variantStyles[variant]
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{value}</span>
              {suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              {isPositiveTrend ? (
                <TrendingUp className="h-4 w-4 text-positive" />
              ) : (
                <TrendingDown className="h-4 w-4 text-negative" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositiveTrend ? "text-positive" : "text-negative"
                )}
              >
                {isPositiveTrend ? "+" : ""}{trend}%
              </span>
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            </div>
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function KPICards({ data = [] }: { data?: any[] }) {

  const total = data.length;
  const getSentiment = (d: any) =>
  (d.sentiment_label || "")
    .toString()
    .toLowerCase()
    .trim();
  const positive = data.filter(d => getSentiment(d) === "positive").length;
  const negative = data.filter(d => getSentiment(d) === "negative").length;

  const positivePercent = total
    ? ((positive / total) * 100).toFixed(1)
    : 0;

  const negativePercent = total
    ? ((negative / total) * 100).toFixed(1)
    : 0;

  // ✅ SAFE RATING CALCULATION
  const ratings = data
    .map(d =>
      Number(d.star_rating?.toString().replace("/5", "").trim())
    )
    .filter(r => !isNaN(r));

  const averageRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Feedback"
        value={total}
        trend={5}
        trendLabel="live data"
        icon={<MessageSquare className="h-6 w-6" />}
        variant="default"
      />
      <KPICard
        title="Positive Feedback"
        value={positivePercent}
        suffix="%"
        trend={3}
        trendLabel="live data"
        icon={<ThumbsUp className="h-6 w-6" />}
        variant="positive"
      />
      <KPICard
        title="Negative Feedback"
        value={negativePercent}
        suffix="%"
        trend={-2}
        trendLabel="live data"
        icon={<ThumbsDown className="h-6 w-6" />}
        variant="negative"
      />
      <KPICard
        title="Average Rating"
        value={averageRating}
        suffix="/5"
        trend={1}
        trendLabel="live data"
        icon={<Star className="h-6 w-6" />}
        variant="warning"
      />
    </div>
  );
}