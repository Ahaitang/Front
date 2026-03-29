<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMedicationList,
  saveMedication,
  deleteMedication as deleteMedicationApi,
  getPatientList,
  getAllDoctors
} from '@/api'
import type { Medication, Patient, Doctor } from '@/api'

const searchForm = ref({
  keyword: '',
  startDate: '',
  endDate: '',
  dateRange: [] as string[]
})

const tableData = ref<Medication[]>([])
const patients = ref<Patient[]>([])
const doctors = ref<Doctor[]>([])
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

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      ...pagination.value,
      keyword: searchForm.value.keyword,
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
    startDate: '',
    endDate: '',
    dateRange: []
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

const viewMedication = (row: Medication) => {
  currentMedication.value = { ...row }
  dialogType.value = 'view'
  dialogVisible.value = true
}

const addMedication = () => {
  currentMedication.value = {
    date: new Date().toISOString().split('T')[0],
    unit: 'mg',
    frequency: '每日一次',
    route: '口服'
  }
  dialogType.value = 'add'
  dialogVisible.value = true
}

const editMedication = (row: Medication) => {
  currentMedication.value = { ...row }
  dialogType.value = 'edit'
  dialogVisible.value = true
}

const deleteMedication = (row: Medication) => {
  ElMessageBox.confirm('确定要删除该用药记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteMedicationApi(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      ElMessage.error('删除失败')
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

// 选择患者
const handlePatientSelect = (patientId: number) => {
  const patient = patients.value.find(p => p.id === patientId)
  if (patient && currentMedication.value) {
    currentMedication.value.patientId = patientId
    currentMedication.value.patientName = patient.name
  }
}

// 选择医生
const handleDoctorSelect = (doctorId: number) => {
  const doctor = doctors.value.find(d => d.id === doctorId)
  if (doctor && currentMedication.value) {
    currentMedication.value.doctorId = doctorId
    currentMedication.value.doctorName = doctor.name
  }
}

const formatDate = (date: string) => {
  return date || '-'
}
</script>

<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="患者/药品/医生"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
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
          <el-button type="success" @click="addMedication">新增用药</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="content-card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="patientName" label="患者" min-width="100" />
        <el-table-column prop="medicationName" label="药品名称" min-width="140" />
        <el-table-column label="剂量" min-width="100">
          <template #default="{ row }">
            {{ row.dosage }}{{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="frequency" label="频率" min-width="100" />
        <el-table-column prop="route" label="途径" min-width="80" />
        <el-table-column prop="duration" label="疗程" min-width="80">
          <template #default="{ row }">
            {{ row.duration || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="doctorName" label="开药医生" min-width="100" />
        <el-table-column prop="date" label="开药日期" min-width="120" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewMedication(row)">详情</el-button>
            <el-button type="primary" link @click="editMedication(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteMedication(row)">删除</el-button>
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

    <!-- 详情/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'view' ? '用药详情' : dialogType === 'add' ? '新增用药' : '编辑用药'"
      width="650px"
    >
      <template v-if="currentMedication">
        <el-form :model="currentMedication" label-width="100px" :disabled="dialogType === 'view'">
          <el-row :gutter="20" v-if="dialogType !== 'view'">
            <el-col :span="12">
              <el-form-item label="患者" required>
                <el-select
                  v-model="currentMedication.patientId"
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
              <el-form-item label="开药日期">
                <el-date-picker
                  v-model="currentMedication.date"
                  type="date"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20" v-if="dialogType === 'view'">
            <el-col :span="12">
              <el-form-item label="ID">{{ currentMedication.id }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="患者">{{ currentMedication.patientName }}</el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="药品名称" required>
                <el-input v-model="currentMedication.medicationName" placeholder="请输入药品名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="dialogType === 'view'">
              <el-form-item label="开药日期">{{ currentMedication.date }}</el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="剂量">
                <el-input v-model="currentMedication.dosage" placeholder="剂量" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位">
                <el-select v-model="currentMedication.unit" style="width: 100%">
                  <el-option label="mg" value="mg" />
                  <el-option label="g" value="g" />
                  <el-option label="ml" value="ml" />
                  <el-option label="片" value="片" />
                  <el-option label="粒" value="粒" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用药频率">
                <el-select v-model="currentMedication.frequency" style="width: 100%">
                  <el-option label="每日一次" value="每日一次" />
                  <el-option label="每日两次" value="每日两次" />
                  <el-option label="每日三次" value="每日三次" />
                  <el-option label="每周一次" value="每周一次" />
                  <el-option label="必要时" value="必要时" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用药途径">
                <el-select v-model="currentMedication.route" style="width: 100%">
                  <el-option label="口服" value="口服" />
                  <el-option label="注射" value="注射" />
                  <el-option label="外用" value="外用" />
                  <el-option label="静脉滴注" value="静脉滴注" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="疗程">
                <el-input v-model="currentMedication.duration" placeholder="如：7天" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开药医生">
                <el-select
                  v-model="currentMedication.doctorId"
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
          <el-form-item label="备注">
            <el-input v-model="currentMedication.notes" type="textarea" :rows="2" placeholder="备注信息" />
          </el-form-item>
          <el-form-item label="创建时间" v-if="currentMedication.createTime">
            <el-input :model-value="formatDate(currentMedication.createTime)" disabled />
          </el-form-item>
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
.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>