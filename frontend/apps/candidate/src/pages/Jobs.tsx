import React from 'react'
import { Card } from '@directhire/shared'

export const Jobs: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
          Discover Jobs
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} hover>
            <h3 className="mb-2 text-lg font-semibold text-[#dce1fb]">Senior Frontend Engineer</h3>
            <p className="mb-2 text-sm text-[#8b92b4]">TechCorp • Remote</p>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Tailwind'].map((skill) => (
                <span key={skill} className="rounded-full bg-[#2a3150] px-2 py-1 text-xs text-[#dce1fb]">
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
