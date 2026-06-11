import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2,
  Loader2,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Mic,
} from 'lucide-react'
import { Card, Button, interviewService } from '@directhire/shared'
import { VoiceRecorder } from '../components/VoiceRecorder'

interface QAItem {
  id: string
  question: string
  transcript: string
  timestamp: Date
}

type Phase = 'intro' | 'question' | 'recording' | 'processing' | 'results'

interface EvaluationData {
  overall_score: number
  communication_score: number
  technical_score: number
  confidence_score: number
  behavioral_analysis: string
  strengths: string[]
  weaknesses: string[]
  summary: string
  transcript: string
}

const phaseVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 1.0
  u.pitch = 1.0
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  return '#ef4444'
}

export const MockInterview: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(
    "Tell me about yourself and your background in software engineering."
  )
  const [qaHistory, setQaHistory] = useState<QAItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [interviewData, setInterviewData] = useState<any>(null)

  const questionCount = qaHistory.length + 1
  const maxQuestions = 6

  useEffect(() => {
    if (!interviewId) return
    const load = async () => {
      try {
        const res = await interviewService.getInterview(interviewId)
        setInterviewData(res.data)
      } catch {
        // silent fail — proceed with mock state
      }
    }
    load()
  }, [interviewId])

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const handleStart = useCallback(() => {
    setPhase('question')
    setTimeout(() => speak(currentQuestion), 400)
  }, [currentQuestion])

  const handleAudioReady = useCallback(
    async (blob: Blob) => {
      if (!interviewId) return
      setPhase('processing')
      setIsLoading(true)
      setError(null)

      try {
        const tRes = await interviewService.transcribe(blob)
        const transcript = tRes.data?.transcript || ''

        const newItem: QAItem = {
          id: Date.now().toString(),
          question: currentQuestion,
          transcript,
          timestamp: new Date(),
        }

        await interviewService.submitAnswer(interviewId, {
          question: currentQuestion,
          answer: transcript,
        })

        const updatedHistory = [...qaHistory, newItem]
        setQaHistory(updatedHistory)

        if (updatedHistory.length >= maxQuestions) {
          setCurrentQuestion('')
          setPhase('question')
          setIsLoading(false)
          return
        }

        const qRes = await interviewService.getQuestion(interviewId, {
          previous_qa: updatedHistory.map((q) => ({
            question: q.question,
            answer: q.transcript,
          })),
        })

        const nextQ = qRes.data?.question || 'Can you elaborate on that?'
        setCurrentQuestion(nextQ)
        setPhase('question')
        setTimeout(() => speak(nextQ), 400)
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to process answer. Please try again.')
        setPhase('question')
      } finally {
        setIsLoading(false)
      }
    },
    [interviewId, currentQuestion, qaHistory]
  )

  const handleFinish = useCallback(async () => {
    if (!interviewId) return
    setPhase('processing')
    setIsLoading(true)
    setError(null)

    try {
      const res = await interviewService.evaluate(interviewId)
      setEvaluation(res.data)
      setPhase('results')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Evaluation failed. Please try again.')
      setPhase('question')
    } finally {
      setIsLoading(false)
    }
  }, [interviewId])

  const fullTranscript = qaHistory
    .map(
      (q, i) =>
        `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.transcript}`
    )
    .join('\n\n')

  if (!interviewId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-[#adc6ff] mb-3">No Interview Selected</h2>
        <p className="text-[#8b92b4] mb-6 max-w-md">
          You need an active interview session. Please apply to a job and wait for a recruiter to
          schedule your mock interview.
        </p>
        <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        {phase !== 'intro' && phase !== 'results' && (
          <span className="text-sm text-[#8b92b4]">
            Question {questionCount} of {maxQuestions}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* INTRO */}
        {phase === 'intro' && (
          <motion.div key="intro" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <Card className="text-center py-12 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#4f6df5]/10 flex items-center justify-center">
                <Mic size={32} className="text-[#4f6df5]" />
              </div>
              <h1 className="text-3xl font-bold text-[#adc6ff]">Mock Interview</h1>
              <p className="text-[#8b92b4] max-w-md mx-auto">
                Practice with an AI interviewer. Record your answers with voice and receive
                instant feedback on your performance.
              </p>
              {interviewData?.job_id && (
                <p className="text-sm text-[#8b92b4]">
                  Job: <span className="text-[#dce1fb]">{interviewData.job_id}</span>
                </p>
              )}
              <Button onClick={handleStart}>Start Interview</Button>
            </Card>
          </motion.div>
        )}

        {/* QUESTION */}
        {phase === 'question' && (
          <motion.div key="question" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="space-y-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
              <Card className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#4f6df5]/10 flex items-center justify-center">
                    <span className="text-[#4f6df5] font-bold text-sm">AI</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[#dce1fb] text-base leading-relaxed">{currentQuestion}</p>
                  </div>
                  <button
                    onClick={() => speak(currentQuestion)}
                    className="flex-shrink-0 p-2 rounded-lg bg-[#2a3150] text-[#adc6ff] hover:bg-[#4f6df5]/20 transition-colors"
                    aria-label="Read question aloud"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
              </Card>
            </motion.div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {qaHistory.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#8b92b4]">Your Answers</h3>
                {qaHistory.map((qa, i) => (
                  <motion.div
                    key={qa.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-[#2a3150] bg-[#1e2640] p-4 space-y-2"
                  >
                    <p className="text-xs text-[#adc6ff] font-medium">Q{i + 1}: {qa.question}</p>
                    <p className="text-sm text-[#dce1fb]">{qa.transcript}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {qaHistory.length >= maxQuestions ? (
              <div className="flex justify-center">
                <Button onClick={handleFinish} disabled={isLoading}>
                  {isLoading ? <Loader2 size={18} className="mr-2 animate-spin" /> : null}
                  Finish Interview
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button onClick={() => setPhase('recording')} variant="outline">
                  <Mic size={18} className="mr-2" />
                  Record Answer
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* RECORDING */}
        {phase === 'recording' && (
          <motion.div key="recording" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <VoiceRecorder
              onAudioReady={(blob) => {
                window.speechSynthesis.cancel()
                handleAudioReady(blob)
              }}
            />
            {qaHistory.length > 0 && (
              <p className="text-center text-xs text-[#8b92b4] mt-4">
                Answered {qaHistory.length} of {maxQuestions} questions
              </p>
            )}
          </motion.div>
        )}

        {/* PROCESSING */}
        {phase === 'processing' && (
          <motion.div key="processing" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 size={48} className="text-[#4f6df5] animate-spin" />
            <p className="text-[#adc6ff] font-medium">Processing your answer...</p>
          </motion.div>
        )}

        {/* RESULTS */}
        {phase === 'results' && evaluation && (
          <motion.div key="results" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                <Award size={32} className="text-[#22c55e]" />
              </div>
              <h2 className="text-2xl font-bold text-[#adc6ff]">Interview Complete!</h2>
              <p className="text-[#8b92b4]">Here is your AI-powered evaluation.</p>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Overall', score: evaluation.overall_score },
                { label: 'Communication', score: evaluation.communication_score },
                { label: 'Technical', score: evaluation.technical_score },
                { label: 'Confidence', score: evaluation.confidence_score },
              ].map(({ label, score }) => (
                <Card key={label} className="text-center py-5">
                  <p className="text-3xl font-bold" style={{ color: getScoreColor(score) }}>
                    {score}
                  </p>
                  <p className="text-xs text-[#8b92b4] mt-1">{label}</p>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card>
              <h3 className="text-lg font-semibold text-[#adc6ff] mb-2">Summary</h3>
              <p className="text-sm text-[#dce1fb] leading-relaxed">{evaluation.summary}</p>
            </Card>

            {/* Behavioral Analysis */}
            <Card>
              <h3 className="text-lg font-semibold text-[#adc6ff] mb-2">Behavioral Analysis</h3>
              <p className="text-sm text-[#dce1fb] leading-relaxed whitespace-pre-wrap">{evaluation.behavioral_analysis}</p>
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <h3 className="text-sm font-semibold text-[#22c55e] mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {evaluation.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#dce1fb]">
                      <span className="text-[#22c55e] mt-0.5">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-[#ef4444] mb-3">Areas for Growth</h3>
                <ul className="space-y-2">
                  {evaluation.weaknesses?.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#dce1fb]">
                      <span className="text-[#ef4444] mt-0.5">−</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Transcript Accordion */}
            <Card>
              <button
                type="button"
                onClick={() => setTranscriptOpen((o) => !o)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#4f6df5]" />
                  <h3 className="text-lg font-semibold text-[#adc6ff]">Full Transcript</h3>
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
                    {fullTranscript}
                  </p>
                </motion.div>
              )}
            </Card>

            <div className="flex justify-center pb-8">
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft size={16} className="mr-2" />
                Return Home
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
