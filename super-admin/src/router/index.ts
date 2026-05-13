import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/views/Layout.vue'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
  {
    path: '/',
    component: Layout,
    redirect: '/online',
    children: [
      { path: 'online', name: 'OnlineUsers', component: () => import('@/views/OnlineUsers.vue'), meta: { title: '在线用户管理' } },
      { path: 'audit', name: 'AuditLog', component: () => import('@/views/AuditLog.vue'), meta: { title: '审计日志' } },
      { path: 'blacklist', name: 'Blacklist', component: () => import('@/views/Blacklist.vue'), meta: { title: '黑名单管理' } },
      { path: 'config', name: 'SystemConfig', component: () => import('@/views/SystemConfig.vue'), meta: { title: '系统配置' } }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('super_admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router