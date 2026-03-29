<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getFollowUpList,
  saveFollowUp as saveFollowUpApi,
  updateFollowUpStatus,
  deleteFollowUp as deleteFollowUpApi,
  getAllDoctors
} from '@/api'
import { getPatientList } from '@/api'
import type { FollowUp, Doctor, Patient } from '@/api'

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

// 统计数据
const statusStats = computed(() => {
  const pending = tableData.value.filter(f => f.status === 'pending').length
  const completed = tableData.value.filter(f => f.status === 'completed').length
  const cancelled = tableData.value.filter(f => f.status === 'cancelled').length
  return { pending, completed, cancelled, total: tableData.value.length }
})

const dialogVisible = ref(false)
const dialogType = ref<'view' | 'edit' | 'add'>('view')
const currentFollowUp = ref<Partial<FollowUp>>({})
const saveLoading = ref(false)

// 随访类型选项
const followUpTypes = ['定期随访', '复诊随访', '用药随访', '评估随访', '紧急随访']

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待随访',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      ...pagination.value,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status,
      type: searchForm.value.type,
      startDate: searchForm.value.dateRange?.[0] || '',
      endDate: searchForm.value.dateRange?.[1] || ''
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
  dialogType.value = 'view'
  dialogVisible.value = true
}

const editFollowUp = (row: FollowUp) => {
  currentFollowUp.value = { ...row }
  dialogType.value = 'edit'
  dialogVisible.value = true
}

const addFollowUp = () => {
  currentFollowUp.value = {
    patientId: undefined,
    patientName: '',
    patientGender: '男',
    patientAge: 0,
    doctorId: undefined,
    doctorName: '',
    date: new Date().toISOString().split('T')[0],
    project: '',
    type: '定期随访',
    status: 'pending',
    statusText: '待随访',
    content: ''
  }
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
      await updateFollowUpStatus(row.id, 'completed')
      ElMessage.success('随访已完成')
      loadData()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

const cancelFollowUp = (row: FollowUp) => {
  ElMessageBox.confirm('确定要取消该随访吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await updateFollowUpStatus(row.id, 'cancelled')
      ElMessage.success('随访已取消')
      loadData()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

const deleteFollowUp = (row: FollowUp) => {
  ElMessageBox.confirm(`确定要删除该随访记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteFollowUpApi(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
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
    await saveFollowUpApi(currentFollowUp.value)
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
</script>

<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ statusStats.total }}</div>
        <div class="stat-label">总随访</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ statusStats.pending }}</div>
        <div class="stat-label">待随访</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ statusStats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card danger">
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
            <el-option label="待随访" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" clearable placeholder="全部类型" style="width: 120px">
            <el-option v-for="t in followUpTypes" :key="t" :label="t" :value="t" />
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
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="content-card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="患者信息" min-width="160">
          <template #default="{ row }">
            <div class="patient-info">
              <span class="patient-name">{{ row.patientName }}</span>
              <span class="patient-meta">{{ row.patientGender }} | {{ row.patientAge }}岁</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="doctorName" label="随访医生" min-width="100" />
        <el-table-column prop="date" label="随访日期" min-width="110" />
        <el-table-column prop="project" label="随访项目" min-width="140" />
        <el-table-column prop="type" label="类型" min-width="100">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="备注" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-muted">{{ row.content || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewFollowUp(row)">查看</el-button>
            <el-button type="primary" link @click="editFollowUp(row)">编辑</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              link
              @click="completeFollowUp(row)"
            >完成</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="warning"
              link
              @click="cancelFollowUp(row)"
            >取消</el-button>
            <el-button type="danger" link @click="deleteFollowUp(row)">删除</el-button>
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
      width="650px"
    >
      <template v-if="currentFollowUp">
        <el-form :model="currentFollowUp" label-width="100px" :disabled="dialogType === 'view'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="ID" v-if="currentFollowUp.id">
                <el-input :model-value="currentFollowUp.id" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态">
                <el-select v-model="currentFollowUp.status" style="width: 100%">
                  <el-option label="待随访" value="pending" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已取消" value="cancelled" />
                </el-select>
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
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="随访日期">
                <el-date-picker
                  v-model="currentFollowUp.date"
                  type="date"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="随访类型">
                <el-select v-model="currentFollowUp.type" style="width: 100%">
                  <el-option v-for="t in followUpTypes" :key="t" :label="t" :value="t" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="随访项目" required>
            <el-input v-model="currentFollowUp.project" placeholder="请输入随访项目" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="currentFollowUp.content" type="textarea" :rows="3" placeholder="请输入备注信息" />
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
.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #409eff;
  }

  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-top: 8px;
  }

  &.warning .stat-value {
    color: #e6a23c;
  }

  &.success .stat-value {
    color: #67c23a;
  }

  &.danger .stat-value {
    color: #f56c6c;
  }
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.patient-info {
  display: flex;
  flex-direction: column;

  .patient-name {
    font-weight: 500;
    color: #303133;
  }

  .patient-meta {
    font-size: 12px;
    color: #909399;
  }
}

.text-muted {
  color: #909399;
}
</style>