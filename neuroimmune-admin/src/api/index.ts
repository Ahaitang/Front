import { request } from '@/utils/request'
import type { PageRequest, PageResult } from '@/utils/types'

// 登录
export const login = (data: { username: string; password: string; role?: string }) => {
  return request.post('/login', data)
}

// 仪表盘统计
export const getDashboardStats = () => {
  return request.get('/dashboard/stats')
}

// 患者相关
export const getPatientList = (params: PageRequest) => {
  return request.get<PageResult<Patient>>('/patients', params)
}

export const getPatientById = (id: string | number) => {
  return request.get<Patient>(`/patients/${id}`)
}

export const savePatient = (data: Partial<Patient>) => {
  if (data.id) {
    return request.put(`/patients/${data.id}`, data)
  }
  return request.post('/patients', data)
}

export const deletePatient = (id: string | number) => {
  return request.delete(`/patients/${id}`)
}

export const updatePatientPassword = (id: string | number, password: string) => {
  return request.put(`/patients/${id}/password`, { password })
}

// 医生相关
export const getDoctorList = (params: PageRequest) => {
  return request.get<PageResult<Doctor>>('/doctors', params)
}

export const getAllDoctors = () => {
  return request.get<Doctor[]>('/doctors/all')
}

export const getDoctorById = (id: string | number) => {
  return request.get<Doctor>(`/doctors/${id}`)
}

export const saveDoctor = (data: Partial<Doctor>) => {
  if (data.id) {
    return request.put(`/doctors/${data.id}`, data)
  }
  return request.post('/doctors', data)
}

export const deleteDoctor = (id: string | number) => {
  return request.delete(`/doctors/${id}`)
}

export const updateDoctorPassword = (id: string | number, password: string) => {
  return request.put(`/doctors/${id}/password`, { password })
}

export const updateDoctorProfile = (id: string | number, data: Partial<Doctor>) => {
  return request.put(`/doctors/${id}`, data)
}

// 管理员相关
export const updateAdminPassword = (id: string | number, password: string) => {
  return request.put(`/admin/${id}/password`, { password })
}

// 随访相关
export const getFollowUpList = (params: PageRequest) => {
  return request.get<PageResult<FollowUp>>('/followups', params)
}

export const getFollowUpById = (id: string | number) => {
  return request.get<FollowUp>(`/followups/${id}`)
}

export const saveFollowUp = (data: Partial<FollowUp>) => {
  if (data.id) {
    return request.put(`/followups/${data.id}`, data)
  }
  return request.post('/followups', data)
}

export const updateFollowUpStatus = (id: string | number, status: string) => {
  return request.put(`/followups/${id}/status?status=${status}`)
}

export const deleteFollowUp = (id: string | number) => {
  return request.delete(`/followups/${id}`)
}

// 用药相关
export const getMedicationList = (params: PageRequest) => {
  return request.get<PageResult<Medication>>('/medications', params)
}

export const getMedicationById = (id: string | number) => {
  return request.get<Medication>(`/medications/${id}`)
}

export const saveMedication = (data: Partial<Medication>) => {
  if (data.id) {
    return request.put(`/medications/${data.id}`, data)
  }
  return request.post('/medications', data)
}

export const deleteMedication = (id: string | number) => {
  return request.delete(`/medications/${id}`)
}

// 病历相关
export const getRecordList = (params: PageRequest) => {
  return request.get<PageResult<MedicalRecord>>('/records', params)
}

export const getRecordById = (id: string | number) => {
  return request.get<MedicalRecord>(`/records/${id}`)
}

export const saveRecord = (data: Partial<MedicalRecord>) => {
  if (data.id) {
    return request.put(`/records/${data.id}`, data)
  }
  return request.post('/records', data)
}

export const deleteRecord = (id: string | number) => {
  return request.delete(`/records/${id}`)
}

// 文件上传
export const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('http://localhost:8080/api/file/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}`
    }
  })
  const result = await response.json()
  if (result.code === 200 && result.data) {
    return result.data
  }
  throw new Error(result.message || '上传失败')
}

// OCR识别 - 解析病历图片
export const ocrParseMedical = (images: string[]) => {
  return request.post<{ success: boolean; content: string; errorMsg?: string }>('/ocr/parse-medical', { images })
}

// 类型定义
export interface Patient {
  id: number
  name: string
  gender: string
  age: number
  phone: string
  password?: string
  avatar?: string
  idCard?: string
  hasFollowUp: boolean
  isRealAuth: boolean
  doctorId?: number
  doctorName?: string
  createTime: string
  updateTime: string
}

export interface Doctor {
  id: number
  name: string
  title: string
  department: string
  hospital: string
  phone: string
  password?: string
  avatar?: string
  patientCount: number
  createTime: string
}

export interface FollowUp {
  id: number
  patientId: number
  patientName: string
  patientGender: string
  patientAge: number
  doctorId: number
  doctorName: string
  date: string
  project: string
  type: string
  status: 'pending' | 'completed' | 'cancelled'
  statusText: string
  content?: string
  createTime: string
}

export interface Medication {
  id: number
  patientId: number
  patientName: string
  doctorId: number
  doctorName: string
  medicationName: string
  date: string
  dosage: string
  unit: string
  frequency: string
  route: string
  duration?: string
  notes?: string
  createTime: string
}

export interface MedicalRecord {
  id: number
  patientId: number
  patientName: string
  type: string
  diagnosis: string
  hospital: string
  department: string
  doctorName: string
  date: string
  content: string
  attachments?: string
  createTime: string
}