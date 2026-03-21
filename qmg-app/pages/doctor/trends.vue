<template>
  <view class="trends-container">
    <!-- 患者信息 -->
    <view class="patient-header">
      <text class="patient-name">{{ patientInfo.name }}</text>
      <text class="patient-detail">{{ patientInfo.gender === 'male' ? '男' : '女' }} | {{ patientInfo.admissionNumber }}</text>
    </view>

    <!-- QMG总分趋势 -->
    <view class="chart-section">
      <view class="chart-title">QMG总分趋势</view>
      <view class="chart-container">
        <canvas
          canvas-id="trendChart"
          class="chart-canvas"
          :style="{ width: chartWidth + 'px', height: chartHeight + 'px' }"
        ></canvas>
      </view>
    </view>

    <!-- 历史记录列表 -->
    <view class="record-section">
      <view class="section-title">历史填写记录</view>
      <view
        v-for="(record, index) in patientRecords"
        :key="index"
        class="record-item"
        @click="viewDetail(record, index)"
      >
        <view class="record-left">
          <view class="record-date">{{ formatDate(record.assessmentDate) }}</view>
          <view class="record-time">{{ formatTime(record.assessmentDate) }}</view>
        </view>
        <view class="record-right">
          <view class="record-score-wrapper">
            <text class="score-label">总分</text>
            <text class="score-value">{{ record.score.totalScore || 0 }}</text>
            <text class="score-max">/ 39</text>
          </view>
          <view class="record-status" :class="getScoreStatusClass(record.score.totalScore || 0)">
            {{ getScoreStatusText(record.score.totalScore || 0) }}
          </view>
        </view>
        <text class="record-arrow">›</text>
      </view>
      <view v-if="loadingRecords" class="empty-records">
        <text class="empty-text">加载中...</text>
      </view>
      <view v-else-if="patientRecords.length === 0" class="empty-records">
        <text class="empty-text">暂无历史记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAssessmentStore } from '../../src/stores/assessment'
import { questionnaireApi } from '../../src/utils/api'
import type { Patient, QMGRecord } from '../../src/types/qmg'

const assessmentStore = useAssessmentStore()

// 患者信息（含 id 时从患者列表带入）
const patientInfo = computed(() => {
  return assessmentStore.getPatientInfo() || {
    name: '',
    gender: 'male' as const,
    admissionNumber: '',
    phone: ''
  }
})

// 从后端加载的该患者问卷记录（患者列表点「历史记录」时按患者ID拉取）
const loadedRecords = ref<QMGRecord[]>([])
const loadingRecords = ref(false)

// 将接口返回的一条记录转为前端 QMGRecord 格式（不请求患者详情，用当前 patientInfo）
function convertRecordToQMG(record: any, patient: Patient): QMGRecord {
  let selections: Record<string, string | number> = {}
  let itemScores: Record<string, number> = {}
  let categoryScores = { eyes: 0, bulbar: 0, respiratory: 0, limbs: 0 }
  try {
    if (record.selections) {
      selections = typeof record.selections === 'string' ? JSON.parse(record.selections) : record.selections
    }
    if (record.itemScores) {
      itemScores = typeof record.itemScores === 'string' ? JSON.parse(record.itemScores) : record.itemScores
    }
    if (record.categoryScores) {
      categoryScores = typeof record.categoryScores === 'string' ? JSON.parse(record.categoryScores) : record.categoryScores
    }
  } catch (_) {}
  return {
    id: record.id,
    patient: { ...patient },
    assessmentDate: record.assessmentDate || '',
    createTime: record.createTime || record.create_time || null,
    selections,
    score: {
      itemScores,
      totalScore: record.totalScore ?? 0,
      categoryScores
    },
    modifiedBy: 'doctor'
  }
}

// 该患者的所有记录：优先使用后端加载的，否则用本地 store 中匹配的
const patientRecords = computed(() => {
  if (loadedRecords.value.length > 0) {
    return loadedRecords.value
  }
  const patient = patientInfo.value
  if (!patient.name && !patient.admissionNumber) {
    return []
  }
  return assessmentStore.historyRecords.filter((record: QMGRecord) => {
    return record.patient.name === patient.name ||
           record.patient.admissionNumber === patient.admissionNumber
  })
})

// 图表尺寸
const chartWidth = ref(700)
const chartHeight = ref(400)

// 加载该患者的问卷记录（按患者ID + 当前医生权限）
async function loadPatientRecords() {
  const patient = patientInfo.value as Patient & { id?: number }
  const patientId = patient?.id
  if (patientId == null) return
  const doctorLoginInfo = uni.getStorageSync('doctorLoginInfo') as { id?: number } | null
  const doctorId = doctorLoginInfo?.id
  loadingRecords.value = true
  try {
    const list = await questionnaireApi.getRecordsByPatientId(patientId, doctorId)
    loadedRecords.value = list.map((r: any) => convertRecordToQMG(r, patientInfo.value as Patient))
  } catch (e) {
    console.error('加载患者历史记录失败:', e)
    uni.showToast({ title: '加载记录失败', icon: 'none' })
  } finally {
    loadingRecords.value = false
  }
  await nextTick()
  drawTrendChart()
}

onMounted(() => {
  uni.getSystemInfo({
    success: (res) => {
      chartWidth.value = res.windowWidth - 60
      chartHeight.value = 400
    }
  })
  loadPatientRecords().then(() => {
    if (loadedRecords.value.length === 0) {
      setTimeout(() => drawTrendChart(), 100)
    }
  })
})

watch(patientRecords, () => {
  drawTrendChart()
}, { deep: true })

// 绘制趋势图
const drawTrendChart = () => {
  const records = patientRecords.value
  if (records.length === 0) return

  const ctx = uni.createCanvasContext('trendChart')
  const width = chartWidth.value
  const height = chartHeight.value
  const padding = 40
  const chartWidthInner = width - padding * 2
  const chartHeightInner = height - padding * 2

  // 背景
  ctx.setFillStyle('#f8f8f8')
  ctx.fillRect(0, 0, width, height)

  // 绘制坐标轴
  ctx.setStrokeStyle('#cccccc')
  ctx.setLineWidth(1)
  
  // X轴
  ctx.beginPath()
  ctx.moveTo(padding, height - padding)
  ctx.lineTo(width - padding, height - padding)
  ctx.stroke()

  // Y轴
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  ctx.stroke()

  // Y轴刻度（0-39）
  ctx.setFontSize(20)
  ctx.setFillStyle('#666666')
  for (let i = 0; i <= 4; i++) {
    const value = (39 / 4) * (4 - i)
    const y = padding + (chartHeightInner / 4) * i
    ctx.fillText(value.toFixed(0), 10, y + 5)
  }

  // 绘制数据点
  if (records.length > 0) {
    const maxScore = 39
    const stepX = chartWidthInner / Math.max(records.length - 1, 1)

    ctx.setStrokeStyle('#667eea')
    ctx.setLineWidth(3)
    ctx.beginPath()

    records.forEach((record, index) => {
      const score = record.score.totalScore || 0
      const x = padding + stepX * index
      const y = height - padding - (score / maxScore) * chartHeightInner

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      // 绘制数据点
      ctx.setFillStyle('#667eea')
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()
    })

    ctx.stroke()
  }

  ctx.draw()
}


// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 获取得分状态类
const getScoreStatusClass = (score: number) => {
  if (score <= 9) return 'status-good'
  if (score <= 18) return 'status-moderate'
  return 'status-severe'
}

// 获取得分状态文本
const getScoreStatusText = (score: number) => {
  if (score <= 9) return '轻度'
  if (score <= 18) return '中度'
  return '重度'
}

// 查看详情（支持来自后端加载的记录或本地 store 的记录）
const viewDetail = (record: QMGRecord, _index: number) => {
  assessmentStore.setCurrentRecord(record)
  uni.navigateTo({
    url: '/pages/doctor/result'
  })
}
</script>

<style scoped>
.trends-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fb 0%, #f5f7fa 100%);
  padding: 30rpx;
  padding-bottom: 40rpx;
}

.patient-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border-radius: 28rpx;
  padding: 50rpx 40rpx;
  margin-bottom: 30rpx;
  text-align: center;
  box-shadow: 0 12rpx 40rpx rgba(102, 126, 234, 0.3), 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.patient-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.patient-name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12rpx;
  letter-spacing: 0.5rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.patient-detail {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.3rpx;
  position: relative;
  z-index: 1;
}

.chart-section {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 40rpx 36rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.1), 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(232, 236, 240, 0.8);
  position: relative;
  overflow: hidden;
}

.chart-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.chart-title {
  font-size: 34rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 40rpx;
  letter-spacing: 0.5rpx;
}

.chart-container {
  width: 100%;
  height: 400rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(180deg, #f8f9fb 0%, #ffffff 100%);
  border-radius: 16rpx;
  border: 2rpx solid #e8ecf0;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.record-section {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 40rpx 36rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.1), 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(232, 236, 240, 0.8);
  position: relative;
  overflow: hidden;
}

.record-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.section-title {
  font-size: 34rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 40rpx;
  letter-spacing: 0.5rpx;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  border-bottom: 2rpx solid #f0f4f8;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.record-item::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2rpx;
  width: 0;
  height: 2rpx;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.record-item:active {
  background-color: rgba(102, 126, 234, 0.05);
  transform: translateX(8rpx);
}

.record-item:active::after {
  width: 60rpx;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.record-date {
  font-size: 32rpx;
  color: #1a202c;
  font-weight: 600;
  letter-spacing: 0.3rpx;
}

.record-time {
  font-size: 26rpx;
  color: #a0aec0;
  font-weight: 500;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
  margin-right: 24rpx;
}

.record-score-wrapper {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.score-label {
  font-size: 26rpx;
  color: #718096;
  font-weight: 500;
}

.score-value {
  font-size: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  letter-spacing: -0.5rpx;
}

.score-max {
  font-size: 26rpx;
  color: #a0aec0;
  font-weight: 500;
}

.record-status {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 0.3rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.status-good {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(56, 142, 60, 0.2) 100%);
  color: #4caf50;
  border: 1rpx solid rgba(76, 175, 80, 0.3);
}

.status-moderate {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 143, 0, 0.2) 100%);
  color: #ff9800;
  border: 1rpx solid rgba(255, 152, 0, 0.3);
}

.status-severe {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(211, 47, 47, 0.2) 100%);
  color: #f44336;
  border: 1rpx solid rgba(244, 67, 54, 0.3);
}

.record-arrow {
  font-size: 40rpx;
  color: #cbd5e0;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.record-item:active .record-arrow {
  color: #667eea;
  transform: translateX(8rpx);
}

.empty-records {
  text-align: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 30rpx;
  color: #a0aec0;
  font-weight: 500;
}
</style>

