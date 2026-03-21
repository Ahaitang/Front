// HTTP 请求工具
import config from './config'

// 请求拦截
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const role = uni.getStorageSync('role')
    const userInfo = uni.getStorageSync('userInfo')
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
    // 添加角色和用户ID头，用于后端权限控制
    if (role) {
      header['X-User-Role'] = role
    }
    if (userInfo && userInfo.id) {
      header['X-User-Id'] = userInfo.id
    }

    uni.request({
      url: config.BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        if (res.statusCode === 200) {
          const data = res.data
          if (data.code === 200 || data.code === 0) {
            resolve(data.data)
          } else {
            uni.showToast({ title: data.message || '请求失败', icon: 'none' })
            reject(data)
          }
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.removeStorageSync('role')
          uni.showToast({ title: '登录已过期', icon: 'none' })
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/login' })
          }, 1000)
          reject(res)
        } else {
          uni.showToast({ title: '网络错误', icon: 'none' })
          reject(res)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

// GET 请求
export const get = (url, data) => {
  return request({ url, method: 'GET', data })
}

// POST 请求
export const post = (url, data) => {
  return request({ url, method: 'POST', data })
}

// PUT 请求
export const put = (url, data) => {
  return request({ url, method: 'PUT', data })
}

// DELETE 请求
export const del = (url, data) => {
  return request({ url, method: 'DELETE', data })
}

export default {
  request,
  get,
  post,
  put,
  del
}