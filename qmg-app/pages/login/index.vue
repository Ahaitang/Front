<template>
  <view class="login-container">
    <view class="login-card">
      <view class="login-header">
        <text class="login-title">医生登录</text>
        <text class="login-subtitle">QMG评分管理系统</text>
      </view>

      <view class="login-form">
        <view class="form-item">
          <text class="form-label">用户名</text>
          <input
            v-model="username"
            class="form-input"
            placeholder="请输入用户名"
            type="text"
          />
        </view>

        <view class="form-item">
          <text class="form-label">密码</text>
          <input
            v-model="password"
            class="form-input"
            placeholder="请输入密码"
            type="password"
            password
          />
        </view>

        <button class="login-btn" :disabled="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <button class="skip-btn" @click="handleSkip">暂不登录</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAssessmentStore } from '../../src/stores/assessment'
import { doctorApi } from '../../src/utils/api'

const assessmentStore = useAssessmentStore()
const username = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!username.value.trim()) {
    uni.showToast({
      title: '请输入用户名',
      icon: 'none'
    })
    return
  }

  if (!password.value.trim()) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none'
    })
    return
  }

  loading.value = true
  try {
    // 调用后端登录API
    const result = await doctorApi.login(username.value.trim(), password.value.trim())
    
    // 保存登录信息到本地缓存
    const loginInfo = {
      username: result.username,
      id: result.id,
      role: result.role,
      loginTime: new Date().toISOString()
    }
    uni.setStorageSync('doctorLoginInfo', loginInfo)
    
    // 更新store中的登录状态
    assessmentStore.setDoctorLogin(true)
    assessmentStore.setDoctorUsername(result.username)

    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    // 跳转到医生工作台
    setTimeout(() => {
      uni.redirectTo({
        url: '/pages/doctor/index'
      })
    }, 500)
  } catch (error: any) {
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const handleSkip = () => {
  // 暂不登录，跳转到医生工作台（但功能受限）
  uni.redirectTo({
    url: '/pages/doctor/index'
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
  pointer-events: none;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.login-card {
  width: 100%;
  max-width: 600rpx;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20rpx);
  border-radius: 32rpx;
  padding: 70rpx 50rpx;
  box-shadow: 0 24rpx 80rpx rgba(0, 0, 0, 0.2), 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 70rpx;
  position: relative;
}

.login-header::after {
  content: '';
  position: absolute;
  bottom: -30rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2rpx;
}

.login-title {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20rpx;
  letter-spacing: 1rpx;
}

.login-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666666;
  font-weight: 400;
  letter-spacing: 0.5rpx;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  letter-spacing: 0.3rpx;
}

.form-input {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 2rpx solid #e8ecf0;
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 30rpx;
  color: #1a202c;
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.form-input:focus {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.2);
  transform: translateY(-2rpx);
}

.login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 700;
  border-radius: 16rpx;
  border: none;
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4), 0 4rpx 12rpx rgba(118, 75, 162, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.login-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.login-btn:active::before {
  width: 300%;
  height: 300%;
}

.login-btn:disabled {
  opacity: 0.6;
  transform: none;
}

.skip-btn {
  width: 100%;
  height: 88rpx;
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(10rpx);
  color: #666666;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 16rpx;
  border: 2rpx solid rgba(232, 236, 240, 0.8);
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.skip-btn:active {
  background: rgba(232, 236, 240, 0.9);
  transform: scale(0.98);
}
</style>
