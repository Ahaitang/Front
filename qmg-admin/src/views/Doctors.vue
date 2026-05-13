<template>
  <div class="doctors-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>医生管理</span>
          <div>
            <el-button type="success" @click="handleBatchImport" style="margin-right: 10px">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增医生
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="doctorList" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" min-width="80" />
        <el-table-column prop="employeeNumber" label="工号" min-width="120" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column label="权限等级" min-width="140">
          <template #default="{ row }">
            <el-tag v-if="row.level === 0" type="danger">超级管理员</el-tag>
            <el-tag v-else-if="row.level === 1" type="warning">管理员</el-tag>
            <el-tag v-else type="info">普通医生</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180" />
        <el-table-column label="操作" min-width="120" fixed="right" v-if="userStore.isSuperAdmin">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 新增对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增医生"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="工号" prop="employeeNumber">
          <el-input v-model="formData.employeeNumber" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password" type="password" />
        </el-form-item>
        <el-alert
          title="新增的医生默认权限等级为2（普通医生）"
          type="info"
          :closable="false"
          style="margin-top: 10px"
        />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入医生"
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
            <p>1. 请下载 Excel 模板文件，按照模板格式填写数据</p>
            <p>2. Excel 文件必须包含以下列：工号、用户名、密码</p>
            <p>3. 工号必须唯一，已存在的工号将被跳过</p>
            <p>4. 密码长度不能少于6位</p>
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
        :on-change="handleFileChange"
        :limit="1"
        accept=".xlsx,.xls"
        :file-list="fileList"
      >
        <template #trigger>
          <el-button type="primary">选择文件</el-button>
        </template>
        <el-button
          style="margin-left: 10px"
          type="success"
          @click="handleImport"
          :loading="importing"
          :disabled="fileList.length === 0"
        >
          开始导入
        </el-button>
      </el-upload>
      
      <div v-if="importResult" style="margin-top: 20px">
        <el-alert
          :title="`导入完成：成功 ${importResult.successCount} 条，共 ${importResult.totalCount} 条`"
          :type="importResult.successCount === importResult.totalCount ? 'success' : 'warning'"
          :closable="false"
        />
      </div>
    </el-dialog>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑医生"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editFormData"
        :rules="editFormRules"
        label-width="100px"
      >
        <el-form-item label="工号" prop="employeeNumber">
          <el-input v-model="editFormData.employeeNumber" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editFormData.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="editFormData.password" type="password" placeholder="留空则不修改密码" />
        </el-form-item>
        <el-form-item label="权限等级" prop="level" v-if="userStore.isSuperAdmin">
          <el-select v-model="editFormData.level" style="width: 100%">
            <el-option label="超级管理员" :value="0" />
            <el-option label="管理员" :value="1" />
            <el-option label="普通医生" :value="2" />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="!userStore.isSuperAdmin"
          title="只有超级管理员可以修改权限等级"
          type="warning"
          :closable="false"
          style="margin-top: 10px"
        />
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { doctorApi } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElMessage, type FormInstance, type FormRules, type UploadFile, type UploadFiles } from 'element-plus'
import { Plus, Upload, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const doctorList = ref<any[]>([])
const dialogVisible = ref(false)
const editDialogVisible = ref(false)
const importDialogVisible = ref(false)
const importing = ref(false)
const fileList = ref<UploadFile[]>([])
const importResult = ref<{ successCount: number; totalCount: number } | null>(null)
// @ts-expect-error template ref used in template
const uploadRef = ref()
const formRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()

const formData = reactive({
  employeeNumber: '',
  username: '',
  password: ''
})

const editFormData = reactive({
  id: undefined as number | undefined,
  employeeNumber: '',
  username: '',
  password: '',
  level: 2
})

const formRules: FormRules = {
  employeeNumber: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const editFormRules: FormRules = {
  employeeNumber: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  level: [{ required: true, message: '请选择权限等级', trigger: 'change' }]
}

const loadDoctors = async () => {
  loading.value = true
  try {
    doctorList.value = await doctorApi.getDoctorList(userStore.level)
  } catch (error: any) {
    ElMessage.error(error.message || '加载医生列表失败')
    // 如果权限不足，跳转到首页
    if (error.message?.includes('权限不足')) {
      router.push('/dashboard')
    }
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  Object.assign(formData, {
    employeeNumber: '',
    username: '',
    password: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  if (!userStore.isSuperAdmin) {
    ElMessage.warning('只有超级管理员可以编辑医生信息')
    return
  }
  Object.assign(editFormData, {
    id: row.id,
    employeeNumber: row.employeeNumber || '',
    username: row.username,
    password: '',
    level: row.level ?? 2
  })
  editDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await doctorApi.register(formData, userStore.level)
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadDoctors()
      } catch (error: any) {
        ElMessage.error(error.message || '新增失败')
      }
    }
  })
}

const handleEditSubmit = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const updateData: any = {
          id: editFormData.id,
          employeeNumber: editFormData.employeeNumber,
          username: editFormData.username
        }
        
        // 只有密码不为空时才更新密码
        if (editFormData.password) {
          updateData.password = editFormData.password
        }
        
        // 只有超级管理员可以修改权限等级
        if (userStore.isSuperAdmin && editFormData.level !== undefined) {
          updateData.level = editFormData.level
        }
        
        await doctorApi.updateDoctor(updateData, userStore.level)
        ElMessage.success('更新成功')
        editDialogVisible.value = false
        loadDoctors()
      } catch (error: any) {
        ElMessage.error(error.message || '更新失败')
      }
    }
  })
}

// 下载 Excel 模板
const downloadTemplate = () => {
  // 创建工作簿
  const wb = XLSX.utils.book_new()
  
  // 创建表头
  const headers = ['工号', '用户名', '密码']
  const data = [
    headers,
    ['EMP000001', 'doctor1', '请设置密码'],
    ['EMP000002', 'doctor2', '请设置密码'],
    ['EMP000003', 'doctor3', '请设置密码']
  ]
  
  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // 设置列宽
  ws['!cols'] = [
    { wch: 15 }, // 工号
    { wch: 20 }, // 用户名
    { wch: 15 }  // 密码
  ]
  
  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, '医生数据')
  
  // 下载文件
  XLSX.writeFile(wb, '医生批量导入模板.xlsx')
  ElMessage.success('模板下载成功')
}

// 处理文件选择
const handleFileChange = (_file: UploadFile, files: UploadFiles) => {
  fileList.value = files
  importResult.value = null
}

// 解析 Excel 文件
const parseExcelFile = (file: File): Promise<Array<{ employeeNumber: string; username: string; password: string }>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 读取第一个工作表
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          reject(new Error('Excel 文件为空'))
          return
        }
        const worksheet = workbook.Sheets[firstSheetName]!
        
        // 转换为 JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        
        if (jsonData.length < 2) {
          reject(new Error('Excel 文件至少需要包含表头和数据行'))
          return
        }
        
        // 第一行是表头，查找列索引
        const headers = (jsonData[0] || []).map((h: any) => String(h).trim().toLowerCase())
        const employeeNumberIndex = headers.findIndex((h: string) => 
          h.includes('工号') || h.includes('employee') || h.includes('工号')
        )
        const usernameIndex = headers.findIndex((h: string) => 
          h.includes('用户名') || h.includes('username') || h.includes('用户')
        )
        const passwordIndex = headers.findIndex((h: string) => 
          h.includes('密码') || h.includes('password') || h.includes('密码')
        )
        
        if (employeeNumberIndex === -1 || usernameIndex === -1 || passwordIndex === -1) {
          reject(new Error('Excel 文件必须包含：工号、用户名、密码 三列'))
          return
        }
        
        // 解析数据行
        const doctors: Array<{ employeeNumber: string; username: string; password: string }> = []
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue
          
          const employeeNumber = String(row[employeeNumberIndex] || '').trim()
          const username = String(row[usernameIndex] || '').trim()
          const password = String(row[passwordIndex] || '').trim()
          
          if (!employeeNumber || !username || !password) {
            continue // 跳过空行
          }
          
          if (password.length < 6) {
            reject(new Error(`第 ${i + 1} 行：密码长度不能少于6位`))
            return
          }
          
          doctors.push({ employeeNumber, username, password })
        }
        
        if (doctors.length === 0) {
          reject(new Error('Excel 文件中没有有效的数据行'))
          return
        }
        
        resolve(doctors)
      } catch (error: any) {
        reject(new Error('解析 Excel 文件失败：' + error.message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

// 批量导入
const handleBatchImport = () => {
  if (!userStore.canManageDoctors) {
    ElMessage.warning('只有管理员可以批量导入医生')
    return
  }
  importDialogVisible.value = true
  fileList.value = []
  importResult.value = null
}

// 执行导入
const handleImport = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  const file = fileList.value[0]?.raw
  if (!file) {
    ElMessage.warning('文件不存在')
    return
  }
  
  importing.value = true
  importResult.value = null
  
  try {
    // 解析 Excel 文件
    const doctors = await parseExcelFile(file)
    
    if (doctors.length === 0) {
      ElMessage.warning('Excel 文件中没有有效数据')
      importing.value = false
      return
    }
    
    // 调用批量注册接口
    const result = await doctorApi.batchRegister(doctors, userStore.level)
    
    // 显示结果
    if (result && typeof result === 'object' && 'successCount' in result) {
      importResult.value = {
        successCount: result.successCount as number,
        totalCount: result.totalCount as number
      }
      
      if (result.successCount === result.totalCount) {
        ElMessage.success(`成功导入 ${result.successCount} 条医生数据`)
      } else {
        ElMessage.warning(`导入完成：成功 ${result.successCount} 条，共 ${result.totalCount} 条`)
      }
      
      // 刷新列表
      await loadDoctors()
      
      // 3秒后自动关闭对话框
      setTimeout(() => {
        if (importResult.value?.successCount === importResult.value?.totalCount) {
          importDialogVisible.value = false
          fileList.value = []
          importResult.value = null
        }
      }, 3000)
    } else {
      ElMessage.success('导入成功')
      importDialogVisible.value = false
      fileList.value = []
      importResult.value = null
      await loadDoctors()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  loadDoctors()
})
</script>

<style scoped>
.doctors-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

:deep(.el-table__body-wrapper) {
  width: 100%;
}

:deep(.el-table__header-wrapper) {
  width: 100%;
}
</style>
