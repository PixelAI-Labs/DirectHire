import { apiClient } from './apiClient'

export const recruiterService = {
  // Jobs
  listJobs: () => apiClient.get('/recruiter/jobs'),
  createJob: (data: any) => apiClient.post('/recruiter/jobs', data),
  getJobCandidates: (jobId: string) => apiClient.get(`/recruiter/jobs/${jobId}/candidates`),

  // Rankings
  getRankings: () => apiClient.get('/recruiter/rankings'),

  // Offers
  createOffer: (data: any) => apiClient.post('/recruiter/offers', data),
  updateOfferStatus: (offerId: string, status: string) => apiClient.put(`/recruiter/offers/${offerId}/status`, { status }),
}