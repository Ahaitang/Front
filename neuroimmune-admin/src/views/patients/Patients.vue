<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Download, UploadFilled, DocumentCopy } from '@element-plus/icons-vue'
import {
  getPatientList,
  savePatient,
  deletePatient as deletePatientApi,
  updatePatientPassword,
  getAllDoctors
} from '@/api'
import { exportToExcel } from '@/utils/export'
import type { Patient, Doctor } from '@/api'

const router = useRouter()

const searchForm = ref({
  keyword: '',
  gender: '',
  isRealAuth: '',
  doctorId: ''
})

const tableData = ref<Patient[]>([])
const doctors = ref<Doctor[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = ref({
  pageNum: 1,
  pageSize: 10
})

const dialogVisible = ref(false)
const dialogType = ref<'view' | 'edit' | 'add'>('view')
const currentPatient = ref<Partial<Patient>>({})
const saveLoading = ref(false)

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordForm = ref({ id: 0, password: '' })
const passwordLoading = ref(false)

// 导入相关
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importResult = ref<{ total: number; success: number; failed: number; errors: string[] } | null>(null)
const fileList = ref<any[]>([])

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...pagination.value,
      ...searchForm.value
    }
    const res = await getPatientList(params)
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
  loadDoctors()
})

const handleSearch = () => {
  pagination.value.pageNum = 1
  loadData()
}

const handleReset = () => {
  searchForm.value = {
    keyword: '',
    gender: '',
    isRealAuth: '',
    doctorId: ''
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

const viewPatient = (row: Patient) => {
  currentPatient.value = { ...row }
  dialogType.value = 'view'
  dialogVisible.value = true
}

const editPatient = (row: Patient) => {
  currentPatient.value = { ...row }
  dialogType.value = 'edit'
  dialogVisible.value = true
}

const addPatient = () => {
  currentPatient.value = {
    name: '',
    gender: '男',
    age: 0,
    phone: '',
    doctorId: undefined,
    doctorName: '',
    hasFollowUp: false,
    isRealAuth: false
  }
  dialogType.value = 'add'
  dialogVisible.value = true
}

const deletePatient = (row: Patient) => {
  ElMessageBox.confirm(`确定要删除患者 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deletePatientApi(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const savePatientSubmit = async () => {
  if (!currentPatient.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!currentPatient.value.phone) {
    ElMessage.warning('请输入手机号')
    return
  }

  saveLoading.value = true
  try {
    // 选择医生时更新医生姓名
    if (currentPatient.value.doctorId) {
      const doc = doctors.value.find(d => d.id === currentPatient.value.doctorId)
      if (doc) {
        currentPatient.value.doctorName = doc.name
      }
    }
    await savePatient(currentPatient.value)
    ElMessage.success(dialogType.value === 'add' ? '添加成功' : '保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const formatDate = (date: string) => {
  return date || '-'
}

// 查看患者详情
const viewPatientDetail = (row: Patient) => {
  router.push(`/patients/${row.id}`)
}

// 修改密码
const openPasswordDialog = (row: Patient) => {
  passwordForm.value = { id: row.id, password: '' }
  passwordDialogVisible.value = true
}

const handleUpdatePassword = async () => {
  if (!passwordForm.value.password) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (passwordForm.value.password.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }
  passwordLoading.value = true
  try {
    await updatePatientPassword(passwordForm.value.id, passwordForm.value.password)
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (e) {
    ElMessage.error('密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

// 下载模板
const downloadTemplate = () => {
  window.open('/api/import/patient/template', '_blank')
}

// 文件变化
const handleFileChange = (_file: any, list: any[]) => {
  fileList.value = list.slice(-1)
}

// 导入
const handleImport = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  const formData = new FormData()
  formData.append('file', fileList.value[0].raw)

  importLoading.value = true
  importResult.value = null

  try {
    const res = await fetch('/api/import/patient', {
      method: 'POST',
      body: formData
    }).then(r => r.json())
    importResult.value = res.data || res
    if (res.success > 0 || (res.data && res.data.success > 0)) {
      ElMessage.success(`成功导入 ${res.success || res.data?.success} 条数据`)
      loadData()
    }
  } catch (e: any) {
    ElMessage.error(e.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

// 打开导入对话框
const openImportDialog = () => {
  fileList.value = []
  importResult.value = null
  importDialogVisible.value = true
}

// 导出数据
const handleExport = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const exportData = tableData.value.map(item => ({
    'ID': item.id,
    '姓名': item.name,
    '性别': item.gender,
    '年龄': item.age,
    '手机号': item.phone,
    '主治医生': item.doctorName || '-',
    '实名状态': item.isRealAuth ? '已实名' : '未实名',
    '随访状态': item.hasFollowUp ? '待随访' : '正常',
    '更新时间': formatDate(item.updateTime)
  }))
  exportToExcel(exportData, '患者列表')
}
</script>

<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon><User /></el-icon>
        患者管理
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名/手机"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="searchForm.gender" clearable placeholder="全部" style="width: 100px">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="实名状态">
          <el-select v-model="searchForm.isRealAuth" clearable placeholder="全部" style="width: 120px">
            <el-option label="已实名" value="true" />
            <el-option label="未实名" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="主治医生">
          <el-select v-model="searchForm.doctorId" clearable placeholder="全部" style="width: 140px">
            <el-option
              v-for="doc in doctors"
              :key="doc.id"
              :label="doc.name"
              :value="doc.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="addPatient">新增患者</el-button>
          <el-button type="warning" @click="openImportDialog">批量导入</el-button>
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
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="患者信息" min-width="140">
          <template #default="{ row }">
            <div class="patient-info">
              <span class="name">{{ row.name }}</span>
              <span class="meta">{{ row.gender }} | {{ row.age }}岁</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="doctorName" label="主治医生" min-width="100">
          <template #default="{ row }">
            <span :class="row.doctorName ? '' : 'text-muted'">{{ row.doctorName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isRealAuth" label="实名状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isRealAuth ? 'success' : 'warning'" size="small" effect="light">
              {{ row.isRealAuth ? '已实名' : '未实名' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hasFollowUp" label="随访状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.hasFollowUp ? 'warning' : 'info'" size="small" effect="light">
              {{ row.hasFollowUp ? '待随访' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160">
          <template #default="{ row }">
            <span class="text-secondary">{{ formatDate(row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="viewPatientDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="viewPatient(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="editPatient(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="openPasswordDialog(row)">改密</el-button>
            <el-button type="danger" link size="small" @click="deletePatient(row)">删除</el-button>
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
      :title="dialogType === 'view' ? '患者详情' : dialogType === 'add' ? '新增患者' : '编辑患者'"
      width="600px"
    >
      <template v-if="currentPatient">
        <el-form :model="currentPatient" label-width="100px" :disabled="dialogType === 'view'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="ID" v-if="currentPatient.id">
                <el-input :model-value="currentPatient.id" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="姓名" required>
                <el-input v-model="currentPatient.name" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="性别">
                <el-select v-model="currentPatient.gender" style="width: 100%">
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年龄">
                <el-input-number v-model="currentPatient.age" :min="0" :max="150" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="手机号" required>
                <el-input v-model="currentPatient.phone" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="主治医生">
                <el-select v-model="currentPatient.doctorId" style="width: 100%" clearable>
                  <el-option
                    v-for="doc in doctors"
                    :key="doc.id"
                    :label="`${doc.name} - ${doc.title}`"
                    :value="doc.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="实名认证">
                <el-switch v-model="currentPatient.isRealAuth" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="待随访">
                <el-switch v-model="currentPatient.hasFollowUp" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="创建时间" v-if="currentPatient.createTime">
            <el-input :model-value="formatDate(currentPatient.createTime)" disabled />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogType !== 'view'" type="primary" :loading="saveLoading" @click="savePatientSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form label-width="80px">
        <el-form-item label="患者ID">
          <el-input :model-value="passwordForm.id" disabled />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleUpdatePassword">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入患者" width="550px">
      <div class="import-tips">
        <el-alert type="info" :closable="false">
          <template #title>
            <div>导入说明：</div>
          </template>
          <ul class="tips-list">
            <li>请先下载模板，按照模板格式填写数据</li>
            <li>带 * 的字段为必填项</li>
            <li>医生手机号必须为系统中已存在的医生</li>
            <li>密码将由系统自动生成</li>
          </ul>
        </el-alert>
      </div>

      <div class="import-actions">
        <el-button type="primary" link @click="downloadTemplate">
          <el-icon><Download /></el-icon> 下载导入模板
        </el-button>
      </div>

      <el-upload
        class="upload-area"
        drag
        accept=".xlsx,.xls"
        :auto-upload="false"
        :file-list="fileList"
        :on-change="handleFileChange"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">只能上传 xlsx/xls 文件</div>
        </template>
      </el-upload>

      <!-- 导入结果 -->
      <div v-if="importResult" class="import-result">
        <el-divider />
        <div class="result-summary">
          <span>总计: <strong>{{ importResult.total }}</strong> 条</span>
          <span class="success">成功: <strong>{{ importResult.success }}</strong> 条</span>
          <span class="failed">失败: <strong>{{ importResult.failed }}</strong> 条</span>
        </div>
        <div v-if="importResult.errors?.length" class="error-list">
          <div class="error-title">错误详情：</div>
          <el-scrollbar max-height="150px">
            <div v-for="(err, idx) in importResult.errors" :key="idx" class="error-item">
              {{ err }}
            </div>
          </el-scrollbar>
        </div>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImport">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.import-tips {
  margin-bottom: 16px;
}

.tips-list {
  margin: 8px 0 0 16px;
  padding: 0;
  font-size: 13px;
  line-height: 1.8;
}

.import-actions {
  margin-bottom: 16px;
}

.upload-area {
  width: 100%;

  :deep(.el-upload-dragger) {
    width: 100%;
  }
}

.import-result {
  .result-summary {
    display: flex;
    gap: 24px;
    font-size: 14px;

    strong {
      font-size: 16px;
    }

    .success strong {
      color: #10B981;
    }

    .failed strong {
      color: #EF4444;
    }
  }

  .error-list {
    margin-top: 12px;

    .error-title {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .error-item {
      font-size: 13px;
      color: #EF4444;
      line-height: 1.6;
    }
  }
}
</style>