"use client"

import { useEffect, useMemo, useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

export default function PredictBox() {
  const [text, setText] = useState("")
  const [result, setResult] = useState("")
  const [scores, setScores] = useState<Record<string, number>>({})
  const [provider, setProvider] = useState("")
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [anonymizedComment, setAnonymizedComment] = useState("")
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { addFeedback, rawData, currentUser, userRole } = useDashboard()
  const [rating, setRating] = useState("4")
  const [department, setDepartment] = useState("")
  const [faculty, setFaculty] = useState("")
  const [name, setName] = useState("")
  const [usn, setUsn] = useState("")
  const [email, setEmail] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [submitMessage, setSubmitMessage] = useState("")

  const facultyMode = userRole === "faculty"

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          rawData
            .filter((item) => !facultyMode || item.professor_name?.toString().trim() === currentUser?.name)
            .map((item) => item.department_name?.toString().trim())
            .filter(Boolean)
        )
      ).sort(),
    [currentUser?.name, facultyMode, rawData]
  )

  const faculties = useMemo(
    () =>
      Array.from(
        new Set(
          rawData
            .map((item) => item.professor_name?.toString().trim())
            .filter(Boolean)
            .filter((value) => !facultyMode || value === currentUser?.name)
        )
      ).sort(),
    [currentUser?.name, facultyMode, rawData]
  )

  useEffect(() => {
    if (!facultyMode) {
      return
    }

    if (currentUser?.name) {
      setFaculty(currentUser.name)
    }

    if (currentUser?.department) {
      setDepartment(currentUser.department)
      return
    }

    const matchingDepartment = rawData.find(
      (item) => item.professor_name?.toString().trim() === currentUser?.name && item.department_name?.toString().trim()
    )?.department_name

    if (matchingDepartment) {
      setDepartment(matchingDepartment.toString())
    }
  }, [currentUser?.department, currentUser?.name, facultyMode, rawData])

  const handlePredict = async () => {
    if (!text || !faculty) {
      return
    }

    setLoading(true)
    setSubmitMessage("")

    try {
      const res = await fetch("http://127.0.0.1:5000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: text,
        }),
      })

      const predictionData = await res.json()
      if (!res.ok) {
        throw new Error(predictionData.error || "Prediction failed")
      }

      setKeywords(predictionData.keywords || [])
      setResult(predictionData.label || predictionData.sentiment_label)
      setScores(predictionData.scores || predictionData.confidence_score || {})
      setProvider(predictionData.provider || "")
      setAccuracy(typeof predictionData.accuracy === "number" ? predictionData.accuracy : null)
      setAnonymizedComment(predictionData.anonymized_comment || "")
      setNotes(Array.isArray(predictionData.notes) ? predictionData.notes : [])

      await fetch("http://127.0.0.1:5000/api/add-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comments: predictionData.anonymized_comment,
          sentiment: predictionData.sentiment_label,
          department_name: department,
          professor_name: faculty,
          star_rating: `${rating}/5`,
          name,
          usn,
          email,
        }),
      })

      addFeedback({
        sentiment_label: predictionData.sentiment_label,
        department_name: department,
        professor_name: faculty,
        star_rating: `${rating}/5`,
        student_name: facultyMode ? undefined : name,
        usn: facultyMode ? undefined : usn,
        email: facultyMode ? undefined : email,
        comments: predictionData.anonymized_comment,
      })

      setSubmitMessage("Prediction saved to the local dashboard store.")
    } catch (err) {
      console.error("Prediction error:", err)
      setSubmitMessage(err instanceof Error ? err.message : "Prediction failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Try Sentiment Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          Only the feedback comment is sent to the model. Identity fields stay in the dashboard layer and are never passed to model inference.
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-text">Student Feedback</Label>
          <Textarea
            id="feedback-text"
            className="min-h-28"
            placeholder="Enter student feedback..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Max supported input length: 100 tokens.
          </p>
        </div>

        {!facultyMode && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student-name">Student Name</Label>
                <Input id="student-name" placeholder="Student Name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-usn">USN</Label>
                <Input id="student-usn" placeholder="USN" value={usn} onChange={(e) => setUsn(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="student@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment} disabled={facultyMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Faculty</Label>
            <Select value={faculty} onValueChange={setFaculty} disabled={facultyMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((fac) => (
                  <SelectItem key={fac} value={fac}>
                    {fac}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Rating</Label>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["1", "2", "3", "4", "5"].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}/5
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handlePredict} disabled={loading || !text || !faculty} className="w-full">
          {loading ? "Predicting..." : "Predict Sentiment"}
        </Button>

        {result && (
          <p className="font-bold">
            Sentiment:{" "}
            <span
              className={
                result.toLowerCase() === "positive"
                  ? "text-green-600"
                  : result.toLowerCase() === "negative"
                    ? "text-red-600"
                    : "text-yellow-500"
              }
            >
              {result}
            </span>
          </p>
        )}

        {accuracy !== null && (
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase text-muted-foreground">Model Accuracy</p>
            <p className="text-2xl font-semibold">{(accuracy * 100).toFixed(1)}%</p>
          </div>
        )}

        {keywords.length > 0 && (
          <p className="text-sm text-gray-500">Keywords: {keywords.join(", ")}</p>
        )}

        {Object.keys(scores).length > 0 && (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">Confidence Scores</p>
            <div className="mt-3 space-y-3">
              {(["Positive", "Negative", "Neutral"] as const).map((label) => {
                const score = Number(scores[label] ?? 0)
                const percent = Math.max(0, Math.min(100, score * 100))

                return (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{label}</span>
                      <span>{percent.toFixed(1)}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                )
              })}
            </div>
            {provider && <p className="mt-2 text-muted-foreground">Provider: {provider}</p>}
          </div>
        )}

        {anonymizedComment && (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">Anonymized Comment</p>
            <p className="text-muted-foreground">{anonymizedComment}</p>
          </div>
        )}

        {notes.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Model Notes</p>
            {notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        )}

        {submitMessage && (
          <div className="rounded-lg border p-3 text-sm text-muted-foreground">{submitMessage}</div>
        )}
      </CardContent>
    </Card>
  )
}
