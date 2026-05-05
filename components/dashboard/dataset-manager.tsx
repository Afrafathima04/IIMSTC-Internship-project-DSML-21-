"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useDashboard } from "@/lib/dashboard-context"

type DatasetStatus = {
  active_dataset_path: string
  default_dataset_path: string
  using_uploaded_dataset: boolean
  row_count: number
  columns: string[]
}

const FACULTY_DIRECTORY_CACHE_KEY = "edufeed-faculty-directory"

export function DatasetManager() {
  const { refreshData } = useDashboard()
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState("")

  const loadStatus = async () => {
    try {
      const datasetResponse = await fetch("http://localhost:5000/api/dataset-status")

      setDatasetStatus(await datasetResponse.json())
    } catch (error) {
      console.error("STATUS ERROR:", error)
      setMessage("Could not load dataset status.")
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Select a CSV or XLSX file first.")
      return
    }

    setIsBusy(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("http://localhost:5000/api/upload-dataset", {
        method: "POST",
        body: formData,
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "Upload failed.")
      }

      setDatasetStatus(payload)
      setSelectedFile(null)
      setMessage("Dataset uploaded successfully. Faculty and admin views now use the uploaded file.")
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(FACULTY_DIRECTORY_CACHE_KEY)
      }
      await refreshData()
      await loadStatus()
    } catch (error) {
      console.error("UPLOAD ERROR:", error)
      setMessage(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setIsBusy(false)
    }
  }

  const handleReset = async () => {
    setIsBusy(true)
    setMessage("")

    try {
      const response = await fetch("http://localhost:5000/api/reset-dataset", {
        method: "POST",
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "Reset failed.")
      }

      setDatasetStatus(payload)
      setSelectedFile(null)
      setMessage("Uploaded dataset removed. Dashboard reverted to the default dataset.")
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(FACULTY_DIRECTORY_CACHE_KEY)
      }
      await refreshData()
      await loadStatus()
    } catch (error) {
      console.error("RESET ERROR:", error)
      setMessage(error instanceof Error ? error.message : "Reset failed.")
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dataset Manager</CardTitle>
          <CardDescription>
            Upload a CSV/XLSX file for admin-controlled analysis. Removing it switches everyone back to the default dataset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Active Source</p>
            <p className="text-sm text-muted-foreground break-all">
              {datasetStatus?.active_dataset_path || "Loading dataset status..."}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={datasetStatus?.using_uploaded_dataset ? "default" : "outline"}>
                {datasetStatus?.using_uploaded_dataset ? "Uploaded Dataset" : "Default Dataset"}
              </Badge>
              {datasetStatus && (
                <Badge variant="outline">{datasetStatus.row_count} rows</Badge>
              )}
            </div>
          </div>

          <Input
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />

          <div className="flex gap-3">
            <Button onClick={handleUpload} disabled={isBusy || !selectedFile}>
              {isBusy ? "Processing..." : "Upload Dataset"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isBusy}>
              Remove Uploaded File
            </Button>
          </div>

          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
