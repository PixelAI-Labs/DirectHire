import { apiClient } from './apiClient'
import type { User } from '../types'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData extends LoginCredentials {
  full_name: string
  role: 'CANDIDATE' | 'RECRUITER'
}

interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new URLSearchParams()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)

    const response = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },
}
