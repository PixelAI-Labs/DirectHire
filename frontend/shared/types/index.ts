// Shared Type Definitions

export interface User {
  id: string
  email: string
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN'
  full_name: string
  avatar_url?: string
  company_id?: string
  created_at: string
}

export interface CandidateProfile {
  user_id: string
  resume_url?: string
  skills: string[]
  experience: Experience[]
  education: Education[]
  preferences: JobPreferences
}

export interface Experience {
  id: string
  company: string
  title: string
  start_date: string
  end_date?: string
  description: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  graduation_year: number
}

export interface JobPreferences {
  desired_roles: string[]
  locations: string[]
  salary_min?: number
  salary_max?: number
  remote_preference: 'REMOTE' | 'HYBRID' | 'ONSITE'
}

export interface Job {
  id: string
  company_id: string
  title: string
  description: string
  requirements: string[]
  skills: string[]
  location: string
  salary_min?: number
  salary_max?: number
  role_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'
  remote_option: 'REMOTE' | 'HYBRID' | 'ONSITE'
  status: 'DRAFT' | 'OPEN' | 'CLOSED'
  created_at: string
}

export interface Company {
  id: string
  name: string
  logo_url?: string
  description: string
  website?: string
  recruiters: string[]
}

export interface Application {
  id: string
  job_id: string
  candidate_id: string
  status: 'APPLIED' | 'SCREENING' | 'ASSESSMENT' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'HIRED'
  match_score?: number
  created_at: string
}

export interface Offer {
  id: string
  application_id: string
  salary: number
  currency: string
  status: 'DRAFT' | 'SENT' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED'
  confidence_score?: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export interface AgentEvent {
  id: string
  agent_type: 'CAREER' | 'HIRING'
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}
