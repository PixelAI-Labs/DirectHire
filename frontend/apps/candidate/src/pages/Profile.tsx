import React from 'react'
import { Card, Button } from '@directhire/shared'

export const Profile: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        Your Profile
      </h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[#dce1fb]">Resume</h2>
          <p className="text-sm text-[#8b92b4]">Upload your resume for AI-powered analysis and optimization.</p>
          <Button className="mt-4" variant="secondary">Upload Resume</Button>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[#dce1fb]">Skills</h2>
          <p className="text-sm text-[#8b92b4]">Manage your skills and see how they match with job requirements.</p>
          <Button className="mt-4" variant="secondary">Update Skills</Button>
        </Card>
      </div>
    </div>
  )
}
