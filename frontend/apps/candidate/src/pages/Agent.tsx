import React from 'react'
import { Card, Input, Button } from '@directhire/shared'

export const Agent: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        Career Agent
      </h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-[60vh]">
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 p-4">
                <div className="rounded-lg bg-[#1e2640] p-4">
                  <p className="text-sm text-[#dce1fb]">
                    Hello! I&apos;m your Career Agent. I can help you optimize your resume, find matching jobs, and prepare for interviews.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 border-t border-[#2a3150] p-4">
                <Input placeholder="Ask your Career Agent..." className="flex-1" />
                <Button>Send</Button>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <h3 className="mb-2 font-semibold text-[#adc6ff]">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">Optimize Resume</Button>
              <Button variant="ghost" className="w-full justify-start">Job Matching</Button>
              <Button variant="ghost" className="w-full justify-start">Interview Prep</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
