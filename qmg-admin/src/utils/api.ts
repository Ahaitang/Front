/**
 * API工具类
 * 统一管理API请求
 */
import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

// API基础地址（根据实际部署环境修改）
const BASE_URL = '/api/v1'

// 创建axios实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可以在这里添加token等
    const token = sessionStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const result = response.data
    if (result.code === 1) {
      return result.data
    } else {
      ElMessage.error(result.msg || '请求失败')
      return Promise.reject(new Error(result.msg || '请求失败'))
    }
  },
  (error) => {
    // 更详细的错误处理
    let errorMessage = '网络连接失败'

    if (error.response) {
      // 服务器返回了错误响应
      const status = error.response.status
      const data = error.response.data

      if (status === 404) {
        errorMessage = '请求的接口不存在，请检查后端服务是否正常运行'
      } else if (status === 500) {
        errorMessage = '服务器内部错误'
      } else if (status === 403) {
        errorMessage = '没有权限访问该资源'
      } else if (status === 401) {
        // 401 未授权：清除 token 并跳转到登录页
        errorMessage = '登录已过期，请重新登录'
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('userInfo')
        sessionStorage.removeItem('level')
        // 跳转到登录页
        window.location.href = '/login'
      } else if (data && data.msg) {
        errorMessage = data.msg
      } else {
        errorMessage = `请求失败 (${status})`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '无法连接到服务器，请检查：\n1. 后端服务是否已启动 (http://101.201.30.29:8080)\n2. 网络连接是否正常'
    } else {
      // 请求配置出错
      errorMessage = error.message || '请求配置错误'
    }

    console.error('API 请求错误:', {
      message: error.message,
      response: error.response,
      request: error.request,
      config: error.config
    })

    ElMessage.error(errorMessage)
    return Promise.reject(error)
  }
)

/**
 * 统一请求方法
 */
function request<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<T> {
  return axiosInstance.request<T>({
    url,
    method,
    data
  })
}

/**
 * 医生API（全部使用POST请求）
 */
export const doctorApi = {
  /**
   * 医生登录
   */
  login(username: string, password: string): Promise<any> {
    return request('/qmg/doctor/login', 'POST', { username, password })
  },

  /**
   * 根据用户名获取医生信息
   */
  getByUsername(username: string): Promise<any> {
    return request('/qmg/doctor/getByUsername', 'POST', { username })
  },

  /**
   * 注册医生（支持单个和批量）
   * 单个注册：传入 employeeNumber, username, password
   * 批量注册：传入 doctors 数组
   */
  register(doctor: {
    employeeNumber: string
    username: string
    password: string
  }, currentUserLevel: number): Promise<any> {
    return request('/qmg/doctor/register', 'POST', { ...doctor, currentUserLevel })
  },

  /**
   * 批量注册医生（使用统一的 register 接口）
   */
  batchRegister(doctors: Array<{
    employeeNumber: string
    username: string
    password: string
  }>, currentUserLevel: number): Promise<any> {
    return request('/qmg/doctor/register', 'POST', { doctors, currentUserLevel })
  },

  /**
   * 获取所有医生列表
   */
  getDoctorList(currentUserLevel: number): Promise<any[]> {
    return request('/qmg/doctor/list', 'POST', { currentUserLevel })
  },

  /**
   * 更新医生信息
   */
  updateDoctor(doctor: {
    id: number
    username?: string
    password?: string
    role?: string
    level?: number
  }, currentUserLevel: number): Promise<any> {
    return request('/qmg/doctor/update', 'POST', { ...doctor, currentUserLevel })
  }
}

/**
 * 患者API（全部使用POST请求）
 */
export const patientApi = {
  /**
   * 获取患者列表（根据权限过滤）
   */
  getPatientList(currentDoctorId?: number, currentUserLevel?: number): Promise<any[]> {
    return request('/qmg/patient/list', 'POST', { currentDoctorId, currentUserLevel })
  },

  /**
   * 根据ID获取患者（根据权限过滤）
   */
  getPatientById(id: number, currentDoctorId?: number, currentUserLevel?: number): Promise<any> {
    return request('/qmg/patient/getById', 'POST', { id, currentDoctorId, currentUserLevel })
  },

  /**
   * 根据住院号获取患者
   */
  getPatientByAdmissionNumber(admissionNumber: string): Promise<any> {
    return request('/qmg/patient/getByAdmissionNumber', 'POST', { admissionNumber })
  },

  /**
   * 搜索患者（根据权限过滤）
   */
  searchPatients(keyword: string, currentDoctorId?: number, currentUserLevel?: number): Promise<any[]> {
    return request('/qmg/patient/search', 'POST', { keyword, currentDoctorId, currentUserLevel })
  },

  /**
   * 新增患者。传入 currentDoctorId 时可为该医生建立关联（普通医生仅能查看自己关联的患者）。
   */
  addPatient(patient: {
    name: string
    gender: 'male' | 'female'
    admissionNumber: string
    phone: string
  }, currentDoctorId?: number): Promise<any> {
    return request('/qmg/patient/add', 'POST', { ...patient, currentDoctorId })
  },

  /**
   * 更新患者信息。传 currentUserLevel 用于权限校验（管理员不可改超级管理员添加的患者）。
   */
  updatePatient(patient: {
    id: number
    name: string
    gender: 'male' | 'female'
    admissionNumber: string
    phone: string
  }, currentUserLevel?: number): Promise<any> {
    return request('/qmg/patient/update', 'POST', { ...patient, currentUserLevel })
  },

  /**
   * 删除患者。传 currentUserLevel 用于权限校验（管理员不可删超级管理员添加的患者）。
   */
  deletePatient(id: number, currentUserLevel?: number): Promise<any> {
    return request('/qmg/patient/delete', 'POST', { id, currentUserLevel })
  },

  /**
   * 批量导入患者
   * @param patients 患者列表，每项需包含 name, gender, admissionNumber, phone
   * @param currentDoctorId 当前医生ID，可选，传入则与导入患者建立关联
   * @returns 导入结果 { successCount, failCount, errors: [{ row, message }] }
   */
  importPatients(
    patients: Array<{ name: string; gender: string; admissionNumber: string; phone: string }>,
    currentDoctorId?: number
  ): Promise<{ successCount: number; failCount: number; errors: Array<{ row: number; message: string }> }> {
    return request('/qmg/patient/import', 'POST', { patients, currentDoctorId })
  }
}

/**
 * 问卷结果API（全部使用POST请求）
 */
export const questionnaireApi = {
  /**
   * 保存问卷结果（新增）
   */
  saveRecord(record: {
    patient: any
    assessmentDate: string
    selections: any
    score: any
    doctorId?: number
    doctorUsername?: string
    userInputData?: any  // 用户自定义输入数据（可以是字符串或对象）
  }): Promise<any> {
    return request('/qmg/questionnaire/save', 'POST', record)
  },

  /**
   * 更新问卷结果
   */
  updateRecord(record: {
    id: number
    patient: any
    assessmentDate: string
    selections: any
    score: any
    doctorId?: number
    doctorUsername?: string
    modifiedBy?: string
    currentUsername?: string
    userInputData?: any  // 用户自定义输入数据（可以是字符串或对象）
  }): Promise<any> {
    return request('/qmg/questionnaire/update', 'POST', record)
  },

  /**
   * 根据ID获取问卷结果
   */
  getRecordById(id: number): Promise<any> {
    return request('/qmg/questionnaire/getById', 'POST', { id })
  },

  /**
   * 根据患者ID查询问卷结果（支持日期范围筛选，根据权限过滤）
   * 如果 startDate 和 endDate 为空，则查询所有记录
   */
  getRecordsByPatientId(
    patientId: number,
    startDate?: string,
    endDate?: string,
    currentDoctorId?: number,
    currentUserLevel?: number
  ): Promise<any[]> {
    return request('/qmg/questionnaire/getByPatientId', 'POST', {
      patientId,
      startDate,
      endDate,
      currentDoctorId,
      currentUserLevel
    })
  },


  /**
   * 获取所有问卷结果（不分页）
   */
  getAllRecords(): Promise<any[]> {
    return request('/qmg/questionnaire/list', 'POST')
  },

  /**
   * 查询问卷结果（支持分页和条件筛选，根据权限过滤）
   * 如果所有参数都为空，则返回所有记录
   */
  searchRecordsByPatientNameAndDateRange(
    patientName?: string,
    startDate?: string,
    endDate?: string,
    page?: number,
    pageSize?: number,
    currentDoctorId?: number,
    currentUserLevel?: number
  ): Promise<{
    records: any[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }> {
    return request('/qmg/questionnaire/list', 'POST', {
      patientName,
      startDate,
      endDate,
      page,
      pageSize,
      currentDoctorId,
      currentUserLevel
    })
  },


  /**
   * 删除问卷结果
   */
  deleteRecord(id: number): Promise<any> {
    return request('/qmg/questionnaire/delete', 'POST', { id })
  },

  /**
   * 统计最近一周每天的问卷数量
   */
  countByDayLast7Days(): Promise<Array<{ date: string; count: number }>> {
    return request('/qmg/questionnaire/countByDayLast7Days', 'POST')
  }
}

/**
 * 问卷配置API（全部使用POST请求）
 */
export const questionnaireConfigApi = {
  /**
   * 获取所有问卷项目（包含选项）
   */
  getAllItems(): Promise<any[]> {
    return request('/qmg/questionnaireConfig/getAllItems', 'POST')
  },

  /**
   * 根据分类获取问卷项目
   */
  getItemsByCategory(category: string): Promise<any[]> {
    return request('/qmg/questionnaireConfig/getItemsByCategory', 'POST', { category })
  },

  /**
   * 根据键名获取问卷项目
   */
  getItemByKey(key: string): Promise<any> {
    return request('/qmg/questionnaireConfig/getItemByKey', 'POST', { key })
  },

  /**
   * 保存或更新问卷项目（包含选项）
   */
  saveOrUpdateItem(item: any): Promise<any> {
    return request('/qmg/questionnaireConfig/saveOrUpdateItem', 'POST', item)
  },

  /**
   * 批量保存或更新问卷项目
   */
  batchSaveOrUpdateItems(items: any[]): Promise<any> {
    return request('/qmg/questionnaireConfig/batchSaveOrUpdateItems', 'POST', { items })
  },

  /**
   * 删除问卷项目
   */
  deleteItem(itemId: number): Promise<any> {
    return request('/qmg/questionnaireConfig/deleteItem', 'POST', { itemId })
  }
}
