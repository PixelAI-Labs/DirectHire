import React, { useState, useEffect } from 'react'
import { Card, Badge, Skeleton } from '@directhire/shared'
import { useReveal, useReducedMotion, fadeUp, staggerFast } from '@directhire/shared/motion'
import { motion } from 'framer-motion'
import { analyticsService } from '@directhire/shared/services'
import type { DashboardResponse } from '@directhire/shared'
import {
  Briefcase, Users, Calendar, Mail, TrendingUp, CheckCircle, RefreshCw, Send,
  FileText, ChevronRight,
} from 'lucide-react'
import { cn } from '@directhire/shared'

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; trend?: string; up?: boolean }> = ({
  icon, label, value, trend, up,
}) => (
  <Card hover className="py-4 text-center">
    <div className="flex justify-center mb-2 text-primary">{icon}</div>
    <p className="text-3xl font-display font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
      {value}
    </p>
    <p className="text-sm text-text-muted mt-1">{label}</p>
    {trend && (
      <div className={cn('flex items-center justify-center gap-1 mt-2 text-xs', up ? 'text-success' : 'text-error')}>
        <TrendingUp size={12} className={up ? '' : 'rotate-180'} /><span>{trend}</span>
      </div>
    )}
  </Card>
)

// ── Pipeline Stage ─────────────────────────────────────────────────────────────
const Stage: React.FC<{ label: string; count: number; color: string; active?: boolean }> = ({
  label, count, color, active,
}) => (
  <div className={cn('flex-1 text-center py-4 rounded-xl border bg-surface transition-colors',
    active ? 'border-primary/30 bg-primary/5' : 'border-border')}>
    <p className={cn('text-2xl font-display font-semibold', color)}>{count}</p>
    <p className="text-xs text-text-muted mt-1">{label}</p>
  </div>
)

// ── Candidate Row ──────────────────────────────────────────────────────────────
const CandidateRow: React.FC<{
  i: string; n: string; r: string; s: number; sk: string[]; st: string;
  v: 'primary' | 'secondary' | 'success' | 'default'; ai: number;
}> = ({ i, n, r, s, sk, st, v, ai }) => (
  <tr className="border-b border-border hover:bg-surface-raised transition-colors">
    <td className="py-3 px-3"><div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">{i}</div></td>
    <td className="py-3 px-3"><p className="text-text font-semibold">{n}</p><p className="text-xs text-text-muted">{r}</p></td>
    <td className="py-3 px-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-[60px] h-1.5 bg-surface-raised rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${s}%` }} />
        </div>
        <span className="text-xs text-text-muted">{s}%</span>
      </div>
    </td>
    <td className="py-3 px-3"><div className="flex gap-1 flex-wrap">{sk.map(skill => <Badge key={skill} size="sm" variant="default">{skill}</Badge>)}</div></td>
    <td className="py-3 px-3"><Badge variant={v} size="sm">{st}</Badge></td>
    <td className="py-3 px-3 text-sm text-text-muted">{ai}/10</td>
  </tr>
)

// ── Velocity Bar ───────────────────────────────────────────────────────────────
const VBar: React.FC<{ a: number; int: number; h: number; l: string }> = ({ a, int, h, l }) => (
  <div className="flex items-end gap-2">
    <div className="flex-1 flex items-end h-24 gap-0.5">
      <div className="w-1/3 bg-background-elevated rounded-t" style={{ height: '100%' }} />
      <div className="w-1/3 bg-primary/30 rounded-t" style={{ height: `${(int / a) * 100}%` }} />
      <div className="w-1/3 bg-success/40 rounded-t" style={{ height: `${(h / a) * 100}%` }} />
    </div>
    <span className="text-xs text-text-subdued whitespace-nowrap">{l}</span>
  </div>
)

// ── Dashboard ──────────────────────────────────────────────────────────────────

const EMPTY_DASHBOARD: DashboardResponse = {
  open_jobs: 0,
  total_candidates: 0,
  candidates_in_pipeline: 0,
  interviews_this_week: 0,
  offers_sent: 0,
  pipeline_stages: {
    applied: 0,
    screening: 0,
    assessment: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    hired: 0,
  },
  top_candidates: [],
}

export const Dashboard: React.FC = () => {
  const reduced = useReducedMotion()
  const r1 = useReveal(); const r2 = useReveal(); const r3 = useReveal(); const r4 = useReveal()
  const mv = reduced ? {} : { initial: 'hidden', animate: 'visible', variants: fadeUp }

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardResponse>(EMPTY_DASHBOARD)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const res = await analyticsService.getDashboard()
      // axios wraps the response — payload is on `.data`
      const payload = (res as any).data ?? res
      setData(payload as DashboardResponse)
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error)
      setData(EMPTY_DASHBOARD)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { icon: <Briefcase size={20} />, label: 'Open Positions', value: loading ? '...' : String(data.open_jobs) },
    { icon: <Users size={20} />, label: 'Candidates in Pipeline', value: loading ? '...' : String(data.candidates_in_pipeline) },
    { icon: <Calendar size={20} />, label: 'Interviews This Week', value: loading ? '...' : String(data.interviews_this_week) },
    { icon: <Mail size={20} />, label: 'Offers Sent', value: loading ? '...' : String(data.offers_sent) },
  ]

  const aiActions = [
    { icon: <CheckCircle size={16} />, color: 'text-primary', desc: 'AI screening complete', time: 'Just now' },
    { icon: <RefreshCw size={16} />, color: 'text-secondary', desc: 'Match scores updated', time: 'Recently' },
    { icon: <Send size={16} />, color: 'text-success', desc: 'Ready to send offers', time: '' },
    { icon: <FileText size={16} />, color: 'text-primary', desc: 'Candidate profiles analyzed', time: '' },
  ]

  const candidates = (data.top_candidates || []).map((c) => ({
    i: (c.full_name || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??',
    n: c.full_name || 'Unknown',
    r: 'Candidate',
    s: Math.round(c.overall_score || 0),
    sk: (c.skills || []).slice(0, 3),
    st: c.application_status || 'Applied',
    v: 'primary' as const,
    ai: parseFloat(((c.overall_score || 0) / 10).toFixed(1)),
  }))

  const matchScores = (data.top_candidates || []).map((c) => ({
    name: c.full_name || 'Unknown',
    s: Math.round(c.overall_score || 0),
  }))

  const skeletonScores = [1, 2, 3, 4, 5].map((i) => (
    <div key={i} className="flex items-center gap-3">
      <Skeleton className="h-4 w-24" />
      <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
        <Skeleton className="h-full rounded-full" width={`${60 + i * 5}%`} />
      </div>
      <Skeleton className="h-4 w-8" />
    </div>
  ))

  const scoreBars = matchScores.map(({ name, s }) => (
    <div key={name} className="flex items-center gap-3">
      <span className="text-xs text-text-muted w-24 truncate">{name}</span>
      <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${s}%` }} />
      </div>
      <span className="text-xs text-text-muted w-8 text-right">{s}%</span>
    </div>
  ))

  const pCounts = data.pipeline_stages

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div {...mv}>
        <h1 className="text-4xl font-display font-semibold bg-gradient-to-r from-text to-primary bg-clip-text text-transparent">
          Hiring Dashboard
        </h1>
        <p className="text-text-muted text-lg mt-1">AI-powered recruiting pipeline overview</p>
      </motion.div>

      {/* Row 1: Stats */}
      <div ref={r1.ref} className={r1.isVisible || reduced ? '' : 'opacity-0'}>
        {r1.isVisible && (
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((st, i) => (
              <motion.div key={i} variants={staggerFast} initial="hidden" animate="visible">
                <motion.div variants={fadeUp}>
                  <StatCard {...st} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Row 2: Pipeline + AI Actions */}
      <div ref={r2.ref} className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {r2.isVisible && (
          <motion.div {...mv}>
            <Card>
              <h2 className="text-xl font-display font-semibold text-text mb-4">Hiring Pipeline</h2>
              <div className="flex items-center">
                <Stage label="Applied" count={loading ? 0 : pCounts.applied} color="text-primary" />
                <div className="px-1 flex items-center"><ChevronRight size={16} className="text-border" /></div>
                <Stage label="Screened" count={loading ? 0 : pCounts.screening} color="text-secondary" />
                <div className="px-1 flex items-center"><ChevronRight size={16} className="text-border" /></div>
                <Stage label="Interview" count={loading ? 0 : pCounts.interview} color="text-primary" />
                <div className="px-1 flex items-center"><ChevronRight size={16} className="text-border" /></div>
                <Stage label="Offer" count={loading ? 0 : pCounts.offer} color="text-success" />
                <div className="px-1 flex items-center"><ChevronRight size={16} className="text-border" /></div>
                <Stage label="Hired" count={loading ? 0 : pCounts.hired} active color="text-success" />
              </div>
            </Card>
          </motion.div>
        )}
        {r2.isVisible && (
          <motion.div {...mv}>
            <Card>
              <h2 className="text-xl font-display font-semibold text-text mb-4">AI Actions Today</h2>
              {aiActions.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className={a.color}>{a.icon}</div>
                  <p className="text-sm text-text flex-1">{a.desc}</p>
                  {a.time && <span className="text-xs text-text-subdued">{a.time}</span>}
                </div>
              ))}
            </Card>
          </motion.div>
        )}
      </div>

      {/* Row 3: Candidates */}
      <div ref={r3.ref}>
        {r3.isVisible && (
          <motion.div {...mv}>
            <Card padding="default">
              <h2 className="text-xl font-display font-semibold text-text mb-4">Top Candidates</h2>
              {candidates.length === 0 && !loading ? (
                <p className="text-text-muted text-sm py-4 text-center">No candidates yet. Post jobs to start seeing matches.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-text-muted border-b border-border">
                      <th className="pb-2 px-3">Candidate</th>
                      <th className="pb-2 px-3">Match</th>
                      <th className="pb-2 px-3">Skills</th>
                      <th className="pb-2 px-3">Status</th>
                      <th className="pb-2 px-3">AI Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1, 2, 3].map((i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-3 px-3"><Skeleton className="h-9 w-9 rounded-full" /></td>
                          <td className="py-3 px-3"><Skeleton className="h-4 w-24" /></td>
                          <td className="py-3 px-3"><div className="flex gap-1"><Skeleton className="h-5 w-12" /><Skeleton className="h-5 w-12" /></div></td>
                          <td className="py-3 px-3"><Skeleton className="h-5 w-16" /></td>
                          <td className="py-3 px-3"><Skeleton className="h-4 w-8" /></td>
                        </tr>
                      ))
                    ) : (
                      candidates.map(c => <CandidateRow key={c.n} {...c} />)
                    )}
                  </tbody>
                </table>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      {/* Row 4: Analytics */}
      <div ref={r4.ref} className="grid gap-6 md:grid-cols-2">
        {r4.isVisible && (
          <motion.div {...mv}>
            <Card>
              <h2 className="text-xl font-display font-semibold text-text mb-4">Pipeline Velocity</h2>
              <div className="flex gap-6 justify-between">
                <VBar a={28} int={12} h={5} l="Week 1" /><VBar a={35} int={18} h={8} l="Week 2" /><VBar a={42} int={22} h={11} l="Week 3" /><VBar a={50} int={24} h={12} l="Week 4" />
              </div>
              <div className="flex gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-background-elevated" /><span className="text-xs text-text-muted">Applied</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary/30" /><span className="text-xs text-text-muted">Interview</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-success/40" /><span className="text-xs text-text-muted">Hired</span></div>
              </div>
            </Card>
          </motion.div>
        )}
        {r4.isVisible && (
          <motion.div {...mv}>
            <Card>
              <h2 className="text-xl font-display font-semibold text-text mb-4">AI Match Scores</h2>
              {matchScores.length === 0 && !loading ? (
                <p className="text-text-muted text-sm py-4 text-center">No match data yet.</p>
              ) : (
                <div className="space-y-3">
                  {loading ? skeletonScores : scoreBars}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
