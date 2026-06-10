import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Skeleton, Modal, Input, TextArea, useToast } from '@directhire/shared'
import { recruiterService } from '@directhire/shared/services'
import { ArrowLeft, Edit2, Send, MapPin, DollarSign, Briefcase } from 'lucide-react'

const STATUS_BADGE_VARIANTS: Record<string, 'primary' | 'secondary' | 'success' | 'default'> = {
  APPLIED: 'default',
  SCREENING: 'secondary',
  ASSESSMENT: 'secondary',
  INTERVIEW: 'primary',
  OFFER: 'success',
  REJECTED: 'default',
  HIRED: 'success',
}

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [job, setJob] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<'overall_score' | 'match_score' | 'resume_score'>('overall_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [offerModal, setOfferModal] = useState<{ open: boolean; candidateId: string; candidateName: string }>({
    open: false,
    candidateId: '',
    candidateName: '',
  })
  const [offerData, setOfferData] = useState({ salary_offered: '', benefits: '', message: '' })
  const [submittingOffer, setSubmittingOffer] = useState(false)

  useEffect(() => {
    if (id) fetchData(id)
  }, [id])

  const fetchData = async (jobId: string) => {
    setLoading(true)
    try {
      const [jobRes, candidatesRes] = await Promise.all([
        recruiterService.listJobs(),
        recruiterService.getJobCandidates(jobId),
      ])
      const foundJob = jobRes.data.find((j: any) => j.id === jobId)
      setJob(foundJob || null)
      setCandidates(candidatesRes.data || [])
    } catch (error: any) {
      console.error('Failed to load job:', error)
      toast.addToast('Failed to load job details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedCandidates = [...candidates].sort((a, b) => {
    const aVal = a[sortKey] ?? 0
    const bVal = b[sortKey] ?? 0
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerData.salary_offered) {
      toast.addToast('Please enter a salary', 'error')
      return
    }
    setSubmittingOffer(true)
    try {
      await recruiterService.createOffer({
        job_id: id,
        candidate_id: offerModal.candidateId,
        salary_offered: parseFloat(offerData.salary_offered),
        benefits: offerData.benefits,
        message: offerData.message,
      })
      toast.addToast('Offer sent successfully!', 'success')
      setOfferModal({ open: false, candidateId: '', candidateName: '' })
      setOfferData({ salary_offered: '', benefits: '', message: '' })
    } catch (error: any) {
      console.error('Failed to send offer:', error)
      toast.addToast('Failed to send offer', 'error')
    } finally {
      setSubmittingOffer(false)
    }
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified'
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`
    if (min && max) return `${fmt(min)} - ${fmt(max)}`
    if (min) return `From ${fmt(min)}`
    return `Up to ${fmt(max!)}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success'
    if (score >= 70) return 'text-primary'
    if (score >= 50) return 'text-secondary'
    return 'text-error'
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-muted mb-4">Job not found</p>
        <Button variant="outline" onClick={() => navigate('/jobs')}>Back to Jobs</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Back + Header */}
      <Button variant="outline" size="sm" onClick={() => navigate('/jobs')}>
        <ArrowLeft size={14} className="mr-2" /> Back to Jobs
      </Button>

      {/* Job Info Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-text">{job.title}</h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-muted">
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
              <span className="flex items-center gap-1.5">
                <DollarSign size={14} /> {formatSalary(job.salary_min, job.salary_max)}
              </span>
              <span className="flex items-center gap-1.5"><Briefcase size={14} /> {job.role_type}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={job.status === 'OPEN' ? 'success' : 'default'}>{job.status}</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${id}/edit`)}>
              <Edit2 size={14} className="mr-1.5" /> Edit
            </Button>
          </div>
        </div>
        {job.description && (
          <p className="text-sm text-text-muted mt-4 whitespace-pre-wrap">{job.description}</p>
        )}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {job.skills.map((skill: string) => (
              <Badge key={skill} variant="default" size="sm">{skill}</Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Candidates Table */}
      <Card padding="default">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-text">
            Candidates ({candidates.length})
          </h2>
        </div>

        {candidates.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p>No candidates have applied to this job yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-border">
                  <th className="pb-3 px-2">Candidate</th>
                  <th
                    className="pb-3 px-2 cursor-pointer select-none hover:text-primary"
                    onClick={() => handleSort('match_score')}
                  >
                    Match {sortKey === 'match_score' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="pb-3 px-2 cursor-pointer select-none hover:text-primary"
                    onClick={() => handleSort('resume_score')}
                  >
                    Resume {sortKey === 'resume_score' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="pb-3 px-2 cursor-pointer select-none hover:text-primary"
                    onClick={() => handleSort('overall_score')}
                  >
                    Overall {sortKey === 'overall_score' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="pb-3 px-2">Skills</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCandidates.map((candidate: any) => (
                  <tr
                    key={candidate.candidate_id}
                    className="border-b border-border hover:bg-surface-raised transition-colors"
                  >
                    <td className="py-3 px-2">
                      <button
                        className="text-left hover:text-primary transition-colors"
                        onClick={() => navigate(`/candidates/${candidate.candidate_id}`)}
                      >
                        <p className="text-text font-semibold">{candidate.full_name}</p>
                        <p className="text-xs text-text-muted">{candidate.email}</p>
                      </button>
                    </td>
                    <td className="py-3 px-2">
                      <span className={getScoreColor(candidate.match_score || 0)}>
                        {candidate.match_score != null ? `${candidate.match_score.toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={getScoreColor(candidate.resume_score || 0)}>
                        {candidate.resume_score != null ? `${candidate.resume_score.toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[60px] h-1.5 bg-surface-raised rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                            style={{ width: `${candidate.overall_score || 0}%` }}
                          />
                        </div>
                        <span className={getScoreColor(candidate.overall_score || 0)}>
                          {candidate.overall_score != null ? `${candidate.overall_score.toFixed(1)}%` : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1">
                        {(candidate.skills || []).slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="default" size="sm">{skill}</Badge>
                        ))}
                        {(candidate.skills || []).length > 3 && (
                          <Badge variant="default" size="sm">+{candidate.skills.length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={STATUS_BADGE_VARIANTS[candidate.application_status] || 'default'} size="sm">
                        {candidate.application_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setOfferModal({
                            open: true,
                            candidateId: candidate.candidate_id,
                            candidateName: candidate.full_name,
                          })
                        }
                      >
                        <Send size={12} className="mr-1" /> Offer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Send Offer Modal */}
      <Modal
        isOpen={offerModal.open}
        onClose={() => {
          setOfferModal({ open: false, candidateId: '', candidateName: '' })
          setOfferData({ salary_offered: '', benefits: '', message: '' })
        }}
        title={`Send Offer to ${offerModal.candidateName}`}
        size="md"
      >
        <form onSubmit={handleSendOffer} className="space-y-4">
          <Input
            label="Salary Offered ($) *"
            name="salary_offered"
            type="number"
            placeholder="95000"
            value={offerData.salary_offered}
            onChange={(e) => setOfferData((prev) => ({ ...prev, salary_offered: e.target.value }))}
          />
          <TextArea
            label="Benefits"
            name="benefits"
            placeholder="Health insurance, 401k match, unlimited PTO..."
            value={offerData.benefits}
            onChange={(e) => setOfferData((prev) => ({ ...prev, benefits: e.target.value }))}
            rows={3}
          />
          <TextArea
            label="Personal Message"
            name="message"
            placeholder="Add a personal note to the candidate..."
            value={offerData.message}
            onChange={(e) => setOfferData((prev) => ({ ...prev, message: e.target.value }))}
            rows={3}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOfferModal({ open: false, candidateId: '', candidateName: '' })}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submittingOffer}>
              <Send size={14} className="mr-2" /> Send Offer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}