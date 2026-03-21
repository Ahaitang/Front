<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api'

const router = useRouter()

const form = ref({
  username: '',
  password: '',
  role: 'admin' // 默认管理员
})

const loading = ref(false)

const roleOptions = [
  { value: 'admin', label: '管理员', icon: 'User' },
  { value: 'doctor', label: '医生', icon: 'Avatar' }
]

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true

  try {
    // 调用真实登录接口
    const res = await login({
      username: form.value.username,
      password: form.value.password,
      role: form.value.role
    })

    // 响应拦截器已解包 data，res 直接是 { token, user, role }
    if (res && res.token) {
      localStorage.setItem('admin_token', res.token)
      localStorage.setItem('admin_user', JSON.stringify(res.user || {}))
      localStorage.setItem('admin_role', res.role || form.value.role)
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(res?.message || '登录失败，请重试')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '用户名或密码错误')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#0D9488"><FirstAidKit /></el-icon>
        <h1>神经免疫随访系统</h1>
        <p>管理后台</p>
      </div>

      <el-form :model="form" class="login-form">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-radio-group v-model="form.role" class="role-radio-group">
            <el-radio-button
              v-for="item in roleOptions"
              :key="item.value"
              :value="item.value"
            >
              <el-icon style="margin-right: 4px"><component :is="item.icon" /></el-icon>
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-tip">
        <p>管理员：admin / 123456</p>
        <p>医生：手机号 / 123456</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #5EEAD4 100%);
}

.login-box {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  h1 {
    font-size: 24px;
    color: #1F2937;
    margin: 16px 0 8px;
  }

  p {
    font-size: 14px;
    color: #9CA3AF;
    margin: 0;
  }
}

.login-form {
  .login-btn {
    width: 100%;
    background: #0D9488;
    border-color: #0D9488;

    &:hover {
      background: #14B8A6;
      border-color: #14B8A6;
    }
  }

  .role-radio-group {
    width: 100%;
    display: flex;

    :deep(.el-radio-button) {
      flex: 1;

      .el-radio-button__inner {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

.login-tip {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #E5E7EB;

  p {
    font-size: 12px;
    color: #9CA3AF;
    margin: 0;
  }
}
</style>