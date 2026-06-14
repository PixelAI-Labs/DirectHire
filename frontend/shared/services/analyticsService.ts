import { apiClient } from './apiClient'
import type { DashboardResponse } from '../types'

/**
 * Analytics service — backs the Recruiter Dashboard.
 *
 * Resolves review finding #2: the dashboard used to compute stats client-side
 * from /api/recruiter/jobs + /api/recruiter/rankings, reading the non-existent
 * Ranking.application_status field, which is why the UI always showed "0
 * Candidates in Pipeline" and "No candidates yet".
 *
 * Now the dashboard calls /api/analytics/dashboard which the backend aggregates
 * from Application.status (the canonical source).
 */
export const analyticsService = {
  getDashboard: () => apiClient.get<DashboardResponse>('/analytics/dashboard'),
}
