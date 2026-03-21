<template>
  <view class="doctor-container">
    <view class="header">
      <text class="title">医生工作台</text>
      <text class="subtitle">QMG评分管理系统</text>
      <view v-if="assessmentStore.isDoctorLoggedIn" class="user-info">
        <text class="username">当前用户：{{ assessmentStore.doctorUsername }}</text>
        <text class="logout-btn" @click="handleLogout">退出</text>
      </view>
    </view>

    <view class="action-card" @click="goToPatientList">
      <view class="action-icon">👥</view>
      <view class="action-content">
        <text class="action-title">患者列表</text>
        <text class="action-desc">管理患者信息，填写记录，查看历史趋势</text>
      </view>
      <text class="action-arrow">›</text>
    </view>

    <view class="action-card" @click="goToQuestionnaireRecord">
      <view class="action-icon">📋</view>
      <view class="action-content">
        <text class="action-title">问卷记录</text>
        <text class="action-desc">查看、修改、确认问卷记录</text>
      </view>
      <text class="action-arrow">›</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAssessmentStore } from '../../src/stores/assessment'

const assessmentStore = useAssessmentStore()

// 检查登录状态
const checkLogin = (callback: () => void) => {
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

const goToPatientList = () => {
  checkLogin(() => {
    uni.navigateTo({
      url: '/pages/doctor/patient-list'
    })
  })
}

const goToQuestionnaireRecord = () => {
  checkLogin(() => {
    uni.navigateTo({ url: '/pages/doctor/questionnaire-record' })
  })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 调用store的登出方法
        assessmentStore.doctorLogout()
        
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })
        
        // 跳转到登录页面
        setTimeout(() => {
          uni.redirectTo({
            url: '/pages/login/index'
          })
        }, 500)
      }
    }
  })
}
</script>

<style scoped>
.doctor-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fb 0%, #f5f7fa 100%);
  padding: 30rpx;
  padding-bottom: 60rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
  padding-top: 50rpx;
  position: relative;
}

.header::after {
  content: '';
  position: absolute;
  bottom: -30rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 100rpx;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2rpx;
}

.title {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16rpx;
  letter-spacing: 1rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #666666;
  font-weight: 400;
  letter-spacing: 0.5rpx;
}

.user-info {
  margin-top: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  flex-wrap: wrap;
}

.username {
  font-size: 26rpx;
  color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  padding: 10rpx 24rpx;
  border-radius: 24rpx;
  font-weight: 500;
  border: 1rpx solid rgba(102, 126, 234, 0.2);
}

.logout-btn {
  font-size: 26rpx;
  color: #ff6b6b;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 82, 82, 0.15) 100%);
  padding: 10rpx 24rpx;
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 107, 107, 0.3);
  font-weight: 500;
  transition: all 0.3s ease;
}

.logout-btn:active {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.25) 0%, rgba(255, 82, 82, 0.25) 100%);
  transform: scale(0.95);
}

.action-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 50rpx 40rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08), 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: 1rpx solid rgba(232, 236, 240, 0.8);
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.action-card:active {
  transform: translateY(-4rpx) scale(0.98);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12), 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.action-card:active::before {
  transform: scaleX(1);
}

.action-icon {
  font-size: 72rpx;
  margin-right: 32rpx;
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 20rpx;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.action-card:active .action-icon {
  transform: scale(1.1) rotate(5deg);
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.action-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1a202c;
  letter-spacing: 0.5rpx;
}

.action-desc {
  font-size: 26rpx;
  color: #718096;
  line-height: 1.5;
  letter-spacing: 0.3rpx;
}

.action-arrow {
  font-size: 48rpx;
  color: #cbd5e0;
  margin-left: 20rpx;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.action-card:active .action-arrow {
  color: #667eea;
  transform: translateX(8rpx);
}
</style>

