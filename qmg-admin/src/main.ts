import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import 'element-plus/dist/index.css'
import 'echarts'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 过滤浏览器扩展的错误（不影响应用功能）
window.addEventListener('error', (event) => {
  // 过滤掉 content_script.js 相关的错误（通常是浏览器扩展引起的）
  if (event.filename && event.filename.includes('content_script.js')) {
    event.preventDefault()
    return false
  }
}, true)

// 过滤未捕获的 Promise 错误中的扩展错误
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason
  const errorMessage = error?.message || error?.toString() || ''
  const errorStack = error?.stack || ''
  
  // 过滤掉 content_script.js 相关的错误
  if (errorMessage.includes('content_script.js') || 
      errorStack.includes('content_script.js') ||
      errorMessage.includes('Failed to fetch') && errorStack.includes('content_script')) {
    event.preventDefault()
    return false
  }
})

app.use(pinia)
app.use(router)
app.mount('#app')
