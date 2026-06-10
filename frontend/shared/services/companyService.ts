import { apiClient } from './apiClient'

export const companyService = {
  listCompanies: () => apiClient.get('/companies'),
  createCompany: (data: any) => apiClient.post('/companies', data),
  updateCompany: (id: string, data: any) => apiClient.put(`/companies/${id}`, data),
  getCompany: (id: string) => apiClient.get(`/companies/${id}`),
}