import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { buildAlerts, buildLocalSummary } from "@/lib/dashboard-insights"
import { getDepartment, getProfessor, type DashboardRecord } from "@/lib/access-control"

type AISummaryResponse = {
  strengths: string[]
  problems: string[]
  suggestions: string[]
  source: "local" | "ai"
  provider?: string
}

function loadLocalEnvValue(key: string) {
  if (process.env[key]) {
    return process.env[key]
  }

  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) {
    return undefined
  }

  const file = fs.readFileSync(envPath, "utf-8")
  const line = file
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`))

  if (!line) {
    return undefined
  }

  return line.split("=")[1]?.trim().replace(/^['"]|['"]$/g, "")
}

function buildPrompt(data: DashboardRecord[]) {
  const localSummary = buildLocalSummary(data)
  const alerts = buildAlerts(data)
  const topFaculty = Array.from(
    data.reduce((map, record) => {
      const professor = getProfessor(record) || "Unknown"
      const department = getDepartment(record) || "Unknown"
      const bucket = map.get(professor) || { count: 0, department }
      bucket.count += 1
      map.set(professor, bucket)
      return map
    }, new Map<string, { count: number; department: string }>())
  )
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([professor, info]) => ({ professor, department: info.department, reviews: info.count }))

  return {
    localSummary,
    alerts,
    topFaculty,
    totalRecords: data.length,
  }
}

async function fetchGroqSummary(data: DashboardRecord[]): Promise<AISummaryResponse | null> {
  const apiKey = loadLocalEnvValue("GROQ_API_KEY")

  if (!apiKey) {
    return null
  }

  const promptPayload = buildPrompt(data)
  const model = loadLocalEnvValue("GROQ_MODEL") || "llama-3.1-8b-instant"

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an analytics assistant for an education feedback dashboard. Return valid JSON with keys strengths, problems, suggestions. Each value must be an array of 3 short strings. Focus only on the supplied dataset snapshot.",
        },
        {
          role: "user",
          content: JSON.stringify(promptPayload),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq request failed with ${response.status}`)
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content

  if (!content) {
    return null
  }

  const parsed = JSON.parse(content) as {
    strengths?: string[]
    problems?: string[]
    suggestions?: string[]
  }

  return {
    strengths: parsed.strengths?.slice(0, 3) || [],
    problems: parsed.problems?.slice(0, 3) || [],
    suggestions: parsed.suggestions?.slice(0, 3) || [],
    source: "ai",
    provider: `Groq (${model})`,
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { data?: DashboardRecord[] }
    const data = Array.isArray(body.data) ? body.data : []
    const localSummary = buildLocalSummary(data)

    if (!data.length) {
      return NextResponse.json(localSummary)
    }

    try {
      const aiSummary = await fetchGroqSummary(data)

      if (aiSummary) {
        return NextResponse.json(aiSummary)
      }
    } catch (error) {
      console.error("GROQ SUMMARY ERROR:", error)
    }

    return NextResponse.json(localSummary)
  } catch (error) {
    console.error("AI SUMMARY ROUTE ERROR:", error)
    return NextResponse.json(buildLocalSummary([]), { status: 200 })
  }
}
