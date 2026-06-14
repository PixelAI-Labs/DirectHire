import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// ─── Mocks (must be declared before importing the component under test) ──

// 1. analyticsService — return fixture data instead of hitting the network
vi.mock('@directhire/shared/services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@directhire/shared/services')>()
  return {
    ...actual,
    analyticsService: {
      getDashboard: vi.fn(),
    },
  }
})

// 2. Motion hooks — make every reveal section visible immediately
vi.mock('@directhire/shared/motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@directhire/shared/motion')>()
  return {
    ...actual,
    useReveal: () => ({ ref: () => { }, isVisible: true }),
    useReducedMotion: () => false,
  }
})

import { Dashboard } from '../Dashboard'
import { analyticsService } from '@directhire/shared/services'
import type { DashboardResponse } from '@directhire/shared'

// ─── Fixture data ─────────────────────────────────────────────────────

const FIXTURE: DashboardResponse = {
  open_jobs: 3,
  total_candidates: 12,
  candidates_in_pipeline: 9,
  interviews_this_week: 4,
  offers_sent: 2,
  pipeline_stages: {
    applied: 5,
    screening: 1,
    assessment: 1,
    interview: 2,
    offer: 1,
    rejected: 1,
    hired: 1,
  },
  top_candidates: [
    {
      candidate_id: 'cand-1',
      full_name: 'Ada Lovelace',
      overall_score: 92,
      match_score: 88,
      application_status: 'INTERVIEW',
      skills: ['Python', 'React', 'FastAPI'],
    },
    {
      candidate_id: 'cand-2',
      full_name: 'Grace Hopper',
      overall_score: 81,
      match_score: 79,
      application_status: 'OFFER',
      skills: ['Python', 'Go'],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
    // axios wraps the response; the component reads `res.data`.
    ; (analyticsService.getDashboard as any).mockResolvedValue({ data: FIXTURE })
})

// ─── Tests ────────────────────────────────────────────────────────────

describe('Recruiter Dashboard (rewired to /api/analytics/dashboard)', () => {
  it('calls analyticsService.getDashboard exactly once on mount', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(analyticsService.getDashboard).toHaveBeenCalledTimes(1)
    })
  })

  it('renders server-supplied stat counts in the stat cards', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1) // open_jobs
      expect(screen.getAllByText('9').length).toBeGreaterThanOrEqual(1) // candidates_in_pipeline
      expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1) // interviews_this_week
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1) // offers_sent
    })
    expect(screen.getByText('Open Positions')).toBeInTheDocument()
    expect(screen.getByText('Candidates in Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Interviews This Week')).toBeInTheDocument()
    expect(screen.getByText('Offers Sent')).toBeInTheDocument()
  })

  it('renders pipeline stage counts from server pipeline_stages', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getAllByText('Applied').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Screened').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Interview').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Offer').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Hired').length).toBeGreaterThanOrEqual(1)
    })
    // Multiple elements may share a number; assert pipeline counts appear via
    // getAllByText. Counts: applied=5, screening=1, assessment=1, interview=2,
    // offer=1, rejected=1, hired=1
    const fives = screen.getAllByText('5')
    expect(fives.length).toBeGreaterThanOrEqual(1)
    const ones = screen.getAllByText('1')
    expect(ones.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the top-candidates table from server data', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Grace Hopper').length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getAllByText('92%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('81%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('INTERVIEW').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('OFFER').length).toBeGreaterThanOrEqual(1)
  })

  it('renders AI Match Scores section with server data', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText('AI Match Scores')).toBeInTheDocument()
    })
    // The match-scores panel also shows Ada and Grace
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Grace Hopper').length).toBeGreaterThanOrEqual(1)
  })

  it('falls back to empty state when the API call fails', async () => {
    ; (analyticsService.getDashboard as any).mockRejectedValueOnce(new Error('boom'))
    render(<Dashboard />)
    await waitFor(() => {
      // No candidates → empty-state message appears
      expect(
        screen.getByText('No candidates yet. Post jobs to start seeing matches.'),
      ).toBeInTheDocument()
    })
    // All stat counters are 0
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the empty-state message when the response has no candidates', async () => {
    ; (analyticsService.getDashboard as any).mockResolvedValueOnce({
      data: { ...FIXTURE, top_candidates: [], candidates_in_pipeline: 0 },
    })
    render(<Dashboard />)
    await waitFor(() => {
      expect(
        screen.getByText('No candidates yet. Post jobs to start seeing matches.'),
      ).toBeInTheDocument()
    })
  })
})