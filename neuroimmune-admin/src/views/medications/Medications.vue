<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FirstAidKit, DocumentCopy } from '@element-plus/icons-vue'
import {
  getMedicationList,
  saveMedication,
  cancelMedication,
  getPatientList,
  getAllDoctors,
  getCommonDictByType,
  DICT_TYPES
} from '@/api'
import { exportToExcel } from '@/utils/export'
import type { Medication, Patient, Doctor, CommonDict } from '@/api'

const searchForm = ref({
  keyword: '',
  startDate: '',
  endDate: '',
  dateRange: [] as string[]
})

const tableData = ref<Medication[]>([])
const patients = ref<Patient[]>([])
const doctors = ref<Doctor[]>([])
const unitOptions = ref<CommonDict[]>([])
const frequencyOptions = ref<CommonDict[]>([])
const routeOptions = ref<CommonDict[]>([])
const medicationOptions = ref<CommonDict[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = ref({
  pageNum: 1,
  pageSize: 10
})

const dialogVisible = ref(false)
const dialogType = ref<'view' | 'add' | 'edit'>('view')
const currentMedication = ref<Partial<Medication>>({})
const saveLoading = ref(false)

// 根据开药日期和疗程计算状态
const calculateMedicationStatus = (date: string, duration?: string): number => {
  if (!date) return 0 // 无日期默认进行中
  if (!duration) return 0 // 无疗程默认进行中

  // 解析疗程字符串，如 "7天"、"1个月"、"3个月"、"2周"
  const startDate = new Date(date.substring(0, 10))
  let daysToAdd = 0

  const durationMatch = duration.match(/^(\d+)(天|周|个月|月)$/)
  if (durationMatch && durationMatch[1] && durationMatch[2]) {
    const value = parseInt(durationMatch[1])
    const unit = durationMatch[2]
    if (unit === '天') daysToAdd = value
    else if (unit === '周') daysToAdd = value * 7
    else if (unit === '个月' || unit === '月') daysToAdd = value * 30
  } else {
    // 无法解析，默认进行中
    return 0
  }

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysToAdd)
  endDate.setHours(23, 59, 59) // 结束日期的最后一刻

  const now = new Date()
  return now > endDate ? 1 : 0 // 1=已完成, 0=进行中
}

const getStatusType = (status: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '进行中', 1: '已完成', 2: '已取消' }
  return map[status] || '进行中'
}

// 根据记录计算实际状态（用于显示）
const getActualStatus = (row: Medication): number => {
  // 如果已手动取消，保持取消状态
  if (row.status === 2) return 2
  return calculateMedicationStatus(row.date, row.duration)
}

const getUnitLabel = (unit: string) => {
  const found = unitOptions.value.find(u => u.name === unit || u.code === unit)
  return found ? found.name : unit || '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      ...pagination.value,
      keyword: searchForm.value.keyword || '',
      startDate: searchForm.value.dateRange?.[0] || '',
      endDate: searchForm.value.dateRange?.[1] || ''
    }
    const res = await getMedicationList(params)
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

const loadPatients = async () => {
  try {
    const res = await getPatientList({ pageNum: 1, pageSize: 1000 })
    patients.value = res?.list || []
  } catch (e) {
    console.error('加载患者列表失败:', e)
  }
}

const loadDoctors = async () => {
  try {
    const res = await getAllDoctors()
    doctors.value = res || []
  } catch (e) {
    console.error('加载医生列表失败:', e)
  }
}

const loadDicts = async () => {
  try {
    unitOptions.value = await getCommonDictByType(DICT_TYPES.MEDICATION_UNIT)
    frequencyOptions.value = await getCommonDictByType(DICT_TYPES.FREQUENCY)
    routeOptions.value = await getCommonDictByType(DICT_TYPES.ROUTE)
    medicationOptions.value = await getCommonDictByType(DICT_TYPES.MEDICATION)
  } catch (e) {
    console.error('加载字典失败:', e)
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
  searchForm.value = { keyword: '', startDate: '', endDate: '', dateRange: [] }
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

const addMedication = () => {
  currentMedication.value = {
    date: new Date().toISOString().split('T')[0],
    dosageValue: undefined,
    dosageUnit: 'mg',
    frequency: '每日一次',
    route: '口服',
    status: 0
  }
  dialogType.value = 'add'
  dialogVisible.value = true
}

const editMedication = (row: Medication) => {
  currentMedication.value = { ...row }
  dialogType.value = 'edit'
  dialogVisible.value = true
}

const cancelMedicationRecord = (row: Medication) => {
  ElMessageBox.confirm('确定要取消该用药记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelMedication(row.id)
      ElMessage.success('已取消')
      loadData()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

const saveMedicationSubmit = async () => {
  if (!currentMedication.value.patientId) {
    ElMessage.warning('请选择患者')
    return
  }
  if (!currentMedication.value.medicationName) {
    ElMessage.warning('请输入药品名称')
    return
  }
  saveLoading.value = true
  try {
    await saveMedication(currentMedication.value)
    ElMessage.success(dialogType.value === 'add' ? '添加成功' : '保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const handlePatientSelect = (patientId: number) => {
  const patient = patients.value.find(p => p.id === patientId)
  if (patient && currentMedication.value) {
    currentMedication.value.patientId = patientId
    currentMedication.value.patientName = patient.name
  }
}

const handleDoctorSelect = (doctorId: number) => {
  const doctor = doctors.value.find(d => d.id === doctorId)
  if (doctor && currentMedication.value) {
    currentMedication.value.doctorId = doctorId
    currentMedication.value.doctorName = doctor.name
  }
}

const formatDate = (date: string) => date || '-'

// 导出数据
const handleExport = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const exportData = tableData.value.map(item => ({
    '患者姓名': item.patientName,
    '药品名称': item.medicationName,
    '剂量': `${item.dosageValue || ''}${getUnitLabel(item.dosageUnit || '')}`,
    '用药频率': item.frequency,
    '用药途径': item.route,
    '疗程': item.duration || '-',
    '开药医生': item.doctorName,
    '开药日期': item.date,
    '状态': getStatusText(getActualStatus(item)),
    '备注': item.notes || '-',
    '创建时间': formatDate(item.createTime)
  }))
  exportToExcel(exportData, '用药记录')
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">
        <el-icon><FirstAidKit /></el-icon>
        用药管理
      </div>
    </div>

    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input v-model="searchForm.keyword" placeholder="患者/药品/医生" clearable style="width: 180px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="addMedication">新增用药</el-button>
          <el-button type="info" @click="handleExport">
            <el-icon><DocumentCopy /></el-icon>
            导出数据
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="content-card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="patientName" label="患者" min-width="100" />
        <el-table-column prop="medicationName" label="药品名称" min-width="140" />
        <el-table-column label="剂量" min-width="100">
          <template #default="{ row }"><span class="dosage-value">{{ row.dosageValue }}{{ getUnitLabel(row.dosageUnit) }}</span></template>
        </el-table-column>
        <el-table-column prop="frequency" label="频率" min-width="100" />
        <el-table-column prop="route" label="途径" width="80">
          <template #default="{ row }"><el-tag type="info" effect="plain" size="small">{{ row.route }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="duration" label="疗程" min-width="80">
          <template #default="{ row }"><span :class="row.duration ? '' : 'text-muted'">{{ row.duration || '-' }}</span></template>
        </el-table-column>
        <el-table-column prop="doctorName" label="开药医生" min-width="100" />
        <el-table-column prop="date" label="开药日期" width="110" />
        <el-table-column prop="notes" label="备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-muted">{{ row.notes || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(getActualStatus(row))" size="small" effect="light">{{ getStatusText(getActualStatus(row)) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editMedication(row)">编辑</el-button>
            <el-button v-if="getActualStatus(row) === 0" type="warning" link size="small" @click="cancelMedicationRecord(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination background layout="total, sizes, prev, pager, next" :total="total" :page-sizes="[10, 20, 50]" :page-size="pagination.pageSize" :current-page="pagination.pageNum" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'view' ? '用药详情' : dialogType === 'add' ? '新增用药' : '编辑用药'" width="650px">
      <template v-if="currentMedication">
        <el-form :model="currentMedication" label-width="100px" :disabled="dialogType === 'view'">
          <el-row :gutter="20" v-if="dialogType !== 'view'">
            <el-col :span="12">
              <el-form-item label="患者" required>
                <el-select v-model="currentMedication.patientId" placeholder="选择患者" style="width: 100%" filterable @change="handlePatientSelect">
                  <el-option v-for="p in patients" :key="p.id" :label="`${p.name} (${p.phone})`" :value="p.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开药日期">
                <el-date-picker v-model="currentMedication.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20" v-if="dialogType === 'view'">
            <el-col :span="12"><el-form-item label="患者">{{ currentMedication.patientName }}</el-form-item></el-col>
            <el-col :span="12"><el-form-item label="状态"><el-tag :type="getStatusType(getActualStatus(currentMedication as Medication))" size="small">{{ getStatusText(getActualStatus(currentMedication as Medication)) }}</el-tag></el-form-item></el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="药品名称" required>
                <el-select v-model="currentMedication.medicationName" placeholder="请选择药品" style="width: 100%" filterable allow-create default-first-option>
                  <el-option v-for="m in medicationOptions" :key="m.id" :label="m.name" :value="m.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="dialogType === 'view'"><el-form-item label="开药日期">{{ currentMedication.date }}</el-form-item></el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="剂量">
                <el-input-number v-model="currentMedication.dosageValue" :min="0" :precision="2" placeholder="剂量" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位">
                <el-select v-model="currentMedication.dosageUnit" style="width: 100%">
                  <el-option v-for="u in unitOptions" :key="u.id" :label="u.name" :value="u.name" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用药频率">
                <el-select v-model="currentMedication.frequency" style="width: 100%">
                  <el-option v-for="f in frequencyOptions" :key="f.id" :label="f.name" :value="f.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用药途径">
                <el-select v-model="currentMedication.route" style="width: 100%">
                  <el-option v-for="r in routeOptions" :key="r.id" :label="r.name" :value="r.name" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12"><el-form-item label="疗程"><el-input v-model="currentMedication.duration" placeholder="如：7天" /></el-form-item></el-col>
            <el-col :span="12">
              <el-form-item label="开药医生">
                <el-select v-model="currentMedication.doctorId" placeholder="选择医生" style="width: 100%" @change="handleDoctorSelect">
                  <el-option v-for="d in doctors" :key="d.id" :label="`${d.name} - ${d.department}`" :value="d.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注"><el-input v-model="currentMedication.notes" type="textarea" :rows="2" placeholder="备注信息" /></el-form-item>
          <el-form-item label="创建时间" v-if="currentMedication.createTime"><el-input :model-value="formatDate(currentMedication.createTime)" disabled /></el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogType !== 'view'" type="primary" :loading="saveLoading" @click="saveMedicationSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.dosage-value { font-weight: 600; color: #0891B2; }
</style>