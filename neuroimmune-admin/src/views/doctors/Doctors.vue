<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Download, UploadFilled } from '@element-plus/icons-vue'
import {
  getDoctorList,
  saveDoctor as saveDoctorApi,
  deleteDoctor as deleteDoctorApi,
  updateDoctorPassword,
  getPatientList,
  getDoctorRoles,
  updateDoctorRoles,
  getCommonDictByType,
  DICT_TYPES
} from '@/api'
import type { Doctor, Patient, CommonDict } from '@/api'

const router = useRouter()

// 判断当前用户是否是管理员
const currentUserIsAdmin = computed(() => {
  const role = localStorage.getItem('admin_role')
  return role === 'admin'
})

const searchForm = ref({
  keyword: '',
  department: ''
})

const tableData = ref<Doctor[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = ref({
  pageNum: 1,
  pageSize: 10
})

// 详情/编辑对话框
const dialogVisible = ref(false)
const dialogType = ref<'view' | 'edit' | 'add'>('view')
const currentDoctor = ref<Partial<Doctor>>({})
const confirmPassword = ref('')
const saveLoading = ref(false)

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordForm = ref({ id: 0, password: '', confirmPassword: '' })
const passwordLoading = ref(false)

// 患者列表对话框
const patientDialogVisible = ref(false)
const currentDoctorPatients = ref<Patient[]>([])
const patientLoading = ref(false)

// 导入相关
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importResult = ref<{ total: number; success: number; failed: number; errors: string[] } | null>(null)
const fileList = ref<any[]>([])

// 角色编辑对话框
const roleDialogVisible = ref(false)
const roleForm = ref({ id: 0, name: '', roles: [] as string[], level: undefined as number | undefined })
const roleLoading = ref(false)
const currentUserLevel = ref<number | undefined>(undefined)

// 角色选项（动态加载）
const roleOptions = ref<CommonDict[]>([])

// 字典选项（动态加载）
const departmentOptions = ref<CommonDict[]>([])
const titleOptions = ref<CommonDict[]>([])

// 加载字典
const loadDicts = async () => {
  try {
    departmentOptions.value = await getCommonDictByType(DICT_TYPES.DEPARTMENT)
    titleOptions.value = await getCommonDictByType(DICT_TYPES.TITLE)
    roleOptions.value = await getCommonDictByType(DICT_TYPES.ROLE)
  } catch (e) {
    console.error('加载字典失败:', e)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...pagination.value,
      ...searchForm.value
    }
    const res = await getDoctorList(params)
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

onMounted(() => {
  loadDicts()
  loadData()
})

const handleSearch = () => {
  pagination.value.pageNum = 1
  loadData()
}

const handleReset = () => {
  searchForm.value = {
    keyword: '',
    department: ''
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

const viewDoctor = (row: Doctor) => {
  router.push(`/doctors/${row.id}`)
}

const editDoctor = (row: Doctor) => {
  currentDoctor.value = { ...row }
  dialogType.value = 'edit'
  dialogVisible.value = true
}

const addDoctor = () => {
  currentDoctor.value = {
    name: '',
    title: titleOptions.value[0]?.name || '',
    department: departmentOptions.value[0]?.name || '',
    hospital: '',
    phone: '',
    password: ''
  }
  confirmPassword.value = ''
  dialogType.value = 'add'
  dialogVisible.value = true
}

const deleteDoctor = (row: Doctor) => {
  if (row.patientCount > 0) {
    ElMessage.warning(`该医生下有 ${row.patientCount} 名患者，无法删除`)
    return
  }
  ElMessageBox.confirm(`确定要删除医生 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDoctorApi(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const saveDoctor = async () => {
  if (!currentDoctor.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!currentDoctor.value.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  if (dialogType.value === 'add') {
    if (!currentDoctor.value.password) {
      ElMessage.warning('请输入密码')
      return
    }
    if (currentDoctor.value.password.length < 6) {
      ElMessage.warning('密码长度不能少于6位')
      return
    }
    if (currentDoctor.value.password !== confirmPassword.value) {
      ElMessage.warning('两次输入的密码不一致')
      return
    }
  }

  saveLoading.value = true
  try {
    await saveDoctorApi(currentDoctor.value)
    ElMessage.success(dialogType.value === 'add' ? '添加成功' : '保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const viewPatients = async (row: Doctor) => {
  patientLoading.value = true
  patientDialogVisible.value = true
  try {
    const res = await getPatientList({ pageNum: 1, pageSize: 100, doctorId: row.id })
    currentDoctorPatients.value = res?.list || []
  } catch (e) {
    console.error('加载患者列表失败:', e)
    currentDoctorPatients.value = []
  } finally {
    patientLoading.value = false
  }
}

const openPasswordDialog = (row: Doctor) => {
  passwordForm.value = { id: row.id, password: '', confirmPassword: '' }
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
  if (passwordForm.value.password !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  passwordLoading.value = true
  try {
    await updateDoctorPassword(passwordForm.value.id, passwordForm.value.password)
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (e) {
    ElMessage.error('密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

// 下载模板
const downloadTemplate = async () => {
  try {
    const response = await fetch('/api/v1/neuroimmune/import/doctor/template')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const blob = await response.blob()
    if (blob.size === 0) {
      throw new Error('Empty file')
    }
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'doctor_template.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Download error:', e)
    ElMessage.error('下载模板失败: ' + (e as Error).message)
  }
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
    const token = localStorage.getItem('admin_token')
    const response = await fetch('/api/v1/neuroimmune/import/doctor', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    const res = await response.json()
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

// 打开角色编辑对话框
const openRoleDialog = async (row: Doctor) => {
  // 获取当前用户信息
  const userStr = localStorage.getItem('admin_user')
  if (userStr) {
    const user = JSON.parse(userStr)
    currentUserLevel.value = user.level
  }
  // 从后端获取角色列表
  try {
    const roles = await getDoctorRoles(row.id)
    roleForm.value = {
      id: row.id,
      name: row.name,
      roles: roles || [],
      level: row.level
    }
  } catch (e) {
    // 如果获取失败，使用本地数据
    roleForm.value = {
      id: row.id,
      name: row.name,
      roles: row.roles || (row.role ? row.role.split(',') : ['doctor']),
      level: row.level
    }
  }
  roleDialogVisible.value = true
}

// 保存角色设置
const handleSaveRole = async () => {
  if (roleForm.value.roles.length === 0) {
    ElMessage.warning('请至少选择一个角色')
    return
  }
  roleLoading.value = true
  try {
    await updateDoctorRoles(roleForm.value.id, roleForm.value.roles, roleForm.value.level)
    ElMessage.success('角色设置成功')
    roleDialogVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '角色设置失败')
  } finally {
    roleLoading.value = false
  }
}

const formatDate = (date: string) => {
  return date || '-'
}
</script>

<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon><UserFilled /></el-icon>
        医生管理
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名/手机号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="科室">
          <el-select
            v-model="searchForm.department"
            clearable
            placeholder="全部科室"
            style="width: 150px"
          >
            <el-option
              v-for="dept in departmentOptions"
              :key="dept.id"
              :label="dept.name"
              :value="dept.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="addDoctor">新增医生</el-button>
          <el-button type="warning" @click="openImportDialog">批量导入</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="content-card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="department" label="科室" min-width="100" />
        <el-table-column prop="title" label="职称" min-width="100">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" size="small">{{ row.title || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hospital" label="医院" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column label="患者数量" width="90">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewPatients(row)">
              {{ row.patientCount || 0 }} 人
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            <span class="text-secondary">{{ formatDate(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="viewDoctor(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="editDoctor(row)">编辑</el-button>
            <el-button v-if="currentUserIsAdmin" type="primary" link size="small" @click="openRoleDialog(row)">角色</el-button>
            <el-button type="warning" link size="small" @click="openPasswordDialog(row)">改密</el-button>
            <el-button type="danger" link size="small" @click="deleteDoctor(row)">删除</el-button>
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
      :title="dialogType === 'view' ? '医生详情' : dialogType === 'add' ? '新增医生' : '编辑医生'"
      width="600px"
    >
      <template v-if="currentDoctor">
        <el-form :model="currentDoctor" label-width="100px" :disabled="dialogType === 'view'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" required>
                <el-input v-model="currentDoctor.name" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="职称">
                <el-select v-model="currentDoctor.title" style="width: 100%">
                  <el-option
                    v-for="title in titleOptions"
                    :key="title.id"
                    :label="title.name"
                    :value="title.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="科室">
                <el-select v-model="currentDoctor.department" style="width: 100%">
                  <el-option
                    v-for="dept in departmentOptions"
                    :key="dept.id"
                    :label="dept.name"
                    :value="dept.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="医院">
                <el-input v-model="currentDoctor.hospital" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号" required>
                <el-input v-model="currentDoctor.phone" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20" v-if="dialogType === 'add'">
            <el-col :span="12">
              <el-form-item label="密码" required>
                <el-input
                  v-model="currentDoctor.password"
                  type="password"
                  placeholder="请输入密码（至少6位）"
                  show-password
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="确认密码" required>
                <el-input
                  v-model="confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  show-password
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20" v-if="dialogType !== 'add'">
            <el-col :span="12">
              <el-form-item label="患者数量">
                <el-input :model-value="(currentDoctor.patientCount || 0) + ' 人'" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建时间">
                <el-input :model-value="formatDate(currentDoctor.createTime!)" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogType !== 'view'" type="primary" :loading="saveLoading" @click="saveDoctor">保存</el-button>
      </template>
    </el-dialog>

    <!-- 患者列表对话框 -->
    <el-dialog v-model="patientDialogVisible" title="患者列表" width="750px">
      <el-table :data="currentDoctorPatients" stripe size="small" v-loading="patientLoading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="姓名" min-width="90" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="age" label="年龄" width="60" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="isRealAuth" label="实名状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isRealAuth ? 'success' : 'warning'" size="small">
              {{ row.isRealAuth ? '已实名' : '未实名' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hasFollowUp" label="随访状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.hasFollowUp ? 'primary' : 'info'" size="small">
              {{ row.hasFollowUp ? '待随访' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="100">
          <template #default="{ row }">
            {{ formatDate(row.updateTime) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="patient-count-info">
        共 <strong>{{ currentDoctorPatients.length }}</strong> 名患者
      </div>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form label-width="80px">
        <el-form-item label="新密码" required>
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
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
    <el-dialog v-model="importDialogVisible" title="批量导入医生" width="550px">
      <div class="import-tips">
        <el-alert type="info" :closable="false">
          <template #title>
            <div>导入说明：</div>
          </template>
          <ul class="tips-list">
            <li>请先下载模板，按照模板格式填写数据</li>
            <li>带 * 的字段为必填项</li>
            <li>密码为必填项</li>
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

    <!-- 角色编辑对话框 -->
    <el-dialog v-model="roleDialogVisible" title="角色设置" width="450px">
      <el-form label-width="80px">
        <el-form-item label="医生姓名">
          <el-input :model-value="roleForm.name" disabled />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="roleForm.roles" multiple style="width: 100%" placeholder="请选择角色">
            <el-option
              v-for="opt in roleOptions"
              :key="opt.id"
              :label="opt.name"
              :value="opt.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="管理等级" v-if="roleForm.roles?.includes('admin')">
          <el-input-number
            v-model="roleForm.level"
            :min="1"
            :max="10"
            placeholder="1为最高等级"
          />
          <div class="level-tip">数字越小等级越高，1为最高等级</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleLoading" @click="handleSaveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.patient-count {
  font-weight: 600;
  font-size: 14px;
  color: #0D9488;
}

.patient-count-info {
  margin-top: 16px;
  text-align: right;
  color: #6B7280;
  font-size: 14px;

  strong {
    color: #0D9488;
    font-size: 16px;
  }
}

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

.level-tip {
  font-size: 12px;
  color: #6B7280;
  margin-top: 8px;
}
</style>