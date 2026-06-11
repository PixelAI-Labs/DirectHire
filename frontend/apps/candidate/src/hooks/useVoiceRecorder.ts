import { useState, useRef, useCallback, useEffect } from 'react'

export interface UseVoiceRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
  analyserData: Uint8Array | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [analyserData, setAnalyserData] = useState<Uint8Array | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animationFrameIdRef = useRef<number | null>(null)
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanupAnimationFrame = useCallback(() => {
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }
  }, [])

  const cleanupInterval = useCallback(() => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }
  }, [])

  const animateAnalyser = useCallback(() => {
    if (!analyserRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animateAnalyser)
      return
    }
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    setAnalyserData(new Uint8Array(dataArray))
    animationFrameIdRef.current = requestAnimationFrame(animateAnalyser)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      setAudioUrl(null)
      setAudioBlob(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext({ sampleRate: 44100 })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      source.connect(analyser)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      setDuration(0)

      intervalIdRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)

      animateAnalyser()
    } catch {
      // Silently handle microphone permission denied or other errors
    }
  }, [animateAnalyser, audioUrl])

  const stopRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
    }
    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()

    cleanupAnimationFrame()
    cleanupInterval()

    setIsRecording(false)
    setIsPaused(false)
    setAnalyserData(null)
  }, [cleanupAnimationFrame, cleanupInterval])

  const pauseRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause()
      setIsPaused(true)
      cleanupInterval()
    }
  }, [cleanupInterval])

  const resumeRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume()
      setIsPaused(false)
      intervalIdRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
  }, [])

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setIsRecording(false)
    setIsPaused(false)
    setAnalyserData(null)
    chunksRef.current = []
  }, [audioUrl])

  useEffect(() => {
    return () => {
      const mediaRecorder = mediaRecorderRef.current
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      cleanupAnimationFrame()
      cleanupInterval()
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl, cleanupAnimationFrame, cleanupInterval])

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    analyserData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  }
}
