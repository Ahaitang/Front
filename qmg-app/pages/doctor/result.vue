<template>
  <view class="result-container">
    <!-- 患者信息卡片 -->
    <view class="patient-info-card">
      <view class="patient-header">
        <text class="patient-name">{{ patientInfo.name }}</text>
        <text class="patient-badge">{{ patientInfo.gender === 'male' ? '男' : '女' }}</text>
      </view>
      <view class="patient-info-row">
        <text class="patient-admission">住院号: {{ patientInfo.admissionNumber }}</text>
        <text v-if="patientInfo.phone" class="patient-phone">手机号: {{ patientInfo.phone }}</text>
      </view>
      <text class="patient-date">测评日期: {{ formatDate(assessmentDate) }}</text>
    </view>

    <!-- QMG总分 -->
    <view class="total-score-card">
      <text class="total-label">QMG总分</text>
      <view class="total-value-wrapper">
        <text class="total-value">{{ totalScore }}</text>
        <text class="total-max">/ 39</text>
      </view>
      <view class="score-status" :class="scoreStatusClass">
        {{ scoreStatusText }}
      </view>
    </view>

    <!-- 得分表格 -->
    <view class="score-table-container">
      <view class="table-header">
        <view class="table-header-cell item-name-header">项目名称</view>
        <view class="table-header-cell score-header">0分</view>
        <view class="table-header-cell score-header">1分</view>
        <view class="table-header-cell score-header">2分</view>
        <view class="table-header-cell score-header">3分</view>
      </view>
      <view
        v-for="item in allItems"
        :key="item.key"
        class="table-row"
      >
        <view class="table-cell item-name-cell">
          <text class="item-name-text">{{ getItemDisplayName(item) }}</text>
        </view>
        <view class="table-cell score-cell" :class="{ checked: getItemScore(item.key) === 0 }">
          <text v-if="getItemScore(item.key) === 0" class="check-mark">✓</text>
        </view>
        <view class="table-cell score-cell" :class="{ checked: getItemScore(item.key) === 1 }">
          <text v-if="getItemScore(item.key) === 1" class="check-mark">✓</text>
        </view>
        <view class="table-cell score-cell" :class="{ checked: getItemScore(item.key) === 2 }">
          <text v-if="getItemScore(item.key) === 2" class="check-mark">✓</text>
        </view>
        <view class="table-cell score-cell" :class="{ checked: getItemScore(item.key) === 3 }">
          <text v-if="getItemScore(item.key) === 3" class="check-mark">✓</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="btn btn-secondary" @click="goBack">返回</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAssessmentStore } from '../../src/stores/assessment'
import { calculateQMGScore } from '../../src/utils/qmgScoreCalculator'
import { QMG_ITEMS, QMG_CATEGORIES } from '../../src/utils/qmgScoreConstants'
import type { QMGItemConfig } from '../../src/utils/qmgScoreConstants'

const assessmentStore = useAssessmentStore()

// 患者信息
const patientInfo = computed(() => {
  const record = displayRecord.value || assessmentStore.currentRecord
  if (!record || !record.patient) {
    return { name: '', gender: 'male' as const, admissionNumber: '', phone: '' }
  }
  return record.patient
})

// 测评日期
const assessmentDate = computed(() => {
  const record = displayRecord.value || assessmentStore.currentRecord
  return record?.assessmentDate || new Date().toISOString().split('T')[0]
})

// 计算得分
const scoreResult = computed(() => {
  const record = displayRecord.value || assessmentStore.currentRecord
  if (!record || !record.selections) {
    // 如果有保存的得分，直接使用
    if (record?.score) {
      return record.score
    }
    return {
      itemScores: {},
      totalScore: 0,
      categoryScores: { eyes: 0, bulbar: 0, respiratory: 0, limbs: 0 }
    }
  }
  
  // 如果已经有计算好的得分，直接使用
  if (record.score) {
    return record.score
  }
  
  // 否则重新计算
  return calculateQMGScore(
    record.selections,
    record.patient
  )
})

// 各项得分
const itemScores = computed(() => scoreResult.value.itemScores)

// 总分
const totalScore = computed(() => scoreResult.value.totalScore)

// 分类得分
const categoryScores = computed(() => scoreResult.value.categoryScores)

// 分类项目
const categoryItems = computed(() => {
  return {
    eyes: QMG_CATEGORIES.eyes.items,
    bulbar: QMG_CATEGORIES.bulbar.items,
    respiratory: QMG_CATEGORIES.respiratory.items,
    limbs: QMG_CATEGORIES.limbs.items
  }
})

// 所有项目（用于表格展示）
const allItems = computed(() => {
  return QMG_ITEMS
})

// 获取项目显示名称（如果有输入值，显示项目名称+数值）
const getItemDisplayName = (item: QMGItemConfig): string => {
  const record = displayRecord.value || assessmentStore.currentRecord
  if (!record || !record.selections) {
    return item.name
  }
  
  const selection = record.selections[item.key]
  if (item.hasInput && selection && typeof selection === 'object' && 'value' in selection) {
    const value = selection.value
    if (value !== undefined && value !== null) {
      const unit = item.inputUnit || ''
      return `${item.name} ${value}${unit}`
    }
  }
  
  return item.name
}

// 获取项目得分
const getItemScore = (itemKey: string): number => {
  return itemScores.value[itemKey] || 0
}

// 得分状态
const scoreStatusClass = computed(() => {
  if (totalScore.value <= 9) return 'status-good'
  if (totalScore.value <= 18) return 'status-moderate'
  return 'status-severe'
})

const scoreStatusText = computed(() => {
  if (totalScore.value <= 9) return '轻度'
  if (totalScore.value <= 18) return '中度'
  return '重度'
})

// 保存当前记录的副本用于显示（避免保存后被清空）
const displayRecord = ref<any>(null)

onMounted(async () => {
  // 计算并保存得分
  if (assessmentStore.currentRecord && assessmentStore.currentRecord.selections) {
    // 先保存一份副本用于显示
    displayRecord.value = JSON.parse(JSON.stringify(assessmentStore.currentRecord))
    
    // 计算得分
    const result = calculateQMGScore(
      assessmentStore.currentRecord.selections,
      assessmentStore.currentRecord.patient
    )
    
    // 更新得分到当前记录和显示记录
    assessmentStore.currentRecord.score = result
    displayRecord.value.score = result
    
    // 保存到历史记录（同时保存到后端数据库）
    // 注意：saveCurrentRecord 会清空 currentRecord，所以使用 displayRecord 来显示
    await assessmentStore.saveCurrentRecord()
  } else if (assessmentStore.historyRecords.length > 0) {
    // 如果没有当前记录，尝试从历史记录中获取最新的
    const latestRecord = assessmentStore.historyRecords[assessmentStore.historyRecords.length - 1]
    displayRecord.value = JSON.parse(JSON.stringify(latestRecord))
  }
})

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 返回首页
const goBack = () => {
  uni.redirectTo({
    url: '/pages/doctor/index'
  })
}
</script>

<style scoped>
.result-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fb 0%, #f5f7fa 100%);
  padding: 30rpx;
  padding-bottom: 200rpx;
}

.patient-info-card {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #667eea 100%);
  border-radius: 28rpx;
  padding: 50rpx 40rpx;
  margin-bottom: 30rpx;
  color: #ffffff;
  box-shadow: 0 12rpx 40rpx rgba(30, 60, 114, 0.3), 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.patient-info-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
  position: relative;
  z-index: 1;
}

.patient-name {
  font-size: 40rpx;
  font-weight: 700;
  letter-spacing: 0.5rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.patient-badge {
  font-size: 26rpx;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10rpx);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  font-weight: 500;
}

.patient-info-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 12rpx;
  position: relative;
  z-index: 1;
}

.patient-admission,
.patient-phone {
  font-size: 28rpx;
  opacity: 0.95;
  font-weight: 400;
  letter-spacing: 0.3rpx;
}

.patient-date {
  display: block;
  font-size: 28rpx;
  opacity: 0.95;
  margin-top: 12rpx;
  font-weight: 400;
  position: relative;
  z-index: 1;
}

.total-score-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 60rpx 50rpx;
  text-align: center;
  margin-bottom: 30rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.1), 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  border: 1rpx solid rgba(232, 236, 240, 0.8);
}

.total-score-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.total-label {
  display: block;
  font-size: 30rpx;
  color: #718096;
  margin-bottom: 30rpx;
  font-weight: 600;
  letter-spacing: 0.5rpx;
}

.total-value-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 30rpx;
}

.total-value {
  font-size: 120rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  letter-spacing: -2rpx;
}

.total-max {
  font-size: 40rpx;
  color: #a0aec0;
  margin-left: 12rpx;
  font-weight: 500;
}

.score-status {
  display: inline-block;
  padding: 16rpx 48rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: 700;
  letter-spacing: 0.5rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.status-good {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(56, 142, 60, 0.2) 100%);
  color: #4caf50;
  border: 2rpx solid rgba(76, 175, 80, 0.3);
}

.status-moderate {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 143, 0, 0.2) 100%);
  color: #ff9800;
  border: 2rpx solid rgba(255, 152, 0, 0.3);
}

.status-severe {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(211, 47, 47, 0.2) 100%);
  color: #f44336;
  border: 2rpx solid rgba(244, 67, 54, 0.3);
}

/* 得分表格 */
.score-table-container {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 0;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08), 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid rgba(232, 236, 240, 0.8);
  overflow: hidden;
}

.table-header {
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-weight: 700;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.2);
}

.table-header-cell {
  padding: 24rpx 20rpx;
  text-align: center;
  font-size: 28rpx;
  letter-spacing: 0.5rpx;
  border-right: 1rpx solid rgba(255, 255, 255, 0.2);
}

.table-header-cell:last-child {
  border-right: none;
}

.item-name-header {
  flex: 2;
  text-align: left;
}

.score-header {
  flex: 1;
}

.table-row {
  display: flex;
  border-bottom: 1rpx solid #f0f4f8;
  transition: background-color 0.2s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: rgba(102, 126, 234, 0.02);
}

.table-cell {
  padding: 24rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1rpx solid #f0f4f8;
  font-size: 26rpx;
}

.table-cell:last-child {
  border-right: none;
}

.item-name-cell {
  flex: 2;
  justify-content: flex-start;
  text-align: left;
  color: #1a202c;
  font-weight: 500;
}

.item-name-text {
  line-height: 1.5;
  letter-spacing: 0.3rpx;
}

.score-cell {
  flex: 1;
  color: #a0aec0;
  font-size: 32rpx;
  position: relative;
}

.score-cell.checked {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  font-weight: 700;
}

.check-mark {
  font-size: 36rpx;
  color: #667eea;
  font-weight: 700;
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20rpx);
  padding: 24rpx 30rpx;
  display: flex;
  gap: 24rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
  border-top: 1rpx solid rgba(232, 236, 240, 0.8);
}

.btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 16rpx;
  font-size: 34rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
  letter-spacing: 0.5rpx;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.25);
}

.btn-secondary {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  color: #718096;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  border: 2rpx solid #e8ecf0;
}

.btn-secondary:active {
  transform: scale(0.98);
  background: #f8f9fb;
}
</style>

