import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, TextArea, Select, useToast } from '@directhire/shared'
import { recruiterService, companyService } from '@directhire/shared/services'

export const CreateJob: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()

  const [companies, setCompanies] = useState<any[]>([])
  const [formData, setFormData] = useState({
    company_id: '',
    title: '',
    description: '',
    requirements: '',
    skills: '',
    location: '',
    salary_min: '',
    salary_max: '',
    role_type: 'FULL_TIME',
    remote_option: 'HYBRID',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    setLoadingCompanies(true)
    try {
      const res = await companyService.listCompanies()
      setCompanies(res.data)
      if (res.data.length > 0) {
        setFormData((prev) => ({ ...prev, company_id: res.data[0].id }))
      }
    } catch (error: any) {
      console.error('Failed to load companies:', error)
      toast.addToast('Failed to load companies', 'error')
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
    if (!formData.company_id) newErrors.company_id = 'Please select a company'
    if (!formData.title.trim()) newErrors.title = 'Job title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        company_id: formData.company_id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
        skills: formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        location: formData.location.trim(),
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : undefined,
        role_type: formData.role_type,
        remote_option: formData.remote_option,
      }

      await recruiterService.createJob(payload)
      toast.addToast('Job created successfully!', 'success')
      navigate('/jobs')
    } catch (error: any) {
      console.error('Failed to create job:', error)
      const msg = error.response?.data?.detail || 'Failed to create job. Please try again.'
      toast.addToast(msg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-semibold text-text">Create Job</h1>
        <p className="text-text-muted mt-1">Post a new job to start finding candidates</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Select */}
          <Select
            label="Company *"
            options={[
              { value: '', label: 'Select a company...' },
              ...companyOptions,
            ]}
            value={formData.company_id}
            onChange={handleChange}
            name="company_id"
            error={errors.company_id}
            disabled={loadingCompanies}
          />

          <Input
            label="Job Title *"
            name="title"
            placeholder="Senior Software Engineer"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
          />

          <TextArea
            label="Description *"
            name="description"
            placeholder="Describe the role, responsibilities, and what you're looking for..."
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            rows={5}
          />

          <Input
            label="Requirements"
            name="requirements"
            placeholder="5+ years of experience, Bachelor's degree (comma-separated)"
            value={formData.requirements}
            onChange={handleChange}
          />
          <p className="text-xs text-text-subdued -mt-3">Comma-separated list</p>

          <Input
            label="Skills"
            name="skills"
            placeholder="React, TypeScript, Node.js (comma-separated)"
            value={formData.skills}
            onChange={handleChange}
          />
          <p className="text-xs text-text-subdued -mt-3">Comma-separated list</p>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Location *"
              name="location"
              placeholder="San Francisco, CA"
              value={formData.location}
              onChange={handleChange}
              error={errors.location}
            />
            <div className="grid gap-4 grid-cols-2">
              <Input
                label="Min Salary ($)"
                name="salary_min"
                type="number"
                placeholder="80000"
                value={formData.salary_min}
                onChange={handleChange}
              />
              <Input
                label="Max Salary ($)"
                name="salary_max"
                type="number"
                placeholder="120000"
                value={formData.salary_max}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Role Type"
              name="role_type"
              options={[
                { value: 'FULL_TIME', label: 'Full-time' },
                { value: 'PART_TIME', label: 'Part-time' },
                { value: 'CONTRACT', label: 'Contract' },
                { value: 'INTERNSHIP', label: 'Internship' },
              ]}
              value={formData.role_type}
              onChange={handleChange}
            />

            <Select
              label="Remote Option"
              name="remote_option"
              options={[
                { value: 'REMOTE', label: 'Remote' },
                { value: 'HYBRID', label: 'Hybrid' },
                { value: 'ONSITE', label: 'Onsite' },
              ]}
              value={formData.remote_option}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/jobs')}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Create Job
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}