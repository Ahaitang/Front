<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, User, Picture, Delete } from '@element-plus/icons-vue'
import {
  getPatientById,
  getRecordList,
  getFollowUpList,
  getMedicationList,
  getEpisodesByPatient,
  saveRecord,
  cancelRecord,
  saveFollowUp,
  cancelFollowUp,
  saveMedication,
  cancelMedication,
  saveEpisode,
  deleteEpisode,
  getAllDoctors,
  getCommonDictByType,
  DICT_TYPES,
  uploadFile,
  ocrParseMedical
} from '@/api'
import type { Patient, MedicalRecord, FollowUp, Medication, DiseaseEpisode, Doctor, CommonDict } from '@/api'

const route = useRoute()
const router = useRouter()
const patientId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string') return id
  if (id && id.length > 0) return id[0]!
  return ''
})

// 患者信息
const patient = ref<Patient | null>(null)
const loading = ref(false)

// Tab相关
const activeTab = ref('records')

// 病历相关
const records = ref<MedicalRecord[]>([])
const recordsLoading = ref(false)
const recordDialogVisible = ref(false)
const recordForm = ref<Partial<MedicalRecord>>({})
const recordDialogType = ref<'add' | 'edit'>('add')

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

// 发作记录相关
const episodes = ref<DiseaseEpisode[]>([])
const episodesLoading = ref(false)
const episodeDialogVisible = ref(false)
const episodeForm = ref<Partial<DiseaseEpisode>>({})
const episodeDialogType = ref<'add' | 'edit'>('add')

const doctors = ref<Doctor[]>([])
const saveLoading = ref(false)

// 图片相关
const imageList = ref<string[]>([])
const ocrLoading = ref(false)

// 详情对话框状态
const detailDialogVisible = ref(false)
const detailDialogType = ref<'record' | 'followup' | 'episode' | 'medication'>('record')

// 当前查看的记录（只读副本）
const viewingRecord = ref<Partial<MedicalRecord>>({})
const viewingFollowUp = ref<Partial<FollowUp>>({})
const viewingEpisode = ref<Partial<DiseaseEpisode>>({})
const viewingMedication = ref<Partial<Medication>>({})

// 字典选项
const recordTypeOptions = ref<CommonDict[]>([])
const followUpTypeOptions = ref<CommonDict[]>([])
const examTypeOptions = ref<CommonDict[]>([])       // 随访检查类型
const cycleTypeOptions = ref<CommonDict[]>([])      // 门诊周期类型
const timeSlotOptions = ref<CommonDict[]>([])       // 时间段
const unitOptions = ref<CommonDict[]>([])
const frequencyOptions = ref<CommonDict[]>([])
const routeOptions = ref<CommonDict[]>([])
const examItemsList = ref<string[]>([])             // 检查项目列表
const selectedExamItems = ref<string[]>([])         // 已选检查项目

// 加载字典
const loadDicts = async () => {
  try {
    const [recordTypes, followUpTypes, examTypes, cycleTypes, timeSlots, units, frequencies, routes] = await Promise.all([
      getCommonDictByType(DICT_TYPES.RECORD_TYPE),
      getCommonDictByType(DICT_TYPES.FOLLOW_UP_TYPE),
      getCommonDictByType(DICT_TYPES.FOLLOW_UP_EXAM_TYPE),
      getCommonDictByType(DICT_TYPES.OUTPATIENT_CYCLE_TYPE),
      getCommonDictByType(DICT_TYPES.TIME_SLOT),
      getCommonDictByType(DICT_TYPES.MEDICATION_UNIT),
      getCommonDictByType(DICT_TYPES.FREQUENCY),
      getCommonDictByType(DICT_TYPES.ROUTE)
    ])
    recordTypeOptions.value = recordTypes
    followUpTypeOptions.value = followUpTypes
    examTypeOptions.value = examTypes
    cycleTypeOptions.value = cycleTypes
    timeSlotOptions.value = timeSlots
    unitOptions.value = units
    frequencyOptions.value = frequencies
    routeOptions.value = routes
  } catch (e) {
    console.error('加载字典失败:', e)
  }
}

// 状态相关 - 使用整数
const getStatusType = (status: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '进行中', 1: '已完成', 2: '已删除' }
  return map[status] || '进行中'
}

// 根据开药日期和疗程计算用药状态
const calculateMedicationStatus = (date: string, duration?: string): number => {
  if (!date) return 0
  if (!duration) return 0

  const startDate = new Date(date.substring(0, 10))
  let daysToAdd = 0

  const durationMatch = duration.match(/^(\d+)(天|周|个月|月)$/)
  if (durationMatch) {
    const value = parseInt(durationMatch[1])
    const unit = durationMatch[2]
    if (unit === '天') daysToAdd = value
    else if (unit === '周') daysToAdd = value * 7
    else if (unit === '个月' || unit === '月') daysToAdd = value * 30
  } else {
    return 0
  }

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysToAdd)
  endDate.setHours(23, 59, 59)

  const now = new Date()
  return now > endDate ? 1 : 0
}

// 根据记录计算用药实际状态
const getActualMedicationStatus = (row: Medication): number => {
  if (row.status === 2) return 2
  return calculateMedicationStatus(row.date, row.duration)
}

const getUnitLabel = (unit: string) => {
  const found = unitOptions.value.find(u => u.name === unit || u.code === unit)
  return found ? found.name : unit || '-'
}

// 加载患者信息
const loadPatient = async () => {
  loading.value = true
  try {
    const id = patientId.value
    if (id) {
      const res = await getPatientById(id)
      patient.value = res
    }
  } catch (e) {
    ElMessage.error('加载患者信息失败')
  } finally {
    loading.value = false
  }
}

// 加载病历记录
const loadRecords = async () => {
  recordsLoading.value = true
  try {
    const res = await getRecordList({ pageNum: 1, pageSize: 100, patientId: Number(patientId.value) })
    records.value = res?.list || []
  } catch (e) {
    console.error('加载病历失败:', e)
  } finally {
    recordsLoading.value = false
  }
}

// 加载随访记录
const loadFollowUps = async () => {
  followUpsLoading.value = true
  try {
    const res = await getFollowUpList({ pageNum: 1, pageSize: 100, patientId: Number(patientId.value) })
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
    const res = await getMedicationList({ pageNum: 1, pageSize: 100, patientId: Number(patientId.value) })
    medications.value = res?.list || []
  } catch (e) {
    console.error('加载用药记录失败:', e)
  } finally {
    medicationsLoading.value = false
  }
}

// 加载发作记录
const loadEpisodes = async () => {
  episodesLoading.value = true
  try {
    const res = await getEpisodesByPatient(Number(patientId.value))
    episodes.value = res || []
  } catch (e) {
    console.error('加载发作记录失败:', e)
  } finally {
    episodesLoading.value = false
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
  loadPatient()
  loadRecords()
  loadFollowUps()
  loadMedications()
  loadDoctors()
})

// Tab切换
const handleTabChange = (tab: string) => {
  if (tab === 'records' && records.value.length === 0) loadRecords()
  if (tab === 'followups' && followUps.value.length === 0) loadFollowUps()
  if (tab === 'medications' && medications.value.length === 0) loadMedications()
  if (tab === 'episodes' && episodes.value.length === 0) loadEpisodes()
}

// ========== 病历相关操作 ==========
const openAddRecordDialog = () => {
  recordForm.value = {
    patientId: Number(patientId.value),
    patientName: patient.value?.name || '',
    type: '门诊病历',
    date: new Date().toISOString().split('T')[0],
    status: 0
  }
  imageList.value = []
  recordDialogType.value = 'add'
  recordDialogVisible.value = true
}

const openEditRecordDialog = (row: MedicalRecord) => {
  recordForm.value = { ...row }
  // 编辑时，将后端返回的完整日期格式截取为短格式供 date-picker 使用
  if (row.date && row.date.length > 10) {
    recordForm.value.date = row.date.substring(0, 10)
  }
  // 加载已有图片
  if (row.attachments) {
    imageList.value = row.attachments.split(',').filter((url: string) => url)
  } else {
    imageList.value = []
  }
  recordDialogType.value = 'edit'
  recordDialogVisible.value = true
}

const saveRecordSubmit = async () => {
  if (!recordForm.value.diagnosis) {
    ElMessage.warning('请输入诊断结果')
    return
  }
  // 保存图片URL列表
  recordForm.value.attachments = imageList.value.join(',')

  saveLoading.value = true
  try {
    // 将日期转换为 LocalDateTime 格式 (yyyy-MM-dd HH:mm:ss)
    const submitData = {
      ...recordForm.value,
      date: recordForm.value.date ? `${recordForm.value.date} 00:00:00` : undefined
    }
    await saveRecord(submitData)
    ElMessage.success(recordDialogType.value === 'add' ? '添加成功' : '保存成功')
    recordDialogVisible.value = false
    loadRecords()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 图片上传
const handleImageUpload = async (options: any) => {
  const { file } = options
  try {
    ElMessage.info('正在上传图片...')
    const res = await uploadFile(file)
    if (res && res.url) {
      imageList.value.push(res.url)
      ElMessage.success('上传成功')
    }
  } catch (e) {
    ElMessage.error('上传失败')
  }
}

// 删除图片
const removeImage = (index: number) => {
  imageList.value.splice(index, 1)
}

// OCR识别
const handleOcrParse = async () => {
  if (imageList.value.length === 0) {
    ElMessage.warning('请先上传图片')
    return
  }

  ocrLoading.value = true
  try {
    const res = await ocrParseMedical(imageList.value)
    if (res && res.success && res.content) {
      // 将识别内容覆盖病历内容
      recordForm.value.content = res.content
      ElMessage.success('识别成功')
    } else {
      ElMessage.warning(res.errorMsg || '识别失败，请手动输入')
    }
  } catch (e) {
    ElMessage.error('OCR识别失败')
  } finally {
    ocrLoading.value = false
  }
}

const cancelRecordConfirm = (row: MedicalRecord) => {
  ElMessageBox.confirm('确定要删除该病历记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '删除',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelRecord(row.id)
      ElMessage.success('已删除')
      loadRecords()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

// ========== 随访相关操作 ==========
const openAddFollowUpDialog = () => {
  followUpForm.value = {
    patientId: Number(patientId.value),
    patientName: patient.value?.name || '',
    patientGender: patient.value?.gender || '男',
    patientAge: calculateAge(patient.value?.birthDate) || 0,
    // 新字段
    followUpExamTypeId: examTypeOptions.value[0]?.id || null,
    followUpExamTypeName: examTypeOptions.value[0]?.name || '',
    examinationItems: '',
    outpatientCycleType: 'monthly',
    outpatientCycleValue: '',
    outpatientTimeSlot: 'morning',
    hospitalizationTime: '',
    notes: '',
    // 保留字段
    doctorId: null,
    doctorName: '',
    status: 0
  }
  // 解析默认检查项目
  if (examTypeOptions.value.length > 0) {
    handleExamTypeChange(examTypeOptions.value[0].id)
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
        : null
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
  ElMessageBox.confirm('确定要删除该随访记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '删除',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelFollowUp(row.id)
      ElMessage.success('已删除')
      loadFollowUps()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

// ========== 用药相关操作 ==========
const openAddMedicationDialog = () => {
  medicationForm.value = {
    patientId: Number(patientId.value),
    patientName: patient.value?.name || '',
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
  // 编辑时，将后端返回的完整日期格式截取为短格式供 date-picker 使用
  if (row.date && row.date.length > 10) {
    medicationForm.value.date = row.date.substring(0, 10)
  }
  medicationDialogType.value = 'edit'
  medicationDialogVisible.value = true
}

const saveMedicationSubmit = async () => {
  if (!medicationForm.value.medicationName) {
    ElMessage.warning('请输入药品名称')
    return
  }
  saveLoading.value = true
  try {
    // 将日期转换为 LocalDateTime 格式 (yyyy-MM-dd HH:mm:ss)
    const submitData = {
      ...medicationForm.value,
      date: medicationForm.value.date ? `${medicationForm.value.date} 00:00:00` : undefined
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
  ElMessageBox.confirm('确定要删除该用药记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '删除',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelMedication(row.id)
      ElMessage.success('已删除')
      loadMedications()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

// ========== 发作记录相关操作 ==========
const openAddEpisodeDialog = () => {
  episodeForm.value = {
    patientId: Number(patientId.value),
    patientName: patient.value?.name || '',
    episodeNumber: (episodes.value.length + 1),
    episodeDate: new Date().toISOString().split('T')[0]
  }
  episodeDialogType.value = 'add'
  episodeDialogVisible.value = true
}

const openEditEpisodeDialog = (row: DiseaseEpisode) => {
  episodeForm.value = { ...row }
  if (row.episodeDate && row.episodeDate.length > 10) {
    episodeForm.value.episodeDate = row.episodeDate.substring(0, 10)
  }
  episodeDialogType.value = 'edit'
  episodeDialogVisible.value = true
}

const saveEpisodeSubmit = async () => {
  if (!episodeForm.value.chiefComplaint) {
    ElMessage.warning('请输入主诉')
    return
  }
  saveLoading.value = true
  try {
    const submitData = {
      ...episodeForm.value,
      episodeDate: episodeForm.value.episodeDate ? `${episodeForm.value.episodeDate} 00:00:00` : undefined
    }
    await saveEpisode(submitData)
    ElMessage.success(episodeDialogType.value === 'add' ? '添加成功' : '保存成功')
    episodeDialogVisible.value = false
    loadEpisodes()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const deleteEpisodeConfirm = (row: DiseaseEpisode) => {
  ElMessageBox.confirm(`确定要删除第${row.episodeNumber}次发作记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteEpisode(row.id)
      ElMessage.success('已删除')
      loadEpisodes()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

// 选择医生
const handleDoctorSelect = (doctorId: number) => {
  const doctor = doctors.value.find(d => d.id === doctorId)
  if (doctor) {
    if (followUpForm.value) {
      followUpForm.value.doctorId = doctorId
      followUpForm.value.doctorName = doctor.name
    }
  }
}

const handleMedicationDoctorSelect = (doctorId: number) => {
  const doctor = doctors.value.find(d => d.id === doctorId)
  if (doctor && medicationForm.value) {
    medicationForm.value.doctorId = doctorId
    medicationForm.value.doctorName = doctor.name
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

  const typeText = typeMap[row.outpatientCycleType] || ''
  const value = row.outpatientCycleValue || ''
  const slotText = slotMap[row.outpatientTimeSlot] || ''

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

// 返回
const goBack = () => {
  router.push('/patients')
}

// ========== 详情查看相关操作 ==========
const handleRowClick = (row: any, type: 'record' | 'followup' | 'episode' | 'medication') => {
  switch (type) {
    case 'record':
      viewingRecord.value = { ...row }
      break
    case 'followup':
      viewingFollowUp.value = { ...row }
      break
    case 'episode':
      viewingEpisode.value = { ...row }
      break
    case 'medication':
      viewingMedication.value = { ...row }
      break
  }
  detailDialogType.value = type
  detailDialogVisible.value = true
}

// 从详情切换到编辑
const switchToEdit = () => {
  detailDialogVisible.value = false
  switch (detailDialogType.value) {
    case 'record':
      openEditRecordDialog(viewingRecord.value as MedicalRecord)
      break
    case 'followup':
      openEditFollowUpDialog(viewingFollowUp.value as FollowUp)
      break
    case 'episode':
      openEditEpisodeDialog(viewingEpisode.value as DiseaseEpisode)
      break
    case 'medication':
      openEditMedicationDialog(viewingMedication.value as Medication)
      break
  }
}

const closeDetailDialog = () => {
  detailDialogVisible.value = false
}

const formatDate = (date: string) => date || '-'

// 年龄计算函数
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
      <el-button @click="goBack" :icon="ArrowLeft">返回患者列表</el-button>
      <div class="page-title" v-if="patient">
        <el-icon><User /></el-icon>
        患者详情 - {{ patient.name }}
      </div>
    </div>

    <!-- 患者基本信息 -->
    <div class="patient-card" v-loading="loading">
      <template v-if="patient">
        <div class="patient-header">
          <div class="patient-avatar">
            <el-avatar :size="72" :style="{ background: '#0891B2' }">{{ patient.name?.charAt(0) }}</el-avatar>
          </div>
          <div class="patient-info">
            <h3>{{ patient.name }}</h3>
            <div class="patient-meta">
              <span>{{ patient.gender }}</span>
              <span>{{ calculateAge(patient.birthDate) ?? '-' }}岁</span>
              <span>{{ patient.phone }}</span>
            </div>
          </div>
          <div class="patient-tags">
            <el-tag :type="patient.isRealAuth ? 'success' : 'warning'" effect="light">
              {{ patient.isRealAuth ? '已实名' : '未实名' }}
            </el-tag>
            <el-tag :type="patient.hasFollowUp ? 'danger' : 'info'" effect="light">
              {{ patient.hasFollowUp ? '待随访' : '正常' }}
            </el-tag>
          </div>
        </div>
        <div class="patient-detail">
          <div class="detail-item">
            <span class="label">主治医生:</span>
            <span class="value">{{ patient.doctorName || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDate(patient.createTime || '') }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- Tab切换 -->
    <div class="content-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 病历记录 -->
        <el-tab-pane label="病历记录" name="records">
          <div class="tab-header">
            <div class="tab-title">
              <span>病历记录列表</span>
              <span class="count-badge">{{ records.length }}</span>
            </div>
            <el-button type="primary" :icon="Plus" @click="openAddRecordDialog">新增病历</el-button>
          </div>
          <el-table :data="records" stripe v-loading="recordsLoading" empty-text="暂无病历记录" class="clickable-table" @row-click="(row: MedicalRecord) => handleRowClick(row, 'record')">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="light">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="就诊日期" width="120" />
            <el-table-column prop="diagnosis" label="诊断" min-width="200" show-overflow-tooltip />
            <el-table-column prop="hospital" label="医院" min-width="150" show-overflow-tooltip />
            <el-table-column prop="department" label="科室" width="100" />
            <el-table-column prop="doctorName" label="医生" width="100" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click.stop="openEditRecordDialog(row)">编辑</el-button>
                <el-button v-if="row.status === 0" type="danger" link size="small" @click.stop="cancelRecordConfirm(row)">删除</el-button>
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
          <el-table :data="followUps" stripe v-loading="followUpsLoading" empty-text="暂无随访记录" class="clickable-table" @row-click="(row: FollowUp) => handleRowClick(row, 'followup')">
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
            <el-table-column prop="doctorName" label="随访医生" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small" effect="light">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click.stop="openEditFollowUpDialog(row)">编辑</el-button>
                <el-button v-if="row.status === 0" type="danger" link size="small" @click.stop="cancelFollowUpConfirm(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 发作记录 -->
        <el-tab-pane label="发作记录" name="episodes">
          <div class="tab-header">
            <div class="tab-title">
              <span>发作记录列表</span>
              <span class="count-badge">{{ episodes.length }}</span>
            </div>
            <el-button type="primary" :icon="Plus" @click="openAddEpisodeDialog">新增发作</el-button>
          </div>
          <el-table :data="episodes" stripe v-loading="episodesLoading" empty-text="暂无发作记录" class="clickable-table" @row-click="(row: DiseaseEpisode) => handleRowClick(row, 'episode')">
            <el-table-column prop="episodeNumber" label="发作次数" width="100">
              <template #default="{ row }">
                <el-tag type="warning" size="small" effect="light">第{{ row.episodeNumber }}次</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="episodeDate" label="发作时间" width="140" />
            <el-table-column prop="chiefComplaint" label="主诉" min-width="180" show-overflow-tooltip />
            <el-table-column prop="symptoms" label="症状" min-width="150" show-overflow-tooltip />
            <el-table-column prop="diagnosis" label="诊断" min-width="150" show-overflow-tooltip />
            <el-table-column prop="hospital" label="医院" min-width="120" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click.stop="openEditEpisodeDialog(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click.stop="deleteEpisodeConfirm(row)">删除</el-button>
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
          <el-table :data="medications" stripe v-loading="medicationsLoading" empty-text="暂无用药记录" class="clickable-table" @row-click="(row: Medication) => handleRowClick(row, 'medication')">
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
            <el-table-column prop="doctorName" label="开药医生" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(getActualMedicationStatus(row))" size="small" effect="light">{{ getStatusText(getActualMedicationStatus(row)) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click.stop="openEditMedicationDialog(row)">编辑</el-button>
                <el-button v-if="getActualMedicationStatus(row) === 0" type="danger" link size="small" @click.stop="cancelMedicationConfirm(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 病历编辑对话框 -->
    <el-dialog v-model="recordDialogVisible" :title="recordDialogType === 'add' ? '新增病历' : '编辑病历'" width="600px">
      <el-form :model="recordForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="病历类型">
              <el-select v-model="recordForm.type" style="width: 100%">
                <el-option
                  v-for="t in recordTypeOptions"
                  :key="t.id"
                  :label="t.name"
                  :value="t.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="就诊日期">
              <el-date-picker v-model="recordForm.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="医院">
              <el-input v-model="recordForm.hospital" placeholder="请输入医院名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科室">
              <el-input v-model="recordForm.department" placeholder="请输入科室" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="医生姓名">
              <el-input v-model="recordForm.doctorName" placeholder="请输入医生姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="诊断结果" required>
          <el-input v-model="recordForm.diagnosis" placeholder="请输入诊断结果" />
        </el-form-item>

        <!-- 图片上传区域 -->
        <el-form-item label="病历图片">
          <div class="image-upload-area">
            <el-upload
              :show-file-list="false"
              :http-request="handleImageUpload"
              accept="image/*"
            >
              <el-button type="primary" :icon="Picture">上传图片</el-button>
            </el-upload>
            <el-button
              type="success"
              :loading="ocrLoading"
              :disabled="imageList.length === 0"
              @click="handleOcrParse"
              style="margin-left: 10px"
            >
              OCR识别
            </el-button>
          </div>
          <div class="image-list" v-if="imageList.length > 0">
            <div class="image-item" v-for="(url, index) in imageList" :key="index">
              <el-image :src="url" fit="cover" style="width: 80px; height: 80px" />
              <el-button type="danger" :icon="Delete" size="small" circle @click="removeImage(index)" />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="病历内容">
          <el-input v-model="recordForm.content" type="textarea" :rows="4" placeholder="请输入病历内容或使用OCR识别" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">删除</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveRecordSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 随访编辑对话框 -->
    <el-dialog v-model="followUpDialogVisible" :title="followUpDialogType === 'add' ? '新增随访' : '编辑随访'" width="650px">
      <el-form :model="followUpForm" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="随访检查类型">
              <el-select v-model="followUpForm.followUpExamTypeId" style="width: 100%" @change="handleExamTypeChange">
                <el-option v-for="t in examTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="随访医生">
              <el-select v-model="followUpForm.doctorId" placeholder="选择医生" style="width: 100%" @change="handleDoctorSelect">
                <el-option v-for="d in doctors" :key="d.id" :label="`${d.name} - ${d.department}`" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="检查项目">
          <div class="exam-checkboxes" v-if="examItemsList.length > 0">
            <el-checkbox-group v-model="selectedExamItems">
              <el-checkbox v-for="item in examItemsList" :key="item" :label="item">{{ item }}</el-checkbox>
            </el-checkbox-group>
          </div>
          <el-input v-model="followUpForm.examinationItems" placeholder="已选项目或自定义输入" style="margin-top: 8px" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="门诊周期">
              <el-select v-model="followUpForm.outpatientCycleType" style="width: 100%">
                <el-option v-for="c in cycleTypeOptions" :key="c.id" :label="c.name" :value="c.code" />
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
                <el-option v-for="s in timeSlotOptions" :key="s.id" :label="s.name" :value="s.code" />
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
          <el-col :span="12">
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
            <el-form-item label="药品名称" required>
              <el-input v-model="medicationForm.medicationName" placeholder="请输入药品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开药日期">
              <el-date-picker v-model="medicationForm.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="剂量">
              <el-input-number v-model="medicationForm.dosageValue" :min="0" :precision="2" placeholder="剂量" style="width: 100%" />
            </el-form-item>
          </el-col>
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
        </el-row>
        <el-row :gutter="20">
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
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="疗程">
              <el-input v-model="medicationForm.duration" placeholder="如：7天" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开药医生">
              <el-select v-model="medicationForm.doctorId" placeholder="选择医生" style="width: 100%" @change="handleMedicationDoctorSelect">
                <el-option v-for="d in doctors" :key="d.id" :label="`${d.name} - ${d.department}`" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="medicationForm.notes" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="medicationDialogVisible = false">删除</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveMedicationSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发作记录编辑对话框 -->
    <el-dialog v-model="episodeDialogVisible" :title="episodeDialogType === 'add' ? '新增发作' : '编辑发作'" width="700px">
      <el-form :model="episodeForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发作次数">
              <el-input-number v-model="episodeForm.episodeNumber" :min="1" placeholder="发作次数" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发作时间" required>
              <el-date-picker v-model="episodeForm.episodeDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="就诊医院">
              <el-input v-model="episodeForm.hospital" placeholder="请输入医院名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科室">
              <el-input v-model="episodeForm.department" placeholder="请输入科室" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="主诉" required>
          <el-input v-model="episodeForm.chiefComplaint" placeholder="请输入主诉" />
        </el-form-item>
        <el-form-item label="症状描述">
          <el-input v-model="episodeForm.symptoms" type="textarea" :rows="3" placeholder="请输入症状描述" />
        </el-form-item>
        <el-form-item label="病情变化">
          <el-input v-model="episodeForm.diseaseProgress" type="textarea" :rows="2" placeholder="请输入病情变化" />
        </el-form-item>
        <el-form-item label="诊治经过">
          <el-input v-model="episodeForm.treatmentProcess" type="textarea" :rows="2" placeholder="请输入诊治经过" />
        </el-form-item>
        <el-form-item label="诊断结果">
          <el-input v-model="episodeForm.diagnosis" placeholder="请输入诊断结果" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="episodeForm.notes" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="episodeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveEpisodeSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.patient-card {
  background: #fff;
  border-radius: 16px;
  padding: 0;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #E5E7EB;
  overflow: hidden;

  .patient-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px 28px;
    background: linear-gradient(135deg, #F0FDFA 0%, #ECFEFF 100%);
    border-bottom: 1px solid #E5E7EB;

    .patient-avatar {
      position: relative;

      .el-avatar {
        border: 3px solid #fff;
        box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
      }
    }

    .patient-info {
      flex: 1;

      h3 {
        font-size: 24px;
        font-weight: 700;
        color: #0F172A;
        margin-bottom: 12px;
        letter-spacing: 0.5px;
      }

      .patient-meta {
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

    .patient-tags {
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

  .patient-detail {
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

.image-upload-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.image-list {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.image-item {
  position: relative;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 4px;
  background: #F8FAFC;

  .el-button {
    position: absolute;
    top: -8px;
    right: -8px;
  }
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