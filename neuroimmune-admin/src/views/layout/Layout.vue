<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)

// 用户信息
const userInfo = ref<any>({})
const userRole = ref('')

// 根据角色过滤菜单
const menuItems = computed(() => {
  const allMenus = [
    { path: '/dashboard', title: '仪表盘', icon: 'DataBoard' },
    { path: '/patients', title: '患者管理', icon: 'User' },
    { path: '/doctors', title: '医生管理', icon: 'UserFilled', adminOnly: true },
    { path: '/admins', title: '管理员管理', icon: 'UserFilled', adminOnly: true },
    { path: '/followups', title: '随访记录', icon: 'Calendar' },
    { path: '/medications', title: '用药记录', icon: 'FirstAidKit' },
    { path: '/records', title: '病历记录', icon: 'Document' },
    { path: '/episodes', title: '发作记录', icon: 'Warning' },
    { path: '/dict', title: '字典管理', icon: 'Setting', adminOnly: true }
  ]

  // 医生角色隐藏管理员专属菜单
  if (userRole.value === 'doctor') {
    return allMenus.filter(item => !item.adminOnly)
  }
  return allMenus
})

const activeMenu = computed(() => route.path)

// 加载用户信息
const loadUserInfo = () => {
  const userStr = localStorage.getItem('admin_user')
  const role = localStorage.getItem('admin_role')
  if (userStr) {
    userInfo.value = JSON.parse(userStr)
  }
  userRole.value = role || 'admin'
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const { request } = await import('@/utils/request')
      await request.post('/neuroimmune/logout')
    } catch (e) {
      // 即使后端调用失败也继续清理本地状态
    }
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_role')
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}

const goToProfile = () => {
  router.push('/profile')
}

onMounted(() => {
  loadUserInfo()
})
</script>

<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <div class="logo">
        <el-icon :size="28" color="#FFFFFF"><FirstAidKit /></el-icon>
        <span v-show="!isCollapse" class="logo-text">神经免疫随访</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
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
          <span class="page-title">{{ route.meta.title || '管理后台' }}</span>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ userInfo.name || '管理员' }}</span>
              <el-tag size="small" :type="userRole === 'admin' ? 'danger' : 'primary'" style="margin-left: 8px">
                {{ userRole === 'admin' ? '管理员' : '医生' }}
              </el-tag>
              <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToProfile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
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
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
  border-right: 1px solid #E5E7EB;

  &.collapsed {
    width: 64px;
  }

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 12px;
    background: #0891B2;

    .logo-text {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
    }
  }

  .el-menu {
    border-right: none;
    flex: 1;
    background: #F8FAFC;

    .el-menu-item {
      color: #6B7280;

      &:hover {
        background-color: #ECFEFF;
        color: #0891B2;
      }

      &.is-active {
        background-color: #ECFEFF;
        color: #0891B2;
        border-right: 3px solid #0891B2;
      }
    }
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid #E5E7EB;
  }
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
  border-bottom: 1px solid #E5E7EB;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;

  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: #1F2937;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    .user-name {
      font-size: 14px;
      color: #1F2937;
    }
  }
}

.content {
  flex: 1;
  overflow: auto;
  background: #F8FAFC;
}
</style>