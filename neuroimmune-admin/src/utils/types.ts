// 通用分页请求
export interface PageRequest {
  pageNum?: number
  pageSize?: number
  keyword?: string
  status?: string
  gender?: string
  isRealAuth?: boolean
  doctorId?: number
  patientId?: number
  type?: string
  startDate?: string
  endDate?: string
}

// 通用分页响应
export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

// API 响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}