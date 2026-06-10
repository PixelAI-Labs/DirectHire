import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Badge, Skeleton } from '@directhire/shared'
import { jobService } from '@directhire/shared'

interface JobItem {
  id: string
  title: string
  location: string
  skills: string[]
  salary_min?: number
  salary_max?: number
  role_type: string
  company: {
    name: string
    logo_url?: string
  }
}

interface JobListResponse {
  items: JobItem[]
  total: number
  page: number
  limit: number
}

export const Jobs: React.FC = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [roleType, setRoleType] = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (search) params.q = search
      if (location) params.location = location
      if (roleType) params.role_type = roleType
      const res = await jobService.listJobs(params as Parameters<typeof jobService.listJobs>[0])
      const data: JobListResponse = res.data
      setJobs(data.items ?? data as unknown as JobItem[])
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [search, location, roleType])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `From ${fmt(min)}`
    return `Up to ${fmt(max!)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
          Discover Jobs
        </h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-[#2a3150] bg-[#131a2a] px-4 py-2 text-sm text-[#dce1fb] placeholder-[#8b92b4] focus:border-[#4f6df5] focus:outline-none"
        />
        <input
          type="text"
          placeholder="Location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-lg border border-[#2a3150] bg-[#131a2a] px-4 py-2 text-sm text-[#dce1fb] placeholder-[#8b92b4] focus:border-[#4f6df5] focus:outline-none"
        />
        <select
          value={roleType}
          onChange={(e) => setRoleType(e.target.value)}
          className="rounded-lg border border-[#2a3150] bg-[#131a2a] px-4 py-2 text-sm text-[#dce1fb] focus:border-[#4f6df5] focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="FULL_TIME">Full Time</option>
          <option value="PART_TIME">Part Time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERNSHIP">Internship</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="mb-3 h-5 w-3/4" />
                <Skeleton className="mb-3 h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </Card>
            ))
          : jobs.map((job) => {
              const salaryLabel = formatSalary(job.salary_min, job.salary_max)
              return (
                <Card
                  key={job.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <h3 className="mb-1 text-lg font-semibold text-[#dce1fb]">{job.title}</h3>
                  <p className="mb-2 text-sm text-[#8b92b4]">{job.company?.name} • {job.location}</p>
                  {salaryLabel && (
                    <p className="mb-2 text-xs text-[#facc15]">{salaryLabel}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 4 && (
                      <Badge variant="secondary">
                        +{job.skills.length - 4}
                      </Badge>
                    )}
                  </div>
                </Card>
              )
            })}
      </div>
    </div>
  )
}