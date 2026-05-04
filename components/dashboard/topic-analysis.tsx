"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/dashboard-context"
import { BookOpen, ClipboardList, GraduationCap, Microscope, MessageCircle } from "lucide-react"

const topicIcons: Record<string, React.ReactNode> = {
  "Teaching Quality": <GraduationCap className="h-5 w-5" />,
  "Assignments": <ClipboardList className="h-5 w-5" />,
  "Exam Difficulty": <BookOpen className="h-5 w-5" />,
  "Lab Facilities": <Microscope className="h-5 w-5" />,
  "Communication": <MessageCircle className="h-5 w-5" />
}

const topicKeywordMap: Record<string, string[]> = {
  "Teaching Quality": ["teach", "teaching", "explain", "lecture", "lectures", "class", "professor", "faculty"],
  "Assignments": ["assignment", "assignments", "homework", "project", "projects", "submission"],
  "Exam Difficulty": ["exam", "exams", "test", "tests", "quiz", "quizzes", "difficult", "hard"],
  "Lab Facilities": ["lab", "labs", "equipment", "facility", "facilities", "practical"],
  "Communication": ["communication", "respond", "response", "email", "doubt", "helpful", "support"],
}

function normalizeSentiment(value: unknown) {
  return value?.toString().trim().toLowerCase() || ""
}

function getCommentText(record: any) {
  return record.comments?.toString().toLowerCase() || ""
}

function useTopicMetrics() {
  const { data } = useDashboard()

  return useMemo(() => {
    const keywordCounts: Record<string, number> = {}
    const topicSummaries = Object.entries(topicKeywordMap).map(([topic, keywords]) => {
      let total = 0
      let positive = 0
      let negative = 0

      data.forEach((record) => {
        const comment = getCommentText(record)
        if (!comment) {
          return
        }

        if (!keywords.some((keyword) => comment.includes(keyword))) {
          return
        }

        total += 1
        const sentiment = normalizeSentiment(record.sentiment_label)
        if (sentiment === "positive") {
          positive += 1
        } else if (sentiment === "negative") {
          negative += 1
        }

        comment
          .split(/[^a-zA-Z]+/)
          .map((token: string) => token.trim().toLowerCase())
          .filter((token: string) => token.length >= 4)
          .forEach((token: string) => {
            keywordCounts[token] = (keywordCounts[token] || 0) + 1
          })
      })

      const sentiment =
        positive > negative ? "positive" : negative > positive ? "negative" : "neutral"

      return {
        topic,
        total,
        percentage: data.length ? Number(((total / data.length) * 100).toFixed(1)) : 0,
        positive: total ? Number(((positive / total) * 100).toFixed(1)) : 0,
        negative: total ? Number(((negative / total) * 100).toFixed(1)) : 0,
        sentiment,
      }
    })

    const sortedTopics = topicSummaries.sort((a, b) => b.total - a.total)
    const wordCloudData = Object.entries(keywordCounts)
      .filter(([word]) => !["this", "that", "with", "have", "from", "were", "they", "them", "very"].includes(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([text, value]) => ({ text, value }))

    return {
      topics: sortedTopics,
      words: wordCloudData,
    }
  }, [data])
}

export function TopicCards() {
  const { topics } = useTopicMetrics()

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Topic Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.map((topic) => {
          const sentimentColor = topic.sentiment === "positive"
            ? "text-positive"
            : topic.sentiment === "negative"
            ? "text-negative"
            : "text-neutral"
          
          const progressColor = topic.sentiment === "positive"
            ? "bg-positive"
            : topic.sentiment === "negative"
            ? "bg-negative"
            : "bg-neutral"

          return (
            <div key={topic.topic} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-secondary", sentimentColor)}>
                    {topicIcons[topic.topic]}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{topic.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {topic.positive}% positive · {topic.negative}% negative
                    </p>
                  </div>
                </div>
                <span className={cn("text-xl font-bold", sentimentColor)}>{topic.percentage}%</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor)}
                  style={{ width: `${topic.percentage}%` }}
                />
              </div>
            </div>
          )
        })}
        {!topics.length && (
          <p className="text-sm text-muted-foreground">No topic data available for the current dataset.</p>
        )}
      </CardContent>
    </Card>
  )
}

export function WordCloud() {
  const { words } = useTopicMetrics()
  const maxValue = words.length ? Math.max(...words.map((w) => w.value)) : 1
  const minValue = words.length ? Math.min(...words.map((w) => w.value)) : 0

  const getSize = (value: number) => {
    const normalized = maxValue === minValue ? 1 : (value - minValue) / (maxValue - minValue)
    return 12 + normalized * 20 // Size range: 12px to 32px
  }

  const getColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue)
    if (normalized > 0.7) return "text-primary"
    if (normalized > 0.5) return "text-positive"
    if (normalized > 0.3) return "text-neutral"
    return "text-muted-foreground"
  }

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Common Keywords</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 justify-center items-center min-h-[200px]">
          {words.map((word, index) => (
            <span
              key={index}
              className={cn(
                "font-medium transition-all hover:scale-110 cursor-pointer",
                getColor(word.value)
              )}
              style={{ fontSize: `${getSize(word.value)}px` }}
            >
              {word.text}
            </span>
          ))}
          {!words.length && (
            <p className="text-sm text-muted-foreground">No keyword cloud available for the current dataset.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function TopicSentimentTable() {
  const { topics } = useTopicMetrics()

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Topic Sentiment Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Topic</TableHead>
              <TableHead className="text-muted-foreground text-center">Positive</TableHead>
              <TableHead className="text-muted-foreground text-center">Negative</TableHead>
              <TableHead className="text-muted-foreground text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((topic) => (
              <TableRow key={topic.topic} className="border-border hover:bg-secondary/50">
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {topicIcons[topic.topic]}
                    {topic.topic}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-positive font-semibold">{topic.positive}%</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-negative font-semibold">{topic.negative}%</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={cn(
                      "border-0",
                      topic.sentiment === "positive" && "bg-positive/20 text-positive",
                      topic.sentiment === "negative" && "bg-negative/20 text-negative",
                      topic.sentiment === "neutral" && "bg-neutral/20 text-neutral"
                    )}
                  >
                    {topic.sentiment === "positive" ? "Good" : topic.sentiment === "negative" ? "Needs Work" : "Moderate"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!topics.length && (
              <TableRow className="border-border">
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No topic breakdown is available for the current dataset.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
