<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon patient">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.patients }}</div>
              <div class="stat-label">患者总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon questionnaire">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.questionnaires }}</div>
              <div class="stat-label">问卷记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon doctor">
              <el-icon><Avatar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.doctors }}</div>
              <div class="stat-label">医生总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon today">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayRecords }}</div>
              <div class="stat-label">今日记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 最近一周统计曲线图 -->
    <el-row :gutter="20" style="margin-top: 20px" v-if="dailyStatistics.length > 0">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近一周每日问卷调查数量</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="chartOption" :loading="chartLoading" />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近问卷记录</span>
            </div>
          </template>
          <el-table :data="recentRecords" style="width: 100%" stripe>
            <el-table-column label="患者姓名" min-width="120">
              <template #default="{ row }">
                {{ row.patient?.name || row.patient_name || row.patientName || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="住院号" min-width="120">
              <template #default="{ row }">
                {{ row.patient?.admissionNumber || row.admissionNumber || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="assessmentDate" label="评估日期" min-width="120" />
            <el-table-column label="总分" min-width="100">
              <template #default="{ row }">
                <el-tag :type="getScoreType(row.score?.total || row.score?.totalScore || 0)">
                  {{ row.score?.total || row.score?.totalScore || 0 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="评估医生" min-width="120">
              <template #default="{ row }">
                {{ row.doctorName || row.doctor_name || row.doctorUsername || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { patientApi, questionnaireApi, doctorApi } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { User, Document, Avatar, Calendar } from '@element-plus/icons-vue'
import { parseQuestionnaireRecords } from '@/utils/questionnaireParser'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const userStore = useUserStore()

const stats = ref({
  patients: 0,
  questionnaires: 0,
  doctors: 0,
  todayRecords: 0
})

const recentRecords = ref<any[]>([])
const dailyStatistics = ref<Array<{ date: string; count: number }>>([])
const chartLoading = ref(false)

const loadStats = async () => {
  try {
    // 构建请求数组
    const requests: Promise<any>[] = [
      patientApi.getPatientList(userStore.userInfo?.id, userStore.level),
      questionnaireApi.getAllRecords(),
      questionnaireApi.getAllRecords(),
      questionnaireApi.countByDayLast7Days()
    ]
    
    // 如果用户有权限查看医生列表，则添加医生列表请求
    if (userStore.canManageDoctors) {
      requests.push(doctorApi.getDoctorList(userStore.level))
    }
    
    const results = await Promise.allSettled(requests)
    
    // 处理患者列表
    const patientsResult = results[0]
    if (patientsResult.status === 'fulfilled') {
      stats.value.patients = patientsResult.value.length
    }
    
    // 处理问卷记录
    const questionnairesResult = results[1]
    if (questionnairesResult.status === 'fulfilled') {
      stats.value.questionnaires = questionnairesResult.value.length
    }
    
    // 处理所有记录（用于今日记录和最近记录）
    const allRecordsResult = results[2]
    let parsedRecords: any[] = []
    if (allRecordsResult.status === 'fulfilled') {
      parsedRecords = parseQuestionnaireRecords(allRecordsResult.value || [])
      
      // 计算今日记录
      const today = new Date().toISOString().split('T')[0]
      stats.value.todayRecords = parsedRecords.filter(
        (r: any) => r.assessmentDate?.startsWith(today)
      ).length
      
      // 获取最近记录
      recentRecords.value = parsedRecords
        .sort((a: any, b: any) => 
          new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
        )
        .slice(0, 10)
    }
    
    // 处理按天统计
    const dailyStatsResult = results[3]
    if (dailyStatsResult.status === 'fulfilled') {
      dailyStatistics.value = dailyStatsResult.value || []
    }
    
    // 处理医生列表（如果有权限）
    if (userStore.canManageDoctors && results[4]) {
      const doctorsResult = results[4]
      if (doctorsResult.status === 'fulfilled') {
        stats.value.doctors = doctorsResult.value.length
      } else {
        // 如果获取失败，可能是权限问题，设置为0
        stats.value.doctors = 0
      }
    } else {
      // 没有权限查看医生列表，设置为0或隐藏
      stats.value.doctors = 0
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 获取得分类型（用于标签颜色）
const getScoreType = (score: number) => {
  if (score >= 30) return 'danger'
  if (score >= 20) return 'warning'
  if (score >= 10) return 'info'
  return 'success'
}

// 格式化日期显示
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

// 图表配置
const chartOption = computed(() => {
  const dates = dailyStatistics.value.map(item => formatDate(item.date))
  const counts = dailyStatistics.value.map(item => item.count)
  
  return {
    title: {
      text: '最近一周每日问卷调查数量',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line'
      },
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>数量: ${param.value}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '问卷数量',
        type: 'line',
        smooth: true,
        data: counts,
        itemStyle: {
          color: '#2196f3'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(33, 150, 243, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(33, 150, 243, 0.1)'
              }
            ]
          }
        },
        lineStyle: {
          width: 2
        }
      }
    ]
  }
})

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  margin-right: 15px;
}

.stat-icon.patient {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.stat-icon.questionnaire {
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
  box-shadow: 0 4px 12px rgba(66, 165, 245, 0.3);
}

.stat-icon.doctor {
  background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%);
  box-shadow: 0 4px 12px rgba(100, 181, 246, 0.3);
}

.stat-icon.today {
  background: linear-gradient(135deg, #90caf9 0%, #64b5f6 100%);
  box-shadow: 0 4px 12px rgba(144, 202, 249, 0.3);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1976d2;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #90caf9;
  font-weight: 500;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  padding: 20px;
  height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
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
  padding: 16px 20px;
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
