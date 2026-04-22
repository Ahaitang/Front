<template>
  <div class="blacklist">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #F56C6C"><CircleCloseFilled /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.activeCount }}</span>
            <span class="stat-label">活跃封禁</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选区 -->
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="活跃" value="active" />
            <el-option label="已释放" value="released" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadBlacklist">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="danger" @click="showAddDialog">添加封禁</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 黑名单列表 -->
    <el-card>
      <el-table :data="blacklist" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="module" label="系统模块" width="120">
          <template #default="{ row }">
            <el-tag :type="row.module === 'qmg' ? 'primary' : 'warning'">
              {{ row.module === 'qmg' ? 'QMG' : '神经免疫' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)">{{ roleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="封禁原因" min-width="150" show-overflow-tooltip />
        <el-table-column prop="banTime" label="封禁时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.banTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="expireTime" label="过期时间" width="180">
          <template #default="{ row }">
            <span :class="{ 'expire-warning': isExpired(row.expireTime) && row.status === 'active' }">
              {{ formatDateTime(row.expireTime) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'danger' : 'success'">
              {{ row.status === 'active' ? '活跃' : '已释放' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorId" label="操作人ID" width="100">
          <template #default="{ row }">
            {{ row.operatorId || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'active'" type="success" size="small" @click="releaseUser(row)">解除封禁</el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加封禁对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加封禁" width="450px">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model.number="addForm.userId" type="number" />
        </el-form-item>
        <el-form-item label="系统模块" prop="module">
          <el-select v-model="addForm.module" style="width: 100%">
            <el-option label="QMG" value="qmg" />
            <el-option label="神经免疫" value="neuroimmune" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="addForm.role" style="width: 100%">
            <el-option label="医生" value="doctor" />
            <el-option label="管理员" value="admin" />
            <el-option label="患者" value="patient" />
          </el-select>
        </el-form-item>
        <el-form-item label="封禁原因" prop="reason">
          <el-input v-model="addForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="封禁时长">
          <el-input-number v-model="addForm.hours" :min="1" :max="72" /> 小时
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmAdd">确认封禁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { blacklistApi } from '@/utils/api'
import { formatDateTime } from '@/utils/export'

interface BlackListEntry {
  id: number
  userId: number
  role: string
  module: string
  reason: string
  banTime: string
  expireTime: string
  status: string
  operatorId: number | null
}

const loading = ref(false)
const blacklist = ref<BlackListEntry[]>([])
const stats = reactive({ activeCount: 0 })
const filter = reactive({ status: '' })

const addDialogVisible = ref(false)
const addFormRef = ref<FormInstance>()
const addForm = reactive({ userId: 0, module: '', role: '', reason: '', hours: 24 })
const addRules: FormRules = {
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  module: [{ required: true, message: '请选择系统模块', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  reason: [{ required: true, message: '请输入封禁原因', trigger: 'blur' }]
}

onMounted(() => {
  loadBlacklist()
  loadStats()
})

const loadBlacklist = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filter.status) params.status = filter.status
    const res = await blacklistApi.list(params)
    if (res.code === 200) {
      blacklist.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  const res = await blacklistApi.count()
  if (res.code === 200) {
    stats.activeCount = res.data.activeCount
  }
}

const resetFilter = () => {
  filter.status = ''
  loadBlacklist()
}

const showAddDialog = () => {
  addForm.userId = 0
  addForm.module = ''
  addForm.role = ''
  addForm.reason = ''
  addForm.hours = 24
  addDialogVisible.value = true
}

const confirmAdd = async () => {
  await addFormRef.value?.validate()
  try {
    const res = await blacklistApi.add({
      userId: addForm.userId,
      module: addForm.module,
      role: addForm.role,
      reason: addForm.reason,
      hours: addForm.hours
    })
    if (res.code === 200) {
      ElMessage.success('已添加封禁')
      addDialogVisible.value = false
      loadBlacklist()
      loadStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const releaseUser = async (row: BlackListEntry) => {
  try {
    await ElMessageBox.confirm(`确定要解除用户 ${row.userId} 的封禁吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await blacklistApi.release(row.id)
    if (res.code === 200) {
      ElMessage.success('已解除封禁')
      loadBlacklist()
      loadStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    // 用户取消
  }
}

const roleLabel = (role: string) => {
  const map: Record<string, string> = { doctor: '医生', admin: '管理员', patient: '患者' }
  return map[role] || role
}

const roleTagType = (role: string) => {
  const map: Record<string, string> = { doctor: 'success', admin: 'primary', patient: 'info' }
  return map[role] || ''
}

const isExpired = (expireTime: string) => {
  return new Date(expireTime) < new Date()
}
</script>

<style scoped>
.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  width: 180px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.filter-card {
  margin-bottom: 20px;
}

.expire-warning {
  color: #F56C6C;
}
</style>