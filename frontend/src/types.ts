export type Role = 'citizen' | 'operator' | 'admin'
export type Status = 'analysis' | 'queued' | 'in_progress' | 'completed' | 'rejected'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: Role
  is_active?: boolean
}

export interface Category {
  id: number
  name: string
}
export interface Municipality {
  ibge_code: string
  name: string
  state: string
}
export interface Attachment {
  id: string
  original_name: string
  content_type: string
  size: number
  created_at: string
}
export interface Transition {
  from_status: Status | ''
  to_status: Status
  actor: string | null
  reason: string
  created_at: string
}
export interface Report {
  id: string
  title: string
  description: string
  category: Category
  municipality: Municipality | null
  address: string
  latitude: number | null
  longitude: number | null
  reporter: string | null
  status: Status
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  created_at: string
  updated_at: string
  attachments: Attachment[]
  transitions: Transition[]
  access_token?: string
}
export interface NearbyReport {
  id: string
  title: string
  status: Status
  category: string
  latitude: number
  longitude: number
  distance_km: number
}
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
