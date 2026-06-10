import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Input, TextArea, useToast } from '@directhire/shared'
import { companyService } from '@directhire/shared/services'

interface CompanyFormProps {
  mode: 'create' | 'edit'
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    logo_url: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(mode === 'edit')

  useEffect(() => {
    if (mode === 'edit' && id) {
      loadCompany(id)
    }
  }, [mode, id])

  const loadCompany = async (companyId: string) => {
    setInitialLoading(true)
    try {
      const res = await companyService.getCompany(companyId)
      const company = res.data
      setFormData({
        name: company.name || '',
        description: company.description || '',
        website: company.website || '',
        logo_url: company.logo_url || '',
      })
    } catch (error: any) {
      console.error('Failed to load company:', error)
      toast.addToast('Failed to load company details', 'error')
      navigate('/companies')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required'
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      if (mode === 'create') {
        await companyService.createCompany(formData)
        toast.addToast('Company created successfully!', 'success')
      } else {
        await companyService.updateCompany(id!, formData)
        toast.addToast('Company updated successfully!', 'success')
      }
      navigate('/companies')
    } catch (error: any) {
      console.error('Failed to save company:', error)
      const msg = error.response?.data?.detail || 'Failed to save company. Please try again.'
      toast.addToast(msg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-6 p-6 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-surface-raised rounded animate-pulse" />
        <div className="h-64 bg-surface-raised rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-semibold text-text">
          {mode === 'create' ? 'Create Company' : 'Edit Company'}
        </h1>
        <p className="text-text-muted mt-1">
          {mode === 'create'
            ? 'Add your company details to start posting jobs'
            : 'Update your company profile information'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Company Name *"
            name="name"
            placeholder="Acme Corp"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />

          <TextArea
            label="Description"
            name="description"
            placeholder="Tell candidates about your company, mission, and culture..."
            value={formData.description}
            onChange={handleChange}
            rows={5}
          />

          <Input
            label="Website"
            name="website"
            type="url"
            placeholder="https://www.example.com"
            value={formData.website}
            onChange={handleChange}
            error={errors.website}
          />

          <Input
            label="Logo URL"
            name="logo_url"
            type="url"
            placeholder="https://example.com/logo.png"
            value={formData.logo_url}
            onChange={handleChange}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/companies')}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {mode === 'create' ? 'Create Company' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}