import { get, patch, del } from "./client"
import type { User } from "@/hooks/use-auth"

export function updateMe(data: {
  name: string
  email: string
  pfp_url?: string | null
}) {
  return patch<{ user: User }>("/me", data)
}

export function getAdminUsers() {
  return get<{ users: User[] }>("/admin/users").then((d) => d.users)
}

export function updateAdminUser(id: string, data: Partial<User>) {
  return patch<{ message: string }>(`/admin/users/${id}`, data)
}

export function deleteAdminUser(id: string) {
  return del<{ message: string }>(`/admin/users/${id}`)
}