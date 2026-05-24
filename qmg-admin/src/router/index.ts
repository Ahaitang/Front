/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '首页',
          icon: 'Odometer'
        }
      },
      {
        path: 'dashboard',
        redirect: '/'
      },
      {
        path: 'patients',
        name: 'Patients',
        component: () => import('@/views/Patients.vue'),
        meta: {
          title: '患者管理',
          icon: 'User'
        }
      },
      {
        path: 'patient/:id',
        name: 'PatientDetail',
        component: () => import('@/views/PatientDetail.vue'),
        meta: {
          title: '患者详情',
          requiresAuth: true
        }
      },
      {
        path: 'questionnaires',
        name: 'Questionnaires',
        component: () => import('@/views/Questionnaires.vue'),
        meta: {
          title: '问卷记录',
          icon: 'Document'
        }
      },
      {
        path: 'doctors',
        name: 'Doctors',
        component: () => import('@/views/Doctors.vue'),
        meta: {
          title: '医生管理',
          icon: 'Avatar',
          requiresLevel: [0, 1]  // 只有权限等级0和1可以访问
        }
      },
      {
        path: 'questionnaire-config',
        name: 'QuestionnaireConfig',
        component: () => import('@/views/QuestionnaireConfig.vue'),
        meta: {
          title: '问卷配置',
          icon: 'Setting',
          requiresLevel: [0, 1]  // 只有权限等级0和1可以访问
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/qmg/'),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  
  // 初始化用户信息
  if (!userStore.isLoggedIn) {
    userStore.initUser()
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && userStore.isLoggedIn) {
    next({ name: 'Dashboard' })
  } else {
    // 检查需要权限的页面
    if (to.name === 'Doctors' || to.name === 'QuestionnaireConfig') {
      if (!userStore.canManageDoctors) {
        next({ name: 'Dashboard' })
        return
      }
    }
    next()
  }
})

export default router
