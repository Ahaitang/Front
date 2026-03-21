import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/views/layout/Layout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataBoard' }
      },
      {
        path: 'patients',
        name: 'Patients',
        component: () => import('@/views/patients/Patients.vue'),
        meta: { title: '患者管理', icon: 'User' }
      },
      {
        path: 'doctors',
        name: 'Doctors',
        component: () => import('@/views/doctors/Doctors.vue'),
        meta: { title: '医生管理', icon: 'UserFilled' }
      },
      {
        path: 'followups',
        name: 'FollowUps',
        component: () => import('@/views/followups/FollowUps.vue'),
        meta: { title: '随访记录', icon: 'Calendar' }
      },
      {
        path: 'medications',
        name: 'Medications',
        component: () => import('@/views/medications/Medications.vue'),
        meta: { title: '用药记录', icon: 'FirstAidKit' }
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('@/views/records/Records.vue'),
        meta: { title: '病历记录', icon: 'Document' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/Profile.vue'),
        meta: { title: '个人信息', icon: 'User' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router