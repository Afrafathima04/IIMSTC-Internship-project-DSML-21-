// Mock data for the EDU-FEED dashboard

export type UserRole = "admin" | "faculty"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  courses?: string[]
  avatar?: string
}

export interface KPIData {
  totalFeedback: number
  positivePercent: number
  negativePercent: number
  neutralPercent: number
  averageRating: number
  feedbackTrend: number
  positiveTrend: number
  negativeTrend: number
  ratingTrend: number
}

export interface SentimentData {
  positive: number
  neutral: number
  negative: number
}

export interface TrendData {
  month: string
  positive: number
  neutral: number
  negative: number
}

export interface DepartmentData {
  department: string
  positive: number
  neutral: number
  negative: number
}

export interface FacultyData {
  id: string
  name: string
  course: string
  department: string
  positive: number
  negative: number
  neutral: number
  averageRating: number
}

export interface TopicData {
  topic: string
  percentage: number
  positive: number
  negative: number
  sentiment: "positive" | "neutral" | "negative"
}

export interface AlertData {
  id: string
  type: "critical" | "warning" | "stable"
  message: string
  timestamp: string
  course?: string
  department?: string
}

export interface FeedbackItem {
  id: string
  date: string
  course: string
  department: string
  sentiment: "positive" | "neutral" | "negative"
  topic: string
  comment: string
  rating: number
}

export interface AISummary {
  strengths: string[]
  problems: string[]
  suggestions: string[]
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Dr. Admin User",
    email: "admin@university.edu",
    role: "admin",
    avatar: "/avatars/admin.jpg"
  },
  {
    id: "2", 
    name: "Prof. John Smith",
    email: "jsmith@university.edu",
    role: "faculty",
    department: "CSE",
    courses: ["Data Structures", "Algorithms"],
    avatar: "/avatars/faculty1.jpg"
  }
]

// Mock KPI Data
export const mockKPIData: KPIData = {
  totalFeedback: 1247,
  positivePercent: 72,
  negativePercent: 18,
  neutralPercent: 10,
  averageRating: 4.1,
  feedbackTrend: 12.5,
  positiveTrend: 5.2,
  negativeTrend: -3.8,
  ratingTrend: 0.3
}

// Mock Sentiment Distribution
export const mockSentimentData: SentimentData = {
  positive: 72,
  neutral: 10,
  negative: 18
}

// Mock Trend Data (6 months)
export const mockTrendData: TrendData[] = [
  { month: "Jan", positive: 65, neutral: 15, negative: 20 },
  { month: "Feb", positive: 68, neutral: 12, negative: 20 },
  { month: "Mar", positive: 70, neutral: 11, negative: 19 },
  { month: "Apr", positive: 69, neutral: 13, negative: 18 },
  { month: "May", positive: 71, neutral: 11, negative: 18 },
  { month: "Jun", positive: 72, neutral: 10, negative: 18 }
]

// Mock Department Data
export const mockDepartmentData: DepartmentData[] = [
  { department: "CSE", positive: 75, neutral: 10, negative: 15 },
  { department: "ECE", positive: 68, neutral: 12, negative: 20 },
  { department: "AI/ML", positive: 80, neutral: 8, negative: 12 },
  { department: "IT", positive: 70, neutral: 11, negative: 19 }
]

// Mock Faculty Data
export const mockFacultyData: FacultyData[] = [
  { id: "1", name: "Prof. Smith", course: "Data Structures", department: "CSE", positive: 82, negative: 10, neutral: 8, averageRating: 4.5 },
  { id: "2", name: "Prof. Johnson", course: "Database Systems", department: "CSE", positive: 65, negative: 25, neutral: 10, averageRating: 3.8 },
  { id: "3", name: "Prof. Williams", course: "Machine Learning", department: "AI/ML", positive: 88, negative: 7, neutral: 5, averageRating: 4.7 },
  { id: "4", name: "Prof. Brown", course: "Digital Electronics", department: "ECE", positive: 60, negative: 28, neutral: 12, averageRating: 3.5 },
  { id: "5", name: "Prof. Davis", course: "Computer Networks", department: "IT", positive: 75, negative: 15, neutral: 10, averageRating: 4.2 },
  { id: "6", name: "Prof. Miller", course: "Operating Systems", department: "CSE", positive: 70, negative: 18, neutral: 12, averageRating: 4.0 },
  { id: "7", name: "Prof. Wilson", course: "Deep Learning", department: "AI/ML", positive: 85, negative: 8, neutral: 7, averageRating: 4.6 },
  { id: "8", name: "Prof. Moore", course: "Signal Processing", department: "ECE", positive: 72, negative: 16, neutral: 12, averageRating: 4.1 }
]

// Mock Topic Data
export const mockTopicData: TopicData[] = [
  { topic: "Teaching Quality", percentage: 42, positive: 78, negative: 22, sentiment: "positive" },
  { topic: "Assignments", percentage: 25, positive: 45, negative: 55, sentiment: "negative" },
  { topic: "Exam Difficulty", percentage: 18, positive: 52, negative: 48, sentiment: "neutral" },
  { topic: "Lab Facilities", percentage: 10, positive: 38, negative: 62, sentiment: "negative" },
  { topic: "Communication", percentage: 5, positive: 85, negative: 15, sentiment: "positive" }
]

// Mock Word Cloud Data
export const mockWordCloudData = [
  { text: "practical", value: 85 },
  { text: "explanation", value: 78 },
  { text: "assignments", value: 72 },
  { text: "helpful", value: 68 },
  { text: "understanding", value: 65 },
  { text: "slow teaching", value: 58 },
  { text: "more practicals", value: 55 },
  { text: "good", value: 52 },
  { text: "interactive", value: 48 },
  { text: "too much work", value: 45 },
  { text: "lab equipment", value: 42 },
  { text: "clear", value: 40 },
  { text: "engaging", value: 38 },
  { text: "difficult", value: 35 },
  { text: "supportive", value: 32 }
]

// Mock Alerts
export const mockAlerts: AlertData[] = [
  { id: "1", type: "critical", message: "High negative sentiment in DBMS course", timestamp: "2 hours ago", course: "Database Systems", department: "CSE" },
  { id: "2", type: "critical", message: "Repeated complaint: Lab equipment not working", timestamp: "5 hours ago", department: "ECE" },
  { id: "3", type: "warning", message: "Sudden drop in faculty rating for Digital Electronics", timestamp: "1 day ago", course: "Digital Electronics", department: "ECE" },
  { id: "4", type: "warning", message: "Assignment load complaints increasing in CSE", timestamp: "2 days ago", department: "CSE" },
  { id: "5", type: "stable", message: "ML course maintaining excellent feedback", timestamp: "3 days ago", course: "Machine Learning", department: "AI/ML" },
  { id: "6", type: "stable", message: "Overall sentiment improved by 5% this month", timestamp: "1 week ago" }
]

// Mock Feedback Items
export const mockFeedbackItems: FeedbackItem[] = [
  { id: "1", date: "2024-01-15", course: "Data Structures", department: "CSE", sentiment: "positive", topic: "Teaching Quality", comment: "The professor explains concepts very clearly with practical examples. The teaching methodology is excellent.", rating: 5 },
  { id: "2", date: "2024-01-14", course: "Database Systems", department: "CSE", sentiment: "negative", topic: "Assignments", comment: "Too many assignments without proper explanation. Need more time to complete them.", rating: 2 },
  { id: "3", date: "2024-01-14", course: "Machine Learning", department: "AI/ML", sentiment: "positive", topic: "Teaching Quality", comment: "Amazing course! [NAME] makes complex algorithms easy to understand.", rating: 5 },
  { id: "4", date: "2024-01-13", course: "Digital Electronics", department: "ECE", sentiment: "negative", topic: "Lab Facilities", comment: "Lab equipment is outdated and often not working. Need urgent upgrades.", rating: 2 },
  { id: "5", date: "2024-01-13", course: "Computer Networks", department: "IT", sentiment: "positive", topic: "Communication", comment: "Professor is very responsive and helpful. Always available for doubts.", rating: 4 },
  { id: "6", date: "2024-01-12", course: "Operating Systems", department: "CSE", sentiment: "neutral", topic: "Exam Difficulty", comment: "Exams are challenging but fair. Would appreciate more practice questions.", rating: 3 },
  { id: "7", date: "2024-01-12", course: "Deep Learning", department: "AI/ML", sentiment: "positive", topic: "Teaching Quality", comment: "Best course I have taken! Very practical and industry-oriented.", rating: 5 },
  { id: "8", date: "2024-01-11", course: "Signal Processing", department: "ECE", sentiment: "neutral", topic: "Assignments", comment: "Assignments are helpful but sometimes unclear instructions.", rating: 3 }
]

// Mock AI Summary
export const mockAISummary: AISummary = {
  strengths: [
    "Students highly appreciate the practical teaching approach in AI/ML courses",
    "Faculty responsiveness and communication is rated excellent across departments",
    "Interactive teaching methods in Data Structures course receiving positive feedback"
  ],
  problems: [
    "Assignment load in CSE department is frequently mentioned as excessive",
    "Lab facilities in ECE department need urgent attention and upgrades",
    "Some courses have unclear exam patterns causing student anxiety"
  ],
  suggestions: [
    "Consider reducing assignment frequency and increasing quality over quantity",
    "Urgent investment needed in ECE lab equipment and infrastructure",
    "Implement more practical sessions across all technical courses",
    "Create a standardized feedback mechanism for continuous improvement"
  ]
}

// Departments list
export const departments = ["All Departments", "CSE", "ECE", "AI/ML", "IT"]

// Courses list
export const courses = [
  "All Courses",
  "Data Structures",
  "Database Systems", 
  "Machine Learning",
  "Digital Electronics",
  "Computer Networks",
  "Operating Systems",
  "Deep Learning",
  "Signal Processing"
]

// Date ranges
export const dateRanges = [
  "Last 7 Days",
  "Last 30 Days",
  "Last 3 Months",
  "Last 6 Months",
  "Last Year",
  "All Time"
]
