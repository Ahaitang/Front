<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>QMG 管理系统</h2>
        <p>重症肌无力定量评分系统</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm.username, loginForm.password)
        ElMessage.success('登录成功')
        
        const redirect = (route.query.redirect as string) || '/dashboard'
        router.push(redirect)
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败，请检查用户名和密码')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 50%, #1565c0 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.login-box {
  width: 420px;
  padding: 50px 40px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(30, 136, 229, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0 0 10px 0;
  color: #1976d2;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.login-header p {
  margin: 0;
  color: #90caf9;
  font-size: 14px;
  font-weight: 500;
}

.login-form {
  margin-top: 20px;
}

.login-form :deep(.el-input__wrapper) {
  background-color: #ffffff;
  border: 1px solid #e3f2fd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(30, 136, 229, 0.06);
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #90caf9;
  box-shadow: 0 4px 8px rgba(30, 136, 229, 0.12);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.login-form :deep(.el-button--primary) {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  transition: all 0.3s ease;
}

.login-form :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
  transform: translateY(-1px);
}
</style>
