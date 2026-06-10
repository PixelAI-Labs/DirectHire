import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Skeleton } from '@directhire/shared'
import { candidateService } from '@directhire/shared'

interface ApplicationItem {
  id: string
  job_id: string
  candidate_id: string
  status: string
  match_score?: number
  created_at: string
  job?: {
    id: string
    title: string
    company?: {
      name: string
    }
  }
}

const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'text-[#60a5fa]',
  SCREENING: 'text-[#facc15]',
  ASSESSMENT: 'text-[#a78bfa]',
  INTERVIEW: 'text-[#34d399]',
  OFFER: 'text-[#10b981]',
  REJECTED: 'text-[#f87171]',
  HIRED: 'text-[#10b981]',
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  return d.toLocaleDateString()
}

export const Applications: React.FC = () => {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    candidateService
      .getApplications()
      .then((res) => {
        const data: ApplicationItem[] = Array.isArray(res.data) ? res.data : res.data?.items ?? []
        setApplications(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      })
      .catch(() => setApplications([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        My Applications
      </h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><Skeleton className="h-16 w-full" /></Card>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <p className="text-sm text-[#8b92b4]">You haven&apos;t applied to any jobs yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card
              key={app.id}
              hover
              className="cursor-pointer"
              onClick={() => navigate(`/jobs/${app.job_id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#dce1fb]">
                    {app.job?.title ?? 'Unknown Position'}
                  </h3>
                  <p className="text-sm text-[#8b92b4]">
                    {app.job?.company?.name ?? 'Unknown Company'} • Applied {formatDate(app.created_at)}
                  </p>
                  {app.match_score != null && (
                    <p className="mt-1 text-xs text-[#facc15]">
                      Match Score: {Math.round(app.match_score * 100)}%
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full bg-[#2a3150] px-3 py-1 text-sm font-medium ${
                    STATUS_COLORS[app.status] ?? 'text-[#8b92b4]'
                  }`}
                >
                  {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}