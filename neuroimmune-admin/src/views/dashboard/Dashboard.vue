<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardStats, getPatientList, getFollowUpList, getMedicationList } from '@/api'
import type { FollowUp, Medication, Patient } from '@/api'
import { User, UserFilled, Calendar, FirstAidKit, ArrowRight, PieChart, TrendCharts, Clock, DataBoard } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)

const currentUserIsAdmin = computed(() => {
  const role = localStorage.getItem('admin_role')
  return role === 'admin'
})
const stats = ref({
  totalPatients: 0,
  totalDoctors: 0,
  pendingFollowUps: 0,
  completedFollowUps: 0,
  totalMedications: 0
})

const patients = ref<Patient[]>([])
const recentFollowUps = ref<FollowUp[]>([])
const recentMedications = ref<Medication[]>([])

const patientGenderStats = computed(() => {
  const male = patients.value.filter(p => p.gender === '男' || p.gender === 'male' || p.gender === 'M').length
  const female = patients.value.filter(p => p.gender === '女' || p.gender === 'female' || p.gender === 'F').length
  return [
    { name: '男性', value: male, color: '#3B82F6' },
    { name: '女性', value: female, color: '#EC4899' }
  ]
})

// 使用患者列表实际数量计算，确保百分比准确
const genderTotalCount = computed(() => patients.value.length)

const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'success',
    2: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '进行中',
    1: '已完成',
    2: '已取消'
  }
  return map[status] || '进行中'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const [statsRes, patientsRes, followUpsRes, medicationsRes] = await Promise.all([
      getDashboardStats(),
      getPatientList({ pageNum: 1, pageSize: 1000 }),
      getFollowUpList({ pageNum: 1, pageSize: 5 }),
      getMedicationList({ pageNum: 1, pageSize: 5 })
    ])

    if (statsRes) {
      stats.value = {
        totalPatients: statsRes.totalPatients || 0,
        totalDoctors: statsRes.totalDoctors || 0,
        pendingFollowUps: statsRes.pendingFollowUps || 0,
        completedFollowUps: statsRes.completedFollowUps || 0,
        totalMedications: statsRes.totalMedications || 0
      }
    }

    if (patientsRes) {
      patients.value = patientsRes.list || []
    }

    if (followUpsRes) {
      recentFollowUps.value = followUpsRes.list || []
    }

    if (medicationsRes) {
      recentMedications.value = medicationsRes.list || []
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

const goToPage = (path: string) => {
  router.push(path)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon><DataBoard /></el-icon>
        仪表盘
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row" :class="{ 'doctor-view': !currentUserIsAdmin }">
      <div class="stat-card" @click="goToPage('/patients')">
        <div class="stat-icon">
          <el-icon :size="26"><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalPatients }}</div>
          <div class="stat-label">患者总数</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="stat-card info" v-if="currentUserIsAdmin" @click="goToPage('/doctors')">
        <div class="stat-icon">
          <el-icon :size="26"><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalDoctors }}</div>
          <div class="stat-label">医生总数</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="stat-card warning" @click="goToPage('/followups')">
        <div class="stat-icon">
          <el-icon :size="26"><Calendar /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingFollowUps }}</div>
          <div class="stat-label">待随访数</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="stat-card success" @click="goToPage('/medications')">
        <div class="stat-icon">
          <el-icon :size="26"><FirstAidKit /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalMedications }}</div>
          <div class="stat-label">用药记录</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-row">
      <div class="content-card">
        <div class="card-title">
          <el-icon><PieChart /></el-icon>
          患者性别分布
        </div>
        <div class="gender-stats">
          <div v-for="item in patientGenderStats" :key="item.name" class="gender-item">
            <div class="gender-header">
              <span class="gender-dot" :style="{ background: item.color }"></span>
              <span class="gender-label">{{ item.name }}</span>
              <span class="gender-count">{{ item.value }} 人</span>
            </div>
            <el-progress
              :percentage="genderTotalCount > 0 ? Math.round((item.value / genderTotalCount) * 100) : 0"
              :stroke-width="12"
              :color="item.color"
              :show-text="false"
            />
          </div>
          <div class="gender-total">
            <span>总计</span>
            <span class="total-value">{{ genderTotalCount }} 人</span>
          </div>
        </div>
      </div>
      <div class="content-card">
        <div class="card-title">
          <el-icon><TrendCharts /></el-icon>
          随访状态概览
        </div>
        <div class="follow-stats">
          <div class="follow-stat-item warning">
            <div class="stat-circle">
              <span>{{ stats.pendingFollowUps }}</span>
            </div>
            <div class="stat-label">待随访</div>
          </div>
          <div class="follow-stat-item success">
            <div class="stat-circle">
              <span>{{ stats.completedFollowUps }}</span>
            </div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="recent-row">
      <div class="content-card">
        <div class="card-title">
          <el-icon><Clock /></el-icon>
          最近随访记录
          <el-button type="primary" link class="view-all" @click="goToPage('/followups')">查看全部</el-button>
        </div>
        <el-table :data="recentFollowUps" size="small" v-if="recentFollowUps.length">
          <el-table-column prop="patientName" label="患者" min-width="90" />
          <el-table-column prop="project" label="随访项目" min-width="120" show-overflow-tooltip />
          <el-table-column prop="date" label="日期" min-width="110" />
          <el-table-column prop="status" label="状态" min-width="90">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small" effect="light">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无随访记录" :image-size="80" />
      </div>
      <div class="content-card">
        <div class="card-title">
          <el-icon><Clock /></el-icon>
          最近用药记录
          <el-button type="primary" link class="view-all" @click="goToPage('/medications')">查看全部</el-button>
        </div>
        <el-table :data="recentMedications" size="small" v-if="recentMedications.length">
          <el-table-column prop="patientName" label="患者" min-width="90" />
          <el-table-column prop="medicationName" label="药品名称" min-width="120" show-overflow-tooltip />
          <el-table-column label="剂量" min-width="80">
            <template #default="{ row }">
              {{ row.dosageValue }}{{ row.dosageUnit }}
            </template>
          </el-table-column>
          <el-table-column prop="frequency" label="频率" min-width="90" />
        </el-table>
        <el-empty v-else description="暂无用药记录" :image-size="80" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  margin-bottom: 24px;

  .page-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 24px;
    font-weight: 700;
    color: #1E293B;

    .el-icon {
      color: #0891B2;
    }
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  &.doctor-view {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 1px solid #E5E7EB;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .stat-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(8, 145, 178, 0.1);
    color: #0891B2;
    flex-shrink: 0;
  }

  &.info .stat-icon {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
  }

  &.warning .stat-icon {
    background: rgba(245, 158, 11, 0.1);
    color: #F59E0B;
  }

  &.success .stat-icon {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1E293B;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 14px;
      color: #64748B;
      margin-top: 4px;
    }
  }

  .stat-arrow {
    color: #94A3B8;
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.2s ease;
  }
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #0891B2;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    color: #0891B2;
  }

  .view-all {
    margin-left: auto;
    font-size: 13px;
  }
}

.gender-stats {
  padding: 12px 0;

  .gender-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .gender-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      .gender-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 8px;
      }

      .gender-label {
        font-size: 14px;
        color: #475569;
        font-weight: 500;
      }

      .gender-count {
        margin-left: auto;
        font-size: 14px;
        color: #1E293B;
        font-weight: 600;
      }
    }
  }

  .gender-total {
    display: flex;
    justify-content: space-between;
    padding-top: 16px;
    margin-top: 16px;
    border-top: 1px dashed #E5E7EB;
    font-size: 14px;
    color: #64748B;

    .total-value {
      font-weight: 600;
      color: #1E293B;
    }
  }
}

.follow-stats {
  display: flex;
  justify-content: center;
  gap: 80px;
  padding: 32px 0;

  .follow-stat-item {
    text-align: center;

    .stat-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      position: relative;

      span {
        font-size: 32px;
        font-weight: 700;
      }

      &::before {
        content: '';
        position: absolute;
        inset: 4px;
        border-radius: 50%;
        background: #fff;
      }

      span {
        position: relative;
        z-index: 1;
      }
    }

    &.warning .stat-circle {
      background: rgba(245, 158, 11, 0.15);
      span { color: #D97706; }
    }

    &.success .stat-circle {
      background: rgba(16, 185, 129, 0.15);
      span { color: #059669; }
    }

    .stat-label {
      font-size: 14px;
      color: #64748B;
      font-weight: 500;
    }
  }
}

.recent-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  .content-card {
    min-height: 300px;
  }
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);

    &.doctor-view {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;

    &.doctor-view {
      grid-template-columns: 1fr;
    }
  }

  .chart-row,
  .recent-row {
    grid-template-columns: 1fr;
  }
}
</style>