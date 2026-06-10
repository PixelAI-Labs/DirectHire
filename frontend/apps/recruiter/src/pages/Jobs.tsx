import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Skeleton, useToast } from '@directhire/shared'
import { recruiterService, companyService } from '@directhire/shared/services'
import { Briefcase, MapPin, Plus, DollarSign } from 'lucide-react'

const STATUS_COLORS: Record<string, 'success' | 'default' | 'secondary' | 'primary'> = {
  OPEN: 'success',
  CLOSED: 'default',
  DRAFT: 'secondary',
}

const ROLE_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
}

const REMOTE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'Onsite',
}

export const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([])
  const [companies, setCompanies] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [jobsRes, companiesRes] = await Promise.all([
        recruiterService.listJobs(),
        companyService.listCompanies(),
      ])
      setJobs(jobsRes.data)

      // Build company id -> name map
      const companyMap: Record<string, string> = {}
      companiesRes.data.forEach((c: any) => {
        companyMap[c.id] = c.name
      })
      setCompanies(companyMap)
    } catch (error: any) {
      console.error('Failed to load jobs:', error)
      toast.addToast('Failed to load jobs', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === 'ALL') return true
    return job.status === statusFilter
  })

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified'
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`
    if (min && max) return `${fmt(min)} - ${fmt(max)}`
    if (min) return `From ${fmt(min)}`
    return `Up to ${fmt(max!)}`
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-20" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold text-text">My Jobs</h1>
          <p className="text-text-muted mt-1">Manage your job postings</p>
        </div>
        <Button onClick={() => navigate('/jobs/create')}>
          <Plus size={16} className="mr-2" />
          Create Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['ALL', 'OPEN', 'CLOSED'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === 'ALL' ? 'All Jobs' : status.charAt(0) + status.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {/* Empty State */}
      {filteredJobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Briefcase size={32} />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">
            {statusFilter === 'ALL' ? 'No jobs yet' : `No ${statusFilter.toLowerCase()} jobs`}
          </h3>
          <p className="text-text-muted mb-6 max-w-sm">
            {statusFilter === 'ALL'
              ? 'Create your first job posting to start finding candidates.'
              : `You don't have any ${statusFilter.toLowerCase()} job postings.`}
          </p>
          {statusFilter === 'ALL' && (
            <Button onClick={() => navigate('/jobs/create')}>
              <Plus size={16} className="mr-2" />
              Create Your First Job
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              hover
              className="cursor-pointer p-0"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-text">{job.title}</h3>
                    <p className="text-sm text-text-muted mt-0.5">
                      {companies[job.company_id] || 'Unknown Company'}
                    </p>
                  </div>
                  <Badge variant={STATUS_COLORS[job.status] || 'default'} size="sm">
                    {job.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {job.location} · {REMOTE_LABELS[job.remote_option] || job.remote_option}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={14} />
                    {formatSalary(job.salary_min, job.salary_max)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} />
                    {ROLE_TYPE_LABELS[job.role_type] || job.role_type}
                  </span>
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {job.skills.slice(0, 5).map((skill: string) => (
                      <Badge key={skill} variant="default" size="sm">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 5 && (
                      <Badge variant="default" size="sm">+{job.skills.length - 5}</Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-text-subdued">
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs text-primary font-medium hover:underline">View Candidates →</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}