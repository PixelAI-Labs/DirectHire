import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Pause, Play, RotateCcw, Send } from 'lucide-react'
import { WaveformVisualizer } from './WaveformVisualizer'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'

interface VoiceRecorderProps {
  onAudioReady: (blob: Blob) => void
  disabled?: boolean
}

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioReady,
  disabled = false,
}) => {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    analyserData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useVoiceRecorder()

  return (
    <div
      className={`w-full rounded-xl border border-[#2a3150] bg-[#1e2640] p-6 space-y-4 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <WaveformVisualizer analyserData={analyserData} isRecording={isRecording} />

      <div className="flex justify-center">
        <span className="text-xl font-bold font-mono text-[#adc6ff]">
          {formatDuration(duration)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <AnimatePresence mode="wait">
          {!isRecording && !audioBlob && (
            <motion.button
              key="record"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-[#ef4444] text-white shadow-lg"
              aria-label="Start recording"
            >
              <Mic size={24} />
            </motion.button>
          )}

          {isRecording && (
            <>
              <motion.button
                key="stop"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[#6b7280] text-white shadow-lg"
                aria-label="Stop recording"
              >
                <Square size={20} />
              </motion.button>

              <motion.button
                key="pause-resume"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[#2a3150] text-[#dce1fb] shadow-lg"
                aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </motion.button>

              <motion.div
                key="pulse"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-[#ef4444] text-white shadow-lg"
              >
                <Mic size={24} />
              </motion.div>
            </>
          )}

          {!isRecording && audioBlob && (
            <>
              <motion.button
                key="reset"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetRecording}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2a3150] text-[#dce1fb] shadow"
                aria-label="Reset recording"
              >
                <RotateCcw size={16} />
              </motion.button>

              <motion.button
                key="send"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAudioReady(audioBlob)}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#4f6df5] text-white font-medium shadow-lg"
              >
                <Send size={16} />
                Send Answer
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
