import React from 'react'
import { Card } from '@directhire/shared'

export const Offers: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        Offers
      </h1>
      <Card>
        <h3 className="text-lg font-semibold text-[#dce1fb]">No offers yet</h3>
        <p className="text-sm text-[#8b92b4]">Your Career Agent is working to get you the best offers.</p>
      </Card>
    </div>
  )
}
