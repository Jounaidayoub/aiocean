import type { Tool, ToolsResponse, GetToolsParams, Category } from "../schema"
import { get, post, patch, del } from "./client"
export type { Tool, ToolsResponse, GetToolsParams, Category } from "../schema"

export async function getTools(params: GetToolsParams = {}): Promise<ToolsResponse> {
  const query = new URLSearchParams()

  if (params.search) {
    query.set("search", params.search)
  }

  if (params.category) {
    query.set("category", params.category)
  }

  const qs = query.toString()
  return get<ToolsResponse>(`/tools${qs ? `?${qs}` : ""}`)
}

export async function getTool(id: string): Promise<Tool> {
  return get<Tool>(`/tools/${id}`)
}

export async function recordClick(toolId: string): Promise<{ clicked: boolean; count: number }> {
  return post<{ clicked: boolean; count: number }>(`/tools/${toolId}/click`, {})
}

export async function getCategories(): Promise<Category[]> {
  return get<{ categories: Category[] }>("/categories").then((d) => d.categories)
}

export async function getAdminTools(params: GetToolsParams = {}): Promise<ToolsResponse> {
  const query = new URLSearchParams()
  if (params.search) query.set("search", params.search)
  if (params.category) query.set("category", params.category)
  const qs = query.toString()
  return get<ToolsResponse>(`/admin/tools${qs ? `?${qs}` : ""}`)
}

export async function createAdminTool(data: any): Promise<{ id: string; message: string }> {
  return post<{ id: string; message: string }>("/admin/tools", data)
}

export async function updateAdminTool(id: string, data: any): Promise<{ message: string }> {
  return patch<{ message: string }>(`/admin/tools/${id}`, data)
}

export async function deleteAdminTool(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/admin/tools/${id}`)
}

export async function getAdminModels(): Promise<{ id: string; name: string; creator_id: string }[]> {
  return get<{ models: { id: string; name: string; creator_id: string }[] }>("/admin/models").then((d) => d.models)
}
