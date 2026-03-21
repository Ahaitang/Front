<template>
  <view class="home-container">
    <view class="loading-wrapper">
      <text class="loading-text">正在加载...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAssessmentStore } from '../../src/stores/assessment'

const assessmentStore = useAssessmentStore()

onMounted(() => {
  // 设置角色为医生
  assessmentStore.setCurrentRole('doctor')
  
  // 检查本地缓存是否有登录信息
  try {
    const loginInfo = uni.getStorageSync('doctorLoginInfo')
    if (loginInfo && loginInfo.username) {
      // 有登录信息，更新store状态
      assessmentStore.setDoctorLogin(true)
      assessmentStore.setDoctorUsername(loginInfo.username)
      // 跳转到医生工作台
      uni.redirectTo({
        url: '/pages/doctor/index'
      })
    } else {
      // 没有登录信息，跳转到登录页面
      uni.redirectTo({
        url: '/pages/login/index'
      })
    }
  } catch (error) {
    console.error('读取登录信息失败:', error)
    // 读取失败，跳转到登录页面
    uni.redirectTo({
      url: '/pages/login/index'
    })
  }
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.loading-wrapper {
  text-align: center;
}

.loading-text {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
}
</style>

