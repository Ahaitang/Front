import request from './request.js'

/**
 * 患者绑定医生
 */
export const bindDoctor = (patientId, doctorId, bindMethod = 'patient', remark = '') => {
	return request.post('/relation/bind', {
		patientId,
		doctorId,
		bindMethod,
		remark
	})
}

/**
 * 解除绑定
 */
export const unbindRelation = (id) => {
	return request.post('/relation/unbind', { id })
}

/**
 * 解除患者当前绑定
 */
export const unbindPatient = (patientId) => {
	return request.post(`/relation/unbind-patient/${patientId}`)
}

/**
 * 获取患者当前绑定的医生
 */
export const getPatientDoctor = (patientId) => {
	return request.get(`/relation/patient/${patientId}/doctor`)
}

/**
 * 获取医生的绑定患者列表
 */
export const getDoctorPatients = (doctorId) => {
	return request.get(`/relation/doctor/${doctorId}/patients`)
}

/**
 * 获取医生的患者详情列表（含患者完整信息）
 */
export const getDoctorPatientDetails = (doctorId) => {
	return request.get(`/relation/doctor/${doctorId}/patient-details`)
}

/**
 * 获取患者的绑定历史
 */
export const getBindHistory = (patientId) => {
	return request.get(`/relation/patient/${patientId}/history`)
}

/**
 * 获取所有绑定关系（管理端）
 */
export const getRelationList = (params = {}) => {
	return request.get('/relation/list', params)
}

/**
 * 统计医生的患者数量
 */
export const countDoctorPatients = (doctorId) => {
	return request.get(`/relation/doctor/${doctorId}/count`)
}

/**
 * 获取所有医生列表（供患者选择）
 */
export const getDoctorList = () => {
	return request.get('/relation/doctors')
}

/**
 * 获取绑定详情
 */
export const getRelationById = (id) => {
	return request.get(`/relation/${id}`)
}