<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api'

const router = useRouter()

const form = ref({
  username: '',
  password: ''
  // role 移除：角色由后端根据用户身份自动判断，前端不可选择
})

const loading = ref(false)

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true

  try {
    // 调用真实登录接口（不传递role，由后端判断）
    const res: any = await login({
      username: form.value.username,
      password: form.value.password
    })

    // 响应拦截器已解包 data，res 直接是 { token, user, role }
    if (res && res.token) {
      localStorage.setItem('admin_token', res.token)
      localStorage.setItem('admin_user', JSON.stringify(res.user || {}))
      // role 必须由后端返回，不允许使用前端默认值
      if (res.role) {
        localStorage.setItem('admin_role', res.role)
      } else {
        // 如果后端未返回role，清除登录状态并提示错误
        localStorage.clear()
        ElMessage.error('登录失败：后端未返回角色信息')
        return
      }
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
        <el-icon :size="48" color="#0891B2"><FirstAidKit /></el-icon>
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

        <!-- 角色选择已移除：由后端根据用户身份自动判断 -->

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
        <p>请联系管理员获取登录账号</p>
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
  background: linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #67E8F9 100%);
}

.login-box {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid #E5E7EB;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1E293B;
    margin: 16px 0 8px;
  }

  p {
    font-size: 14px;
    color: #64748B;
    margin: 0;
  }
}

.login-form {
  .login-btn {
    width: 100%;
    background: #0891B2;
    border-color: #0891B2;
    border-radius: 10px;

    &:hover {
      background: #06B6D4;
      border-color: #06B6D4;
    }
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    border: 1px solid #E2E8F0;
    box-shadow: none;

    &:hover {
      border-color: #0891B2;
    }

    &.is-focus {
      border-color: #0891B2;
      box-shadow: 0 0 0 2px rgba(8, 145, 178, 0.1);
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
        border-radius: 10px;
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
    color: #94A3B8;
    margin: 0;
  }
}
</style>