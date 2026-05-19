export type ApiResponse<T> = {
  data: T
  message?: string
}

export type ApiError = {
  error: string
  details?: unknown
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
