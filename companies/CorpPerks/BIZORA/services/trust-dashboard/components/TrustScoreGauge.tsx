'use client'

import { useEffect, useState } from 'react'

interface TrustScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
}

export default function TrustScoreGauge({ score, size = 200, strokeWidth = 12 }: TrustScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (animatedScore / 100) * circumference

  const getScoreColor = () => {
    if (score >= 90) return { color: '#22c55e', label: 'Excellent' }
    if (score >= 75) return { color: '#4ade80', label: 'Very Good' }
    if (score >= 60) return { color: '#fbbf24', label: 'Good' }
    if (score >= 40) return { color: '#f97316', label: 'Fair' }
    return { color: '#ef4444', label: 'Needs Improvement' }
  }

  const { color, label } = getScoreColor()

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="text-4xl font-bold transition-colors duration-500"
          style={{ color }}
        >
          {animatedScore}
        </span>
        <span className="text-sm text-slate-500 font-medium mt-1">/ 100</span>
        <span className="text-xs font-semibold mt-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {label}
        </span>
      </div>
    </div>
  )
}