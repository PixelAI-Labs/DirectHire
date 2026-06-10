import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Skeleton, useToast } from '@directhire/shared'
import { companyService } from '@directhire/shared/services'
import { Building2, Globe, Plus, ExternalLink } from 'lucide-react'

export const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const res = await companyService.listCompanies()
      setCompanies(res.data)
    } catch (error: any) {
      console.error('Failed to load companies:', error)
      toast.addToast('Failed to load companies', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold text-text">My Companies</h1>
          <p className="text-text-muted mt-1">Manage your company profiles</p>
        </div>
        <Button onClick={() => navigate('/companies/create')}>
          <Plus size={16} className="mr-2" />
          Create Company
        </Button>
      </div>

      {/* Empty State */}
      {companies.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">No companies yet</h3>
          <p className="text-text-muted mb-6 max-w-sm">
            Create your first company profile to start posting jobs and finding candidates.
          </p>
          <Button onClick={() => navigate('/companies/create')}>
            <Plus size={16} className="mr-2" />
            Create Your First Company
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card
              key={company.id}
              hover
              className="cursor-pointer p-0 overflow-hidden"
              onClick={() => navigate(`/companies/${company.id}/edit`)}
            >
              {/* Company Header */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-14 h-14 rounded-xl object-cover bg-surface-raised"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                      {getInitials(company.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-text truncate">{company.name}</h3>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe size={12} />
                        {company.website.replace(/^https?:\/\//, '')}
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
                {company.description && (
                  <p className="text-sm text-text-muted mt-4 line-clamp-3">{company.description}</p>
                )}
              </div>
              <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-text-subdued">{company.recruiters?.length || 0} recruiter(s)</span>
                <span className="text-xs text-primary font-medium hover:underline">Edit →</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}