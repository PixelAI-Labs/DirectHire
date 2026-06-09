import React from 'react'
import { useParams } from 'react-router-dom'
import { Card, Button } from '@directhire/shared'

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        Job Detail
      </h1>
      <Card>
        <p className="text-sm text-[#8b92b4]">Job ID: {id}</p>
        <Button className="mt-4">Apply Now</Button>
      </Card>
    </div>
  )
}
