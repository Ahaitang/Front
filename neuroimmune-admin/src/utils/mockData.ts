// 模拟数据 - 与 neuroimmune-app 数据结构一致

// 患者数据
export interface Patient {
  id: string
  name: string
  gender: string
  age: number
  phone: string
  avatar?: string
  idCard?: string
  hasFollowUp: boolean
  isRealAuth: boolean
  doctorId?: string
  doctorName?: string
  createTime: string
  updateTime: string
}

// 医生数据
export interface Doctor {
  id: string
  name: string
  title: string
  department: string
  hospital: string
  phone: string
  avatar?: string
  patientCount: number
  createTime: string
}

// 随访记录
export interface FollowUp {
  id: string
  patientId: string
  patientName: string
  patientGender: string
  patientAge: number
  doctorId: string
  doctorName: string
  date: string
  project: string
  status: 'pending' | 'completed' | 'cancelled'
  statusText: string
  type: string
  content?: string
  createTime: string
}

// 用药记录
export interface Medication {
  id: string
  patientId: string
  patientName: string
  doctorId: string
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

// 病历记录
export interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  type: string
  diagnosis: string
  hospital: string
  department: string
  doctorName: string
  date: string
  content: string
  attachments?: string[]
  createTime: string
}

// 模拟患者列表
export const mockPatients: Patient[] = [
  { id: '1', name: '刘博超', gender: '男', age: 45, phone: '18344029312', hasFollowUp: true, isRealAuth: true, doctorId: '1', doctorName: '张医生', createTime: '2024-12-15', updateTime: '2025-02-28' },
  { id: '2', name: '张哲瀚', gender: '男', age: 45, phone: '13800138000', hasFollowUp: false, isRealAuth: true, doctorId: '1', doctorName: '张医生', createTime: '2024-11-20', updateTime: '2025-02-27' },
  { id: '3', name: '王某某', gender: '女', age: 38, phone: '13900139000', hasFollowUp: true, isRealAuth: false, doctorId: '2', doctorName: '李医生', createTime: '2024-10-10', updateTime: '2025-02-20' },
  { id: '4', name: '李明', gender: '男', age: 52, phone: '15800158000', hasFollowUp: false, isRealAuth: true, doctorId: '1', doctorName: '张医生', createTime: '2025-01-05', updateTime: '2025-02-15' },
  { id: '5', name: '赵芳', gender: '女', age: 41, phone: '18600186000', hasFollowUp: true, isRealAuth: true, doctorId: '2', doctorName: '李医生', createTime: '2025-01-10', updateTime: '2025-02-28' },
  { id: '6', name: '陈建国', gender: '男', age: 58, phone: '17700177000', hasFollowUp: false, isRealAuth: true, doctorId: '1', doctorName: '张医生', createTime: '2025-02-01', updateTime: '2025-02-25' },
  { id: '7', name: '孙丽华', gender: '女', age: 35, phone: '13500135000', hasFollowUp: true, isRealAuth: false, doctorId: '2', doctorName: '李医生', createTime: '2025-02-10', updateTime: '2025-02-28' },
  { id: '8', name: '周强', gender: '男', age: 48, phone: '15000150000', hasFollowUp: false, isRealAuth: true, doctorId: '1', doctorName: '张医生', createTime: '2025-02-15', updateTime: '2025-02-20' }
]

// 模拟医生列表
export const mockDoctors: Doctor[] = [
  { id: '1', name: '张医生', title: '主任医师', department: '神经内科', hospital: 'XX医院', phone: '13800138001', patientCount: 5, createTime: '2024-01-01' },
  { id: '2', name: '李医生', title: '副主任医师', department: '神经内科', hospital: 'XX医院', phone: '13800138002', patientCount: 3, createTime: '2024-01-01' },
  { id: '3', name: '王医生', title: '主治医师', department: '神经免疫科', hospital: 'XX医院', phone: '13800138003', patientCount: 0, createTime: '2024-06-01' }
]

// 模拟随访记录
export const mockFollowUps: FollowUp[] = [
  { id: '1', patientId: '1', patientName: '刘博超', patientGender: '男', patientAge: 45, doctorId: '1', doctorName: '张医生', date: '2025-02-28', project: '神经功能评估', status: 'pending', statusText: '待随访', type: '定期随访', createTime: '2025-02-20' },
  { id: '2', patientId: '2', patientName: '张哲瀚', patientGender: '男', patientAge: 45, doctorId: '1', doctorName: '张医生', date: '2025-02-27', project: '复诊', status: 'pending', statusText: '待随访', type: '复诊随访', createTime: '2025-02-18' },
  { id: '3', patientId: '3', patientName: '王某某', patientGender: '女', patientAge: 38, doctorId: '2', doctorName: '李医生', date: '2025-02-25', project: '用药复查', status: 'completed', statusText: '已完成', type: '用药随访', createTime: '2025-02-15' },
  { id: '4', patientId: '5', patientName: '赵芳', patientGender: '女', patientAge: 41, doctorId: '2', doctorName: '李医生', date: '2025-02-28', project: '量表评估', status: 'pending', statusText: '待随访', type: '评估随访', createTime: '2025-02-22' },
  { id: '5', patientId: '7', patientName: '孙丽华', patientGender: '女', patientAge: 35, doctorId: '2', doctorName: '李医生', date: '2025-02-26', project: '病情跟踪', status: 'completed', statusText: '已完成', type: '定期随访', createTime: '2025-02-16' }
]

// 模拟用药记录
export const mockMedications: Medication[] = [
  { id: '1', patientId: '1', patientName: '刘博超', doctorId: '1', doctorName: '张医生', medicationName: '甲钴胺片', date: '2025-02-20', dosage: '0.5', unit: 'mg/次', frequency: '一日三次', route: '口服', duration: '30天', notes: '饭后服用', createTime: '2025-02-20' },
  { id: '2', patientId: '1', patientName: '刘博超', doctorId: '1', doctorName: '张医生', medicationName: '维生素B1', date: '2025-02-15', dosage: '10', unit: 'mg/次', frequency: '一日两次', route: '口服', duration: '30天', createTime: '2025-02-15' },
  { id: '3', patientId: '2', patientName: '张哲瀚', doctorId: '1', doctorName: '张医生', medicationName: '泼尼松片', date: '2025-02-18', dosage: '5', unit: 'mg/次', frequency: '一日一次', route: '口服', duration: '14天', notes: '早晨顿服', createTime: '2025-02-18' },
  { id: '4', patientId: '3', patientName: '王某某', doctorId: '2', doctorName: '李医生', medicationName: '丙戊酸钠', date: '2025-02-22', dosage: '200', unit: 'mg/次', frequency: '一日两次', route: '口服', duration: '长期', createTime: '2025-02-22' },
  { id: '5', patientId: '5', patientName: '赵芳', doctorId: '2', doctorName: '李医生', medicationName: '阿司匹林肠溶片', date: '2025-02-25', dosage: '100', unit: 'mg/次', frequency: '一日一次', route: '口服', duration: '长期', notes: '餐后服用', createTime: '2025-02-25' }
]

// 模拟病历记录
export const mockRecords: MedicalRecord[] = [
  { id: '1', patientId: '1', patientName: '刘博超', type: '门诊病历', diagnosis: '多发性硬化', hospital: 'XX医院', department: '神经内科', doctorName: '张医生', date: '2025-02-15', content: '患者主诉视力模糊，肢体麻木。检查显示脑白质多发脱髓鞘病变。', createTime: '2025-02-15' },
  { id: '2', patientId: '2', patientName: '张哲瀚', type: '住院病历', diagnosis: '视神经脊髓炎', hospital: 'XX医院', department: '神经内科', doctorName: '张医生', date: '2025-01-20', content: '双眼视力下降，伴有下肢无力。脊髓MRI显示颈段长节段病变。', createTime: '2025-01-20' },
  { id: '3', patientId: '3', patientName: '王某某', type: '门诊病历', diagnosis: '格林-巴利综合征', hospital: 'XX医院', department: '神经内科', doctorName: '李医生', date: '2025-02-10', content: '四肢进行性无力，腱反射消失。脑脊液蛋白-细胞分离。', createTime: '2025-02-10' },
  { id: '4', patientId: '5', patientName: '赵芳', type: '外院病历', diagnosis: '重症肌无力', hospital: '外院', department: '神经内科', doctorName: '外院医生', date: '2025-01-05', content: '眼睑下垂，复视。新斯的明试验阳性。', createTime: '2025-01-05' }
]