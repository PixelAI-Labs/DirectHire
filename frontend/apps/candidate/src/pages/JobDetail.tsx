import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Skeleton } from '@directhire/shared'
import { jobService } from '@directhire/shared'

interface JobDetail {
  id: string
  title: string
  description: string
  requirements: string[]
  skills: string[]
  location: string
  salary_min?: number
  salary_max?: number
  role_type: string
  remote_option: string
  company: {
    name: string
    logo_url?: string
    description?: string
    website?: string
  }
}

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    jobService
      .getJob(id)
      .then((res) => setJob(res.data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleApply = async () => {
    if (!id || applied) return
    setApplying(true)
    try {
      await jobService.applyToJob(id)
      setApplied(true)
      window.alert('Application submitted successfully!')
    } catch {
      window.alert('Failed to apply. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `From ${fmt(min)}`
    return `Up to ${fmt(max!)}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Card>
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </Card>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
          Job Not Found
        </h1>
        <Button variant="outline" onClick={() => navigate('/jobs')}>
          Back to Jobs
        </Button>
      </div>
    )
  }

  const salaryLabel = formatSalary(job.salary_min, job.salary_max)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-[#8b92b4]">
            {job.company?.name} • {job.location}
          </p>
          {salaryLabel && (
            <p className="mt-1 text-sm text-[#facc15]">{salaryLabel}</p>
          )}
        </div>
        <Button
          onClick={handleApply}
          disabled={applied || applying}
        >
          {applied ? 'Applied' : applying ? 'Applying...' : 'Apply Now'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{job.role_type.replace('_', ' ')}</Badge>
        <Badge variant="secondary">{job.remote_option}</Badge>
        {job.skills.map((skill) => (
          <Badge key={skill} variant="secondary">
            {skill}
          </Badge>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-[#dce1fb]">About this role</h2>
        <p className="whitespace-pre-wrap text-sm text-[#dce1fb]/80">{job.description}</p>
      </Card>

      {job.requirements.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-[#dce1fb]">Requirements</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-[#dce1fb]/80">
            {job.requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}