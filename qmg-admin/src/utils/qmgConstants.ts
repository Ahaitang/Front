/**
 * QMG评分常量定义
 * 用于中文映射
 */

/**
 * QMG项目配置
 */
export interface QMGItemConfig {
  /** 项目名称 */
  name: string
  /** 项目键名 */
  key: string
  /** 选项配置 */
  options: Array<{
    label: string
    score: number
    value: string | number
  }>
  /** 分类 */
  category: 'eyes' | 'bulbar' | 'respiratory' | 'limbs'
}

/**
 * 13项QMG评分配置（根据需求文档）
 */
export const QMG_ITEMS: QMGItemConfig[] = [
  // 眼肌类 (3项)
  {
    name: '左右侧视出现复视',
    key: 'diplopia',
    category: 'eyes',
    options: [
      { label: '≥61秒', score: 0, value: '>=61' },
      { label: '11~60秒', score: 1, value: '11-60' },
      { label: '1~10秒', score: 2, value: '1-10' },
      { label: '自发', score: 3, value: '0' }
    ]
  },
  {
    name: '上视出现眼睑下垂',
    key: 'ptosis',
    category: 'eyes',
    options: [
      { label: '≥61秒', score: 0, value: '>=61' },
      { label: '11~60秒', score: 1, value: '11-60' },
      { label: '1~10秒', score: 2, value: '1-10' },
      { label: '自发', score: 3, value: '0' }
    ]
  },
  {
    name: '眼睑闭合',
    key: 'eyelidClosure',
    category: 'eyes',
    options: [
      { label: '正常', score: 0, value: 'normal' },
      { label: '闭合时可抵抗部分阻力', score: 1, value: 'partial' },
      { label: '闭合时不能抵抗阻力', score: 2, value: 'no-resistance' },
      { label: '不能闭合', score: 3, value: 'unable' }
    ]
  },
  // 球部肌类 (2项)
  {
    name: '吞咽100mL水',
    key: 'swallowing',
    category: 'bulbar',
    options: [
      { label: '正常', score: 0, value: 'normal' },
      { label: '轻度呛咳', score: 1, value: 'mild' },
      { label: '严重呛咳或鼻腔反流', score: 2, value: 'severe' },
      { label: '不能完成', score: 3, value: 'unable' }
    ]
  },
  {
    name: '数数1~50（观察构音障碍）',
    key: 'counting',
    category: 'bulbar',
    options: [
      { label: '无构音障碍', score: 0, value: '50' },
      { label: '30~49', score: 1, value: '30-49' },
      { label: '10~29', score: 2, value: '10-29' },
      { label: '0~9', score: 3, value: '0-9' }
    ]
  },
  // 呼吸类 (1项)
  {
    name: '肺活量预计值',
    key: 'vitalCapacity',
    category: 'respiratory',
    options: [
      { label: '≥80%', score: 0, value: '>=80' },
      { label: '65-79%', score: 1, value: '65-79' },
      { label: '50-64%', score: 2, value: '50-64' },
      { label: '<50%', score: 3, value: '<50' }
    ]
  },
  // 上肢肌（近端）类 (2项)
  {
    name: '坐位右上肢抬起90°时间',
    key: 'armRaiseRight',
    category: 'limbs',
    options: [
      { label: '≥240秒', score: 0, value: '>=240' },
      { label: '90~239秒', score: 1, value: '90-239' },
      { label: '10~89秒', score: 2, value: '10-89' },
      { label: '0~9秒', score: 3, value: '0-9' }
    ]
  },
  {
    name: '坐位左上肢抬起90°时间',
    key: 'armRaiseLeft',
    category: 'limbs',
    options: [
      { label: '≥240秒', score: 0, value: '>=240' },
      { label: '90~239秒', score: 1, value: '90-239' },
      { label: '10~89秒', score: 2, value: '10-89' },
      { label: '0~9秒', score: 3, value: '0-9' }
    ]
  },
  // 上肢肌（远端）类 (2项)
  {
    name: '右手握力',
    key: 'gripStrengthRight',
    category: 'limbs',
    options: [
      { label: '≥45kg(男)/≥30kg(女)', score: 0, value: 'high' },
      { label: '15~44kg(男)/10~29kg(女)', score: 1, value: 'medium' },
      { label: '5~14kg(男)/5~9kg(女)', score: 2, value: 'low' },
      { label: '0~4kg', score: 3, value: 'very-low' }
    ]
  },
  {
    name: '左手握力',
    key: 'gripStrengthLeft',
    category: 'limbs',
    options: [
      { label: '≥35kg(男)/≥25kg(女)', score: 0, value: 'high' },
      { label: '15~34kg(男)/10~24kg(女)', score: 1, value: 'medium' },
      { label: '5~14kg(男)/5~9kg(女)', score: 2, value: 'low' },
      { label: '0~4kg', score: 3, value: 'very-low' }
    ]
  },
  // 颈肌类 (1项)
  {
    name: '平卧位抬头45°',
    key: 'headLift',
    category: 'limbs',
    options: [
      { label: '≥120秒', score: 0, value: '>=120' },
      { label: '30~119秒', score: 1, value: '30-119' },
      { label: '1~29秒', score: 2, value: '1-29' },
      { label: '0秒', score: 3, value: '0' }
    ]
  },
  // 下肢肌类 (2项)
  {
    name: '平卧位右下肢抬起45°',
    key: 'legRaiseRight',
    category: 'limbs',
    options: [
      { label: '≥100秒', score: 0, value: '>=100' },
      { label: '31~99秒', score: 1, value: '31-99' },
      { label: '1~30秒', score: 2, value: '1-30' },
      { label: '0秒', score: 3, value: '0' }
    ]
  },
  {
    name: '平卧位左下肢抬起45°',
    key: 'legRaiseLeft',
    category: 'limbs',
    options: [
      { label: '≥100秒', score: 0, value: '>=100' },
      { label: '31~99秒', score: 1, value: '31-99' },
      { label: '1~30秒', score: 2, value: '1-30' },
      { label: '0秒', score: 3, value: '0' }
    ]
  }
]

/**
 * 分类映射
 */
export const QMG_CATEGORIES = {
  eyes: '眼部',
  bulbar: '延髓',
  respiratory: '呼吸',
  limbs: '四肢'
}

/**
 * 根据项目键名获取项目名称
 */
export function getItemNameByKey(key: string): string {
  const item = QMG_ITEMS.find(item => item.key === key)
  return item ? item.name : key
}

/**
 * 根据分类键名获取分类名称
 */
export function getCategoryNameByKey(key: string): string {
  return QMG_CATEGORIES[key as keyof typeof QMG_CATEGORIES] || key
}

/**
 * 根据项目键名和选项值获取选项标签
 */
export function getOptionLabelByValue(itemKey: string, optionValue: any): string {
  const item = QMG_ITEMS.find(item => item.key === itemKey)
  if (!item) return String(optionValue)
  
  // 处理对象类型的选项值（可能包含 range 和 value，或包含 customInput）
  if (typeof optionValue === 'object' && optionValue !== null) {
    if ('range' in optionValue) {
      // 尝试匹配 range 值
      const option = item.options.find(opt => {
        if (typeof opt.value === 'string' && opt.value === optionValue.range) {
          return true
        }
        return false
      })
      if (option) {
        return option.label + (optionValue.value !== undefined ? ` (${optionValue.value})` : '')
      }
      return `${optionValue.range}${optionValue.value !== undefined ? ` (${optionValue.value})` : ''}`
    }
    // 处理包含 customInput 的选项值
    if ('value' in optionValue && 'customInput' in optionValue) {
      const option = item.options.find(opt => {
        if (typeof opt.value === typeof optionValue.value) {
          return String(opt.value) === String(optionValue.value)
        }
        return false
      })
      const label = option ? option.label : String(optionValue.value)
      // 如果有自定义输入，显示选项标签和自定义输入内容
      if (optionValue.customInput && String(optionValue.customInput).trim()) {
        return `${label}：${optionValue.customInput}`
      }
      return label
    }
    // 如果对象有其他结构，尝试转换为字符串
    return JSON.stringify(optionValue)
  }
  
  // 处理基本类型的选项值
  const option = item.options.find(opt => {
    if (typeof opt.value === typeof optionValue) {
      return String(opt.value) === String(optionValue)
    }
    return false
  })
  
  return option ? option.label : String(optionValue)
}
