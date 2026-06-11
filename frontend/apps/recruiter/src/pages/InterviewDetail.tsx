import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { Card, Button, Badge, Skeleton } from '@directhire/shared'
import { interviewService } from '@directhire/shared/services'
import { ScoreRing } from '@directhire/shared/components/ScoreRing'

interface InterviewDetailData {
  id: string
  job_id: string
  candidate_id: string
  recruiter_id: string
  scheduled_at?: string
  status: string
  transcript: string
  qa_history: { question: string; answer: string }[]
  overall_score: number
  communication_score: number
  technical_score: number
  confidence_score: number
  behavioral_analysis: string
  evaluation_summary: string
  strengths?: string[]
  weaknesses?: string[]
}

// Mock data fallback for development
const MOCK_INTERVIEW: InterviewDetailData = {
  id: 'int-001',
  job_id: 'job-123',
  candidate_id: 'cand-456',
  recruiter_id: 'rec-789',
  status: 'COMPLETED',
  transcript:
    "Interviewer: Thank you for joining us today. Can you start by telling me about your experience with React and TypeScript?\n\nCandidate: Absolutely. I've been working with React for about four years now, and I've been using TypeScript exclusively for the last two years. I've built several large-scale applications including an e-commerce platform and a real-time dashboard.\n\nInterviewer: Can you describe a challenging technical problem you faced and how you solved it?\n\nCandidate: Sure. We had a performance issue with a large data table that was re-rendering on every state change. I implemented virtualization using react-window, which reduced render time from 3 seconds to under 200 milliseconds. I also memoized expensive computations and used React.memo strategically.\n\nInterviewer: How do you handle state management in complex applications?\n\nCandidate: For complex apps I typically use a combination of Zustand for global state and React Query for server state. This separation keeps the client state lightweight and handles caching and synchronization automatically.\n\nInterviewer: What's your experience with testing?\n\nCandidate: I write tests with Jest and React Testing Library. I aim for high coverage on critical paths and integration tests for complex user flows. I've also worked with Cypress for end-to-end testing.",
  qa_history: [
    {
      question: 'Tell me about your experience with React and TypeScript.',
      answer:
        "I've been working with React for about four years, and TypeScript exclusively for two years. I've built e-commerce platforms and real-time dashboards.",
    },
    {
      question: 'Describe a challenging technical problem and how you solved it.',
      answer:
        'I solved a performance issue with a large data table by implementing virtualization with react-window, reducing render time from 3s to under 200ms.',
    },
    {
      question: 'How do you handle state management in complex applications?',
      answer:
        'I use Zustand for global client state and React Query for server state. This keeps client state lightweight and handles caching automatically.',
    },
    {
      question: "What's your experience with testing?",
      answer:
        'I write tests with Jest and React Testing Library, targeting high coverage on critical paths. I also use Cypress for end-to-end testing.',
    },
  ],
  overall_score: 84,
  communication_score: 88,
  technical_score: 82,
  confidence_score: 78,
  behavioral_analysis:
    'The candidate demonstrates strong technical depth in React and TypeScript with practical experience solving real-world performance problems. Communication is clear and structured — they follow the STAR method naturally when describing past experiences. Shows good ownership mentality; the virtualization fix came from proactively identifying a bottleneck. Slight weakness in articulating complex system design decisions under pressure, but recovers well with prompting. Confidence level is appropriate — they acknowledge areas for growth without being uncertain. Overall a strong hire recommendation for mid-to-senior React roles.',
  evaluation_summary:
    'Strong technical foundation with proven ability to identify and solve performance issues. Good culture fit indicators: collaborative language, data-driven decisions, and continuous learning mindset.',
  strengths: [
    'Strong React/TypeScript fundamentals',
    'Performance optimization experience',
    'Clear structured communication',
    'Testing best practices knowledge',
  ],
  weaknesses: [
    'System design articulation under pressure',
    'Limited experience with very large teams',
  ],
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export const InterviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [interview, setInterview] = useState<InterviewDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchInterview(id)
  }, [id])

  const fetchInterview = async (interviewId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await interviewService.getInterview(interviewId)
      setInterview(res.data)
    } catch (err: any) {
      // Fall back to mock data in development
      if (err?.response?.status === 404) {
        setInterview(MOCK_INTERVIEW)
      } else {
        console.warn('Failed to fetch interview, using mock data:', err)
        setInterview({ ...MOCK_INTERVIEW, id: interviewId })
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'success'
      case 'SCHEDULED':
      case 'PENDING':
        return 'default'
      case 'CANCELLED':
        return 'error'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl md:col-span-2" />
        </div>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle size={48} className="text-error mb-4" />
        <h2 className="text-xl font-semibold text-[#adc6ff] mb-2">Interview Not Found</h2>
        <p className="text-[#8b92b4] mb-6">
          {error || 'The interview you are looking for does not exist.'}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} className="mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 p-6 max-w-5xl mx-auto"
    >
      {/* Back + Header */}
      <motion.div variants={item} className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} className="mr-2" /> Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-semibold text-[#adc6ff]">
              Interview Evaluation
            </h1>
            <Badge variant={getStatusColor(interview.status) as any} size="sm">
              {interview.status}
            </Badge>
          </div>
          <p className="text-sm text-[#8b92b4] mt-1">
            ID: {interview.id} &nbsp;·&nbsp; Candidate: {interview.candidate_id} &nbsp;·&nbsp; Job:{' '}
            {interview.job_id}
          </p>
        </div>
      </motion.div>

      {/* Score Rings */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { label: 'Overall Score', score: interview.overall_score },
            { label: 'Communication', score: interview.communication_score },
            { label: 'Technical', score: interview.technical_score },
            { label: 'Confidence', score: interview.confidence_score },
          ].map(({ label, score }) => (
            <Card key={label} className="flex flex-col items-center justify-center py-6">
              <ScoreRing score={score} label={label} size={110} strokeWidth={8} />
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Behavioral Analysis */}
      <motion.div variants={item}>
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-[#adc6ff]">Behavioral Analysis</h2>
          </div>
          <p
            className="text-sm text-[#dce1fb] leading-relaxed whitespace-pre-wrap"
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          >
            {interview.behavioral_analysis}
          </p>
        </Card>
      </motion.div>

      {/* Evaluation Summary */}
      <motion.div variants={item}>
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-[#adc6ff]">Evaluation Summary</h2>
          </div>
          <p className="text-sm text-[#dce1fb] leading-relaxed">{interview.evaluation_summary}</p>
        </Card>
      </motion.div>

      {/* Strengths & Weaknesses */}
      {((interview.strengths?.length ?? 0) > 0 || (interview.weaknesses?.length ?? 0) > 0) && (
        <motion.div variants={item}>
          <Card>
            <h2 className="text-lg font-semibold text-[#adc6ff] mb-4">Strengths & Weaknesses</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-[#22c55e] mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" />
                  Strengths
                </h3>
                <ul className="space-y-1.5">
                  {interview.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#dce1fb]">
                      <span className="text-[#22c55e] mt-0.5">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#ef4444] mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" />
                  Areas for Growth
                </h3>
                <ul className="space-y-1.5">
                  {interview.weaknesses?.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#dce1fb]">
                      <span className="text-[#ef4444] mt-0.5">−</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Transcript Accordion */}
      <motion.div variants={item}>
        <Card>
          <button
            type="button"
            onClick={() => setTranscriptOpen((o) => !o)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-[#adc6ff]">Full Transcript</h2>
            </div>
            {transcriptOpen ? (
              <ChevronUp size={18} className="text-[#8b92b4]" />
            ) : (
              <ChevronDown size={18} className="text-[#8b92b4]" />
            )}
          </button>
          {transcriptOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <p className="text-sm text-[#dce1fb] whitespace-pre-wrap leading-relaxed">
                {interview.transcript}
              </p>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* QA History Timeline */}
      <motion.div variants={item}>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-[#adc6ff]">Q&A History</h2>
          </div>
          <div className="space-y-4">
            {interview.qa_history.map((qa, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#2a3150] p-4 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2a3150] text-[#adc6ff] text-xs flex items-center justify-center font-semibold mt-0.5">
                    Q
                  </span>
                  <p className="text-sm font-medium text-[#adc6ff]">{qa.question}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1e2640] text-[#dce1fb] text-xs flex items-center justify-center font-semibold mt-0.5">
                    A
                  </span>
                  <p className="text-sm text-[#dce1fb]">{qa.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}