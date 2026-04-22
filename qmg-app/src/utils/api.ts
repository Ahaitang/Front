/**
 * API工具类
 * 统一管理API请求
 */

// API基础地址（本地开发用 localhost；真机/小程序模拟器需改为本机局域网 IP，如 http://192.168.x.x:8080/api/v1）
const BASE_URL = 'http://localhost:8080/api/v1'

/**
 * 统一请求方法
 */
function request<T = any>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res: any) => {
        if (res.statusCode === 200) {
          const result = res.data as any
          if (result.code === 1) {
            resolve(result.data as T)
          } else {
            uni.showToast({
              title: result.msg || '请求失败',
              icon: 'none'
            })
            reject(new Error(result.msg || '请求失败'))
          }
        } else {
          uni.showToast({
            title: '网络请求失败',
            icon: 'none'
          })
          reject(new Error('网络请求失败'))
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
        reject(err)
      }
    })
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
   * 注册单个医生
   */
  register(doctor: {
    username: string
    password: string
    role?: string
  }): Promise<any> {
    return request('/qmg/doctor/register', 'POST', doctor)
  },

  /**
   * 批量注册医生
   */
  batchRegister(doctors: Array<{
    username: string
    password: string
    role?: string
  }>): Promise<any> {
    return request('/qmg/doctor/batchRegister', 'POST', { doctors })
  }
}

/**
 * 患者API（全部使用POST请求）
 */
export const patientApi = {
  /**
   * 获取患者列表。小程序端传 doctorId，仅返回该医生关联的患者（含管理员也只看到自己的）。
   */
  getPatientList(doctorId?: number): Promise<any[]> {
    const body = doctorId != null ? { scope: 'mine', currentDoctorId: doctorId } : {}
    return request('/qmg/patient/list', 'POST', body)
  },

  /**
   * 根据ID获取患者。小程序端传 doctorId 用于权限校验（仅能查看自己关联的患者）。
   */
  getPatientById(id: number, doctorId?: number): Promise<any> {
    const body: any = { id }
    if (doctorId != null) body.currentDoctorId = doctorId
    return request('/qmg/patient/getById', 'POST', body)
  },

  /**
   * 根据住院号获取患者
   */
  getPatientByAdmissionNumber(admissionNumber: string): Promise<any> {
    return request('/qmg/patient/getByAdmissionNumber', 'POST', { admissionNumber })
  },

  /**
   * 搜索患者。小程序端传 doctorId，仅在该医生关联的患者中搜索。
   */
  searchPatients(keyword: string, doctorId?: number): Promise<any[]> {
    const body: any = { keyword }
    if (doctorId != null) {
      body.scope = 'mine'
      body.currentDoctorId = doctorId
    }
    return request('/qmg/patient/search', 'POST', body)
  },

  /**
   * 新增患者。传 doctorId 时建立该医生与患者的关联，便于在“我的患者”中显示。
   */
  addPatient(patient: {
    name: string
    gender: 'male' | 'female'
    admissionNumber: string
    phone: string
  }, doctorId?: number): Promise<any> {
    const body = doctorId != null ? { ...patient, currentDoctorId: doctorId } : patient
    return request('/qmg/patient/add', 'POST', body)
  },

  /**
   * 更新患者信息
   */
  updatePatient(patient: {
    id: number
    name: string
    gender: 'male' | 'female'
    admissionNumber: string
    phone: string
  }): Promise<any> {
    return request('/qmg/patient/update', 'POST', patient)
  },

  /**
   * 删除患者
   */
  deletePatient(id: number): Promise<any> {
    return request('/qmg/patient/delete', 'POST', { id })
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
   * 根据患者ID获取所有问卷结果。App 端需传 currentDoctorId 且带 scope: 'mine' 才能看到该患者记录。
   */
  getRecordsByPatientId(patientId: number, currentDoctorId?: number): Promise<any[]> {
    const body: any = { patientId, scope: 'mine' }
    if (currentDoctorId != null) body.currentDoctorId = currentDoctorId
    return request('/qmg/questionnaire/getByPatientId', 'POST', body)
  },

  /**
   * 根据患者ID和日期范围查询问卷结果
   */
  getRecordsByPatientIdAndDateRange(
    patientId: number,
    startDate?: string,
    endDate?: string,
    currentDoctorId?: number
  ): Promise<any[]> {
    const body: any = { patientId, startDate, endDate, scope: 'mine' }
    if (currentDoctorId != null) body.currentDoctorId = currentDoctorId
    return request('/qmg/questionnaire/getByPatientId', 'POST', body)
  },

  /**
   * 获取所有问卷结果
   */
  getAllRecords(): Promise<any[]> {
    return request('/qmg/questionnaire/list', 'POST')
  },

  /**
   * 分页获取问卷结果。小程序端必须传 currentDoctorId，否则后端按“无医生”处理会返回空列表。
   */
  getRecordsByPage(
    page: number,
    pageSize: number = 20,
    currentDoctorId?: number
  ): Promise<{
    records: any[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }> {
    const body: any = { page, pageSize, scope: 'mine' }
    if (currentDoctorId != null) body.currentDoctorId = currentDoctorId
    return request('/qmg/questionnaire/list', 'POST', body)
  },

  /**
   * 根据患者名称和时间范围组合查询（分页）。小程序端需传 currentDoctorId 才能看到自己的记录。
   */
  searchRecordsByPatientNameAndDateRange(
    patientName?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 20,
    currentDoctorId?: number
  ): Promise<{
    records: any[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }> {
    const body: any = { patientName, startDate, endDate, page, pageSize, scope: 'mine' }
    if (currentDoctorId != null) body.currentDoctorId = currentDoctorId
    return request('/qmg/questionnaire/list', 'POST', body)
  },

  /**
   * 更新问卷结果
   */
  updateRecord(record: any): Promise<any> {
    return request('/qmg/questionnaire/update', 'POST', record)
  },

  /**
   * 删除问卷结果
   */
  deleteRecord(id: number): Promise<any> {
    return request('/qmg/questionnaire/delete', 'POST', { id })
  }
}
