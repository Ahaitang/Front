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
        meta: { title: '仪表盘', icon: 'DataBoard', roles: ['admin', 'doctor'] }
      },
      {
        path: 'patients',
        name: 'Patients',
        component: () => import('@/views/patients/Patients.vue'),
        meta: { title: '患者管理', icon: 'User', roles: ['admin', 'doctor'] }
      },
      {
        path: 'patients/:id',
        name: 'PatientDetail',
        component: () => import('@/views/patients/PatientDetail.vue'),
        meta: { title: '患者详情', hidden: true, roles: ['admin', 'doctor'] }
      },
      {
        path: 'doctors',
        name: 'Doctors',
        component: () => import('@/views/doctors/Doctors.vue'),
        meta: { title: '医生管理', icon: 'UserFilled', roles: ['admin'] }
      },
      {
        path: 'followups',
        name: 'FollowUps',
        component: () => import('@/views/followups/FollowUps.vue'),
        meta: { title: '随访记录', icon: 'Calendar', roles: ['admin', 'doctor'] }
      },
      {
        path: 'medications',
        name: 'Medications',
        component: () => import('@/views/medications/Medications.vue'),
        meta: { title: '用药记录', icon: 'FirstAidKit', roles: ['admin', 'doctor'] }
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('@/views/records/Records.vue'),
        meta: { title: '病历记录', icon: 'Document', roles: ['admin', 'doctor'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/Profile.vue'),
        meta: { title: '个人信息', icon: 'User', roles: ['admin', 'doctor'] }
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
  const role = localStorage.getItem('admin_role')

  // 未登录且访问非登录页
  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }

  // 已登录但访问登录页
  if (to.path === '/login' && token) {
    next('/dashboard')
    return
  }

  // 权限检查
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && role && !requiredRoles.includes(role)) {
    // 无权限访问该页面
    next('/dashboard')
    return
  }

  next()
})

export default router