const PHP_BASE = process.env.PHP_API_BASE_URL || 'http://localhost:8080'

async function phpFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PHP_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  })
  if (!res.ok) {
    console.error(`PHP API error: ${res.status} ${res.statusText} for ${path}`)
  }
  return res.json().catch(() => null)
}

export function createAgentRun(submissionId: string) {
  return phpFetch('/api/agent/runs', {
    method: 'POST',
    body: JSON.stringify({ submission_id: submissionId }),
  })
}

export function updateAgentStatus(runId: string, status: string) {
  return phpFetch(`/api/agent/runs/${runId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function updateAgentTodo(runId: string, todos: unknown) {
  return phpFetch(`/api/agent/runs/${runId}/todo`, {
    method: 'PATCH',
    body: JSON.stringify({ todos }),
  })
}

export function saveAgentMessages(runId: string, messages: unknown) {
  return phpFetch(`/api/agent/runs/${runId}/messages`, {
    method: 'PATCH',
    body: JSON.stringify({ messages }),
  })
}

export function saveAgentReport(runId: string, report: string) {
  return phpFetch(`/api/agent/runs/${runId}/report`, {
    method: 'PATCH',
    body: JSON.stringify({ report }),
  })
}

export async function listAioceanTools(params: { search?: string; category?: string } = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.category) query.set('category', params.category)
  const suffix = query.toString() ? `?${query}` : ''
  const payload = await phpFetch(`/api/tools${suffix}`)
  return payload?.data ?? null
}

export async function getAioceanTool(id: string) {
  const payload = await phpFetch(`/api/tools/${encodeURIComponent(id)}`)
  return payload?.data ?? null
}

export async function listAioceanCategories() {
  const payload = await phpFetch('/api/categories')
  return payload?.data?.categories ?? null
}

export async function listSubmissions(status?: string) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : ''
  const payload = await phpFetch(`/api/admin/submissions${suffix}`)
  return payload?.data?.submissions ?? null
}

export async function decideSubmission(id: string, status: string, adminNotes?: string) {
  const payload = await phpFetch(`/api/admin/submissions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, admin_notes: adminNotes }),
  })
  return payload?.data?.submission ?? payload?.data ?? null
}
