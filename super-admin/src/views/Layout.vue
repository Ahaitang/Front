<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <div class="logo">
        <el-icon :size="28" color="#FFFFFF"><Monitor /></el-icon>
        <span v-show="!isCollapse" class="logo-text">超级管理平台</span>
      </div>

      <el-menu :default-active="activeMenu" :collapse="isCollapse" router>
        <el-menu-item index="/online">
          <el-icon><User /></el-icon>
          <template #title>在线用户管理</template>
        </el-menu-item>
        <el-menu-item index="/audit">
          <el-icon><Document /></el-icon>
          <template #title>审计日志</template>
        </el-menu-item>
        <el-menu-item index="/blacklist">
          <el-icon><CircleClose /></el-icon>
          <template #title>黑名单管理</template>
        </el-menu-item>
        <el-menu-item index="/config">
          <el-icon><Setting /></el-icon>
          <template #title>系统配置</template>
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
          <span class="page-title">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ userStore.name || userStore.username }}</span>
              <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">
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
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/utils/api'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isCollapse = ref(false)

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title as string || '')

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await authApi.logout(userStore.username)
    userStore.clear()
    router.push('/login')
  } catch {
    // 用户取消
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