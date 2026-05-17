<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <div class="logo">
        <el-icon :size="28" color="#FFFFFF"><Odometer /></el-icon>
        <span v-show="!isCollapse" class="logo-text">QMG 管理系统</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
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
          <template #title>{{ route.meta?.title }}</template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <el-button text @click="isCollapse = !isCollapse">
          <el-icon :size="20">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </el-button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <header class="header">
        <div class="header-left">
          <span class="page-title">{{ route.meta?.title || '重症肌无力定量评分系统' }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ userStore.username }}</span>
              <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import { User, ArrowDown, Odometer, Document, Avatar, Setting, Fold, Expand, SwitchButton } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)

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
      await userStore.logout()
      router.push('/login')
    } catch {
      // 用户取消
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  background: #F8FAFC;
}

.sidebar {
  width: 220px;
  background: #F8FAFC;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  border-right: 1px solid #E2E8F0;
}

.sidebar.collapsed {
  width: 64px;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  background: #0891B2;
}

.logo .logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.sidebar :deep(.el-menu) {
  border-right: none;
  flex: 1;
  background: #F8FAFC;
}

.sidebar :deep(.el-menu .el-menu-item) {
  color: #64748B;
}

.sidebar :deep(.el-menu .el-menu-item:hover) {
  background-color: #ECFEFF;
  color: #0891B2;
}

.sidebar :deep(.el-menu .el-menu-item.is-active) {
  background-color: #ECFEFF;
  color: #0891B2;
  border-right: 3px solid #0891B2;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #E2E8F0;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F8FAFC;
}

.header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #1E293B;
}

.content {
  flex: 1;
  overflow: auto;
  background: #F8FAFC;
}
</style>
