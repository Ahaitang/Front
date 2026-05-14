<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#0891B2"><Monitor /></el-icon>
        <h2>超级管理平台</h2>
        <p>Hospital Platform Super Admin</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" size="large" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" @click="handleLogin" :loading="loading" class="login-btn">登 录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Monitor } from '@element-plus/icons-vue'
import { authApi } from '@/utils/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    const res = await authApi.login(form.username, form.password)
    if (res.code === 200) {
      userStore.setToken(res.data.token, res.data.username, res.data.name)
      ElMessage.success('登录成功')
      router.push('/online')
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch {
    ElMessage.error('登录失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #67E8F9 100%);
}

.login-box {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid #E2E8F0;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1E293B;
  margin: 16px 0 8px;
}

.login-header p {
  font-size: 14px;
  color: #64748B;
  margin: 0;
}

.login-form .login-btn {
  width: 100%;
  background: #0891B2;
  border-color: #0891B2;
  border-radius: 10px;
}

.login-form .login-btn:hover {
  background: #06B6D4;
  border-color: #06B6D4;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  box-shadow: none;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #0891B2;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #0891B2;
  box-shadow: 0 0 0 2px rgba(8, 145, 178, 0.1);
}
</style>