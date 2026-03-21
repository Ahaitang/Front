/**
 * QMG测评数据状态管理
 */
import { defineStore } from 'pinia'
import type { Patient, QMGRecord } from '../types/qmg'
import { patientApi, questionnaireApi } from '../utils/api'

export const useAssessmentStore = defineStore('assessment', {
  state: () => {
    return {
      /** 当前测评记录 */
      currentRecord: null as QMGRecord | null,
      /** 历史测评记录列表 */
      historyRecords: [] as QMGRecord[],
      /** 患者列表（所有患者，包括未完成测评的） */
      patientList: [] as Patient[],
      /** 当前用户角色 */
      currentRole: 'patient' as 'patient' | 'doctor',
      /** 当前患者信息（用于患者主页显示） */
      currentPatientInfo: null as Patient | null,
      /** 是否从新增问卷入口进入（持久化标记） */
      isFromNewQuestionnaire: false,
      /** 医生是否已登录 */
      isDoctorLoggedIn: false,
      /** 医生用户名 */
      doctorUsername: '' as string
    }
  },

  getters: {
    /** 当前患者信息 */
    currentPatient(): Patient | null {
      return this.currentRecord?.patient || null
    },

    /** 当前得分 */
    currentScore(): QMGRecord['score'] | null {
      return this.currentRecord?.score || null
    },

    /** 当前总分 */
    currentTotalScore(): number {
      return this.currentRecord?.score?.totalScore || 0
    }
  },

  actions: {
    /**
     * 初始化新测评记录
     */
    initNewRecord(patient: Patient) {
      // 确保患者信息在本地列表中（不调用API，因为患者可能已存在于数据库）
      const exists = this.patientList.some(p => 
        (p.admissionNumber && p.admissionNumber === patient.admissionNumber) ||
        (!p.admissionNumber && p.name === patient.name && p.phone === patient.phone)
      )
      
      if (!exists) {
        // 如果本地列表中没有，添加到本地列表（不调用API）
        this.patientList.push({ ...patient })
      }
      
      this.currentRecord = {
        patient,
        assessmentDate: new Date().toISOString().split('T')[0],
        selections: {},
        score: {
          itemScores: {},
          totalScore: 0,
          categoryScores: {
            eyes: 0,
            bulbar: 0,
            respiratory: 0,
            limbs: 0
          }
        },
        modifiedBy: this.currentRole
      }
    },

    /**
     * 加载患者列表（从API）。小程序端仅加载当前医生关联的患者。
     */
    async loadPatientList() {
      try {
        const doctorLoginInfo = uni.getStorageSync('doctorLoginInfo') as { id?: number } | null
        const doctorId = doctorLoginInfo?.id
        const patients = await patientApi.getPatientList(doctorId)
        // 转换API返回的数据格式为前端格式
        this.patientList = patients.map((p: any) => ({
          id: p.id,
          name: p.name,
          gender: p.gender as 'male' | 'female',
          admissionNumber: p.admissionNumber,
          phone: p.phone
        }))
      } catch (error) {
        console.error('加载患者列表失败:', error)
        // 失败时保持现有列表
      }
    },

    /**
     * 添加患者到患者列表（如果不存在）
     * 先调用API保存并关联当前医生，再更新本地列表
     */
    async addPatientToList(patient: Patient) {
      try {
        const doctorLoginInfo = uni.getStorageSync('doctorLoginInfo') as { id?: number } | null
        const doctorId = doctorLoginInfo?.id
        await patientApi.addPatient(patient, doctorId)
        await this.loadPatientList()
      } catch (error) {
        console.error('添加患者失败:', error)
        throw error
      }
    },

    /**
     * 更新选择项（医生端使用）
     */
    updateSelections(selections: Record<string, string | number>) {
      if (!this.currentRecord) {
        throw new Error('请先初始化测评记录')
      }

      this.currentRecord.selections = { ...selections }
      this.currentRecord.modifiedBy = this.currentRole
    },

    /**
     * 保存当前测评记录到历史（同时保存到后端）
     * 如果有id，则更新现有记录；否则新增记录
     */
    async saveCurrentRecord() {
      if (!this.currentRecord) {
        throw new Error('没有可保存的测评记录')
      }
      if (!this.currentRecord.patient?.admissionNumber?.trim()) {
        uni.showToast({ title: '患者住院号缺失，无法保存', icon: 'none' })
        return
      }

      try {
        // 准备保存到后端的数据（保证 patient 含 admissionNumber）
        const recordData: any = {
          patient: {
            name: this.currentRecord.patient.name,
            gender: this.currentRecord.patient.gender,
            admissionNumber: this.currentRecord.patient.admissionNumber.trim(),
            phone: this.currentRecord.patient.phone ?? ''
          },
          assessmentDate: this.currentRecord.assessmentDate,
          selections: this.currentRecord.selections ?? {},
          score: this.currentRecord.score ?? { itemScores: {}, totalScore: 0, categoryScores: { eyes: 0, bulbar: 0, respiratory: 0, limbs: 0 } }
        }

        // 如果医生已登录，添加医生信息
        if (this.isDoctorLoggedIn) {
          // 尝试从本地存储获取医生ID
          const doctorLoginInfo = uni.getStorageSync('doctorLoginInfo')
          if (doctorLoginInfo && doctorLoginInfo.id) {
            recordData.doctorId = doctorLoginInfo.id
          }
          if (this.doctorUsername) {
            recordData.doctorUsername = this.doctorUsername
          }
        }

        // 判断是新增还是更新
        const isUpdate = !!this.currentRecord.id
        if (isUpdate) {
          // 有id，更新现有记录
          recordData.id = this.currentRecord.id
          await questionnaireApi.updateRecord(recordData)
        } else {
          // 没有id，新增记录
          await questionnaireApi.saveRecord(recordData)
        }

        // 保存成功后，添加到本地历史记录
        this.historyRecords.push({
          ...this.currentRecord
        })

        // 清空当前记录
        this.currentRecord = null

        uni.showToast({
          title: isUpdate ? '更新成功' : '保存成功',
          icon: 'success'
        })
      } catch (error: any) {
        console.error('保存问卷结果失败:', error)
        // 即使后端保存失败，也保存到本地历史记录
        this.historyRecords.push({
          ...this.currentRecord
        })
        this.currentRecord = null
        
        uni.showToast({
          title: error.message || '保存失败，已保存到本地',
          icon: 'none',
          duration: 2000
        })
      }
    },

    /**
     * 设置当前用户角色
     */
    setCurrentRole(role: 'patient' | 'doctor') {
      this.currentRole = role
    },

    /**
     * 加载历史记录
     */
    loadHistoryRecord(index: number) {
      if (index >= 0 && index < this.historyRecords.length) {
        this.currentRecord = {
          ...this.historyRecords[index]
        }
      }
    },

    /**
     * 设置当前记录（用于从历史记录/趋势页点击某条记录查看详情）
     */
    setCurrentRecord(record: import('../types/qmg').QMGRecord) {
      this.currentRecord = { ...record }
    },

    /**
     * 清空当前记录
     */
    clearCurrentRecord() {
      this.currentRecord = null
    },

    /**
     * 保存患者信息（用于患者主页）
     */
    savePatientInfo(patient: Patient) {
      this.currentPatientInfo = patient
    },

    /**
     * 获取患者信息（优先从当前记录，其次从历史记录，最后从保存的信息）
     */
    getPatientInfo(): Patient | null {
      if (this.currentRecord?.patient) {
        return this.currentRecord.patient
      }
      if (this.historyRecords.length > 0) {
        return this.historyRecords[this.historyRecords.length - 1].patient
      }
      return this.currentPatientInfo
    },

    /**
     * 设置是否从新增问卷入口进入
     */
    setFromNewQuestionnaire(value: boolean) {
      this.isFromNewQuestionnaire = value
    },

    /**
     * 设置医生登录状态
     */
    setDoctorLogin(isLoggedIn: boolean) {
      this.isDoctorLoggedIn = isLoggedIn
    },

    /**
     * 设置医生用户名
     */
    setDoctorUsername(username: string) {
      this.doctorUsername = username
    },

    /**
     * 医生登出
     */
    doctorLogout() {
      this.isDoctorLoggedIn = false
      this.doctorUsername = ''
      uni.removeStorageSync('doctorLoginInfo')
    }
  }
})

