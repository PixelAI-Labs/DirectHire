import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@directhire/shared'

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-6xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        404
      </h1>
      <p className="mb-8 text-lg text-[#8b92b4]">Page not found</p>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  )
}
