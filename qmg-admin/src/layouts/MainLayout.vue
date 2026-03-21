<template>
  <el-container class="main-layout">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>QMG Admin</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="transparent"
        text-color="rgba(255, 255, 255, 0.85)"
        active-text-color="#ffffff"
        @select="handleMenuSelect"
      >
        <el-menu-item
          v-for="route in menuRoutes"
          :key="route.path"
          :index="route.path"
        >
          <el-icon v-if="route.iconComponent">
            <component :is="route.iconComponent" />
          </el-icon>
          <span>{{ route.meta?.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="title">重症肌无力定量评分系统</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.username }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import { User, ArrowDown, Odometer, Document, Avatar, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 图标映射
const iconMap: Record<string, any> = {
  Odometer,
  User,
  Document,
  Avatar,
  Setting
}

const activeMenu = computed(() => {
  // 如果是患者详情页，激活患者管理菜单
  if (route.name === 'PatientDetail') {
    return '/patients'
  }
  // 如果是首页（Dashboard），返回 '/'
  if (route.name === 'Dashboard' || route.path === '/') {
    return '/'
  }
  return route.path
})

const menuRoutes = computed(() => {
  // 定义菜单项配置
  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      title: '首页',
      icon: 'Odometer',
      requiresLevel: undefined
    },
    {
      path: '/patients',
      name: 'Patients',
      title: '患者管理',
      icon: 'User',
      requiresLevel: undefined
    },
    {
      path: '/questionnaires',
      name: 'Questionnaires',
      title: '问卷记录',
      icon: 'Document',
      requiresLevel: undefined
    },
    {
      path: '/doctors',
      name: 'Doctors',
      title: '医生管理',
      icon: 'Avatar',
      requiresLevel: [0, 1]  // 只有权限等级0和1可以访问
    },
    {
      path: '/questionnaire-config',
      name: 'QuestionnaireConfig',
      title: '问卷配置',
      icon: 'Setting',
      requiresLevel: [0, 1]  // 只有权限等级0和1可以访问
    }
  ]
  
  // 根据权限过滤菜单项
  return menuItems.filter(item => {
    if (item.requiresLevel) {
      const userLevel = userStore.level
      return item.requiresLevel.includes(userLevel)
    }
    return true
  }).map(item => ({
    path: item.path,
    name: item.name,
    meta: {
      title: item.title,
      icon: item.icon
    },
    iconComponent: iconMap[item.icon] || null
  }))
})

const handleMenuSelect = (path: string) => {
  // 显式处理菜单选择，确保路由跳转正常
  if (path) {
    // 如果选择的是首页，跳转到 '/'
    const targetPath = path === '/' ? '/' : path
    if (targetPath !== route.path) {
      router.push(targetPath)
    }
  }
}

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      userStore.logout()
      router.push('/login')
    } catch {
      // 用户取消
    }
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #1976d2 0%, #1565c0 100%);
  overflow: hidden;
  box-shadow: 2px 0 12px rgba(30, 136, 229, 0.15);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(30, 136, 229, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 10px 0;
}

.sidebar-menu :deep(.el-menu-item) {
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%) !important;
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  color: inherit;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(to right, #ffffff 0%, #f0f7ff 100%);
  border-bottom: 1px solid #e3f2fd;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(30, 136, 229, 0.08);
}

.header-left {
  flex: 1;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1976d2;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #1976d2;
  font-weight: 500;
  transition: color 0.3s ease;
}

.user-info:hover {
  color: #2196f3;
}

.user-info .el-icon {
  margin: 0 4px;
}

.main-content {
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  padding: 20px;
  min-height: calc(100vh - 60px);
}
</style>
