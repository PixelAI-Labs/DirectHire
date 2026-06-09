import { apiClient } from './apiClient'

export const uploadService = {
  async uploadFile(file: File, type: 'resume' | 'logo' | 'avatar'): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
