/**
 * QMG评分计算器
 * 根据选择的选项计算得分
 */

import { QMG_ITEMS } from './qmgScoreConstants'
import type { Patient, SelectionValue } from '../types/qmg'

/**
 * 计算QMG总分及各维度得分
 * @param selections 选择的选项映射 { itemKey: optionValue | SelectionValue }
 * @param patient 患者信息（用于握力计算）
 * @returns 得分对象
 */
export function calculateQMGScore(
  selections: Record<string, string | number | SelectionValue>,
  patient: Patient
) {
  const scores: Record<string, number> = {}
  let totalScore = 0

  // 计算每项得分
  QMG_ITEMS.forEach(item => {
    const selectedValue = selections[item.key]
    if (selectedValue !== undefined) {
      // 处理新的数据结构（支持区间和具体数值）
      let rangeValue: string | number
      if (typeof selectedValue === 'object' && 'range' in selectedValue) {
        rangeValue = selectedValue.range
      } else {
        rangeValue = selectedValue
      }
      
      // 找到对应的选项
      const option = item.options.find(opt => opt.value === rangeValue)
      if (option) {
        scores[item.key] = option.score
        totalScore += option.score
      }
    }
  })

  // 计算分类得分
  const categoryScores = {
    eyes: 0,
    bulbar: 0,
    respiratory: 0,
    limbs: 0
  }

  QMG_ITEMS.forEach(item => {
    const score = scores[item.key]
    if (score !== undefined) {
      categoryScores[item.category] += score
    }
  })

  return {
    itemScores: scores,
    totalScore,
    categoryScores
  }
}

/**
 * 验证是否所有项目都已选择
 */
export function validateAllItemsSelected(selections: Record<string, string | number | SelectionValue>): boolean {
  return QMG_ITEMS.every(item => {
    const selection = selections[item.key]
    if (!selection) return false
    
    // 处理需要输入数值的项目（格式：{ range: '选项值', value?: 输入的数值 }）
    if (typeof selection === 'object' && 'range' in selection) {
      return !!selection.range
    }
    
    // 处理允许自定义输入的选项（格式：{ value: '选项值', customInput?: '自定义文本' }）
    if (typeof selection === 'object' && 'value' in selection) {
      return !!selection.value
    }
    
    // 处理普通选项（直接是值）
    return true
  })
}

