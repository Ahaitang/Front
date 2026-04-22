<template>
  <div class="online-users">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #67C23A"><User /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">总在线</span>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #409EFF"><Monitor /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.qmg }}</span>
            <span class="stat-label">QMG系统</span>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #E6A23C"><FirstAidKit /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.neuroimmune }}</span>
            <span class="stat-label">神经免疫系统</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选区 -->
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="系统模块">
          <el-select v-model="filter.module" placeholder="全部" clearable style="width: 120px">
            <el-option label="QMG" value="qmg" />
            <el-option label="神经免疫" value="neuroimmune" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filter.role" placeholder="全部" clearable style="width: 120px">
            <el-option label="医生" value="doctor" />
            <el-option label="管理员" value="admin" />
            <el-option label="患者" value="patient" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUsers">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card>
      <el-table :data="users" v-loading="loading" stripe>
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
        <el-table-column prop="redisKey" label="Redis Key" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ttlSeconds" label="Token有效期" width="120">
          <template #default="{ row }">
            <span :class="{ 'expire-warning': row.ttlSeconds < 3600 }">
              {{ formatTTL(row.ttlSeconds) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" size="small" @click="kickUser(row)">踢下线</el-button>
            <el-button type="danger" size="small" @click="kickAndBan(row)">踢下线+封禁</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 踢下线对话框 -->
    <el-dialog v-model="kickDialogVisible" title="踢下线确认" width="400px">
      <p>确定要将用户 <strong>{{ kickTarget?.userId }}</strong> ({{ roleLabel(kickTarget?.role) }}) 踢下线吗？</p>
      <template #footer>
        <el-button @click="kickDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmKick">确认踢下线</el-button>
      </template>
    </el-dialog>

    <!-- 踢下线+封禁对话框 -->
    <el-dialog v-model="banDialogVisible" title="踢下线并封禁" width="450px">
      <p>确定要将用户 <strong>{{ kickTarget?.userId }}</strong> ({{ roleLabel(kickTarget?.role) }}) 踢下线并加入黑名单吗？</p>
      <el-form-item label="封禁时长（小时）">
        <el-input-number v-model="banHours" :min="1" :max="72" />
      </el-form-item>
      <template #footer>
        <el-button @click="banDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmKickAndBan">确认封禁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { onlineApi } from '@/utils/api'

interface OnlineUser {
  userId: number
  role: string
  module: string
  redisKey: string
  ttlSeconds: number
}

const loading = ref(false)
const users = ref<OnlineUser[]>([])
const stats = reactive({ total: 0, qmg: 0, neuroimmune: 0 })
const filter = reactive({ module: '', role: '' })

const kickDialogVisible = ref(false)
const banDialogVisible = ref(false)
const kickTarget = ref<OnlineUser | null>(null)
const banHours = ref(24)

onMounted(() => {
  loadUsers()
  loadStats()
})

const loadUsers = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filter.module) params.module = filter.module
    if (filter.role) params.role = filter.role
    const res = await onlineApi.list(params)
    if (res.code === 200) {
      users.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  const res = await onlineApi.count()
  if (res.code === 200) {
    stats.total = res.data.total
    stats.qmg = res.data.qmg
    stats.neuroimmune = res.data.neuroimmune
  }
}

const resetFilter = () => {
  filter.module = ''
  filter.role = ''
  loadUsers()
}

const roleLabel = (role: string) => {
  const map: Record<string, string> = { doctor: '医生', admin: '管理员', patient: '患者' }
  return map[role] || role
}

const roleTagType = (role: string) => {
  const map: Record<string, string> = { doctor: 'success', admin: 'primary', patient: 'info' }
  return map[role] || ''
}

const formatTTL = (seconds: number) => {
  if (!seconds || seconds <= 0) return '已过期'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}时${minutes}分`
  return `${minutes}分钟`
}

const kickUser = (user: OnlineUser) => {
  kickTarget.value = user
  kickDialogVisible.value = true
}

const kickAndBan = (user: OnlineUser) => {
  kickTarget.value = user
  banHours.value = 24
  banDialogVisible.value = true
}

const confirmKick = async () => {
  if (!kickTarget.value) return
  try {
    const res = await onlineApi.kick({
      userId: kickTarget.value.userId,
      role: kickTarget.value.role,
      module: kickTarget.value.module
    })
    if (res.code === 200) {
      ElMessage.success('已踢下线')
      kickDialogVisible.value = false
      loadUsers()
      loadStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const confirmKickAndBan = async () => {
  if (!kickTarget.value) return
  try {
    const res = await onlineApi.kick({
      userId: kickTarget.value.userId,
      role: kickTarget.value.role,
      module: kickTarget.value.module,
      addToBlacklist: true,
      banHours: banHours.value
    })
    if (res.code === 200) {
      ElMessage.success(`已踢下线并封禁 ${banHours.value} 小时`)
      banDialogVisible.value = false
      loadUsers()
      loadStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped>
.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  width: 200px;
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