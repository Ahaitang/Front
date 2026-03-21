<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getDashboardStats, getPatientList, getFollowUpList, getMedicationList } from '@/api'
import type { FollowUp, Medication, Patient } from '@/api'

const loading = ref(false)
const stats = ref({
  totalPatients: 0,
  totalDoctors: 0,
  pendingFollowUps: 0,
  totalMedications: 0
})

const patients = ref<Patient[]>([])
const recentFollowUps = ref<FollowUp[]>([])
const recentMedications = ref<Medication[]>([])

const patientGenderStats = computed(() => {
  const male = patients.value.filter(p => p.gender === '男').length
  const female = patients.value.filter(p => p.gender === '女').length
  return [
    { name: '男性', value: male },
    { name: '女性', value: female }
  ]
})

const completedFollowUps = computed(() => {
  return recentFollowUps.value.filter(f => f.status === 'completed').length
})

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
    // 并行加载所有数据
    const [statsRes, patientsRes, followUpsRes, medicationsRes] = await Promise.all([
      getDashboardStats(),
      getPatientList({ pageNum: 1, pageSize: 1000 }),
      getFollowUpList({ pageNum: 1, pageSize: 5 }),
      getMedicationList({ pageNum: 1, pageSize: 5 })
    ])

    // 统计数据
    if (statsRes) {
      stats.value = {
        totalPatients: statsRes.totalPatients || 0,
        totalDoctors: statsRes.totalDoctors || 0,
        pendingFollowUps: statsRes.pendingFollowUps || 0,
        totalMedications: statsRes.totalMedications || 0
      }
    }

    // 患者列表（用于性别统计）
    if (patientsRes) {
      patients.value = patientsRes.list || []
    }

    // 最近随访
    if (followUpsRes) {
      recentFollowUps.value = followUpsRes.list || []
    }

    // 最近用药
    if (medicationsRes) {
      recentMedications.value = medicationsRes.list || []
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #0D9488, #14B8A6)">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="stat-value">{{ stats.totalPatients }}</div>
          <div class="stat-label">患者总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3B82F6, #60A5FA)">
            <el-icon :size="24"><UserFilled /></el-icon>
          </div>
          <div class="stat-value">{{ stats.totalDoctors }}</div>
          <div class="stat-label">医生总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #F59E0B, #FBBF24)">
            <el-icon :size="24"><Calendar /></el-icon>
          </div>
          <div class="stat-value">{{ stats.pendingFollowUps }}</div>
          <div class="stat-label">待随访数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #10B981, #34D399)">
            <el-icon :size="24"><FirstAidKit /></el-icon>
          </div>
          <div class="stat-value">{{ stats.totalMedications }}</div>
          <div class="stat-label">用药记录</div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <div class="content-card">
          <div class="card-title">患者性别分布</div>
          <div class="gender-stats">
            <div v-for="item in patientGenderStats" :key="item.name" class="gender-item">
              <div class="gender-label">{{ item.name }}</div>
              <el-progress
                :percentage="stats.totalPatients > 0 ? (item.value / stats.totalPatients) * 100 : 0"
                :stroke-width="16"
                :color="item.name === '男性' ? '#3B82F6' : '#EC4899'"
              />
              <div class="gender-value">{{ item.value }} 人</div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="content-card">
          <div class="card-title">随访状态统计</div>
          <div class="follow-stats">
            <div class="follow-stat-item">
              <span class="label">待随访</span>
              <span class="value warning">{{ stats.pendingFollowUps }}</span>
            </div>
            <div class="follow-stat-item">
              <span class="label">已完成</span>
              <span class="value success">{{ completedFollowUps }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 最近记录 -->
    <el-row :gutter="20" class="recent-row">
      <el-col :span="12">
        <div class="content-card">
          <div class="card-title">最近随访记录</div>
          <el-table :data="recentFollowUps" size="small">
            <el-table-column prop="patientName" label="患者" width="100" />
            <el-table-column prop="project" label="随访项目" />
            <el-table-column prop="date" label="日期" width="110" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="content-card">
          <div class="card-title">最近用药记录</div>
          <el-table :data="recentMedications" size="small">
            <el-table-column prop="patientName" label="患者" width="100" />
            <el-table-column prop="medicationName" label="药品名称" />
            <el-table-column prop="dosage" label="剂量" width="80">
              <template #default="{ row }">
                {{ row.dosage }}{{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column prop="frequency" label="频率" width="100" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.stat-row {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.gender-stats {
  padding: 20px 0;

  .gender-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .gender-label {
      font-size: 14px;
      color: #6B7280;
      margin-bottom: 8px;
    }

    .gender-value {
      font-size: 14px;
      color: #1F2937;
      margin-top: 8px;
      text-align: right;
    }
  }
}

.follow-stats {
  display: flex;
  gap: 40px;
  padding: 40px 0;
  justify-content: center;

  .follow-stat-item {
    text-align: center;

    .label {
      font-size: 14px;
      color: #6B7280;
      display: block;
      margin-bottom: 8px;
    }

    .value {
      font-size: 36px;
      font-weight: bold;

      &.warning { color: #F59E0B; }
      &.success { color: #10B981; }
    }
  }
}
</style>