import React, { useRef, useEffect, useCallback } from 'react'

interface WaveformVisualizerProps {
  analyserData: Uint8Array | null
  isRecording: boolean
  barCount?: number
  colorStart?: string
  colorEnd?: string
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  analyserData,
  isRecording,
  barCount = 64,
  colorStart = '#4f6df5',
  colorEnd = '#8b5cf6',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastDataRef = useRef<Uint8Array | null>(null)
  const decayRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      animFrameRef.current = requestAnimationFrame(draw)
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(draw)
      return
    }

    const dpr = window.devicePixelRatio || 1
    const displayWidth = canvas.clientWidth
    const displayHeight = 128

    if (canvas.width !== Math.floor(displayWidth * dpr) || canvas.height !== Math.floor(displayHeight * dpr)) {
      canvas.width = Math.floor(displayWidth * dpr)
      canvas.height = Math.floor(displayHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const width = displayWidth
    const height = displayHeight

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#131a2a'
    ctx.fillRect(0, 0, width, height)

    let dataArray = analyserData
    if (dataArray) {
      lastDataRef.current = new Uint8Array(dataArray)
      decayRef.current = 30
    }

    if (!dataArray && lastDataRef.current && decayRef.current > 0) {
      dataArray = lastDataRef.current
      decayRef.current -= 1
    }

    if (!dataArray || (!isRecording && decayRef.current <= 0)) {
      animFrameRef.current = null
      return
    }

    const count = Math.min(dataArray.length / 2, barCount)
    const gap = 2
    const barW = width / count - gap
    const gradient = ctx.createLinearGradient(0, height, 0, 0)
    gradient.addColorStop(0, colorStart)
    gradient.addColorStop(1, colorEnd)
    ctx.fillStyle = gradient

    for (let i = 0; i < count; i++) {
      const value = dataArray[i] || 0
      const barHeight = (value / 255) * height * 0.8
      const x = i * (barW + gap)
      const y = height - barHeight

      const radius = Math.min(barW / 2, 4)

      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath()
        ctx.roundRect(x, y, Math.max(barW, 1), barHeight, [radius, radius, 0, 0])
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + Math.max(barW, 1) - radius, y)
        ctx.quadraticCurveTo(x + Math.max(barW, 1), y, x + Math.max(barW, 1), y + radius)
        ctx.lineTo(x + Math.max(barW, 1), y + barHeight)
        ctx.lineTo(x, y + barHeight)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
        ctx.fill()
      }
    }

    animFrameRef.current = requestAnimationFrame(draw)
  }, [analyserData, isRecording, barCount, colorStart, colorEnd])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw)
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [draw])

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ backgroundColor: '#131a2a' }}>
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: 128 }}
      />
    </div>
  )
}
