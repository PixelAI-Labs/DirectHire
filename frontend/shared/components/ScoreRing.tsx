import React, { useEffect, useState } from 'react'

interface ScoreRingProps {
  score: number        // 0-100
  label: string
  size?: number        // default 120
  strokeWidth?: number // default 8
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  label,
  size = 120,
  strokeWidth = 8,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22c55e'
    if (s >= 60) return '#eab308'
    return '#ef4444'
  }

  const color = getScoreColor(score)
  const offset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    const duration = 1000 // ms
    const steps = 60
    const increment = score / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(score, increment * step)
      setAnimatedScore(current)
      if (step >= steps) {
        clearInterval(timer)
        setAnimatedScore(score)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2a3150"
          strokeWidth={strokeWidth}
        />
        {/* Foreground ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      {/* Center content overlaid via absolute positioning trick */}
      <div
        className="flex flex-col items-center justify-center"
        style={{ marginTop: -size }}
      >
        <span
          className="font-display font-bold leading-none"
          style={{ fontSize: size * 0.22, color }}
        >
          {Math.round(animatedScore)}
        </span>
      </div>
      <span className="text-sm font-medium text-[#dce1fb] text-center">{label}</span>
    </div>
  )
}