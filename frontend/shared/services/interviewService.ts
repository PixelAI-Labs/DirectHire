import { apiClient } from './apiClient'

export const interviewService = {
  transcribe: (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.webm')
    return apiClient.post<{ transcript: string }>('/interviews/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getQuestion: (interviewId: string, body: { previous_qa: { question: string; answer: string }[] }) =>
    apiClient.post<{ question: string }>(`/interviews/${interviewId}/question`, body),

  evaluate: (interviewId: string) =>
    apiClient.post(`/interviews/${interviewId}/evaluate`),

  getInterview: (interviewId: string) =>
    apiClient.get(`/interviews/${interviewId}`),

  submitAnswer: (interviewId: string, body: { question: string; answer: string }) =>
    apiClient.post(`/interviews/${interviewId}/answer`, body),

  list: () =>
    apiClient.get('/interviews'),
}
