import { apiClient } from './apiClient'

export const jobService = {
  listJobs: (params?: {
    q?: string
    location?: string
    min_salary?: number
    role_type?: string
    page?: number
    limit?: number
  }) => apiClient.get('/jobs', { params }),

  getJob: (id: string) => apiClient.get(`/jobs/${id}`),

  applyToJob: (id: string) => apiClient.post(`/jobs/${id}/apply`),
}