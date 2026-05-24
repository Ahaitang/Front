<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, UserFilled } from '@element-plus/icons-vue'
import {
  getDoctorById,
  getPatientList,
  getFollowUpList,
  getMedicationList,
  saveFollowUp,
  cancelFollowUp,
  saveMedication,
  cancelMedication,
  getAllDoctors,
  getCommonDictByType,
  DICT_TYPES,
  savePatient
} from '@/api'
import type { Doctor, Patient, FollowUp, Medication, CommonDict } from '@/api'

const route = useRoute()
const router = useRouter()
const doctorId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string') return id
  if (id && id.length > 0) return id[0]!
  return ''
})

// 医生信息
const doctor = ref<Doctor | null>(null)
const loading = ref(false)

// Tab相关
const activeTab = ref('patients')

// 患者相关
const patients = ref<Patient[]>([])
const patientsLoading = ref(false)

// 随访相关
const followUps = ref<FollowUp[]>([])
const followUpsLoading = ref(false)
const followUpDialogVisible = ref(false)
const followUpForm = ref<Partial<FollowUp>>({})
const followUpDialogType = ref<'add' | 'edit'>('add')

// 用药相关
const medications = ref<Medication[]>([])
const medicationsLoading = ref(false)
const medicationDialogVisible = ref(false)
const medicationForm = ref<Partial<Medication>>({})
const medicationDialogType = ref<'add' | 'edit'>('add')

const doctors = ref<Doctor[]>([])
const saveLoading = ref(false)

// 字典选项
const followUpTypeOptions = ref<CommonDict[]>([])
const examTypeOptions = ref<CommonDict[]>([])  // 随访检查类型
const timeSlotOptions = ref<CommonDict[]>([])   // 时间段
const unitOptions = ref<CommonDict[]>([])
const frequencyOptions = ref<CommonDict[]>([])
const routeOptions = ref<CommonDict[]>([])
const examItemsList = ref<string[]>([])         // 检查项目列表
const selectedExamItems = ref<string[]>([])     // 已选检查项目

// 门诊周期类型选项（本地固定）
const cycleTypeOptions = [
  { value: 'monthly', label: '每月' },
  { value: 'weekly', label: '每周' },
  { value: 'quarterly', label: '每季度' }
]

// 时间段选项（本地固定，备用）
const timeSlotOptionsList = [
  { value: 'morning', label: '上午' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '晚上' }
]

// 加载字典
const loadDicts = async () => {
  try {
    const [followUpTypes, examTypes, timeSlots, units, frequencies, routes] = await Promise.all([
      getCommonDictByType(DICT_TYPES.FOLLOW_UP_TYPE),
      getCommonDictByType(DICT_TYPES.FOLLOW_UP_EXAM_TYPE),
      getCommonDictByType(DICT_TYPES.TIME_SLOT),
      getCommonDictByType(DICT_TYPES.MEDICATION_UNIT),
      getCommonDictByType(DICT_TYPES.FREQUENCY),
      getCommonDictByType(DICT_TYPES.ROUTE)
    ])
    followUpTypeOptions.value = followUpTypes
    examTypeOptions.value = examTypes
    timeSlotOptions.value = timeSlots
    unitOptions.value = units
    frequencyOptions.value = frequencies
    routeOptions.value = routes
  } catch (e) {
    console.error('加载字典失败:', e)
  }
}

// 状态相关
const getStatusType = (status: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '进行中', 1: '已完成', 2: '已取消' }
  return map[status] || '进行中'
}

const getUnitLabel = (unit: string) => {
  const found = unitOptions.value.find(u => u.name === unit || u.code === unit)
  return found ? found.name : unit || '-'
}

// 加载医生信息
const loadDoctor = async () => {
  loading.value = true
  try {
    const id = doctorId.value
    if (id) {
      const res = await getDoctorById(id)
      doctor.value = res
    }
  } catch (e) {
    ElMessage.error('加载医生信息失败')
  } finally {
    loading.value = false
  }
}

// 加载患者列表
const loadPatients = async () => {
  patientsLoading.value = true
  try {
    const res = await getPatientList({ pageNum: 1, pageSize: 100, doctorId: Number(doctorId.value) })
    patients.value = res?.list || []
  } catch (e) {
    console.error('加载患者失败:', e)
  } finally {
    patientsLoading.value = false
  }
}

// 加载随访记录
const loadFollowUps = async () => {
  followUpsLoading.value = true
  try {
    const res = await getFollowUpList({ pageNum: 1, pageSize: 100, doctorId: Number(doctorId.value) })
    followUps.value = res?.list || []
  } catch (e) {
    console.error('加载随访失败:', e)
  } finally {
    followUpsLoading.value = false
  }
}

// 加载用药记录
const loadMedications = async () => {
  medicationsLoading.value = true
  try {
    const res = await getMedicationList({ pageNum: 1, pageSize: 100, doctorId: Number(doctorId.value) })
    medications.value = res?.list || []
  } catch (e) {
    console.error('加载用药记录失败:', e)
  } finally {
    medicationsLoading.value = false
  }
}

// 加载医生列表
const loadDoctors = async () => {
  try {
    const res = await getAllDoctors()
    doctors.value = res || []
  } catch (e) {
    console.error('加载医生列表失败:', e)
  }
}

onMounted(() => {
  loadDicts()
  loadDoctor()
  loadPatients()
  loadDoctors()
})

// Tab切换
const handleTabChange = (tab: string) => {
  if (tab === 'followups' && followUps.value.length === 0) loadFollowUps()
  if (tab === 'medications' && medications.value.length === 0) loadMedications()
}

// 查看患者详情
const viewPatientDetail = (row: Patient) => {
  router.push(`/patients/${row.id}`)
}

// ========== 患者编辑相关 ==========
const patientDialogVisible = ref(false)
const patientForm = ref<Partial<Patient>>({})

const editPatient = (row: Patient) => {
  patientForm.value = { ...row }
  patientDialogVisible.value = true
}

const savePatientSubmit = async () => {
  if (!patientForm.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!patientForm.value.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  saveLoading.value = true
  try {
    const submitData = { ...patientForm.value }
    // 如果 birthDate 只有日期部分，补上时间
    if (submitData.birthDate && submitData.birthDate.length === 10) {
      submitData.birthDate = submitData.birthDate + ' 00:00:00'
    }
    await savePatient(submitData)
    ElMessage.success('保存成功')
    patientDialogVisible.value = false
    loadPatients()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// ========== 随访相关操作 ==========
const openAddFollowUpDialog = () => {
  followUpForm.value = {
    doctorId: Number(doctorId.value),
    doctorName: doctor.value?.name || '',
    // 新字段
    followUpExamTypeId: examTypeOptions.value[0]?.id ?? undefined,
    followUpExamTypeName: examTypeOptions.value[0]?.name ?? '',
    examinationItems: '',
    outpatientCycleType: 'monthly',
    outpatientCycleValue: '',
    outpatientTimeSlot: 'morning',
    hospitalizationTime: undefined,
    notes: '',
    // 保留字段
    patientId: undefined,
    patientName: '',
    status: 0
  }
  // 解析默认检查项目
  if (examTypeOptions.value.length > 0) {
    handleExamTypeChange(examTypeOptions.value[0]!.id)
  }
  selectedExamItems.value = []
  followUpDialogType.value = 'add'
  followUpDialogVisible.value = true
}

const openEditFollowUpDialog = (row: FollowUp) => {
  followUpForm.value = { ...row }
  // 解析已有的检查项目
  if (row.followUpExamTypeId) {
    const type = examTypeOptions.value.find(t => t.id === row.followUpExamTypeId)
    if (type) {
      try {
        examItemsList.value = JSON.parse(type.description || '[]')
        // 从 examinationItems 解析已选项目
        if (row.examinationItems) {
          selectedExamItems.value = row.examinationItems.split(/[,、]/).filter(s => s.trim())
        } else {
          selectedExamItems.value = []
        }
      } catch (e) {
        examItemsList.value = []
        selectedExamItems.value = []
      }
    }
  } else {
    examItemsList.value = []
    selectedExamItems.value = []
  }
  followUpDialogType.value = 'edit'
  followUpDialogVisible.value = true
}

const saveFollowUpSubmit = async () => {
  if (!followUpForm.value.patientId) {
    ElMessage.warning('请选择患者')
    return
  }
  if (!followUpForm.value.followUpExamTypeId) {
    ElMessage.warning('请选择随访检查类型')
    return
  }
  // 更新检查项目文本
  followUpForm.value.examinationItems = selectedExamItems.value.join(',')

  saveLoading.value = true
  try {
    const submitData = {
      ...followUpForm.value,
      // 住院时间格式化
      hospitalizationTime: followUpForm.value.hospitalizationTime
        ? `${followUpForm.value.hospitalizationTime} 00:00:00`
        : undefined
    }
    await saveFollowUp(submitData)
    ElMessage.success(followUpDialogType.value === 'add' ? '添加成功' : '保存成功')
    followUpDialogVisible.value = false
    loadFollowUps()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const cancelFollowUpConfirm = (row: FollowUp) => {
  ElMessageBox.confirm('确定要取消该随访记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelFollowUp(row.id)
      ElMessage.success('已取消')
      loadFollowUps()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

// ========== 用药相关操作 ==========
const openAddMedicationDialog = () => {
  medicationForm.value = {
    doctorId: Number(doctorId.value),
    doctorName: doctor.value?.name || '',
    date: new Date().toISOString().split('T')[0],
    dosageValue: undefined,
    dosageUnit: 'mg',
    frequency: '每日一次',
    route: '口服',
    status: 0
  }
  medicationDialogType.value = 'add'
  medicationDialogVisible.value = true
}

const openEditMedicationDialog = (row: Medication) => {
  medicationForm.value = { ...row }
  medicationDialogType.value = 'edit'
  medicationDialogVisible.value = true
}

const saveMedicationSubmit = async () => {
  if (!medicationForm.value.medicationName) {
    ElMessage.warning('请输入药品名称')
    return
  }
  if (!medicationForm.value.patientId) {
    ElMessage.warning('请选择患者')
    return
  }
  saveLoading.value = true
  try {
    const submitData = { ...medicationForm.value }
    // 如果 date 只有日期部分，补上时间
    if (submitData.date && submitData.date.length === 10) {
      submitData.date = submitData.date + ' 00:00:00'
    }
    await saveMedication(submitData)
    ElMessage.success(medicationDialogType.value === 'add' ? '添加成功' : '保存成功')
    medicationDialogVisible.value = false
    loadMedications()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const cancelMedicationConfirm = (row: Medication) => {
  ElMessageBox.confirm('确定要取消该用药记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelMedication(row.id)
      ElMessage.success('已取消')
      loadMedications()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

// 选择患者
const handlePatientSelect = (patientId: number) => {
  const patient = patients.value.find(p => p.id === patientId)
  if (patient) {
    if (followUpForm.value) {
      followUpForm.value.patientId = patientId
      followUpForm.value.patientName = patient.name
      followUpForm.value.patientGender = patient.gender
      followUpForm.value.patientAge = patient.age
    }
  }
}

// 随访检查类型选择处理
const handleExamTypeChange = (typeId: number) => {
  const type = examTypeOptions.value.find(t => t.id === typeId)
  if (type) {
    followUpForm.value.followUpExamTypeId = typeId
    followUpForm.value.followUpExamTypeName = type.name
    // 解析 description 中的 JSON 数组
    try {
      examItemsList.value = JSON.parse(type.description || '[]')
      selectedExamItems.value = [...examItemsList.value]
      followUpForm.value.examinationItems = selectedExamItems.value.join(',')
    } catch (e) {
      examItemsList.value = []
      selectedExamItems.value = []
    }
  }
}

// 格式化门诊周期文本
const formatCycleText = (row: FollowUp): string => {
  if (!row.outpatientCycleType) return '-'

  const typeMap: Record<string, string> = {
    'monthly': '每月',
    'weekly': '每周',
    'quarterly': '每季度'
  }
  const slotMap: Record<string, string> = {
    'morning': '上午',
    'afternoon': '下午',
    'evening': '晚间'
  }

  const typeText = (row.outpatientCycleType && typeMap[row.outpatientCycleType]) || ''
  const value = row.outpatientCycleValue || ''
  const slotText = (row.outpatientTimeSlot && slotMap[row.outpatientTimeSlot]) || ''

  if (row.outpatientCycleType === 'weekly') {
    const weekDays = ['一', '二', '三', '四', '五', '六', '日']
    const weekNum = parseInt(value)
    if (weekNum >= 1 && weekNum <= 7) {
      return `${typeText}周${weekDays[weekNum - 1]}${slotText}`
    }
    return typeText
  }

  if (value) {
    return `${typeText}${value}号${slotText}`
  }
  return typeText
}

const handleMedicationPatientSelect = (patientId: number) => {
  const patient = patients.value.find(p => p.id === patientId)
  if (patient && medicationForm.value) {
    medicationForm.value.patientId = patientId
    medicationForm.value.patientName = patient.name
  }
}

// 返回
const goBack = () => {
  router.push('/doctors')
}

const formatDate = (date: string) => date || '-'

// 年龄计算
const calculateAge = (birthDate: string | undefined) => {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
</script>

<template>
  <div class="page-container">
    <!-- 返回按钮 -->
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft">返回医生列表</el-button>
      <div class="page-title" v-if="doctor">
        <el-icon><UserFilled /></el-icon>
        医生详情 - {{ doctor.name }}
      </div>
    </div>

    <!-- 医生基本信息 -->
    <div class="doctor-card" v-loading="loading">
      <template v-if="doctor">
        <div class="doctor-header">
          <div class="doctor-avatar">
            <el-avatar :size="72" :src="doctor.avatar" :style="doctor.avatar ? {} : { background: '#3B82F6' }">
              <template v-if="!doctor.avatar">{{ doctor.name?.charAt(0) }}</template>
            </el-avatar>
          </div>
          <div class="doctor-info">
            <h3>{{ doctor.name }}</h3>
            <div class="doctor-meta">
              <span>{{ doctor.title }}</span>
              <span>{{ doctor.department }}</span>
              <span>{{ doctor.phone }}</span>
            </div>
          </div>
          <div class="doctor-tags">
            <el-tag type="primary" effect="plain">{{ doctor.department }}</el-tag>
            <el-tag type="info" effect="light">{{ doctor.hospital || '本院' }}</el-tag>
          </div>
        </div>
        <div class="doctor-detail">
          <div class="detail-item">
            <span class="label">患者数量:</span>
            <span class="value">{{ patients.length }} 人</span>
          </div>
          <div class="detail-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDate(doctor.createTime || '') }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- Tab切换 -->
    <div class="content-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 患者列表 -->
        <el-tab-pane label="患者列表" name="patients">
          <div class="tab-header">
            <div class="tab-title">
              <span>患者列表</span>
              <span class="count-badge">{{ patients.length }}</span>
            </div>
          </div>
          <el-table :data="patients" stripe v-loading="patientsLoading" empty-text="暂无患者">
            <el-table-column prop="name" label="姓名" min-width="120" />
            <el-table-column prop="gender" label="性别" width="100" />
            <el-table-column label="年龄" width="100">
              <template #default="{ row }">
                {{ calculateAge(row.birthDate) ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="手机号" min-width="140" />
            <el-table-column prop="isRealAuth" label="实名状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isRealAuth ? 'success' : 'warning'" size="small" effect="light">
                  {{ row.isRealAuth ? '已实名' : '未实名' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="hasFollowUp" label="随访状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.hasFollowUp ? 'warning' : 'info'" size="small" effect="light">
                  {{ row.hasFollowUp ? '待随访' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updateTime" label="更新时间" width="180">
              <template #default="{ row }">
                <span class="text-secondary">{{ formatDate(row.updateTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link size="small" @click="viewPatientDetail(row)">详情</el-button>
                <el-button type="primary" link size="small" @click="editPatient(row)">修改</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 随访记录 -->
        <el-tab-pane label="随访记录" name="followups">
          <div class="tab-header">
            <div class="tab-title">
              <span>随访记录列表</span>
              <span class="count-badge">{{ followUps.length }}</span>
            </div>
            <el-button type="primary" :icon="Plus" @click="openAddFollowUpDialog">新增随访</el-button>
          </div>
          <el-table :data="followUps" stripe v-loading="followUpsLoading" empty-text="暂无随访记录">
            <el-table-column prop="patientName" label="患者" min-width="120" />
            <el-table-column prop="followUpExamTypeName" label="检查类型" width="140">
              <template #default="{ row }">
                <el-tag type="primary" size="small" effect="plain">{{ row.followUpExamTypeName || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="门诊随访周期" width="160">
              <template #default="{ row }">
                <span>{{ formatCycleText(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="hospitalizationTime" label="住院时间" width="120">
              <template #default="{ row }">
                <span>{{ row.hospitalizationTime ? row.hospitalizationTime.substring(0, 10) : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="examinationItems" label="检查项目" min-width="180" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small" effect="light">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openEditFollowUpDialog(row)">编辑</el-button>
                <el-button v-if="row.status === 0" type="danger" link size="small" @click="cancelFollowUpConfirm(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 用药记录 -->
        <el-tab-pane label="用药记录" name="medications">
          <div class="tab-header">
            <div class="tab-title">
              <span>用药记录列表</span>
              <span class="count-badge">{{ medications.length }}</span>
            </div>
            <el-button type="primary" :icon="Plus" @click="openAddMedicationDialog">新增用药</el-button>
          </div>
          <el-table :data="medications" stripe v-loading="medicationsLoading" empty-text="暂无用药记录">
            <el-table-column prop="patientName" label="患者" min-width="120" />
            <el-table-column prop="medicationName" label="药品名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="剂量" width="100">
              <template #default="{ row }">
                <span class="dosage-value">{{ row.dosageValue }}{{ getUnitLabel(row.dosageUnit) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="frequency" label="频率" width="120" />
            <el-table-column prop="route" label="途径" width="100">
              <template #default="{ row }">
                <el-tag type="info" size="small" effect="plain">{{ row.route }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="疗程" width="100" />
            <el-table-column prop="date" label="开药日期" width="140" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small" effect="light">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openEditMedicationDialog(row)">编辑</el-button>
                <el-button v-if="row.status === 0" type="danger" link size="small" @click="cancelMedicationConfirm(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 随访编辑对话框 -->
    <el-dialog v-model="followUpDialogVisible" :title="followUpDialogType === 'add' ? '新增随访' : '编辑随访'" width="650px">
      <el-form :model="followUpForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="患者" required>
              <el-select v-model="followUpForm.patientId" placeholder="选择患者" style="width: 100%" @change="handlePatientSelect">
                <el-option v-for="p in patients" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="随访医生">
              <el-input :value="doctor?.name" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="随访检查类型" required>
          <el-select v-model="followUpForm.followUpExamTypeId" style="width: 100%" @change="handleExamTypeChange">
            <el-option v-for="t in examTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="检查项目">
          <div class="exam-checkboxes" v-if="examItemsList.length > 0">
            <el-checkbox-group v-model="selectedExamItems">
              <el-checkbox v-for="item in examItemsList" :key="item" :label="item">{{ item }}</el-checkbox>
            </el-checkbox-group>
          </div>
          <el-input v-model="followUpForm.examinationItems" placeholder="已选项目或自定义" style="margin-top: 8px" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="门诊周期">
              <el-select v-model="followUpForm.outpatientCycleType" style="width: 100%">
                <el-option v-for="c in cycleTypeOptions" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="周期值">
              <el-input v-model="followUpForm.outpatientCycleValue" placeholder="几号/周几" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时间段">
              <el-select v-model="followUpForm.outpatientTimeSlot" style="width: 100%">
                <el-option v-for="s in timeSlotOptionsList" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="住院时间">
              <el-date-picker v-model="followUpForm.hospitalizationTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="followUpDialogType === 'edit'">
            <el-form-item label="状态">
              <el-select v-model="followUpForm.status" style="width: 100%">
                <el-option label="待随访" :value="0" />
                <el-option label="已完成" :value="1" />
                <el-option label="已取消" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="followUpForm.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="followUpDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveFollowUpSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 用药编辑对话框 -->
    <el-dialog v-model="medicationDialogVisible" :title="medicationDialogType === 'add' ? '新增用药' : '编辑用药'" width="600px">
      <el-form :model="medicationForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="患者" required>
              <el-select v-model="medicationForm.patientId" placeholder="选择患者" style="width: 100%" @change="handleMedicationPatientSelect">
                <el-option v-for="p in patients" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="药品名称" required>
              <el-input v-model="medicationForm.medicationName" placeholder="请输入药品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开药日期">
              <el-date-picker v-model="medicationForm.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="剂量">
              <el-input-number v-model="medicationForm.dosageValue" :min="0" :precision="2" placeholder="剂量" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位">
              <el-select v-model="medicationForm.dosageUnit" style="width: 100%">
                <el-option
                  v-for="u in unitOptions"
                  :key="u.id"
                  :label="u.name"
                  :value="u.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用药频率">
              <el-select v-model="medicationForm.frequency" style="width: 100%">
                <el-option
                  v-for="f in frequencyOptions"
                  :key="f.id"
                  :label="f.name"
                  :value="f.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用药途径">
              <el-select v-model="medicationForm.route" style="width: 100%">
                <el-option
                  v-for="r in routeOptions"
                  :key="r.id"
                  :label="r.name"
                  :value="r.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="疗程">
              <el-input v-model="medicationForm.duration" placeholder="如：7天" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="medicationForm.notes" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="medicationDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveMedicationSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 患者编辑对话框 -->
    <el-dialog v-model="patientDialogVisible" title="编辑患者" width="500px">
      <el-form :model="patientForm" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="patientForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="patientForm.gender" style="width: 100%">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker v-model="patientForm.birthDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="手机号" required>
          <el-input v-model="patientForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="实名认证">
              <el-switch v-model="patientForm.isRealAuth" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="待随访">
              <el-switch v-model="patientForm.hasFollowUp" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="patientDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="savePatientSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.doctor-card {
  background: #fff;
  border-radius: 16px;
  padding: 0;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #E5E7EB;
  overflow: hidden;

  .doctor-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px 28px;
    background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
    border-bottom: 1px solid #E5E7EB;

    .doctor-avatar {
      position: relative;

      .el-avatar {
        border: 3px solid #fff;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
    }

    .doctor-info {
      flex: 1;

      h3 {
        font-size: 24px;
        font-weight: 700;
        color: #0F172A;
        margin-bottom: 12px;
        letter-spacing: 0.5px;
      }

      .doctor-meta {
        display: flex;
        gap: 24px;
        color: #475569;
        font-size: 15px;

        span {
          display: flex;
          align-items: center;
          gap: 6px;

          &:not(:last-child)::after {
            content: '';
            width: 4px;
            height: 4px;
            background: #CBD5E1;
            border-radius: 50%;
            margin-left: 20px;
          }
        }
      }
    }

    .doctor-tags {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .el-tag {
        padding: 6px 14px;
        font-size: 13px;
        font-weight: 500;
        border-radius: 8px;
      }
    }
  }

  .doctor-detail {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0;
    padding: 20px 28px;
    background: #fff;

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-right: 1px solid #F1F5F9;
      border-bottom: 1px solid #F1F5F9;

      &:last-child {
        border-right: none;
      }

      .label {
        color: #64748B;
        font-size: 13px;
        white-space: nowrap;
      }

      .value {
        color: #1E293B;
        font-weight: 600;
        font-size: 14px;
      }
    }
  }
}

.content-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #E5E7EB;

  .el-tabs {
    .el-tabs__header {
      margin-bottom: 24px;
      padding-bottom: 8px;
      border-bottom: 2px solid #E5E7EB;

      .el-tabs__nav-wrap::after {
        display: none;
      }

      .el-tabs__item {
        font-size: 15px;
        font-weight: 500;
        color: #64748B;
        padding: 0 24px;
        height: 44px;
        line-height: 44px;

        &.is-active {
          color: #0891B2;
          font-weight: 600;
        }

        &:hover:not(.is-active) {
          color: #0E7490;
        }
      }

      .el-tabs__active-bar {
        background-color: #0891B2;
        height: 3px;
        border-radius: 2px 2px 0 0;
      }
    }
  }
}

.tab-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #F8FAFC;
  border-radius: 12px;
  border: 1px solid #E5E7EB;

  .tab-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #1E293B;

    .count-badge {
      background: #0891B2;
      color: #fff;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
  }
}

// 表格整体样式
.el-table {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E5E7EB;

  // 表头样式
  th.el-table__cell {
    background: #F1F5F9 !important;
    color: #475569;
    font-weight: 600;
    font-size: 13px;
    padding: 16px 12px;
    border-bottom: 2px solid #E5E7EB;
    text-transform: none;
    letter-spacing: 0.3px;

    .cell {
      padding: 0 8px;
    }
  }

  // 行样式
  td.el-table__cell {
    padding: 14px 12px;
    font-size: 14px;
    color: #334155;
    border-bottom: 1px solid #F1F5F9;

    .cell {
      padding: 0 8px;
    }
  }

  // 斑马纹
  .el-table__row--striped {
    td.el-table__cell {
      background: #F8FAFC;
    }
  }

  // hover 效果
  .el-table__row:hover > td.el-table__cell {
    background: #F0FDFA !important;
  }

  // 操作按钮区
  .el-button + .el-button {
    margin-left: 8px;
  }

  // 状态标签美化
  .el-tag {
    border-radius: 8px;
    font-weight: 500;
    border: none;
    padding: 5px 12px;
    font-size: 12px;

    &.el-tag--success {
      background: #D1FAE5;
      color: #047857;
    }

    &.el-tag--warning {
      background: #FEF3C7;
      color: #B45309;
    }

    &.el-tag--danger {
      background: #FEE2E2;
      color: #B91C1C;
    }

    &.el-tag--info {
      background: #E0F2FE;
      color: #0369A1;
    }

    &.el-tag--plain {
      background: #F1F5F9;
      color: #475569;
      border: 1px solid #E5E7EB;
    }

    &.el-tag--light {
      background: rgba(8, 145, 178, 0.1);
      color: #0891B2;
    }
  }
}

.dosage-value {
  font-weight: 600;
  color: #0891B2;
  font-size: 14px;
}

// 空状态
.el-table__empty-block {
  padding: 48px 24px;

  .el-table__empty-text {
    color: #94A3B8;
    font-size: 14px;
  }
}

// 检查项目多选样式
.exam-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .el-checkbox {
    margin-right: 0;
  }
}
</style>