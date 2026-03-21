<template>
  <view class="record-container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <!-- 患者名称搜索 -->
      <view class="search-section">
        <input
          v-model="searchPatientName"
          class="search-input"
          placeholder="搜索患者名称"
          @input="onSearchInput"
        />
      </view>
      
      <!-- 时间范围选择 -->
      <view class="date-range-section">
        <picker
          mode="date"
          :value="startDate"
          @change="onStartDateChange"
        >
          <view class="date-picker-item">
            <text class="date-label">开始日期</text>
            <text class="date-value">{{ startDate || '请选择' }}</text>
          </view>
        </picker>
        <text class="date-separator">至</text>
        <picker
          mode="date"
          :value="endDate"
          @change="onEndDateChange"
        >
          <view class="date-picker-item">
            <text class="date-label">结束日期</text>
            <text class="date-value">{{ endDate || '请选择' }}</text>
          </view>
        </picker>
      </view>
      
      <!-- 清除筛选按钮 -->
      <view v-if="hasFilter" class="clear-filter" @click="clearFilter">
        <text class="clear-text">清除筛选</text>
      </view>
    </view>

    <!-- 记录列表 -->
    <scroll-view
      class="record-list-scroll"
      scroll-y
      @scrolltolower="loadMore"
      :lower-threshold="100"
    >
      <view class="record-list">
        <view
          v-for="(record, index) in displayRecords"
          :key="record.id || index"
          class="record-item"
          @click="viewRecord(record, index)"
        >
          <view class="record-header">
            <text class="patient-name">{{ record.patient.name }}</text>
            <text class="record-date">{{ formatDate(record.assessmentDate) }}</text>
          </view>
          <view class="record-info">
            <text class="info-item">创建时间: {{ formatDateTime(record.createTime) }}</text>
            <text class="info-item">QMG总分: {{ record.score.totalScore || 0 }}/39</text>
          </view>
          <view class="record-actions">
            <text class="action-btn view-btn" @click.stop="viewRecord(record, index)">查看</text>
          </view>
        </view>

        <!-- 加载中 -->
        <view v-if="loading" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 没有更多 -->
        <view v-if="!hasMore && displayRecords.length > 0" class="no-more-state">
          <text class="no-more-text">没有更多记录了</text>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && displayRecords.length === 0" class="empty-state">
          <text class="empty-text">暂无记录</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAssessmentStore } from '../../src/stores/assessment'
import { questionnaireApi, patientApi } from '../../src/utils/api'
import type { QMGRecord } from '../../src/types/qmg'

const assessmentStore = useAssessmentStore()

// 搜索患者名称
const searchPatientName = ref('')

// 时间范围
const startDate = ref('')
const endDate = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const loading = ref(false)
const allRecords = ref<any[]>([])

// 是否有筛选条件
const hasFilter = computed(() => {
  return (searchPatientName.value && searchPatientName.value.trim()) || startDate.value || endDate.value
})

// 显示的记录（直接使用allRecords，因为筛选在后端完成）
const displayRecords = computed(() => {
  return allRecords.value
})

// 加载数据
const loadRecords = async (page: number = 1, reset: boolean = false) => {
  if (loading.value) return
  
  loading.value = true
  try {
    const doctorLoginInfo = uni.getStorageSync('doctorLoginInfo') as { id?: number } | null
    const currentDoctorId = doctorLoginInfo?.id

    let result
    if (hasFilter.value) {
      result = await questionnaireApi.searchRecordsByPatientNameAndDateRange(
        searchPatientName.value.trim() || undefined,
        startDate.value || undefined,
        endDate.value || undefined,
        page,
        pageSize.value,
        currentDoctorId
      )
    } else {
      result = await questionnaireApi.getRecordsByPage(page, pageSize.value, currentDoctorId)
    }
    
    // 转换数据格式
    const records = await Promise.all(result.records.map(async (record: any) => {
      // 解析JSON字段
      let selections = {}
      let itemScores = {}
      let categoryScores = { eyes: 0, bulbar: 0, respiratory: 0, limbs: 0 }
      
      try {
        if (record.selections) {
          selections = typeof record.selections === 'string' 
            ? JSON.parse(record.selections) 
            : record.selections
        }
        if (record.itemScores) {
          itemScores = typeof record.itemScores === 'string'
            ? JSON.parse(record.itemScores)
            : record.itemScores
        }
        if (record.categoryScores) {
          categoryScores = typeof record.categoryScores === 'string'
            ? JSON.parse(record.categoryScores)
            : record.categoryScores
        }
      } catch (e) {
        console.error('解析JSON失败:', e)
      }
      
      // 根据patientId或admissionNumber获取患者信息
      let patient: {
        name: string
        gender: 'male' | 'female'
        admissionNumber: string
        phone: string
      } = {
        name: '未知患者',
        gender: 'male',
        admissionNumber: record.admissionNumber || '',
        phone: ''
      }
      
      try {
        const doctorLoginInfo = uni.getStorageSync('doctorLoginInfo') as { id?: number } | null
        const doctorId = doctorLoginInfo?.id
        if (record.patientId) {
          // 优先使用patientId获取患者信息
          const patientData = await patientApi.getPatientById(record.patientId, doctorId)
          if (patientData) {
            patient = {
              name: patientData.name || '未知患者',
              gender: (patientData.gender === 'female' ? 'female' : 'male'),
              admissionNumber: patientData.admissionNumber || record.admissionNumber || '',
              phone: patientData.phone || ''
            }
          }
        } else if (record.admissionNumber) {
          // 如果没有patientId，使用admissionNumber获取
          const patientData = await patientApi.getPatientByAdmissionNumber(record.admissionNumber)
          if (patientData) {
            patient = {
              name: patientData.name || '未知患者',
              gender: (patientData.gender === 'female' ? 'female' : 'male'),
              admissionNumber: patientData.admissionNumber || record.admissionNumber || '',
              phone: patientData.phone || ''
            }
          }
        }
      } catch (e) {
        console.error('获取患者信息失败:', e)
        // 如果获取失败，使用默认值
      }
      
      return {
        id: record.id,
        patient,
        assessmentDate: record.assessmentDate || new Date().toISOString().split('T')[0],
        createTime: record.createTime || record.create_time || null, // 保留创建时间
        selections,
        score: {
          itemScores,
          totalScore: record.totalScore || 0,
          categoryScores
        },
        modifiedBy: 'doctor' as const
      }
    }))
    
    if (reset) {
      allRecords.value = records
    } else {
      allRecords.value = [...allRecords.value, ...records]
    }
    
    hasMore.value = result.hasMore
    currentPage.value = page
    
  } catch (error: any) {
    console.error('加载问卷记录失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadRecords(currentPage.value + 1, false)
  }
}

// 初始化加载
onMounted(() => {
  loadRecords(1, true)
})

// 搜索输入（防抖）
let searchTimer: any = null
const onSearchInput = () => {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  // 延迟500ms后重新加载（使用后端查询）
  searchTimer = setTimeout(() => {
    loadRecords(1, true)
  }, 500)
}

// 开始日期改变
const onStartDateChange = (e: any) => {
  startDate.value = e.detail.value
  // 如果结束日期早于开始日期，自动调整
  if (endDate.value && endDate.value < startDate.value) {
    endDate.value = startDate.value
  }
}

// 结束日期改变
const onEndDateChange = (e: any) => {
  endDate.value = e.detail.value
  // 如果开始日期晚于结束日期，自动调整
  if (startDate.value && startDate.value > endDate.value) {
    startDate.value = endDate.value
  }
}

// 清除筛选
const clearFilter = () => {
  searchPatientName.value = ''
  startDate.value = ''
  endDate.value = ''
  // 清除筛选后重新加载第一页
  loadRecords(1, true)
}

// 查看记录（可以修改）
const viewRecord = async (record: any, _index: number) => {
  try {
    // 从数据库获取完整记录
    const fullRecord = await questionnaireApi.getRecordById(record.id)
    
    // 转换为前端格式
    const qmgRecord = await convertToQMGRecord(fullRecord)
    
    // 设置为当前记录（包含id，用于后续更新）
    assessmentStore.currentRecord = qmgRecord
    
    // 跳转到问卷页面，可以修改
    uni.navigateTo({
      url: '/pages/doctor/assessment'
    })
  } catch (error: any) {
    uni.showToast({
      title: error.message || '加载记录失败',
      icon: 'none'
    })
  }
}

// 转换数据库记录为前端QMGRecord格式
const convertToQMGRecord = async (record: any): Promise<QMGRecord> => {
  let selections = {}
  let itemScores = {}
  let categoryScores = { eyes: 0, bulbar: 0, respiratory: 0, limbs: 0 }
  
  try {
    if (record.selections) {
      selections = typeof record.selections === 'string' 
        ? JSON.parse(record.selections) 
        : record.selections
    }
    if (record.itemScores) {
      itemScores = typeof record.itemScores === 'string'
        ? JSON.parse(record.itemScores)
        : record.itemScores
    }
    if (record.categoryScores) {
      categoryScores = typeof record.categoryScores === 'string'
        ? JSON.parse(record.categoryScores)
        : categoryScores
    }
  } catch (e) {
    console.error('解析JSON失败:', e)
  }
  
  // 根据patientId或admissionNumber获取患者信息
  let patient: {
    name: string
    gender: 'male' | 'female'
    admissionNumber: string
    phone: string
  } = {
    name: '未知患者',
    gender: 'male',
    admissionNumber: record.admissionNumber || '',
    phone: ''
  }
  
  try {
    const doctorLoginInfo = uni.getStorageSync('doctorLoginInfo') as { id?: number } | null
    const doctorId = doctorLoginInfo?.id
    if (record.patientId) {
      const patientData = await patientApi.getPatientById(record.patientId, doctorId)
      if (patientData) {
        patient = {
          name: patientData.name || '未知患者',
          gender: (patientData.gender === 'female' ? 'female' : 'male'),
          admissionNumber: patientData.admissionNumber || record.admissionNumber || '',
          phone: patientData.phone || ''
        }
      }
    } else if (record.admissionNumber) {
      const patientData = await patientApi.getPatientByAdmissionNumber(record.admissionNumber)
      if (patientData) {
        patient = {
          name: patientData.name || '未知患者',
          gender: (patientData.gender === 'female' ? 'female' : 'male'),
          admissionNumber: patientData.admissionNumber || record.admissionNumber || '',
          phone: patientData.phone || ''
        }
      }
    }
  } catch (e) {
    console.error('获取患者信息失败:', e)
  }
  
  return {
    id: record.id, // 保留id，用于后续更新
    patient,
    assessmentDate: record.assessmentDate || new Date().toISOString().split('T')[0],
    createTime: record.createTime || record.create_time || null, // 保留创建时间
    selections,
    score: {
      itemScores,
      totalScore: record.totalScore || 0,
      categoryScores
    },
    modifiedBy: 'doctor' as const
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 格式化日期时间
const formatDateTime = (dateTimeStr: string | null) => {
  if (!dateTimeStr) return '未知'
  try {
    const date = new Date(dateTimeStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (e) {
    return '未知'
  }
}
</script>

<style scoped>
.record-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fb 0%, #f5f7fa 100%);
}

.filter-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border-bottom: 1rpx solid rgba(232, 236, 240, 0.8);
  box-sizing: border-box;
}

.search-section {
  margin-bottom: 24rpx;
  width: 100%;
  box-sizing: border-box;
}

.search-input {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 2rpx solid #e8ecf0;
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 30rpx;
  color: #1a202c;
  box-sizing: border-box;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.search-input:focus {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.15);
}

.date-range-section {
  display: flex;
  align-items: stretch;
  width: 100%;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.date-picker-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6rpx;
  padding: 20rpx 16rpx;
  background: #ffffff;
  border: 2rpx solid #e8ecf0;
  border-radius: 0;
  min-width: 0;
  box-sizing: border-box;
  height: 88rpx;
}

.date-picker-item:first-child {
  border-top-left-radius: 16rpx;
  border-bottom-left-radius: 16rpx;
  border-right: none;
}

.date-picker-item:last-child {
  border-top-right-radius: 16rpx;
  border-bottom-right-radius: 16rpx;
  border-left: none;
}

.date-picker-item:active {
  background: #f8f9fb;
}

.date-label {
  font-size: 24rpx;
  color: #718096;
  line-height: 1.2;
}

.date-value {
  font-size: 28rpx;
  color: #1a202c;
  font-weight: 500;
  line-height: 1.3;
}

.date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 88rpx;
  font-size: 24rpx;
  color: #718096;
  background: #ffffff;
  border-top: 2rpx solid #e8ecf0;
  border-bottom: 2rpx solid #e8ecf0;
  flex-shrink: 0;
  box-sizing: border-box;
}

.clear-filter {
  text-align: center;
  padding: 20rpx;
}

.clear-text {
  font-size: 28rpx;
  color: #667eea;
  font-weight: 600;
  text-decoration: underline;
  transition: all 0.3s ease;
}

.clear-text:active {
  color: #764ba2;
  transform: scale(0.95);
}

.record-list-scroll {
  height: calc(100vh - 300rpx);
  padding-bottom: 40rpx;
}

.record-list {
  padding: 0 30rpx;
}

.record-item {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 36rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08), 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid rgba(232, 236, 240, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.record-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6rpx;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.record-item:active {
  transform: translateY(-4rpx) scale(0.98);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12), 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #f0f4f8;
}

.patient-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #1a202c;
  letter-spacing: 0.5rpx;
}

.record-date {
  font-size: 26rpx;
  color: #a0aec0;
  font-weight: 500;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.info-item {
  font-size: 28rpx;
  color: #718096;
  letter-spacing: 0.3rpx;
  line-height: 1.6;
}

.record-actions {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}

.action-btn {
  padding: 14rpx 28rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
}

.view-btn {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(21, 101, 192, 0.15) 100%);
  color: #1976d2;
  border: 1rpx solid rgba(25, 118, 210, 0.3);
}

.view-btn:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.25) 0%, rgba(21, 101, 192, 0.25) 100%);
}


.loading-state,
.no-more-state {
  text-align: center;
  padding: 40rpx 0;
}

.loading-text,
.no-more-text {
  font-size: 28rpx;
  color: #a0aec0;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: 30rpx;
  color: #a0aec0;
  font-weight: 500;
}
</style>

