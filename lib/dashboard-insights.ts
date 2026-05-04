import { getComment, getCourse, getDepartment, getProfessor, normalizeText, type DashboardRecord } from "./access-control"

export type DashboardAlert = {
  id: string
  type: "critical" | "warning" | "stable"
  message: string
  timestamp: string
  department?: string
  course?: string
  professor?: string
}

export type DashboardSummary = {
  strengths: string[]
  problems: string[]
  suggestions: string[]
  source: "local" | "ai"
  provider?: string
}

const STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "always",
  "because",
  "been",
  "being",
  "class",
  "classes",
  "could",
  "course",
  "from",
  "good",
  "great",
  "have",
  "helpful",
  "just",
  "more",
  "much",
  "only",
  "professor",
  "really",
  "should",
  "some",
  "student",
  "students",
  "teacher",
  "teaching",
  "than",
  "that",
  "them",
  "they",
  "this",
  "very",
  "with",
  "would",
])

function parseRatingValue(value: unknown) {
  const rating = Number(value?.toString().replace("/5", "").trim())
  return Number.isNaN(rating) ? null : rating
}

function getSentiment(record: DashboardRecord) {
  return normalizeText(record.sentiment_label)
}

function getRecordDate(record: DashboardRecord) {
  const rawValue =
    record.post_date?.toString().trim() ||
    record.date?.toString().trim() ||
    ""

  if (!rawValue) {
    return null
  }

  const date = new Date(rawValue)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatTimestamp(date: Date | null) {
  if (!date) {
    return "Based on current dataset"
  }

  return `Updated from ${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`
}

function getComplaintKeywords(records: DashboardRecord[]) {
  const keywordCounts = new Map<string, number>()

  records.forEach((record) => {
    const words = getComment(record)
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOPWORDS.has(word))

    words.forEach((word) => {
      keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1)
    })
  })

  return Array.from(keywordCounts.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
}

function getMonthlyPositiveRate(records: DashboardRecord[]) {
  const monthlyMap = new Map<string, { positive: number; total: number }>()

  records.forEach((record) => {
    const date = getRecordDate(record)

    if (!date) {
      return
    }

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const bucket = monthlyMap.get(monthKey) || { positive: 0, total: 0 }

    bucket.total += 1

    if (getSentiment(record) === "positive") {
      bucket.positive += 1
    }

    monthlyMap.set(monthKey, bucket)
  })

  return Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, value]) => ({
      month,
      rate: value.total ? value.positive / value.total : 0,
      total: value.total,
    }))
}

export function buildAlerts(records: DashboardRecord[]): DashboardAlert[] {
  if (!records.length) {
    return []
  }

  const alerts: DashboardAlert[] = []
  const professorMap = new Map<string, DashboardRecord[]>()

  records.forEach((record) => {
    const professor = getProfessor(record)
    if (!professor) {
      return
    }

    const key = normalizeText(professor)
    const group = professorMap.get(key) || []
    group.push(record)
    professorMap.set(key, group)
  })

  Array.from(professorMap.entries()).forEach(([key, group], index) => {
    const professor = getProfessor(group[0])
    const department = getDepartment(group[0]) || undefined
    const course = getCourse(group[0]) || undefined
    const latestDate = group
      .map(getRecordDate)
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null
    const negativeRecords = group.filter((record) => getSentiment(record) === "negative")
    const negativeRatio = group.length ? negativeRecords.length / group.length : 0
    const ratings = group.map((record) => parseRatingValue(record.star_rating)).filter((value): value is number => value !== null)
    const averageRating = ratings.length
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null

    if (group.length >= 5 && negativeRatio >= 0.4) {
      alerts.push({
        id: `negative-${index}`,
        type: negativeRatio >= 0.55 ? "critical" : "warning",
        message: `${professor} has ${(negativeRatio * 100).toFixed(0)}% negative feedback across ${group.length} reviews.`,
        timestamp: formatTimestamp(latestDate),
        department,
        course,
        professor,
      })
    }

    if (averageRating !== null && group.length >= 5 && averageRating < 2.5) {
      alerts.push({
        id: `rating-${index}`,
        type: averageRating < 2 ? "critical" : "warning",
        message: `${professor} has a low average rating of ${averageRating.toFixed(1)}/5.`,
        timestamp: formatTimestamp(latestDate),
        department,
        course,
        professor,
      })
    }

    const complaintKeywords = getComplaintKeywords(negativeRecords)
    if (complaintKeywords.length > 0) {
      const [topKeyword, count] = complaintKeywords[0]
      alerts.push({
        id: `keyword-${index}`,
        type: count >= 5 ? "critical" : "warning",
        message: `Repeated complaint keyword "${topKeyword}" appears ${count} times for ${professor}.`,
        timestamp: formatTimestamp(latestDate),
        department,
        course,
        professor,
      })
    }

    const monthlyRates = getMonthlyPositiveRate(group)
    if (monthlyRates.length >= 4) {
      const recent = monthlyRates.slice(-2)
      const previous = monthlyRates.slice(-4, -2)
      const recentRate = recent.reduce((sum, item) => sum + item.rate, 0) / recent.length
      const previousRate = previous.reduce((sum, item) => sum + item.rate, 0) / previous.length
      const drop = previousRate - recentRate

      if (drop >= 0.15) {
        alerts.push({
          id: `trend-${index}`,
          type: drop >= 0.25 ? "critical" : "warning",
          message: `${professor} shows a ${(drop * 100).toFixed(0)} point drop in positive sentiment compared with earlier months.`,
          timestamp: formatTimestamp(latestDate),
          department,
          course,
          professor,
        })
      }
    }
  })

  const sortedAlerts = alerts
    .sort((a, b) => {
      const typeWeight = { critical: 0, warning: 1, stable: 2 }
      return typeWeight[a.type] - typeWeight[b.type]
    })
    .slice(0, 12)

  if (sortedAlerts.length > 0) {
    return sortedAlerts
  }

  return [
    {
      id: "stable-overview",
      type: "stable",
      message: "No critical issues crossed the current dataset thresholds.",
      timestamp: "Based on current dataset",
    },
  ]
}

function describeStrengths(records: DashboardRecord[]) {
  const positiveRecords = records.filter((record) => getSentiment(record) === "positive")
  const topDepartments = new Map<string, { positive: number; total: number }>()

  records.forEach((record) => {
    const department = getDepartment(record)
    if (!department) {
      return
    }

    const bucket = topDepartments.get(department) || { positive: 0, total: 0 }
    bucket.total += 1
    if (getSentiment(record) === "positive") {
      bucket.positive += 1
    }
    topDepartments.set(department, bucket)
  })

  const bestDepartment = Array.from(topDepartments.entries())
    .map(([department, value]) => ({
      department,
      rate: value.total ? value.positive / value.total : 0,
      total: value.total,
    }))
    .filter((item) => item.total >= 3)
    .sort((a, b) => b.rate - a.rate)[0]

  const positiveKeywords = getComplaintKeywords(positiveRecords)

  return [
    records.length
      ? `${((positiveRecords.length / records.length) * 100).toFixed(0)}% of visible feedback is positive.`
      : "Positive feedback is limited in the current dataset.",
    bestDepartment
      ? `${bestDepartment.department} is currently the strongest department with ${(
          bestDepartment.rate * 100
        ).toFixed(0)}% positive feedback.`
      : "No department has enough reviews yet to rank reliably.",
    positiveKeywords[0]
      ? `Students repeatedly praise "${positiveKeywords[0][0]}" in positive comments.`
      : "Positive comments do not yet repeat enough keywords to extract a clear theme.",
  ]
}

function describeProblems(records: DashboardRecord[]) {
  const alerts = buildAlerts(records).filter((alert) => alert.type !== "stable")
  const negativeKeywords = getComplaintKeywords(records.filter((record) => getSentiment(record) === "negative"))

  return [
    alerts[0]?.message || "No major risk crossed the current alert thresholds.",
    alerts[1]?.message || "Average ratings remain above the warning threshold for most visible faculty.",
    negativeKeywords[0]
      ? `The complaint keyword "${negativeKeywords[0][0]}" is repeatedly appearing in negative feedback.`
      : "Negative comments are too sparse to isolate a repeated complaint theme.",
  ]
}

function describeSuggestions(records: DashboardRecord[]) {
  const problems = describeProblems(records)

  return [
    "Review the flagged professors first and compare their latest comments against historical sentiment trends.",
    problems[2].includes("keyword")
      ? "Address the most repeated complaint theme with targeted action plans and follow-up reviews."
      : "Capture more structured comments so recurring issues can be detected earlier.",
    "Recompute alerts after new feedback entries are added to confirm whether interventions are improving sentiment.",
  ]
}

export function buildLocalSummary(records: DashboardRecord[]): DashboardSummary {
  return {
    strengths: describeStrengths(records),
    problems: describeProblems(records),
    suggestions: describeSuggestions(records),
    source: "local",
    provider: "Local analytics",
  }
}
