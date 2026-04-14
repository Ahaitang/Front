<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, User } from '@element-plus/icons-vue'
import {
  getPatientById,
  getRecordList,
  getFollowUpList,
  getMedicationList,
  saveRecord,
  deleteRecord,
  saveFollowUp,
  deleteFollowUp,
  saveMedication,
  deleteMedication,
  getAllDoctors
} from '@/api'
import type { Patient, MedicalRecord, FollowUp, Medication, Doctor } from '@/api'

const route = useRoute()
const router = useRouter()
const patientId = computed(() => route.params.id as string)

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

const doctors = ref<Doctor[]>([])
const saveLoading = ref(false)

// 病历类型选项
const recordTypes = ['门诊病历', '住院病历', '外院病历']

// 随访类型选项
const followUpTypes = ['定期随访', '复诊随访', '用药随访', '评估随访', '紧急随访']

// 加载患者信息
const loadPatient = async () => {
  loading.value = true
  try {
    const res = await getPatientById(patientId.value)
    patient.value = res
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
}

// ========== 病历相关操作 ==========
const openAddRecordDialog = () => {
  recordForm.value = {
    patientId: Number(patientId.value),
    patientName: patient.value?.name || '',
    type: '门诊病历',
    date: new Date().toISOString().split('T')[0]
  }
  recordDialogType.value = 'add'
  recordDialogVisible.value = true
}

const openEditRecordDialog = (row: MedicalRecord) => {
  recordForm.value = { ...row }
  recordDialogType.value = 'edit'
  recordDialogVisible.value = true
}

const saveRecordSubmit = async () => {
  if (!recordForm.value.diagnosis) {
    ElMessage.warning('请输入诊断结果')
    return
  }
  saveLoading.value = true
  try {
    await saveRecord(recordForm.value)
    ElMessage.success(recordDialogType.value === 'add' ? '添加成功' : '保存成功')
    recordDialogVisible.value = false
    loadRecords()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const deleteRecordConfirm = (row: MedicalRecord) => {
  ElMessageBox.confirm('确定要删除该病历记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRecord(row.id)
      ElMessage.success('删除成功')
      loadRecords()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// ========== 随访相关操作 ==========
const openAddFollowUpDialog = () => {
  followUpForm.value = {
    patientId: Number(patientId.value),
    patientName: patient.value?.name || '',
    patientGender: patient.value?.gender || '男',
    patientAge: patient.value?.age || 0,
    date: new Date().toISOString().split('T')[0],
    type: '定期随访',
    status: 'pending'
  }
  followUpDialogType.value = 'add'
  followUpDialogVisible.value = true
}

const openEditFollowUpDialog = (row: FollowUp) => {
  followUpForm.value = { ...row }
  followUpDialogType.value = 'edit'
  followUpDialogVisible.value = true
}

const saveFollowUpSubmit = async () => {
  if (!followUpForm.value.project) {
    ElMessage.warning('请输入随访项目')
    return
  }
  saveLoading.value = true
  try {
    await saveFollowUp(followUpForm.value)
    ElMessage.success(followUpDialogType.value === 'add' ? '添加成功' : '保存成功')
    followUpDialogVisible.value = false
    loadFollowUps()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const deleteFollowUpConfirm = (row: FollowUp) => {
  ElMessageBox.confirm('确定要删除该随访记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteFollowUp(row.id)
      ElMessage.success('删除成功')
      loadFollowUps()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// ========== 用药相关操作 ==========
const openAddMedicationDialog = () => {
  medicationForm.value = {
    patientId: Number(patientId.value),
    patientName: patient.value?.name || '',
    date: new Date().toISOString().split('T')[0],
    unit: 'mg',
    frequency: '每日一次',
    route: '口服'
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
  saveLoading.value = true
  try {
    await saveMedication(medicationForm.value)
    ElMessage.success(medicationDialogType.value === 'add' ? '添加成功' : '保存成功')
    medicationDialogVisible.value = false
    loadMedications()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const deleteMedicationConfirm = (row: Medication) => {
  ElMessageBox.confirm('确定要删除该用药记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteMedication(row.id)
      ElMessage.success('删除成功')
      loadMedications()
    } catch (e) {
      ElMessage.error('删除失败')
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

// 返回
const goBack = () => {
  router.push('/patients')
}

// 状态相关
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

const formatDate = (date: string) => date || '-'
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
            <el-avatar :size="72" :style="{ background: '#0D9488' }">{{ patient.name?.charAt(0) }}</el-avatar>
          </div>
          <div class="patient-info">
            <h3>{{ patient.name }}</h3>
            <div class="patient-meta">
              <span>{{ patient.gender }}</span>
              <span>{{ patient.age }}岁</span>
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
            <span class="label">ID:</span>
            <span class="value">{{ patient.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">主治医生:</span>
            <span class="value">{{ patient.doctorName || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDate(patient.createTime) }}</span>
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
            <el-button type="primary" :icon="Plus" @click="openAddRecordDialog">新增病历</el-button>
          </div>
          <el-table :data="records" stripe v-loading="recordsLoading">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="light">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="diagnosis" label="诊断" min-width="140" show-overflow-tooltip />
            <el-table-column prop="hospital" label="医院" min-width="120" />
            <el-table-column prop="department" label="科室" width="100" />
            <el-table-column prop="doctorName" label="医生" width="100" />
            <el-table-column prop="date" label="就诊日期" width="110" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openEditRecordDialog(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="deleteRecordConfirm(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 随访记录 -->
        <el-tab-pane label="随访记录" name="followups">
          <div class="tab-header">
            <el-button type="primary" :icon="Plus" @click="openAddFollowUpDialog">新增随访</el-button>
          </div>
          <el-table :data="followUps" stripe v-loading="followUpsLoading">
            <el-table-column prop="date" label="随访日期" width="110" />
            <el-table-column prop="project" label="随访项目" min-width="140" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag type="info" size="small" effect="plain">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="doctorName" label="随访医生" width="100" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small" effect="light">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="备注" min-width="120" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openEditFollowUpDialog(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="deleteFollowUpConfirm(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 用药记录 -->
        <el-tab-pane label="用药记录" name="medications">
          <div class="tab-header">
            <el-button type="primary" :icon="Plus" @click="openAddMedicationDialog">新增用药</el-button>
          </div>
          <el-table :data="medications" stripe v-loading="medicationsLoading">
            <el-table-column prop="medicationName" label="药品名称" min-width="140" />
            <el-table-column label="剂量" width="100">
              <template #default="{ row }">
                <span class="dosage-value">{{ row.dosage }}{{ row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="frequency" label="频率" width="100" />
            <el-table-column prop="route" label="途径" width="80">
              <template #default="{ row }">
                <el-tag type="info" size="small" effect="plain">{{ row.route }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="疗程" width="80" />
            <el-table-column prop="doctorName" label="开药医生" width="100" />
            <el-table-column prop="date" label="开药日期" width="110" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openEditMedicationDialog(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="deleteMedicationConfirm(row)">删除</el-button>
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
                <el-option v-for="t in recordTypes" :key="t" :label="t" :value="t" />
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
        <el-form-item label="病历内容">
          <el-input v-model="recordForm.content" type="textarea" :rows="4" placeholder="请输入病历内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveRecordSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 随访编辑对话框 -->
    <el-dialog v-model="followUpDialogVisible" :title="followUpDialogType === 'add' ? '新增随访' : '编辑随访'" width="600px">
      <el-form :model="followUpForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="随访日期">
              <el-date-picker v-model="followUpForm.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="随访类型">
              <el-select v-model="followUpForm.type" style="width: 100%">
                <el-option v-for="t in followUpTypes" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="随访医生">
              <el-select v-model="followUpForm.doctorId" placeholder="选择医生" style="width: 100%" @change="handleDoctorSelect">
                <el-option v-for="d in doctors" :key="d.id" :label="`${d.name} - ${d.department}`" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="followUpForm.status" style="width: 100%">
                <el-option label="待随访" value="pending" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="随访项目" required>
          <el-input v-model="followUpForm.project" placeholder="请输入随访项目" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="followUpForm.content" type="textarea" :rows="3" placeholder="请输入备注信息" />
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
              <el-input v-model="medicationForm.dosage" placeholder="剂量" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-select v-model="medicationForm.unit" style="width: 100%">
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
              <el-select v-model="medicationForm.frequency" style="width: 100%">
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
              <el-select v-model="medicationForm.route" style="width: 100%">
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
        <el-button @click="medicationDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveMedicationSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.patient-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .patient-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 20px;

    .patient-info {
      flex: 1;

      h3 {
        font-size: 22px;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 10px;
      }

      .patient-meta {
        display: flex;
        gap: 20px;
        color: #6B7280;
        font-size: 14px;
      }
    }

    .patient-tags {
      display: flex;
      gap: 10px;
    }
  }

  .patient-detail {
    display: flex;
    gap: 48px;
    padding-top: 20px;
    border-top: 1px solid #E5E7EB;

    .detail-item {
      .label {
        color: #6B7280;
        margin-right: 8px;
      }

      .value {
        color: #1F2937;
        font-weight: 500;
      }
    }
  }
}

.tab-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.dosage-value {
  font-weight: 600;
  color: #0D9488;
}
</style>