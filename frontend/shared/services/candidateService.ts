import { apiClient } from './apiClient'

export const candidateService = {
  getProfile: () => apiClient.get('/candidate/profile'),

  updateProfile: (data: {
    skills?: string[]
    experience?: Record<string, unknown>[]
    education?: Record<string, unknown>[]
    preferences?: Record<string, unknown>
  }) => apiClient.put('/candidate/profile', data),

  uploadResume: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/candidate/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getApplications: () => apiClient.get('/candidate/applications'),

  getOffers: () => apiClient.get('/candidate/offers'),
}