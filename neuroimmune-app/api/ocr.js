// 图像识别相关 API
import config from './config'
import { post } from './request'

/**
 * 通用文字识别
 * @param {String} filePath - 图片临时路径
 */
export const recognizeGeneral = (filePath) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: config.BASE_URL + '/ocr/general',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          if (data.code === 200 || data.code === 0) {
            resolve(data.data)
          } else {
            reject(new Error(data.message || '识别失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * 医疗报告识别
 * @param {String} filePath - 图片临时路径
 */
export const recognizeMedicalReport = (filePath) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: config.BASE_URL + '/ocr/medical-report',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          if (data.code === 200 || data.code === 0) {
            resolve(data.data)
          } else {
            reject(new Error(data.message || '识别失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * 身份证识别
 * @param {String} filePath - 图片临时路径
 */
export const recognizeIdCard = (filePath) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: config.BASE_URL + '/ocr/idcard',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          if (data.code === 200 || data.code === 0) {
            resolve(data.data)
          } else {
            reject(new Error(data.message || '识别失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * 通过URL识别图片
 * @param {String} url - 图片URL
 */
export const recognizeByUrl = (url) => {
  return post('/ocr/url', { url })
}

export default {
  recognizeGeneral,
  recognizeMedicalReport,
  recognizeIdCard,
  recognizeByUrl
}