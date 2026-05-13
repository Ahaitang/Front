import { request } from '@/utils/request'
import type { PageRequest, PageResult } from '@/utils/types'

// 登录
export const login = (data: { username: string; password: string; role?: string }) => {
  return request.post('/neuroimmune/login', data)
}

// 仪表盘统计
export interface DashboardStats {
  totalPatients: number
  totalDoctors: number
  pendingFollowUps: number
  completedFollowUps: number
  totalMedications: number
}

export const getDashboardStats = () => {
  return request.get<DashboardStats>('/neuroimmune/dashboard/stats')
}

// 患者相关
export const getPatientList = (params: PageRequest) => {
  return request.get<PageResult<Patient>>('/neuroimmune/patients', params)
}

export const getPatientById = (id: string | number) => {
  return request.get<Patient>(`/neuroimmune/patients/${id}`)
}

export const savePatient = (data: Partial<Patient>) => {
  if (data.id) {
    return request.put(`/neuroimmune/patients/${data.id}`, data)
  }
  return request.post('/neuroimmune/patients', data)
}

export const deletePatient = (id: string | number) => {
  return request.delete(`/neuroimmune/patients/${id}`)
}

export const updatePatientPassword = (id: string | number, password: string, oldPassword?: string) => {
  return request.put(`/neuroimmune/patients/${id}/password`, { password, oldPassword })
}

// 患者绑定医生
export const bindPatientDoctor = (patientId: number, doctorId: number, bindMethod?: string, remark?: string) => {
  return request.post('/neuroimmune/relation/bind', {
    patientId,
    doctorId,
    bindMethod: bindMethod || 'admin',
    remark
  })
}

export const unbindPatientDoctor = (patientId: number, doctorId: number) => {
  const params = new URLSearchParams()
  params.append('patientId', patientId.toString())
  params.append('doctorId', doctorId.toString())
  return request.post(`/neuroimmune/relation/unbind-by-ids?${params.toString()}`)
}

// 绑定关系审核
export const confirmRelation = (relationId: number) => {
  return request.put(`/neuroimmune/relation/${relationId}/confirm`)
}

export const rejectRelation = (relationId: number) => {
  return request.put(`/neuroimmune/relation/${relationId}/reject`)
}

// 医生相关
export const getDoctorList = (params: PageRequest) => {
  return request.get<PageResult<Doctor>>('/neuroimmune/doctors', params)
}

// 获取所有医生（用于下拉选择）
// API 合并：使用 ?all=true 替代 /doctors/all
export const getAllDoctors = () => {
  return request.get<Doctor[]>('/neuroimmune/doctors', { all: true })
}

export const getDoctorById = (id: string | number) => {
  return request.get<Doctor>(`/neuroimmune/doctors/${id}`)
}

export const saveDoctor = (data: Partial<Doctor>) => {
  if (data.id) {
    return request.put(`/neuroimmune/doctors/${data.id}`, data)
  }
  return request.post('/neuroimmune/doctors', data)
}

export const deleteDoctor = (id: string | number) => {
  return request.delete(`/neuroimmune/doctors/${id}`)
}

export const updateDoctorPassword = (id: string | number, password: string, oldPassword?: string) => {
  return request.put(`/neuroimmune/doctors/${id}/password`, { password, oldPassword })
}

export const updateDoctorProfile = (id: string | number, data: Partial<Doctor>) => {
  return request.put(`/neuroimmune/doctors/${id}`, data)
}

// 管理员相关
export const getAdminList = (params: PageRequest) => {
  return request.get<PageResult<Doctor>>('/neuroimmune/doctors/admins', params)
}

export const updateDoctorRole = (id: string | number, role: string, level?: number) => {
  const params = new URLSearchParams()
  params.append('role', role)
  if (level !== undefined) {
    params.append('level', level.toString())
  }
  return request.put(`/neuroimmune/doctors/${id}/role?${params.toString()}`)
}

// 获取医生角色列表
export const getDoctorRoles = (id: string | number) => {
  return request.get<string[]>(`/neuroimmune/doctors/${id}/roles`)
}

// 更新医生角色列表（多选）和管理等级
export const updateDoctorRoles = (id: string | number, roles: string[], level?: number) => {
  return request.put(`/neuroimmune/doctors/${id}/roles`, { roles, level })
}

export const updateAdminPassword = (id: string | number, password: string, oldPassword?: string) => {
  return request.put(`/neuroimmune/admin/${id}/password`, { password, oldPassword })
}

// 随访相关
export const getFollowUpList = (params: PageRequest) => {
  return request.get<PageResult<FollowUp>>('/neuroimmune/followups', params)
}

export const getFollowUpById = (id: string | number) => {
  return request.get<FollowUp>(`/neuroimmune/followups/${id}`)
}

export const saveFollowUp = (data: Partial<FollowUp>) => {
  if (data.id) {
    return request.put(`/neuroimmune/followups/${data.id}`, data)
  }
  return request.post('/neuroimmune/followups', data)
}

export const updateFollowUpStatus = (id: string | number, status: number) => {
  return request.put(`/neuroimmune/followups/${id}/status?status=${status}`)
}

export const cancelFollowUp = (id: string | number) => {
  return request.put(`/neuroimmune/followups/${id}/cancel`)
}

// 用药相关
export const getMedicationList = (params: PageRequest) => {
  return request.get<PageResult<Medication>>('/neuroimmune/medications', params)
}

export const getMedicationById = (id: string | number) => {
  return request.get<Medication>(`/neuroimmune/medications/${id}`)
}

export const saveMedication = (data: Partial<Medication>) => {
  if (data.id) {
    return request.put(`/neuroimmune/medications/${data.id}`, data)
  }
  return request.post('/neuroimmune/medications', data)
}

export const updateMedicationStatus = (id: string | number, status: number) => {
  return request.put(`/neuroimmune/medications/${id}/status?status=${status}`)
}

export const cancelMedication = (id: string | number) => {
  return request.put(`/neuroimmune/medications/${id}/cancel`)
}

// 病历相关
export const getRecordList = (params: PageRequest) => {
  return request.get<PageResult<MedicalRecord>>('/neuroimmune/records', params)
}

export const getRecordById = (id: string | number) => {
  return request.get<MedicalRecord>(`/neuroimmune/records/${id}`)
}

export const saveRecord = (data: Partial<MedicalRecord>) => {
  if (data.id) {
    return request.put(`/neuroimmune/records/${data.id}`, data)
  }
  return request.post('/neuroimmune/records', data)
}

export const updateRecordStatus = (id: string | number, status: number) => {
  return request.put(`/neuroimmune/records/${id}/status?status=${status}`)
}

export const cancelRecord = (id: string | number) => {
  return request.put(`/neuroimmune/records/${id}/cancel`)
}

// 发作记录相关
export const getEpisodeList = (params: PageRequest) => {
  return request.get<PageResult<DiseaseEpisode>>('/neuroimmune/episodes', params)
}

export const getEpisodeById = (id: string | number) => {
  return request.get<DiseaseEpisode>(`/neuroimmune/episodes/${id}`)
}

export const getEpisodesByPatient = (patientId: string | number) => {
  return request.get<DiseaseEpisode[]>(`/neuroimmune/episodes/patient/${patientId}`)
}

export const saveEpisode = (data: Partial<DiseaseEpisode>) => {
  if (data.id) {
    return request.put(`/neuroimmune/episodes/${data.id}`, data)
  }
  return request.post('/neuroimmune/episodes', data)
}

export const deleteEpisode = (id: string | number) => {
  return request.delete(`/neuroimmune/episodes/${id}`)
}

// 文件上传
export const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/v1/neuroimmune/file/upload', {
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
  birthDate?: string     // 出生日期
  age?: number           // 计算字段，仅用于显示
  phone: string
  password?: string
  avatar?: string
  idCard?: string
  hasFollowUp: boolean
  isRealAuth: boolean
  doctorId?: number      // 通过 relation 表获取
  doctorName?: string    // 通过 relation 表获取
  relationId?: number    // 绑定关系ID（用于审核操作）
  bindStatus?: number    // 绑定状态：0-待审核, 1-已确认, 2-已拒绝
  diseaseType?: string   // 单个疾病类型（兼容旧数据）
  diseaseTypes?: string[] // 疾病类型列表（从 patient_disease 表查询）
  createTime?: string    // 仅显示，不参与保存
  updateTime?: string    // 仅显示，不参与保存
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
  roles?: string[]    // 角色数组
  role?: string        // 兼容旧数据：角色字符串（doctor/admin/doctor,admin）
  level?: number       // 管理等级，1最高，null表示普通医生
}

export interface FollowUp {
  id: number
  patientId: number
  patientName: string
  patientGender: string
  patientAge: number
  doctorId: number
  doctorName: string
  // 门诊随访周期
  outpatientCycleType?: string    // monthly/weekly/quarterly
  outpatientCycleValue?: string   // 周期值
  outpatientTimeSlot?: string     // morning/afternoon/evening
  // 住院时间
  hospitalizationTime?: string
  // 随访检查类型
  followUpExamTypeId?: number
  followUpExamTypeName?: string
  // 检查项目
  examinationItems?: string
  // 备注
  notes?: string
  // 状态
  status: number  // 0-待随访, 1-完成, 2-取消
  date?: string      // 兼容旧字段
  project?: string   // 兼容旧字段
  type?: string      // 兼容旧字段
  content?: string   // 兼容旧字段
  createTime?: string
  updateTime?: string
}

export interface Medication {
  id: number
  patientId: number
  patientName: string
  doctorId: number
  doctorName: string
  medicationName: string
  date: string
  dosageValue?: number   // 剂量数值
  dosageUnit?: string    // 剂量单位
  frequency: string
  route: string
  duration?: string
  notes?: string
  status: number  // 0-进行中, 1-完成, 2-取消
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
  relatedEpisodeId?: number   // 关联的发作记录ID
  relatedEpisodeNumber?: number // 关联的发作次数
  status: number  // 0-进行中, 1-完成, 2-取消
  createTime: string
}

export interface DiseaseEpisode {
  id: number
  patientId: number
  patientName: string
  episodeNumber: number      // 发作次数（第几次发作）
  episodeDate: string        // 发作时间
  chiefComplaint?: string    // 主诉
  symptoms?: string          // 症状
  diseaseProgress?: string   // 病情变化过程
  treatmentProcess?: string  // 诊治经过
  diagnosis?: string         // 诊断结果
  hospital?: string          // 就诊医院
  department?: string        // 科室
  notes?: string             // 备注
  createTime: string
  updateTime?: string
}

// 通用字典 API
export const getCommonDictByType = (dictType: string) => {
  return request.get<CommonDict[]>(`/neuroimmune/dict/common/type/${dictType}`)
}

export const getCommonDictAll = () => {
  return request.get<CommonDict[]>('/neuroimmune/dict/common')
}

export const saveCommonDict = (data: Partial<CommonDict>) => {
  if (data.id) {
    return request.put(`/neuroimmune/dict/common/${data.id}`, data)
  }
  return request.post('/neuroimmune/dict/common', data)
}

export const deleteCommonDict = (id: number) => {
  return request.delete(`/neuroimmune/dict/common/${id}`)
}

export const toggleCommonDictActive = (id: number, active: boolean) => {
  return request.put(`/neuroimmune/dict/common/${id}/active?active=${active}`)
}

// 通用字典类型定义
export interface CommonDict {
  id: number
  dictType: string    // 字典类型：department/title/recordType/followUpType/gender/status
  code?: string       // 编码
  name: string        // 名称
  description?: string
  sortOrder?: number
  isActive: number    // 1-启用，0-禁用
  createTime: string
  updateTime: string
}

// 字典类型常量
export const DICT_TYPES = {
  DEPARTMENT: 'department',
  TITLE: 'title',
  RECORD_TYPE: 'recordType',
  FOLLOW_UP_TYPE: 'followUpType',
  FOLLOW_UP_EXAM_TYPE: 'followUpExamType',  // 随访检查类型
  GENDER: 'gender',
  STATUS: 'status',
  FREQUENCY: 'frequency',
  ROUTE: 'route',
  MEDICATION: 'medication',
  MEDICATION_UNIT: 'medicationUnit',
  DISEASE: 'disease',
  ROLE: 'role',
  OUTPATIENT_CYCLE_TYPE: 'outpatientCycleType',  // 门诊随访周期类型
  TIME_SLOT: 'timeSlot'  // 时间段
} as const
