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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUpDown, Star } from "lucide-react"
import { useDashboard } from "@/lib/dashboard-context"

type SortField = "name" | "positive" | "negative" | "averageRating"
type SortOrder = "asc" | "desc"

export function FacultyTable({ data = [] }: { data?: any[] }) {
  const [sortField, setSortField] = useState<SortField>("averageRating")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const { userRole } = useDashboard()
  const facultyRows = useMemo(() => {
    const facultyMap: Record<string, any> = {}

    data.forEach((item, index) => {
      // ✅ SAFE NAME (no grouping issue)
      const name =
        item.professor_name ||
        item.professor ||
        item.faculty_name ||
        item.instructor ||
        `Faculty_${index}`

      const course =
        item.course_name ||
        item.course ||
        item.subject ||
        "N/A"

      const department =
        item.department_name ||
        item.department ||
        "Unknown"

      const sentiment = item.sentiment_label?.toLowerCase().trim()

      if (!facultyMap[name]) {
        facultyMap[name] = {
          id: name,
          name,
          course,
          department,
          positiveCount: 0,
          negativeCount: 0,
          totalCount: 0,
          ratings: [],
        }
      }

      facultyMap[name].totalCount++
      facultyMap[name].student_name = item.student_name
      facultyMap[name].usn = item.usn
      facultyMap[name].email = item.email
      // ✅ CORRECT SENTIMENT HANDLING
      if (sentiment === "positive") {
        facultyMap[name].positiveCount++
      } else if (sentiment === "negative") {
        facultyMap[name].negativeCount++
      }

      // ✅ SAFE RATING PARSE
      const rating = Number(
        item.star_rating?.toString().replace("/5", "").trim()
      )

      if (!isNaN(rating) && rating > 0) {
        facultyMap[name].ratings.push(rating)
      }
    })

    const rows = Object.values(facultyMap).map((f: any) => {
      const positive =
        f.totalCount > 0
          ? Number(((f.positiveCount / f.totalCount) * 100).toFixed(1))
          : 0

      const negative =
        f.totalCount > 0
          ? Number(((f.negativeCount / f.totalCount) * 100).toFixed(1))
          : 0

      const averageRating =
        f.ratings.length > 0
          ? Number(
              (
                f.ratings.reduce((a: number, b: number) => a + b, 0) /
                f.ratings.length
              ).toFixed(1)
            )
          : 0

      return {
        ...f,
        positive,
        negative,
        averageRating,
      }
    })

    // ✅ SORTING
    return rows.sort((a: any, b: any) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortOrder === "asc"
        ? aValue - bValue
        : bValue - aValue
    })
  }, [data, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600"
    if (rating >= 4.0) return "text-yellow-500"
    if (rating >= 3.5) return "text-orange-400"
    return "text-red-500"
  }

  const getSentimentBadge = (positive: number) => {
    if (positive >= 80)
      return <Badge className="bg-green-100 text-green-600">Excellent</Badge>
    if (positive >= 70)
      return <Badge className="bg-yellow-100 text-yellow-600">Good</Badge>
    if (positive >= 60)
      return <Badge className="bg-orange-100 text-orange-500">Average</Badge>
    return <Badge className="bg-red-100 text-red-600">Needs Attention</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button onClick={() => handleSort("name")}>
                  Faculty <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>
                <Button onClick={() => handleSort("positive")}>
                  Positive %
                </Button>
              </TableHead>
              <TableHead>
                <Button onClick={() => handleSort("negative")}>
                  Negative %
                </Button>
              </TableHead>
              <TableHead>
                <Button onClick={() => handleSort("averageRating")}>
                  Rating
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              {userRole === "admin" && <TableHead>Student Info</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {facultyRows.map((f: any) => (
              <TableRow key={f.id}>
                <TableCell>{f.name}</TableCell>
                <TableCell>{f.course}</TableCell>
                <TableCell>{f.department}</TableCell>
                <TableCell>{f.positive}%</TableCell>
                <TableCell>{f.negative}%</TableCell>
                <TableCell className="flex items-center gap-1">
                  <Star
                    className={cn(
                      "h-4 w-4 fill-current",
                      getRatingColor(f.averageRating)
                    )}
                  />
                  {f.averageRating}
                </TableCell>
                <TableCell>{getSentimentBadge(f.positive)}</TableCell>
                {userRole === "admin" && (
                <TableCell>
                  <p>{f.student_name}</p>
                  <p>{f.usn}</p>
                  <p>{f.email}</p>
                </TableCell>
              )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}