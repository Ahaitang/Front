<template>
  <div class="patient-detail-page">
    <!-- 患者信息卡片 -->
    <el-card class="patient-info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><User /></el-icon>
            <span class="patient-name">{{ patientInfo?.name }}</span>
            <el-tag :type="patientInfo?.gender === 'male' ? 'primary' : 'danger'" style="margin-left: 10px">
              {{ patientInfo?.gender === 'male' ? '男' : '女' }}
            </el-tag>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
            <el-button @click="$router.back()">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
          </div>
        </div>
      </template>
      
      <el-descriptions :column="3" border>
        <el-descriptions-item label="患者ID">{{ patientInfo?.id }}</el-descriptions-item>
        <el-descriptions-item label="住院号">{{ patientInfo?.admissionNumber }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ patientInfo?.phone }}</el-descriptions-item>
        <el-descriptions-item label="记录总数">{{ records.length }} 条</el-descriptions-item>
        <el-descriptions-item label="最新评估">
          {{ latestRecord?.assessmentDate || '暂无' }}
        </el-descriptions-item>
        <el-descriptions-item label="最新得分">
          <span class="score-text">{{ latestRecord?.score?.total || latestRecord?.score?.totalScore || 0 }} 分</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 得分趋势图 -->
    <el-card class="chart-card" shadow="hover" v-loading="chartLoading">
      <template #header>
        <div class="card-header">
          <span>
            <el-icon><TrendCharts /></el-icon>
            得分变化趋势
          </span>
        </div>
      </template>
      <v-chart
        class="chart"
        :option="chartOption"
        :loading="chartLoading"
        autoresize
      />
    </el-card>

    <!-- 记录列表 -->
    <el-card class="records-card" shadow="hover">
      <template #header>
        <div class="records-header">
          <div class="header-title">
            <el-icon><Document /></el-icon>
            <span>评估记录列表</span>
          </div>
        </div>
      </template>
      
      <div class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索评估日期或医生"
          class="patient-search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <el-table
        :data="filteredRecords"
        style="width: 100%"
        v-loading="loading"
        stripe
        :default-sort="{ prop: 'assessmentDate', order: 'descending' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="assessmentDate" label="评估日期" width="120" sortable />
        <el-table-column label="总分" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.score?.total || row.score?.totalScore || 0)">
              {{ row.score?.total || row.score?.totalScore || 0 }} 分
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="各维度得分" min-width="200">
          <template #default="{ row }">
            <div class="dimension-scores">
              <el-tag size="small" v-for="(value, key) in (row.score?.categoryScores || {})" :key="key">
                {{ getCategoryNameByKey(key) }}: {{ value }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="doctorUsername" label="评估医生" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 记录详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="评估记录详情"
      width="900px"
    >
      <div v-if="currentRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ currentRecord.id }}</el-descriptions-item>
          <el-descriptions-item label="评估日期">{{ currentRecord.assessmentDate }}</el-descriptions-item>
          <el-descriptions-item label="评估医生">{{ currentRecord.doctorName || currentRecord.doctorUsername }}</el-descriptions-item>
          <el-descriptions-item label="总分">
            <span class="score-text-large">{{ currentRecord.score?.total || currentRecord.score?.totalScore || 0 }} 分</span>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 各维度得分 -->
        <el-divider v-if="currentRecord.score?.categoryScores">各维度得分</el-divider>
        <el-row :gutter="20" v-if="currentRecord.score?.categoryScores">
          <el-col :span="6" v-for="(value, key) in currentRecord.score.categoryScores" :key="String(key)">
            <el-card class="dimension-card" shadow="hover">
              <div class="dimension-name">{{ getCategoryNameByKey(String(key)) }}</div>
              <div class="dimension-value">{{ value }} 分</div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 选择详情 -->
        <el-divider v-if="currentRecord.selections">选择详情</el-divider>
        <el-descriptions :column="2" border v-if="currentRecord.selections">
          <el-descriptions-item
            v-for="(value, key) in currentRecord.selections"
            :key="key"
            :label="getItemNameByKey(String(key))"
          >
            {{ getOptionLabelByValue(String(key), value) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 用户自定义输入数据 -->
        <el-divider v-if="currentRecord.userInputData">用户自定义输入</el-divider>
        <el-card v-if="currentRecord.userInputData" shadow="never" style="margin-top: 10px;">
          <pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0; font-family: inherit;">{{ formatUserInputData(currentRecord.userInputData) }}</pre>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { questionnaireApi, patientApi } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { parseQuestionnaireRecords, parseQuestionnaireRecord } from '@/utils/questionnaireParser'
import { getItemNameByKey, getCategoryNameByKey, getOptionLabelByValue } from '@/utils/qmgConstants'
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
import { exportMultipleSheets } from '@/utils/export'
import {
  User,
  Download,
  ArrowLeft,
  TrendCharts,
  Document,
  Search,
  View
} from '@element-plus/icons-vue'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const chartLoading = ref(false)
const records = ref<any[]>([])
const patientInfo = ref<any>(null)
const detailVisible = ref(false)
const currentRecord = ref<any>(null)
const searchKeyword = ref('')
// 防止重复请求的标志
const isLoadingPatientInfo = ref(false)
const isLoadingRecords = ref(false)
const lastLoadedPatientId = ref<number | null>(null)
const lastLoadedRecordsPatientId = ref<number | null>(null)

// 从路由参数获取患者ID
const patientId = computed(() => {
  const id = route.params.id || route.query.id
  const numId = Number(id)
  if (isNaN(numId) || numId <= 0) {
    console.error('无效的患者ID:', id)
    return 0
  }
  return numId
})

// 过滤后的记录
const filteredRecords = computed(() => {
  if (!searchKeyword.value) return records.value
  const keyword = searchKeyword.value.toLowerCase()
  return records.value.filter(record => 
    record.assessmentDate?.toLowerCase().includes(keyword) ||
    record.doctorUsername?.toLowerCase().includes(keyword)
  )
})

// 最新记录
const latestRecord = computed(() => {
  if (records.value.length === 0) return null
  return [...records.value].sort((a, b) => 
    new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
  )[0]
})

// 图表配置
const chartOption = computed(() => {
  if (records.value.length === 0) {
    return {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'middle',
        textStyle: {
          fontSize: 16,
          color: '#909399'
        }
      }
    }
  }
  
  const sortedRecords = [...records.value].sort((a, b) => 
    new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
  )
  
  const dates = sortedRecords.map(r => r.assessmentDate)
  const scores = sortedRecords.map(r => r.score?.total || r.score?.totalScore || 0)
  
  return {
    title: {
      text: 'QMG 评分变化趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        return `${param.axisValue}<br/>${param.seriesName}: ${param.value} 分`
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
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '得分',
      min: 0,
      max: 39
    },
    series: [
      {
        name: '总分',
        type: 'line',
        smooth: true,
        data: scores,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        },
        markPoint: {
          data: [
            { type: 'max', name: '最高分' },
            { type: 'min', name: '最低分' }
          ]
        },
        markLine: {
          data: [
            { type: 'average', name: '平均分' }
          ]
        }
      }
    ]
  }
})

// 加载患者信息
const loadPatientInfo = async () => {
  if (!patientId.value) {
    ElMessage.error('患者ID无效')
    return
  }
  
  // 如果正在加载或已经加载过相同ID，则跳过
  if (isLoadingPatientInfo.value || lastLoadedPatientId.value === patientId.value) {
    return
  }
  
  isLoadingPatientInfo.value = true
  try {
    const currentDoctorId = userStore.userInfo?.id
    const currentUserLevel = userStore.level
    patientInfo.value = await patientApi.getPatientById(patientId.value, currentDoctorId, currentUserLevel)
    lastLoadedPatientId.value = patientId.value
    if (!patientInfo.value) {
      ElMessage.warning('未找到患者信息')
    }
  } catch (error: any) {
    console.error('加载患者信息失败:', error)
    ElMessage.error('加载患者信息失败: ' + (error.message || '未知错误'))
  } finally {
    isLoadingPatientInfo.value = false
  }
}

// 加载记录
const loadRecords = async () => {
  if (!patientId.value) {
    return
  }
  
  // 如果正在加载或已经加载过相同ID，则跳过
  if (isLoadingRecords.value || lastLoadedRecordsPatientId.value === patientId.value) {
    return
  }
  
  isLoadingRecords.value = true
  loading.value = true
  chartLoading.value = true
  try {
    const currentDoctorId = userStore.userInfo?.id
    const currentUserLevel = userStore.level
    const data = await questionnaireApi.getRecordsByPatientId(
      patientId.value,
      undefined,
      undefined,
      currentDoctorId,
      currentUserLevel
    )
    // 解析 JSON 字段
    records.value = parseQuestionnaireRecords(data || [])
    lastLoadedRecordsPatientId.value = patientId.value
    if (records.value.length === 0) {
      ElMessage.info('该患者暂无评估记录')
    }
  } catch (error: any) {
    console.error('加载评估记录失败:', error)
    ElMessage.error('加载评估记录失败: ' + (error.message || '未知错误'))
    records.value = []
  } finally {
    loading.value = false
    chartLoading.value = false
    isLoadingRecords.value = false
  }
}

// 加载所有数据
const loadData = () => {
  if (patientId.value) {
    loadPatientInfo()
    loadRecords()
  }
}

// 获取得分类型（用于标签颜色）
const getScoreType = (score: number) => {
  if (score >= 30) return 'danger'
  if (score >= 20) return 'warning'
  if (score >= 10) return 'info'
  return 'success'
}

// 格式化用户自定义输入数据
const formatUserInputData = (userInputData: any): string => {
  if (!userInputData) return ''
  
  try {
    // 如果是字符串，尝试解析为JSON
    if (typeof userInputData === 'string') {
      try {
        const parsed = JSON.parse(userInputData)
        // 如果是对象，格式化显示
        if (typeof parsed === 'object' && parsed !== null) {
          return JSON.stringify(parsed, null, 2)
        }
        return parsed
      } catch {
        // 如果不是JSON，直接返回字符串
        return userInputData
      }
    }
    
    // 如果是对象，格式化显示
    if (typeof userInputData === 'object' && userInputData !== null) {
      return JSON.stringify(userInputData, null, 2)
    }
    
    return String(userInputData)
  } catch (error) {
    return String(userInputData)
  }
}

// 查看详情
const handleViewDetail = (row: any) => {
  // 确保数据已解析
  currentRecord.value = parseQuestionnaireRecord(row)
  detailVisible.value = true
}

// 搜索
const handleSearch = () => {
  // 搜索逻辑已在 computed 中实现
}

// 导出数据
const handleExport = () => {
  try {
    // 准备导出数据
    const exportData = records.value.map(record => {
      const row: any = {
        '记录ID': record.id,
        '评估日期': record.assessmentDate,
        '评估医生': record.doctorUsername,
        '总分': record.score?.total || record.score?.totalScore || 0
      }
      
      // 添加各维度得分
      if (record.score?.categoryScores) {
        Object.keys(record.score.categoryScores).forEach(key => {
          row[getCategoryNameByKey(key)] = record.score.categoryScores[key]
        })
      }
      
      return row
    })
    
    // 准备患者信息数据
    const patientInfoData = [
      { '项目': 'ID', '值': patientInfo.value?.id },
      { '项目': '姓名', '值': patientInfo.value?.name },
      { '项目': '性别', '值': patientInfo.value?.gender === 'male' ? '男' : '女' },
      { '项目': '住院号', '值': patientInfo.value?.admissionNumber },
      { '项目': '联系电话', '值': patientInfo.value?.phone },
      { '项目': '记录总数', '值': records.value.length }
    ]
    
    // 导出多个工作表
    const fileName = `${patientInfo.value?.name || '患者'}_评估记录_${new Date().toISOString().split('T')[0]}.xlsx`
    exportMultipleSheets(
      [
        { name: '评估记录', data: exportData },
        { name: '患者信息', data: patientInfoData }
      ],
      fileName
    )
  } catch (error) {
    console.error('导出错误:', error)
  }
}

// 监听路由参数变化
watch(() => route.params.id, (newId, oldId) => {
  // 只有当ID真正改变时才重新加载
  if (newId && newId !== oldId) {
    // 重置加载状态
    lastLoadedPatientId.value = null
    lastLoadedRecordsPatientId.value = null
    loadData()
  }
}, { immediate: false })

onMounted(() => {
  // 只在挂载时加载一次
  if (patientId.value) {
    loadData()
  }
})
</script>

<style scoped>
.patient-detail-page {
  padding: 0;
}

.patient-info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1976d2;
}

.header-title .el-icon {
  font-size: 20px;
  color: #2196f3;
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

.header-left {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 24px;
  margin-right: 10px;
  color: #2196f3;
}

.patient-name {
  font-size: 20px;
  font-weight: bold;
  color: #1976d2;
}

.header-right {
  display: flex;
  gap: 10px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart {
  height: 400px;
  width: 100%;
}

.records-card {
  margin-bottom: 20px;
}

.score-text {
  font-size: 18px;
  font-weight: bold;
  color: #2196f3;
}

.score-text-large {
  font-size: 24px;
  font-weight: bold;
  color: #2196f3;
}

.dimension-scores {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.dimension-card {
  text-align: center;
  margin-bottom: 10px;
}

.dimension-name {
  font-size: 14px;
  color: #90caf9;
  margin-bottom: 8px;
  font-weight: 500;
}

.dimension-value {
  font-size: 24px;
  font-weight: bold;
  color: #2196f3;
}

.record-detail {
  padding: 10px 0;
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
}

:deep(.el-table th) {
  background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
  font-weight: 600;
  color: #1976d2;
  border-bottom: 2px solid #90caf9;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
  transform: translateY(-1px);
}
</style>
