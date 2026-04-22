<template>
  <div class="audit-log">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #409EFF"><DataLine /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.todayOperations }}</span>
            <span class="stat-label">今日操作</span>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #67C23A"><UserFilled /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.loginCount }}</span>
            <span class="stat-label">今日登录</span>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #E6A23C"><Warning /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.kickCount }}</span>
            <span class="stat-label">今日踢下线</span>
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
        <el-form-item label="操作类型">
          <el-select v-model="filter.operationType" placeholder="全部" clearable style="width: 120px">
            <el-option label="登录" value="LOGIN" />
            <el-option label="登出" value="LOGOUT" />
            <el-option label="踢下线" value="KICK_OFFLINE" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="filter.timeRange" type="datetimerange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 300px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLogs">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="success" @click="exportLogs">导出Excel</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card>
      <el-table :data="logs" v-loading="loading" stripe>
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
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="opTagType(row.operationType)">{{ opLabel(row.operationType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="loginTime" label="登录时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.loginTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="logoutTime" label="登出时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.logoutTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="device" label="设备信息" min-width="150" show-overflow-tooltip />
        <el-table-column prop="operatorId" label="操作人ID" width="100">
          <template #default="{ row }">
            {{ row.operatorId || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="记录时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="loadLogs" @current-change="loadLogs" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { auditApi } from '@/utils/api'
import { exportToExcel, formatDateTime } from '@/utils/export'

interface SessionLog {
  id: number
  userId: number
  role: string
  module: string
  loginTime: string
  logoutTime: string | null
  ip: string | null
  device: string | null
  operationType: string
  operatorId: number | null
  createTime: string
}

const loading = ref(false)
const logs = ref<SessionLog[]>([])
const stats = reactive({ todayOperations: 0, loginCount: 0, kickCount: 0 })
const filter = reactive({ module: '', role: '', operationType: '', timeRange: [] as string[] })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

onMounted(() => {
  loadLogs()
  loadStats()
})

const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.pageSize }
    if (filter.module) params.module = filter.module
    if (filter.role) params.role = filter.role
    if (filter.operationType) params.operationType = filter.operationType
    if (filter.timeRange && filter.timeRange.length === 2) {
      params.startTime = filter.timeRange[0]
      params.endTime = filter.timeRange[1]
    }
    const res = await auditApi.list(params)
    if (res.code === 200) {
      logs.value = res.data.list
      pagination.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  const res = await auditApi.stats()
  if (res.code === 200) {
    stats.todayOperations = res.data.todayOperations
    stats.loginCount = res.data.loginCount
    stats.kickCount = res.data.kickCount
  }
}

const resetFilter = () => {
  filter.module = ''
  filter.role = ''
  filter.operationType = ''
  filter.timeRange = []
  pagination.page = 1
  loadLogs()
}

const exportLogs = () => {
  const headers: Record<string, string> = {
    id: 'ID',
    userId: '用户ID',
    module: '系统模块',
    role: '角色',
    operationType: '操作类型',
    loginTime: '登录时间',
    logoutTime: '登出时间',
    ip: 'IP地址',
    device: '设备信息',
    operatorId: '操作人ID',
    createTime: '记录时间'
  }
  exportToExcel(logs.value, `审计日志_${new Date().toISOString().slice(0, 10)}`, headers)
  ElMessage.success('导出成功')
}

const roleLabel = (role: string) => {
  const map: Record<string, string> = { doctor: '医生', admin: '管理员', patient: '患者' }
  return map[role] || role
}

const roleTagType = (role: string) => {
  const map: Record<string, string> = { doctor: 'success', admin: 'primary', patient: 'info' }
  return map[role] || ''
}

const opLabel = (op: string) => {
  const map: Record<string, string> = { LOGIN: '登录', LOGOUT: '登出', KICK_OFFLINE: '踢下线' }
  return map[op] || op
}

const opTagType = (op: string) => {
  const map: Record<string, string> = { LOGIN: 'success', LOGOUT: 'info', KICK_OFFLINE: 'warning' }
  return map[op] || ''
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>