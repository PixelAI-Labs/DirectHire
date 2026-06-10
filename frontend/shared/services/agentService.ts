import { apiClient } from './apiClient'

export const agentService = {
  match: (candidate_id: string, job_id: string) =>
    apiClient.post('/agents/match', { candidate_id, job_id }),

  analyze: (candidate_id: string) =>
    apiClient.post('/agents/analyze', { candidate_id }),

  schedule: (candidate_id: string, job_id: string, prompt: string) =>
    apiClient.post('/agents/schedule', { candidate_id, job_id, prompt }),

  negotiate: (offer_id: string, prompt: string) =>
    apiClient.post('/agents/negotiate', { offer_id, prompt }),
}