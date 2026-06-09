import React from 'react'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { ForCandidates } from './ForCandidates'
import { ForRecruiters } from './ForRecruiters'
import { AIChatDemo } from './AIChatDemo'
import { Stats } from './Stats'
import { Testimonials } from './Testimonials'
import { FinalCTA } from './FinalCTA'

export const LandingPage: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-background">
      <Hero />
      <HowItWorks />
      <ForCandidates />
      <ForRecruiters />
      <div id="demo">
        <AIChatDemo />
      </div>
      <Stats />
      <Testimonials />
      <FinalCTA />
    </div>
  )
}