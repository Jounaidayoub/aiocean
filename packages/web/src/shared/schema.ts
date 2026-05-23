export interface Tool {
  id: string
  name: string
  logo: string
  tagline: string
  category: string
  pricing: string
  platform: string
  usageCount: number
  rating: number
  reviewCount: number
  voteCount: number
  primaryUseCase: string
  url?: string | null
  description?: string | null
  status?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  pfp_url: string | null
}

export interface ToolsResponse {
  tools: Tool[]
  total: number
  categories: string[]
}

export interface GetToolsParams {
  search?: string
  category?: string | null
}
