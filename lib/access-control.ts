import type { User, UserRole } from "./dashboard-data"

export const DASHBOARD_SESSION_KEY = "edufeed-session"

export type DashboardRecord = {
  comments?: string
  sentiment_label?: string
  department_name?: string
  professor_name?: string
  star_rating?: string | number
  student_name?: string
  usn?: string
  email?: string
  [key: string]: any
}

export type DashboardSession = {
  role: UserRole
  email: string
  name?: string
}

const FACULTY_EMAIL_DOMAIN = "dufeed.com"

export function normalizeText(value: unknown) {
  return value?.toString().trim().toLowerCase().replace(/\s+/g, " ") || ""
}

export function getDepartment(record: DashboardRecord) {
  return record.department_name?.toString().trim() || record.department?.toString().trim() || ""
}

export function getProfessor(record: DashboardRecord) {
  return record.professor_name?.toString().trim() || record.professor?.toString().trim() || ""
}

export function getComment(record: DashboardRecord) {
  return record.comments?.toString().trim() || record.comment?.toString().trim() || record.feedback?.toString().trim() || ""
}

export function getStudentName(record: DashboardRecord) {
  return record.student_name?.toString().trim() || record.student?.toString().trim() || ""
}

export function getCourse(record: DashboardRecord) {
  return (
    record.name_not_onlines?.toString().trim() ||
    record.course_name?.toString().trim() ||
    record.course?.toString().trim() ||
    record.subject?.toString().trim() ||
    ""
  )
}

function getFirstNameToken(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)[0] || "faculty"
  )
}

export function buildFacultyEmail(name: string, suffix = 0) {
  const firstName = getFirstNameToken(name)
  const localPart = suffix > 0 ? `${firstName}${suffix + 1}` : firstName
  return `${localPart}@${FACULTY_EMAIL_DOMAIN}`
}

export function buildFacultyDirectory(data: DashboardRecord[]): User[] {
  const professorMap = new Map<string, DashboardRecord[]>()

  data.forEach((record) => {
    const professor = getProfessor(record)

    if (!professor) {
      return
    }

    const key = normalizeText(professor)
    const rows = professorMap.get(key) || []
    rows.push(record)
    professorMap.set(key, rows)
  })

  const usedEmails = new Set<string>()

  return Array.from(professorMap.entries())
    .map(([key, rows], index) => {
      const sample = rows[0]
      const professor = getProfessor(sample)
      const department =
        rows.find((record) => getDepartment(record))?.department_name ||
        getDepartment(sample) ||
        undefined
      const courses = Array.from(
        new Set(rows.map((record) => getCourse(record)).filter(Boolean))
      ).slice(0, 10)

      let suffix = 0
      let email = buildFacultyEmail(professor, suffix)

      while (usedEmails.has(email)) {
        suffix += 1
        email = buildFacultyEmail(professor, suffix)
      }

      usedEmails.add(email)

      return {
        id: `faculty-${index + 1}`,
        name: professor,
        email,
        role: "faculty" as const,
        department,
        courses,
        avatar: undefined,
        _key: key,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function buildUserFromSession(session: DashboardSession | null, users: User[], data: DashboardRecord[]) {
  if (!session) {
    return users[0]
  }

  const matchedUser = users.find(
    (user) => user.role === session.role && normalizeText(user.email) === normalizeText(session.email)
  )

  if (matchedUser) {
    return matchedUser
  }

  if (session.role === "faculty") {
    const facultyDirectory = buildFacultyDirectory(data)
    const matchedFaculty = facultyDirectory.find(
      (user) => normalizeText(user.email) === normalizeText(session.email)
    )

    if (matchedFaculty) {
      return matchedFaculty
    }

    return {
      id: "faculty-session",
      role: "faculty",
      email: session.email,
      name: session.name || "Faculty User",
      department: undefined,
      courses: [],
    }
  }

  return {
    id: "admin-session",
    role: "admin",
    email: session.email,
    name: session.name || "Admin User",
  }
}

export function canAccessRecord(record: DashboardRecord, role: UserRole, currentUser: User | null) {
  if (role === "admin") {
    return true
  }

  const userName = normalizeText(currentUser?.name)
  const recordProfessor = normalizeText(getProfessor(record))

  if (userName && recordProfessor && userName === recordProfessor) {
    return true
  }

  return false
}

export function maskFacultyComment(comment: string) {
  if (!comment) {
    return "No comment available"
  }

  return comment
    .replace(/\[student\]/gi, "[Student]")
    .replace(/\[roll\]/gi, "[USN]")
    .replace(/\[email\]/gi, "[Email]")
    .replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[Email]")
    .replace(/\b[A-Z0-9]{6,}\b/gi, "[USN]")
}

export function sanitizeRecordForRole(record: DashboardRecord, role: UserRole) {
  const comment = getComment(record)

  if (role === "admin") {
    return {
      ...record,
      comments: comment,
      comment,
      feedback: comment,
    }
  }

  const maskedComment = maskFacultyComment(comment)

  return {
    ...record,
    comments: maskedComment,
    comment: maskedComment,
    feedback: maskedComment,
    student_name: undefined,
    student: undefined,
    usn: undefined,
    email: undefined,
  }
}

export function createSession(role: UserRole, email: string, name?: string): DashboardSession {
  return { role, email, name }
}
