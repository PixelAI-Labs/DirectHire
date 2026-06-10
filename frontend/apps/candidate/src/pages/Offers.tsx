import React, { useState, useEffect } from 'react'
import { Card, Button, Skeleton } from '@directhire/shared'
import { candidateService } from '@directhire/shared'

interface OfferItem {
  id: string
  job_id: string
  candidate_id: string
  recruiter_id: string
  salary_offered: number
  benefits: string
  status: string
  message: string
  created_at: string
  job?: {
    id: string
    title: string
    company?: {
      name: string
    }
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-[#facc15]',
  ACCEPTED: 'text-[#10b981]',
  DECLINED: 'text-[#f87171]',
  NEGOTIATING: 'text-[#a78bfa]',
  DRAFT: 'text-[#8b92b4]',
  SENT: 'text-[#60a5fa]',
}

const formatSalary = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

export const Offers: React.FC = () => {
  const [offers, setOffers] = useState<OfferItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    candidateService
      .getOffers()
      .then((res) => {
        const data: OfferItem[] = Array.isArray(res.data) ? res.data : res.data?.items ?? []
        setOffers(data)
      })
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        Offers
      </h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}><Skeleton className="h-32 w-full" /></Card>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <Card>
          <h3 className="text-lg font-semibold text-[#dce1fb]">No offers yet</h3>
          <p className="mt-1 text-sm text-[#8b92b4]">
            Your Career Agent is working to get you the best offers.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#dce1fb]">
                    {offer.job?.title ?? 'Offer'}
                  </h3>
                  <p className="text-sm text-[#8b92b4]">
                    {offer.job?.company?.name ?? 'Company'}
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#facc15]">
                    {formatSalary(offer.salary_offered)}/yr
                  </p>
                </div>
                <span
                  className={`rounded-full bg-[#2a3150] px-3 py-1 text-sm font-medium ${
                    STATUS_COLORS[offer.status] ?? 'text-[#8b92b4]'
                  }`}
                >
                  {offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
                </span>
              </div>

              {offer.benefits && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#8b92b4]">Benefits</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#dce1fb]/80">
                    {offer.benefits}
                  </p>
                </div>
              )}

              {offer.message && (
                <div className="mt-3 rounded-lg bg-[#131a2a] p-3">
                  <p className="text-xs font-medium text-[#8b92b4]">Message from Recruiter</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#dce1fb]/80">
                    {offer.message}
                  </p>
                </div>
              )}

              {offer.status === 'PENDING' && (
                <div className="mt-4 flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => window.alert('Accept functionality coming soon.')}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.alert('Decline functionality coming soon.')}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}