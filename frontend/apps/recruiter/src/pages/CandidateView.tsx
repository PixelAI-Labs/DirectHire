import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Skeleton, useToast } from '@directhire/shared'
import { candidateService, recruiterService } from '@directhire/shared/services'
import { ArrowLeft, Mail, User } from 'lucide-react'

export const CandidateView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [profile, setProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchData(id)
  }, [id])

  const fetchData = async (candidateId: string) => {
    setLoading(true)
    try {
      // Load all rankings to find this candidate's scores
      const rankingsRes = await recruiterService.getRankings()
      const candidateRankings = rankingsRes.data.filter((r: any) => r.candidate_id === candidateId)

      // Get applications from candidate service
      const profileData = candidateRankings.length > 0 ? candidateRankings[0] : {}
      setProfile({
        user_id: candidateId,
        full_name: profileData.full_name || 'Candidate',
        email: profileData.email || '',
        skills: profileData.skills || [],
        resume_score: profileData.resume_score,
        assessment_score: profileData.assessment_score,
        match_score: profileData.match_score,
        overall_score: profileData.overall_score,
        application_status: profileData.application_status,
        rankings: candidateRankings,
      })

      // Build applications from rankings
      const apps = candidateRankings.map((r: any) => ({
        job_id: r.job_id,
        status: r.application_status,
        match_score: r.match_score,
        overall_score: r.overall_score,
      }))
      setApplications(apps)
    } catch (error: any) {
      console.error('Failed to load candidate:', error)
      // Try to get basic profile from candidate service
      try {
        const profileRes = await candidateService.getProfile()
        setProfile({
          user_id: candidateId,
          full_name: profileRes.data?.full_name || 'Candidate',
          email: profileRes.data?.email || '',
          skills: profileRes.data?.skills || [],
        })
      } catch {
        toast.addToast('Failed to load candidate details', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score?: number) => {
    if (score == null) return 'text-text-muted'
    if (score >= 85) return 'text-success'
    if (score >= 70) return 'text-primary'
    if (score >= 50) return 'text-secondary'
    return 'text-error'
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl md:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} className="mr-2" /> Back
      </Button>

      {/* Header Card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            {profile?.full_name
              ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              : <User size={32} />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-semibold text-text">{profile?.full_name || 'Candidate'}</h1>
            {profile?.email && (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
              >
                <Mail size={14} /> {profile.email}
              </a>
            )}
            {profile?.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.skills.map((skill: string) => (
                  <Badge key={skill} variant="default" size="sm">{skill}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* AI Scores */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Overall Score', score: profile?.overall_score },
          { label: 'Match Score', score: profile?.match_score },
          { label: 'Resume Score', score: profile?.resume_score },
          { label: 'Assessment Score', score: profile?.assessment_score },
        ].map(({ label, score }) => (
          <Card key={label} className="text-center py-4">
            <div className={`text-2xl font-display font-semibold ${getScoreColor(score)}`}>
              {score != null ? `${score.toFixed(1)}%` : '-'}
            </div>
            <p className="text-sm text-text-muted mt-1">{label}</p>
            {score != null && (
              <div className="mt-2 mx-4 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{ width: `${score}%` }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Applications */}
      <Card>
        <h2 className="text-xl font-display font-semibold text-text mb-4">Applications</h2>
        {applications.length === 0 ? (
          <p className="text-text-muted text-sm py-4">No applications found.</p>
        ) : (
          <div className="space-y-3">
            {applications.map((app, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <div>
                  <p className="text-text font-medium">Job ID: {app.job_id}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Match: {app.match_score?.toFixed(1) || '-'}% · Overall: {app.overall_score?.toFixed(1) || '-'}%
                  </p>
                </div>
                <Badge variant="default" size="sm">{app.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}