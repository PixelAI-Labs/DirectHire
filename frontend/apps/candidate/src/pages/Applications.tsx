import React from 'react'
import { Card } from '@directhire/shared'

export const Applications: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        My Applications
      </h1>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#dce1fb]">Senior Frontend Engineer</h3>
                <p className="text-sm text-[#8b92b4]">TechCorp • Applied 2 days ago</p>
              </div>
              <span className="rounded-full bg-[#facc15]/10 px-3 py-1 text-sm text-[#facc15]">
                Screening
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
