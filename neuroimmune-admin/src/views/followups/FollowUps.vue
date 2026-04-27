<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Document, Clock, CircleCheck, CircleClose, DocumentCopy } from '@element-plus/icons-vue'
import {
  getFollowUpList,
  saveFollowUp as saveFollowUpApi,
  updateFollowUpStatus,
  cancelFollowUp as cancelFollowUpApi,
  getAllDoctors,
  getCommonDictByType,
  DICT_TYPES
} from '@/api'
import { getPatientList } from '@/api'
import { exportToExcel } from '@/utils/export'
import type { FollowUp, Doctor, Patient, CommonDict } from '@/api'

const searchForm = ref({
  keyword: '',
  status: '',
  dateRange: [] as string[],
  type: '',
  startDate: '',
  endDate: ''
})

const tableData = ref<FollowUp[]>([])
const patients = ref<Patient[]>([])
const doctors = ref<Doctor[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = ref({
  pageNum: 1,
  pageSize: 10
})

// 统计数据 - 使用整数状态
const statusStats = computed(() => {
  const pending = tableData.value.filter(f => f.status === 0).length
  const completed = tableData.value.filter(f => f.status === 1).length
  const cancelled = tableData.value.filter(f => f.status === 2).length
  return { pending, completed, cancelled, total: tableData.value.length }
})

const dialogVisible = ref(false)
const dialogType = ref<'view' | 'edit' | 'add'>('view')
const currentFollowUp = ref<Partial<FollowUp>>({})
const saveLoading = ref(false)

// 字典选项
const followUpTypeOptions = ref<CommonDict[]>([])
const followUpExamTypeOptions = ref<CommonDict[]>([])
const outpatientCycleTypeOptions = ref<CommonDict[]>([])
const timeSlotOptions = ref<CommonDict[]>([])

// 检查项目多选
const selectedExamItems = ref<string[]>([])
const availableExamItems = ref<string[]>([])

// 加载字典
const loadDicts = async () => {
  try {
    const [followUpTypes, examTypes, cycleTypes, timeSlots] = await Promise.all([
      getCommonDictByType(DICT_TYPES.FOLLOW_UP_TYPE),
      getCommonDictByType(DICT_TYPES.FOLLOW_UP_EXAM_TYPE),
      getCommonDictByType(DICT_TYPES.OUTPATIENT_CYCLE_TYPE),
      getCommonDictByType(DICT_TYPES.TIME_SLOT)
    ])
    followUpTypeOptions.value = followUpTypes || []
    followUpExamTypeOptions.value = examTypes || []
    outpatientCycleTypeOptions.value = cycleTypes || []
    timeSlotOptions.value = timeSlots || []
  } catch (e) {
    console.error('加载字典失败:', e)
  }
}

// 门诊周期类型选项（备用，如果字典未配置）
const cycleTypeOptions = [
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'quarterly', label: '每季度' }
]

// 时间段选项（备用，如果字典未配置）
const timeSlotOptionsList = [
  { value: 'morning', label: '上午' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '晚上' }
]

// 格式化门诊随访周期显示
const formatOutpatientCycle = (row: FollowUp): string => {
  if (!row.outpatientCycleType && !row.outpatientCycleValue) return '-'

  let typeLabel = ''
  if (row.outpatientCycleType) {
    const found = cycleTypeOptions.find(o => o.value === row.outpatientCycleType)
    typeLabel = found ? found.label : row.outpatientCycleType
  }

  const value = row.outpatientCycleValue || ''
  let timeLabel = ''
  if (row.outpatientTimeSlot) {
    const found = timeSlotOptionsList.find(o => o.value === row.outpatientTimeSlot)
    timeLabel = found ? found.label : row.outpatientTimeSlot
  }

  let result = ''
  if (value && typeLabel) {
    result = `${value}${typeLabel}`
  } else if (typeLabel) {
    result = typeLabel
  }
  if (timeLabel) {
    result += ` ${timeLabel}`
  }
  return result || '-'
}

// 状态相关 - 使用整数
const getStatusType = (status: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '待随访', 1: '已完成', 2: '已取消' }
  return map[status] || '待随访'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      ...pagination.value,
      keyword: searchForm.value.keyword || '',
      type: searchForm.value.type || '',
      startDate: searchForm.value.dateRange?.[0] || '',
      endDate: searchForm.value.dateRange?.[1] || ''
    }
    // 只在有值时添加 status 参数
    if (searchForm.value.status) {
      params.status = searchForm.value.status
    }
    const res = await getFollowUpList(params)
    if (res) {
      tableData.value = res.list || []
      total.value = res.total || 0
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

// 加载患者列表
const loadPatients = async () => {
  try {
    const res = await getPatientList({ pageNum: 1, pageSize: 1000 })
    patients.value = res?.list || []
  } catch (e) {
    console.error('加载患者列表失败:', e)
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
  loadData()
  loadPatients()
  loadDoctors()
})

const handleSearch = () => {
  pagination.value.pageNum = 1
  loadData()
}

const handleReset = () => {
  searchForm.value = {
    keyword: '',
    status: '',
    dateRange: [],
    type: '',
    startDate: '',
    endDate: ''
  }
  handleSearch()
}

const handlePageChange = (page: number) => {
  pagination.value.pageNum = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.pageNum = 1
  loadData()
}

const viewFollowUp = (row: FollowUp) => {
  currentFollowUp.value = { ...row }
  // 解析检查项目
  if (row.examinationItems) {
    selectedExamItems.value = row.examinationItems.split(',').filter(Boolean)
  } else {
    selectedExamItems.value = []
  }
  dialogType.value = 'view'
  dialogVisible.value = true
}

const editFollowUp = (row: FollowUp) => {
  currentFollowUp.value = { ...row }
  // 解析检查项目
  if (row.examinationItems) {
    selectedExamItems.value = row.examinationItems.split(',').filter(Boolean)
  } else {
    selectedExamItems.value = []
  }
  // 触发检查类型变更以加载可用检查项目
  if (row.followUpExamTypeId) {
    handleExamTypeChange(row.followUpExamTypeId)
  }
  dialogType.value = 'edit'
  dialogVisible.value = true
}

const addFollowUp = () => {
  // 生成当前日期时间格式 YYYY-MM-DD HH:mm:ss
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const dateTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:00`
  currentFollowUp.value = {
    patientId: undefined,
    patientName: '',
    patientGender: '男',
    patientAge: 0,
    doctorId: undefined,
    doctorName: '',
    date: dateTimeStr,
    project: '',
    type: '定期随访',
    status: 0,
    content: '',
    outpatientCycleType: '',
    outpatientCycleValue: '',
    outpatientTimeSlot: '',
    hospitalizationTime: '',
    followUpExamTypeId: undefined,
    followUpExamTypeName: '',
    examinationItems: '',
    notes: ''
  }
  selectedExamItems.value = []
  availableExamItems.value = []
  dialogType.value = 'add'
  dialogVisible.value = true
}

const completeFollowUp = (row: FollowUp) => {
  ElMessageBox.confirm('确定要完成该随访吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await updateFollowUpStatus(row.id, 1)
      ElMessage.success('随访已完成')
      loadData()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

const cancelFollowUpRecord = (row: FollowUp) => {
  ElMessageBox.confirm('确定要取消该随访吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelFollowUpApi(row.id)
      ElMessage.success('随访已取消')
      loadData()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

// 随访检查类型变更处理
const handleExamTypeChange = (examTypeId: number) => {
  const examType = followUpExamTypeOptions.value.find(t => t.id === examTypeId)
  if (examType) {
    currentFollowUp.value.followUpExamTypeId = examTypeId
    currentFollowUp.value.followUpExamTypeName = examType.name
    // 根据检查类型设置可用的检查项目（示例：从描述字段解析）
    if (examType.description) {
      availableExamItems.value = examType.description.split(',').map(s => s.trim()).filter(Boolean)
    } else {
      availableExamItems.value = []
    }
  } else {
    currentFollowUp.value.followUpExamTypeId = undefined
    currentFollowUp.value.followUpExamTypeName = ''
    availableExamItems.value = []
  }
  // 清空已选检查项目
  selectedExamItems.value = []
}

// 检查项目选择变更
const handleExamItemsChange = (items: string[]) => {
  currentFollowUp.value.examinationItems = items.join(',')
}

const saveFollowUp = async () => {
  if (!currentFollowUp.value.patientId) {
    ElMessage.warning('请选择患者')
    return
  }
  if (!currentFollowUp.value.doctorId) {
    ElMessage.warning('请选择医生')
    return
  }
  if (!currentFollowUp.value.project) {
    ElMessage.warning('请输入随访项目')
    return
  }

  saveLoading.value = true
  try {
    const submitData = { ...currentFollowUp.value }
    // 如果 date 只有日期部分，补上时间
    if (submitData.date && submitData.date.length === 10) {
      submitData.date = submitData.date + ' 00:00:00'
    }
    // 同步检查项目
    submitData.examinationItems = selectedExamItems.value.join(',')
    await saveFollowUpApi(submitData)
    ElMessage.success(dialogType.value === 'add' ? '添加成功' : '保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 选择患者
const handlePatientSelect = (patientId: number) => {
  const patient = patients.value.find(p => p.id === patientId)
  if (patient && currentFollowUp.value) {
    currentFollowUp.value.patientId = patientId
    currentFollowUp.value.patientName = patient.name
    currentFollowUp.value.patientGender = patient.gender
    currentFollowUp.value.patientAge = patient.age
  }
}

// 选择医生
const handleDoctorSelect = (doctorId: number) => {
  const doctor = doctors.value.find(d => d.id === doctorId)
  if (doctor && currentFollowUp.value) {
    currentFollowUp.value.doctorId = doctorId
    currentFollowUp.value.doctorName = doctor.name
  }
}

const formatDate = (date: string) => {
  return date || '-'
}

// 导出数据
const handleExport = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const exportData = tableData.value.map(item => ({
    '患者姓名': item.patientName,
    '患者性别': item.patientGender,
    '患者年龄': item.patientAge,
    '随访医生': item.doctorName,
    '门诊随访周期': formatOutpatientCycle(item),
    '住院时间': item.hospitalizationTime || '-',
    '随访检查类型': item.followUpExamTypeName || '-',
    '检查项目': item.examinationItems || '-',
    '随访日期': item.date,
    '随访项目': item.project,
    '随访类型': item.type,
    '状态': getStatusText(item.status),
    '备注': item.notes || item.content || '-',
    '创建时间': formatDate(item.createTime || '')
  }))
  exportToExcel(exportData, '随访列表')
}
</script>

<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon><Calendar /></el-icon>
        随访管理
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <div class="stat-value">{{ statusStats.total }}</div>
        <div class="stat-label">总随访</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">
          <el-icon :size="24"><Clock /></el-icon>
        </div>
        <div class="stat-value">{{ statusStats.pending }}</div>
        <div class="stat-label">待随访</div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-value">{{ statusStats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon">
          <el-icon :size="24"><CircleClose /></el-icon>
        </div>
        <div class="stat-value">{{ statusStats.cancelled }}</div>
        <div class="stat-label">已取消</div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="患者/医生/项目"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部状态" style="width: 120px">
            <el-option label="待随访" value="0" />
            <el-option label="已完成" value="1" />
            <el-option label="已取消" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" clearable placeholder="全部类型" style="width: 120px">
            <el-option
              v-for="t in followUpTypeOptions"
              :key="t.id"
              :label="t.name"
              :value="t.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="addFollowUp">新建随访</el-button>
          <el-button type="info" @click="handleExport">
            <el-icon><DocumentCopy /></el-icon>
            导出数据
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="content-card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="patientName" label="患者姓名" min-width="100" />
        <el-table-column prop="patientGender" label="性别" width="70" />
        <el-table-column prop="patientAge" label="年龄" width="70">
          <template #default="{ row }">
            {{ row.patientAge }}岁
          </template>
        </el-table-column>
        <el-table-column prop="doctorName" label="随访医生" min-width="100" />
        <el-table-column label="门诊随访周期" min-width="130">
          <template #default="{ row }">
            <span>{{ formatOutpatientCycle(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="hospitalizationTime" label="住院时间" min-width="110">
          <template #default="{ row }">
            <span>{{ row.hospitalizationTime || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="followUpExamTypeName" label="随访检查类型" min-width="120">
          <template #default="{ row }">
            <el-tag v-if="row.followUpExamTypeName" type="info" effect="plain" size="small">
              {{ row.followUpExamTypeName }}
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="examinationItems" label="检查项目" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.examinationItems || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="随访日期" min-width="110" />
        <el-table-column prop="project" label="随访项目" min-width="120" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" min-width="100">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-muted">{{ row.notes || row.content || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            <span class="text-secondary">{{ formatDate(row.createTime || '') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editFollowUp(row)">编辑</el-button>
            <el-button
              v-if="row.status === 0"
              type="success"
              link
              size="small"
              @click="completeFollowUp(row)"
            >完成</el-button>
            <el-button
              v-if="row.status === 0"
              type="warning"
              link
              size="small"
              @click="cancelFollowUpRecord(row)"
            >取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 50]"
          :page-size="pagination.pageSize"
          :current-page="pagination.pageNum"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 详情/编辑/新增对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'view' ? '随访详情' : dialogType === 'add' ? '新建随访' : '编辑随访'"
      width="750px"
    >
      <template v-if="currentFollowUp">
        <el-form :model="currentFollowUp" label-width="120px" :disabled="dialogType === 'view'">
          <el-row :gutter="20" v-if="dialogType === 'view'">
            <el-col :span="12">
              <el-form-item label="状态">
                <el-tag :type="getStatusType(currentFollowUp.status || 0)" size="small">
                  {{ getStatusText(currentFollowUp.status || 0) }}
                </el-tag>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="患者" required>
                <el-select
                  v-model="currentFollowUp.patientId"
                  placeholder="选择患者"
                  style="width: 100%"
                  filterable
                  @change="handlePatientSelect"
                >
                  <el-option
                    v-for="p in patients"
                    :key="p.id"
                    :label="`${p.name} (${p.phone})`"
                    :value="p.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="随访医生" required>
                <el-select
                  v-model="currentFollowUp.doctorId"
                  placeholder="选择医生"
                  style="width: 100%"
                  @change="handleDoctorSelect"
                >
                  <el-option
                    v-for="d in doctors"
                    :key="d.id"
                    :label="`${d.name} - ${d.department}`"
                    :value="d.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 门诊随访周期 -->
          <el-divider content-position="left">门诊随访周期</el-divider>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="周期类型">
                <el-select
                  v-model="currentFollowUp.outpatientCycleType"
                  placeholder="选择周期类型"
                  style="width: 100%"
                  clearable
                >
                  <el-option
                    v-for="item in cycleTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="周期值">
                <el-input
                  v-model="currentFollowUp.outpatientCycleValue"
                  placeholder="如：1、2、3"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="时间段">
                <el-select
                  v-model="currentFollowUp.outpatientTimeSlot"
                  placeholder="选择时间段"
                  style="width: 100%"
                  clearable
                >
                  <el-option
                    v-for="item in timeSlotOptionsList"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 住院与检查 -->
          <el-divider content-position="left">住院与检查信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="住院时间">
                <el-date-picker
                  v-model="currentFollowUp.hospitalizationTime"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择住院时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="随访检查类型">
                <el-select
                  v-model="currentFollowUp.followUpExamTypeId"
                  placeholder="选择检查类型"
                  style="width: 100%"
                  clearable
                  @change="handleExamTypeChange"
                >
                  <el-option
                    v-for="t in followUpExamTypeOptions"
                    :key="t.id"
                    :label="t.name"
                    :value="t.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="检查项目" v-if="availableExamItems.length > 0">
            <el-checkbox-group
              v-model="selectedExamItems"
              @change="handleExamItemsChange"
            >
              <el-checkbox
                v-for="item in availableExamItems"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="检查项目" v-else>
            <el-input
              v-model="currentFollowUp.examinationItems"
              placeholder="输入检查项目，多个用逗号分隔"
            />
          </el-form-item>

          <!-- 随访信息 -->
          <el-divider content-position="left">随访信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="随访时间">
                <el-date-picker
                  v-model="currentFollowUp.date"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY-MM-DD HH:mm"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="随访类型">
                <el-select v-model="currentFollowUp.type" style="width: 100%">
                  <el-option
                    v-for="t in followUpTypeOptions"
                    :key="t.id"
                    :label="t.name"
                    :value="t.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="随访项目" required>
            <el-input v-model="currentFollowUp.project" placeholder="请输入随访项目" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="currentFollowUp.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
          </el-form-item>
          <el-row :gutter="20" v-if="currentFollowUp.createTime">
            <el-col :span="12">
              <el-form-item label="创建时间">
                <el-input :model-value="formatDate(currentFollowUp.createTime)" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogType !== 'view'" type="primary" :loading="saveLoading" @click="saveFollowUp">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.text-muted {
  color: var(--el-text-color-secondary);
}
.text-secondary {
  color: var(--el-text-color-secondary);
}
</style>