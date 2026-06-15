import { post, get, del } from "./client"

export interface ReportPayload {
  reason: 'spam' | 'inappropriate' | 'duplicate' | 'incorrect_info'
  note?: string
}

export interface AdminReport {
  id: string
  tool_id: string
  user_id: string
  reason: 'spam' | 'inappropriate' | 'duplicate' | 'incorrect_info'
  note: string | null
  created_at: string
  user_name: string | null
  user_email: string | null
  tool_name: string | null
}

export async function reportTool(toolId: string, payload: ReportPayload): Promise<void> {
  await post(`/tools/${toolId}/reports`, payload)
}

export async function getAdminReports(): Promise<AdminReport[]> {
  const data = await get<{ reports: AdminReport[] }>("/admin/reports")
  return data.reports
}

export async function dismissAdminReport(id: string): Promise<void> {
  await del(`/admin/reports/${id}`)
}
