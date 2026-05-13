/**
 * 问卷记录数据解析工具
 * 用于解析后端返回的 JSON 字符串字段
 */

/**
 * 解析问卷记录，将 JSON 字符串转换为对象
 */
export function parseQuestionnaireRecord(record: any) {
  if (!record) return null

  try {
    // 解析 selections JSON 字符串
    let selections = {}
    if (record.selections) {
      if (typeof record.selections === 'string') {
        try {
          selections = JSON.parse(record.selections)
        } catch (e) {
          console.warn('解析 selections 失败:', e)
          selections = {}
        }
      } else {
        selections = record.selections
      }
    }

    // 解析 itemScores JSON 字符串
    let itemScores = {}
    if (record.itemScores) {
      if (typeof record.itemScores === 'string') {
        try {
          itemScores = JSON.parse(record.itemScores)
        } catch (e) {
          console.warn('解析 itemScores 失败:', e)
          itemScores = {}
        }
      } else {
        itemScores = record.itemScores
      }
    }

    // 解析 categoryScores JSON 字符串
    let categoryScores = {}
    if (record.categoryScores) {
      if (typeof record.categoryScores === 'string') {
        try {
          categoryScores = JSON.parse(record.categoryScores)
        } catch (e) {
          console.warn('解析 categoryScores 失败:', e)
          categoryScores = {}
        }
      } else {
        categoryScores = record.categoryScores
      }
    }

    // 构建 score 对象（兼容不同的数据结构）
    const score: any = {
      total: record.totalScore || 0,
      totalScore: record.totalScore || 0,
      itemScores,
      categoryScores
    }

    // 如果 itemScores 有数据，也添加到 score 的根级别（用于显示）
    if (itemScores && typeof itemScores === 'object') {
      Object.assign(score, itemScores)
    }

    // 如果 categoryScores 有数据，也添加到 score 的根级别
    if (categoryScores && typeof categoryScores === 'object') {
      Object.assign(score, categoryScores)
    }

    // 构建患者信息
    // 后端 SQL 查询返回的字段名是 patient_name, patient_gender, patient_phone
    // MyBatis resultMap 映射为驼峰命名：patientName, patientGender, patientPhone
    // 兼容两种命名方式
    let patient = record.patient
    
    // 优先从根级别字段读取（MyBatis 返回的格式，支持驼峰和下划线两种命名）
    const patientName = record.patientName || record.patient_name
    const patientGender = record.patientGender || record.patient_gender
    const patientPhone = record.patientPhone || record.patient_phone
    
    // 如果根级别有患者姓名，或者现有的 patient 对象没有 name，则构建/更新 patient 对象
    if (patientName || !patient || !patient.name) {
      patient = {
        id: record.patientId || patient?.id,
        admissionNumber: record.admissionNumber || patient?.admissionNumber || '',
        name: patientName || patient?.name || '',
        gender: patientGender || patient?.gender,
        phone: patientPhone || patient?.phone
      }
    }
    
    // 构建医生信息（从联查结果获取真实医生姓名）
    // MyBatis resultMap 映射为驼峰命名：doctorName, doctorEmployeeNumber
    // 兼容两种命名方式
    const doctorName = record.doctorName || record.doctor_name
    // doctorEmployeeNumber available for future use
    void (record.doctorEmployeeNumber || record.doctor_employee_number)
    
    // 如果获取到了医生真实姓名，更新 doctorUsername 字段
    if (doctorName) {
      record.doctorUsername = doctorName
    }
    
    // 解析 userInputData（用户自定义输入数据）
    // 保持原始格式，前端会根据需要格式化显示
    let userInputData = record.userInputData
    if (userInputData && typeof userInputData === 'string') {
      try {
        // 尝试解析为JSON，如果失败则保持字符串格式
        userInputData = JSON.parse(userInputData)
      } catch (e) {
        // 不是JSON格式，保持原样
        userInputData = record.userInputData
      }
    }

    return {
      ...record,
      selections,
      score,
      patient,
      userInputData
    }
  } catch (error) {
    console.error('解析问卷记录失败:', error, record)
    return record
  }
}

/**
 * 批量解析问卷记录列表
 */
export function parseQuestionnaireRecords(records: any[]) {
  if (!Array.isArray(records)) return []
  return records.map(record => parseQuestionnaireRecord(record))
}
