"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts"

const COLORS = {
  positive: "hsl(145, 63%, 49%)",
  neutral: "hsl(48, 96%, 53%)",
  negative: "hsl(0, 84%, 60%)"
}

export function SentimentPieChart({ data = [] }: { data?: any[] }) {
  const total = data.length;

  const positive = data.filter(
    d => d.sentiment_label?.toLowerCase().trim() === "positive"
  ).length;

  const negative = data.filter(
    d => d.sentiment_label?.toLowerCase().trim() === "negative"
  ).length;

  const neutral = data.filter(
    d => d.sentiment_label?.toLowerCase().trim() === "neutral"
  ).length;

  const chartData = [
    {
      name: "Positive",
      value: total ? Number(((positive / total) * 100).toFixed(1)) : 0,
      color: COLORS.positive
    },
    {
      name: "Neutral",
      value: total ? Number(((neutral / total) * 100).toFixed(1)) : 0,
      color: COLORS.neutral
    },
    {
      name: "Negative",
      value: total ? Number(((negative / total) * 100).toFixed(1)) : 0,
      color: COLORS.negative
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={chartData} dataKey="value" innerRadius={60} outerRadius={100}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ✅ THIS WAS YOUR ERROR — NOW FIXED */
export function MiniSentimentChart({ data = [] }: { data?: any[] }) {
  const positive = data.filter(
    d => d.sentiment_label?.toLowerCase().trim() === "positive"
  ).length;

  const negative = data.filter(
    d => d.sentiment_label?.toLowerCase().trim() === "negative"
  ).length;

  const neutral = data.filter(
    d => d.sentiment_label?.toLowerCase().trim() === "neutral"
  ).length;

  const chartData = [
    { name: "Positive", value: positive },
    { name: "Neutral", value: neutral },
    { name: "Negative", value: negative }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#22c55e" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DepartmentComparisonChart({ data = [] }: { data?: any[] }) {

  if (!data || data.length === 0) {
    return <div>Loading...</div>;
  }

  const deptMap: any = {};

  data.forEach((d) => {
    const dept = d.department_name?.toString().trim() || "Unknown";

    if (!deptMap[dept]) {
      deptMap[dept] = {
        department: dept,
        positive: 0,
        neutral: 0,
        negative: 0
      };
    }

    const sentiment = d.sentiment_label?.toLowerCase();

    if (sentiment === "positive") deptMap[dept].positive++;
    else if (sentiment === "negative") deptMap[dept].negative++;
    else deptMap[dept].neutral++;
  });

  const chartData = Object.values(deptMap).slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department-wise Sentiment</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="positive" fill="#22c55e" />
            <Bar dataKey="neutral" fill="#eab308" />
            <Bar dataKey="negative" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}