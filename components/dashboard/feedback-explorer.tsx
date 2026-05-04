"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { MessageSquare, Search, Star } from "lucide-react"
import { useDashboard } from "@/lib/dashboard-context"
import { getComment, getDepartment, getProfessor, getStudentName } from "@/lib/access-control"

export function FeedbackExplorer() {
  const { data, userRole } = useDashboard()
  const [searchQuery, setSearchQuery] = useState("")
  const [sentimentFilter, setSentimentFilter] = useState("all")

  const filteredFeedback = useMemo(() => {
    return data.filter((item) => {
      const feedbackText = getComment(item).toLowerCase()
      const professor = getProfessor(item).toLowerCase()
      const department = getDepartment(item).toLowerCase()
      const student = getStudentName(item).toLowerCase()
      const matchesSearch = [feedbackText, professor, department, student].some((value) =>
        value.includes(searchQuery.toLowerCase())
      )

      const sentiment = item.sentiment_label?.toString().toLowerCase().trim()
      const matchesSentiment = sentimentFilter === "all" || sentiment === sentimentFilter

      return matchesSearch && matchesSentiment
    })
  }, [data, searchQuery, sentimentFilter])

  const getSentimentBadge = (sentiment: string) => {
    const styles: Record<string, string> = {
      positive: "bg-green-100 text-green-600",
      neutral: "bg-yellow-100 text-yellow-600",
      negative: "bg-red-100 text-red-600",
    }

    return (
      <Badge className={cn("border-0 capitalize", styles[sentiment] || "")}>
        {sentiment || "unknown"}
      </Badge>
    )
  }

  const parseRating = (rating: unknown) => {
    const value = Number(rating?.toString().replace("/5", "").trim())
    return Number.isNaN(value) ? 0 : value
  }

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("h-4 w-4", i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className="bg-card border-border shadow-md mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Feedback Explorer</CardTitle>
        <p className="text-sm text-muted-foreground">
          {userRole === "admin"
            ? "Browse visible feedback records with student details and faculty context."
            : "Browse only your visible feedback records. Student identity is masked for privacy."}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MessageSquare className="h-4 w-4" />
          Showing {filteredFeedback.length} of {data.length} feedback entries
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {userRole === "admin" && <TableHead>Student</TableHead>}
                {userRole === "admin" && <TableHead>USN</TableHead>}
                {userRole === "admin" && <TableHead>Email</TableHead>}
                <TableHead>Faculty</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredFeedback.map((item, index) => {
                const rating = parseRating(item.star_rating)

                return (
                  <TableRow key={item.id || index}>
                    {userRole === "admin" && <TableCell>{getStudentName(item) || "Anonymous"}</TableCell>}
                    {userRole === "admin" && <TableCell>{item.usn || "N/A"}</TableCell>}
                    {userRole === "admin" && <TableCell>{item.email || "N/A"}</TableCell>}
                    <TableCell>{getProfessor(item) || "Unassigned"}</TableCell>
                    <TableCell>{getDepartment(item) || "Unknown"}</TableCell>
                    <TableCell>{getSentimentBadge(item.sentiment_label?.toString().toLowerCase() || "")}</TableCell>
                    <TableCell>{getRatingStars(rating)}</TableCell>
                    <TableCell className="max-w-[400px] whitespace-normal">{getComment(item)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {filteredFeedback.length === 0 && (
          <div className="text-center py-6 text-gray-500">No feedback found</div>
        )}
      </CardContent>
    </Card>
  )
}
