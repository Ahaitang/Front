<template>
  <div class="patients-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>患者管理</span>
          <div class="header-actions">
            <el-button type="success" @click="showImportDialog">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增患者
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索患者姓名或住院号"
          class="patient-search-input"
          clearable
          @input="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <el-table :data="paginatedPatientList" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" min-width="80" />
        <el-table-column prop="name" label="姓名" min-width="120">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              {{ row.name }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" min-width="100">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="admissionNumber" label="住院号" min-width="150" />
        <el-table-column prop="phone" label="联系电话" min-width="150" />
        <el-table-column label="操作" min-width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              详细信息
            </el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入患者"
      width="600px"
    >
      <el-alert
        title="导入说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <div style="line-height: 1.8">
            <p>1. 请下载 CSV 模板文件，按照模板格式填写数据</p>
            <p>2. CSV 文件必须包含以下列：姓名、性别、住院号、联系电话</p>
            <p>3. 性别填写“男”或“女”（或 male/female），住院号必须唯一，已存在的住院号将被跳过</p>
          </div>
        </template>
      </el-alert>
      <div style="margin-bottom: 20px">
        <el-button type="primary" @click="downloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
      </div>
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleImportFileChange"
        :limit="1"
        accept=".csv"
        :file-list="importFileList"
      >
        <template #trigger>
          <el-button type="primary">选择文件</el-button>
        </template>
        <el-button
          style="margin-left: 10px"
          type="success"
          :loading="importing"
          :disabled="importFileList.length === 0"
          @click="doImport"
        >
          开始导入
        </el-button>
      </el-upload>
      <div v-if="importResult" class="import-result" style="margin-top: 20px">
        <el-alert
          :title="`导入完成：成功 ${importResult.successCount} 条，失败 ${importResult.failCount} 条`"
          :type="importResult.failCount > 0 ? 'warning' : 'success'"
          :closable="false"
          show-icon
        />
        <div v-if="importResult.errors && importResult.errors.length" class="import-errors">
          <div class="errors-title">失败明细：</div>
          <ul>
            <li v-for="e in importResult.errors" :key="e.row">第 {{ e.row }} 行：{{ e.message }}</li>
          </ul>
        </div>
      </div>
    </el-dialog>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="住院号" prop="admissionNumber">
          <el-input v-model="formData.admissionNumber" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { patientApi } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, View, Search, Upload, Download } from '@element-plus/icons-vue'
import type { UploadFile, UploadFiles } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const patientList = ref<any[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增患者')
const formRef = ref<FormInstance>()
const isEdit = ref(false)
const searchKeyword = ref('')
const importDialogVisible = ref(false)
const uploadRef = ref()
const importFileList = ref<UploadFiles>([])
const importing = ref(false)
const importResult = ref<{ successCount: number; failCount: number; errors: Array<{ row: number; message: string }> } | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formData = reactive({
  id: undefined,
  name: '',
  gender: 'male',
  admissionNumber: '',
  phone: ''
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  admissionNumber: [{ required: true, message: '请输入住院号', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const loadPatients = async () => {
  loading.value = true
  try {
    const currentDoctorId = userStore.userInfo?.id
    const currentUserLevel = userStore.level
    
    if (searchKeyword.value && searchKeyword.value.trim()) {
      // 如果有搜索关键词，使用搜索接口
      patientList.value = await patientApi.searchPatients(
        searchKeyword.value.trim(),
        currentDoctorId,
        currentUserLevel
      )
    } else {
      // 否则加载全部患者
      patientList.value = await patientApi.getPatientList(currentDoctorId, currentUserLevel)
    }
    // 更新分页总数
    pagination.total = patientList.value.length
    // 重置到第一页
    pagination.page = 1
  } catch (error) {
    ElMessage.error('加载患者列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadPatients()
}

// 分页后的患者列表
const paginatedPatientList = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return patientList.value.slice(start, end)
})

const handleSizeChange = () => {
  pagination.page = 1
}

const handlePageChange = () => {
  // 分页改变时，数据已经通过 computed 自动更新
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增患者'
  Object.assign(formData, {
    id: undefined,
    name: '',
    gender: 'male',
    admissionNumber: '',
    phone: ''
  })
  dialogVisible.value = true
}

const handleViewDetail = (row: any) => {
  if (!row.id) {
    ElMessage.error('患者ID无效')
    return
  }
  router.push({ name: 'PatientDetail', params: { id: String(row.id) } })
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑患者'
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该患者吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await patientApi.deletePatient(row.id, userStore.level)
    ElMessage.success('删除成功')
    loadPatients()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const showImportDialog = () => {
  importFileList.value = []
  importResult.value = null
  importDialogVisible.value = true
  nextTick(() => uploadRef.value?.clearFiles())
}

// 解析 CSV 行（简单处理，支持双引号包裹的字段）
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (inQuotes) {
      current += c
    } else if (c === ',') {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

// 性别中文转英文
function normalizeGender(val: string): string {
  const v = val.trim().toLowerCase()
  if (v === '男' || v === 'male') return 'male'
  if (v === '女' || v === 'female') return 'female'
  return v || 'male'
}

// 解析 CSV 文件为患者数组
const parseCSVFile = (file: File): Promise<Array<{ name: string; gender: string; admissionNumber: string; phone: string }>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || ''
        const lines = text.split(/\r?\n/).filter((line) => line.trim())
        if (lines.length < 2) {
          reject(new Error('CSV 文件至少需要包含表头和数据行'))
          return
        }
        const headerRow = parseCSVLine(lines[0])
        const headers = headerRow.map((h) => h.replace(/^\s*|\s*$/g, ''))
        const nameIdx = headers.findIndex((h) => /姓名|name/i.test(h))
        const genderIdx = headers.findIndex((h) => /性别|gender/i.test(h))
        const admissionIdx = headers.findIndex((h) => /住院号|admission/i.test(h))
        const phoneIdx = headers.findIndex((h) => /电话|手机|phone/i.test(h))
        if (nameIdx === -1 || genderIdx === -1 || admissionIdx === -1 || phoneIdx === -1) {
          reject(new Error('CSV 必须包含：姓名、性别、住院号、联系电话 四列'))
          return
        }
        const patients: Array<{ name: string; gender: string; admissionNumber: string; phone: string }> = []
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i])
          const name = (cols[nameIdx] || '').trim()
          const gender = normalizeGender(cols[genderIdx] || '')
          const admissionNumber = (cols[admissionIdx] || '').trim()
          const phone = (cols[phoneIdx] || '').trim()
          if (!name || !admissionNumber || !phone) continue
          patients.push({ name, gender, admissionNumber, phone })
        }
        if (patients.length === 0) {
          reject(new Error('CSV 中没有有效的数据行'))
          return
        }
        resolve(patients)
      } catch (err: any) {
        reject(new Error('解析 CSV 失败：' + (err.message || String(err))))
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file, 'UTF-8')
  })
}

const handleImportFileChange = (file: UploadFile, files: UploadFiles) => {
  importFileList.value = files
  importResult.value = null
}

const doImport = async () => {
  if (importFileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }
  const file = importFileList.value[0].raw
  if (!file) {
    ElMessage.warning('文件不存在')
    return
  }
  importing.value = true
  importResult.value = null
  try {
    const patients = await parseCSVFile(file)
    const currentDoctorId = userStore.userInfo?.id
    const result = await patientApi.importPatients(patients, currentDoctorId)
    importResult.value = result
    if (result.successCount > 0) {
      ElMessage.success(`成功导入 ${result.successCount} 条患者`)
      loadPatients()
    }
    if (result.failCount > 0) {
      ElMessage.warning(`部分失败 ${result.failCount} 条，请查看失败明细`)
    }
  } catch (err: any) {
    ElMessage.error(err.message || '导入失败')
  } finally {
    importing.value = false
  }
}

const downloadTemplate = () => {
  const BOM = '\uFEFF'
  const header = '姓名,性别,住院号,联系电话'
  const rows = [
    '张三,男,ZY2024001,13800138001',
    '李四,女,ZY2024002,13800138002'
  ]
  const csv = BOM + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '患者批量导入模板.csv'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('模板下载成功')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await patientApi.updatePatient(formData as any, userStore.level)
          ElMessage.success('更新成功')
        } else {
          await patientApi.addPatient(formData as any, userStore.userInfo?.id)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        loadPatients()
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败' : '新增失败')
      }
    }
  })
}

onMounted(() => {
  loadPatients()
})
</script>

<style scoped>
.patients-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.import-result {
  margin-top: 16px;
}

.import-result .import-errors {
  margin-top: 10px;
  padding: 10px;
  background: #fef0f0;
  border-radius: 6px;
  font-size: 12px;
  max-height: 160px;
  overflow-y: auto;
}

.import-result .errors-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #f56c6c;
}

.import-result .import-errors ul {
  margin: 0;
  padding-left: 18px;
}

.search-container {
  width: 100%;
  margin-bottom: 20px;
  padding: 0;
}

.patient-search-input {
  width: 100%;
  max-width: 100%;
}

.patient-search-input :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  border: 1px solid #e3f2fd;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(30, 136, 229, 0.08);
  transition: all 0.3s ease;
  padding: 12px 16px;
}

.patient-search-input :deep(.el-input__wrapper:hover) {
  border-color: #90caf9;
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.15);
}

.patient-search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
  background: #ffffff;
}

.patient-search-input :deep(.el-input__inner) {
  color: #1565c0;
  font-size: 14px;
}

.patient-search-input :deep(.el-input__inner::placeholder) {
  color: #90caf9;
}

.patient-search-input :deep(.el-input__prefix) {
  color: #2196f3;
}

.patient-search-input :deep(.el-input__suffix) {
  color: #90caf9;
}

:deep(.el-card) {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(30, 136, 229, 0.08);
  border: 1px solid rgba(227, 242, 253, 0.5);
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  box-shadow: 0 6px 20px rgba(30, 136, 229, 0.15);
  transform: translateY(-2px);
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  border-bottom: 1px solid #e3f2fd;
  font-weight: 600;
  color: #1976d2;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
}

:deep(.el-table th) {
  background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
  font-weight: 600;
  color: #1976d2;
  border-bottom: 2px solid #90caf9;
}

:deep(.el-table__body-wrapper) {
  width: 100%;
}

:deep(.el-table__header-wrapper) {
  width: 100%;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.pagination :deep(.el-pagination) {
  --el-pagination-button-color: #1976d2;
  --el-pagination-hover-color: #2196f3;
  --el-pagination-bg-color: #ffffff;
}

.pagination :deep(.el-pagination .btn-next),
.pagination :deep(.el-pagination .btn-prev) {
  color: #1976d2;
}

.pagination :deep(.el-pagination .btn-next:hover),
.pagination :deep(.el-pagination .btn-prev:hover) {
  color: #2196f3;
}

.pagination :deep(.el-pagination .number) {
  color: #1976d2;
}

.pagination :deep(.el-pagination .number:hover) {
  color: #2196f3;
}

.pagination :deep(.el-pagination .number.is-active) {
  background-color: #2196f3;
  color: #ffffff;
}
</style>
