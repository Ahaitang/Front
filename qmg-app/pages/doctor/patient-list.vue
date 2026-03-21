<template>
  <view class="patient-list-container">
    <view class="search-bar">
      <input 
        v-model="searchKeyword" 
        class="search-input" 
        placeholder="搜索患者姓名或住院号" 
        @input="searchPatients"
        @confirm="searchPatients"
      />
      <text v-if="loading" class="loading-text">加载中...</text>
    </view>

    <view class="patient-list">
      <view v-for="(patient, index) in filteredPatients" :key="index" class="patient-item">
        <view class="patient-info">
          <text class="patient-name">{{ patient.name }}</text>
          <text class="patient-detail">{{ patient.admissionNumber }}</text>
        </view>
        <view class="patient-actions">
          <text class="action-btn" @click.stop="fillRecord(patient)">填写记录</text>
          <text class="action-btn trend-btn" @click.stop="viewTrends(patient)">历史记录</text>
        </view>
      </view>

      <view v-if="filteredPatients.length === 0" class="empty-state">
        <text class="empty-text">暂无患者数据</text>
      </view>
    </view>

    <view class="fab" @click="addPatient">
      <text class="fab-icon">+</text>
    </view>

    <!-- 新增患者弹窗 -->
    <view v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新增患者</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">姓名 *</text>
            <input v-model="newPatient.name" class="form-input" placeholder="请输入患者姓名" />
          </view>
          <view class="form-item">
            <text class="form-label">性别 *</text>
            <view class="gender-group">
              <view 
                class="gender-btn" 
                :class="{ active: newPatient.gender === 'male' }"
                @click="newPatient.gender = 'male'"
              >
                男
              </view>
              <view 
                class="gender-btn" 
                :class="{ active: newPatient.gender === 'female' }"
                @click="newPatient.gender = 'female'"
              >
                女
              </view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">住院号 *</text>
            <input v-model="newPatient.admissionNumber" class="form-input" placeholder="请输入住院号" />
          </view>
          <view class="form-item">
            <text class="form-label">手机号 *</text>
            <input v-model="newPatient.phone" class="form-input" placeholder="请输入手机号" type="number" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeModal">取消</button>
          <button class="modal-btn confirm-btn" @click="confirmAddPatient">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAssessmentStore } from '../../src/stores/assessment'
import { patientApi } from '../../src/utils/api'
import type { Patient } from '../../src/types/qmg'

const assessmentStore = useAssessmentStore()
const searchKeyword = ref('')
const showAddModal = ref(false)
const loading = ref(false)
const newPatient = ref({
  name: '',
  gender: 'male' as 'male' | 'female',
  admissionNumber: '',
  phone: ''
})

// 检查登录状态
const checkLoginBeforeAction = (callback: () => void) => {
  if (!assessmentStore.isDoctorLoggedIn) {
    uni.showModal({
      title: '提示',
      content: '请先登录才能使用此功能',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/index'
          })
        }
      }
    })
    return
  }
  callback()
}

// 页面加载时获取患者列表
onMounted(async () => {
  // 如果已登录，加载患者列表
  if (assessmentStore.isDoctorLoggedIn) {
    await loadPatients()
  }
})

// 加载患者列表
const loadPatients = async () => {
  loading.value = true
  try {
    await assessmentStore.loadPatientList()
  } catch (error) {
    console.error('加载患者列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 状态校准：这是解决问题的关键
onShow(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  // 每次显示时刷新患者列表
  await loadPatients()
})

const patients = computed(() => {
  // 逻辑保持你的原样...
  return assessmentStore.patientList 
})

// 搜索防抖定时器
let searchTimer: ReturnType<typeof setTimeout> | null = null

const filteredPatients = computed(() => {
  // 如果有关键词，使用本地过滤（更快）
  // 如果需要服务端搜索，可以调用API
  if (!searchKeyword.value) return patients.value
  const kw = searchKeyword.value.toLowerCase()
  return patients.value.filter((p: Patient) => 
    p.name.toLowerCase().includes(kw) || 
    p.admissionNumber.toLowerCase().includes(kw) ||
    (p.phone && p.phone.includes(kw))
  )
})

// 搜索患者（防抖处理，避免频繁调用API）
const searchPatients = () => {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  // 如果关键词为空，重新加载全部列表
  if (!searchKeyword.value.trim()) {
    loadPatients()
    return
  }
  
  // 防抖：500ms后执行搜索
  searchTimer = setTimeout(async () => {
    loading.value = true
    try {
      const doctorLoginInfo = uni.getStorageSync('doctorLoginInfo') as { id?: number } | null
      const doctorId = doctorLoginInfo?.id
      const results = await patientApi.searchPatients(searchKeyword.value.trim(), doctorId)
      // 转换API返回的数据格式
      assessmentStore.patientList = results.map((p: any) => ({
        id: p.id,
        name: p.name,
        gender: p.gender as 'male' | 'female',
        admissionNumber: p.admissionNumber,
        phone: p.phone
      }))
    } catch (error) {
      console.error('搜索患者失败:', error)
      // 搜索失败时使用本地过滤
    } finally {
      loading.value = false
    }
  }, 500)
}

const fillRecord = (patient: Patient) => {
  checkLoginBeforeAction(() => {
    assessmentStore.initNewRecord(patient)
    uni.navigateTo({ url: '/pages/doctor/assessment' })
  })
}

const viewTrends = (patient: Patient) => {
  checkLoginBeforeAction(() => {
    assessmentStore.savePatientInfo(patient)
    uni.navigateTo({ url: `/pages/doctor/trends?patientId=${patient.admissionNumber}` })
  })
}

const addPatient = () => {
  checkLoginBeforeAction(() => {
    // 重置表单
    newPatient.value = {
      name: '',
      gender: 'male',
      admissionNumber: '',
      phone: ''
    }
    showAddModal.value = true
  })
}

const closeModal = () => {
  showAddModal.value = false
}

const confirmAddPatient = async () => {
  checkLoginBeforeAction(async () => {
    // 验证必填项
    if (!newPatient.value.name.trim()) {
      uni.showToast({
        title: '请输入患者姓名',
        icon: 'none'
      })
      return
    }
    
    if (!newPatient.value.admissionNumber.trim()) {
      uni.showToast({
        title: '请输入住院号',
        icon: 'none'
      })
      return
    }

    if (!newPatient.value.phone.trim()) {
      uni.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    try {
      // 创建患者对象
      const patient: Patient = {
        name: newPatient.value.name.trim(),
        gender: newPatient.value.gender,
        admissionNumber: newPatient.value.admissionNumber.trim(),
        phone: newPatient.value.phone.trim()
      }

      // 调用API添加患者
      await assessmentStore.addPatientToList(patient)
      
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      })
      
      closeModal()
    } catch (error: any) {
      uni.showToast({
        title: error.message || '添加失败',
        icon: 'none'
      })
    }
  })
}
</script>

<style scoped>
.patient-list-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fb 0%, #f5f7fa 100%);
  padding-bottom: 120rpx;
}

.search-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  padding: 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border-bottom: 1rpx solid rgba(232, 236, 240, 0.8);
}

.search-input {
  flex: 1;
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

.loading-text {
  font-size: 26rpx;
  color: #718096;
  font-weight: 500;
  text-align: center;
  padding: 40rpx 0;
}

.patient-list {
  padding: 0 30rpx;
}

.patient-item {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 36rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08), 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1rpx solid rgba(232, 236, 240, 0.8);
  position: relative;
  overflow: hidden;
}

.patient-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6rpx;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.patient-item:active {
  transform: translateY(-4rpx) scale(0.98);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12), 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.patient-item:active::before {
  transform: scaleY(1);
}

.patient-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.patient-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #1a202c;
  letter-spacing: 0.5rpx;
}

.patient-detail {
  font-size: 26rpx;
  color: #718096;
  letter-spacing: 0.3rpx;
  line-height: 1.5;
}

.patient-actions {
  display: flex;
  gap: 16rpx;
  flex-shrink: 0;
}

.action-btn {
  padding: 14rpx 28rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 24rpx;
  font-size: 26rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
}

.action-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.25);
}

.trend-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  box-shadow: 0 4rpx 12rpx rgba(72, 187, 120, 0.3);
}

.trend-btn:active {
  box-shadow: 0 2rpx 8rpx rgba(72, 187, 120, 0.25);
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: 40rpx;
  width: 112rpx;
  height: 112rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4), 0 4rpx 12rpx rgba(118, 75, 162, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3rpx solid rgba(255, 255, 255, 0.3);
}

.fab:active {
  transform: scale(0.9) rotate(90deg);
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
}

.fab-icon {
  font-size: 52rpx;
  color: #ffffff;
  font-weight: 300;
}

/* 弹窗样式 - 美化设计 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  width: 640rpx;
  max-width: 90%;
  background: #ffffff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 24rpx 80rpx rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 50rpx 40rpx 30rpx;
  border-bottom: 2rpx solid #f0f4f8;
  background: linear-gradient(180deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%);
}

.modal-title {
  font-size: 38rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5rpx;
}

.modal-close {
  font-size: 48rpx;
  color: #a0aec0;
  line-height: 1;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close:active {
  background: rgba(160, 174, 192, 0.1);
  color: #718096;
  transform: rotate(90deg);
}

.modal-body {
  padding: 50rpx 40rpx;
}

.form-item {
  margin-bottom: 40rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 30rpx;
  color: #1a202c;
  margin-bottom: 20rpx;
  font-weight: 600;
  letter-spacing: 0.3rpx;
}

.form-input {
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

.form-input:focus {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.15);
}

.gender-group {
  display: flex;
  gap: 20rpx;
}

.gender-btn {
  flex: 1;
  height: 88rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  color: #718096;
  border: 2rpx solid #e8ecf0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.gender-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-color: #667eea;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  transform: translateY(-2rpx);
}

.modal-footer {
  display: flex;
  gap: 24rpx;
  padding: 30rpx 40rpx 40rpx;
  border-top: 2rpx solid #f0f4f8;
  background: rgba(248, 249, 250, 0.5);
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  color: #718096;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.cancel-btn:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.02);
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.confirm-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.25);
}
</style>