/**
 * QMG评分算法常量定义
 * 13项指标的评分标准
 */

/**
 * QMG评分项配置
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
    allowCustomInput?: boolean  // 是否允许用户输入自定义数据
  }>
  /** 分类 */
  category: 'eyes' | 'bulbar' | 'limbs' | 'respiratory'
  /** 是否需要输入具体数值 */
  hasInput?: boolean
  /** 输入框单位（如：秒、Kg、%） */
  inputUnit?: string
  /** 输入框占位符 */
  inputPlaceholder?: string
  /** 是否为左右侧项目（需要分别记录左右） */
  isBilateral?: boolean
}

/**
 * 13项QMG评分配置（根据需求文档）
 */
export const QMG_ITEMS: QMGItemConfig[] = [
  // 眼肌类 (3项) - 按PDF顺序
  {
    name: '左右侧视出现复视',
    key: 'diplopia',
    category: 'eyes',
    options: [
      { label: '≥61秒', score: 0, value: '>=61' },
      { label: '11~60秒', score: 1, value: '11-60' },
      { label: '1~10秒', score: 2, value: '1-10' },
      { label: '自发', score: 3, value: '0' }
    ],
    hasInput: true,
    inputUnit: '秒',
    inputPlaceholder: '请输入具体秒数'
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
    ],
    hasInput: true,
    inputUnit: '秒',
    inputPlaceholder: '请输入具体秒数'
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
    ],
    hasInput: true,
    inputUnit: '个',
    inputPlaceholder: '请输入具体数字(0-50)'
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
    ],
    hasInput: true,
    inputUnit: '%',
    inputPlaceholder: '请输入具体百分比'
  },
  // 上肢肌（近端）类 (2项) - 按PDF顺序，右在前
  {
    name: '坐位右上肢抬起90°时间',
    key: 'armRaiseRight',
    category: 'limbs',
    options: [
      { label: '≥240秒', score: 0, value: '>=240' },
      { label: '90~239秒', score: 1, value: '90-239' },
      { label: '10~89秒', score: 2, value: '10-89' },
      { label: '0~9秒', score: 3, value: '0-9' }
    ],
    hasInput: true,
    inputUnit: '秒',
    inputPlaceholder: '请输入具体秒数',
    isBilateral: true
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
    ],
    hasInput: true,
    inputUnit: '秒',
    inputPlaceholder: '请输入具体秒数',
    isBilateral: true
  },
  // 上肢肌（远端）类 (2项 - 握力，区分左右和性别，阈值不同)
  {
    name: '右手握力',
    key: 'gripStrengthRight',
    category: 'limbs',
    options: [
      // 选项会根据性别动态变化：右手 男≥45，女≥30
      { label: '≥45kg(男)/≥30kg(女)', score: 0, value: 'high' },
      { label: '15~44kg(男)/10~29kg(女)', score: 1, value: 'medium' },
      { label: '5~14kg(男)/5~9kg(女)', score: 2, value: 'low' },
      { label: '0~4kg', score: 3, value: 'very-low' }
    ],
    hasInput: true,
    inputUnit: 'Kg',
    inputPlaceholder: '请输入具体重量',
    isBilateral: true
  },
  {
    name: '左手握力',
    key: 'gripStrengthLeft',
    category: 'limbs',
    options: [
      // 选项会根据性别动态变化：左手 男≥35，女≥25
      { label: '≥35kg(男)/≥25kg(女)', score: 0, value: 'high' },
      { label: '15~34kg(男)/10~24kg(女)', score: 1, value: 'medium' },
      { label: '5~14kg(男)/5~9kg(女)', score: 2, value: 'low' },
      { label: '0~4kg', score: 3, value: 'very-low' }
    ],
    hasInput: true,
    inputUnit: 'Kg',
    inputPlaceholder: '请输入具体重量',
    isBilateral: true
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
    ],
    hasInput: true,
    inputUnit: '秒',
    inputPlaceholder: '请输入具体秒数'
  },
  // 下肢肌类 (2项) - 按PDF顺序，右在前
  {
    name: '平卧位右下肢抬起45°',
    key: 'legRaiseRight',
    category: 'limbs',
    options: [
      { label: '≥100秒', score: 0, value: '>=100' },
      { label: '31~99秒', score: 1, value: '31-99' },
      { label: '1~30秒', score: 2, value: '1-30' },
      { label: '0秒', score: 3, value: '0' }
    ],
    hasInput: true,
    inputUnit: '秒',
    inputPlaceholder: '请输入具体秒数',
    isBilateral: true
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
    ],
    hasInput: true,
    inputUnit: '秒',
    inputPlaceholder: '请输入具体秒数',
    isBilateral: true
  }
]

/**
 * 根据性别和左右手获取握力选项标签
 * @param gender 性别
 * @param isLeft 是否为左手（左手阈值更低）
 */
export function getGripStrengthLabels(gender: 'male' | 'female', isLeft: boolean = false): string[] {
  if (gender === 'male') {
    if (isLeft) {
      // 左手：≥35, 15~34, 5~14, 0~4
      return ['≥35kg', '15~34kg', '5~14kg', '0~4kg']
    } else {
      // 右手：≥45, 15~44, 5~14, 0~4
      return ['≥45kg', '15~44kg', '5~14kg', '0~4kg']
    }
  } else {
    if (isLeft) {
      // 左手：≥25, 10~24, 5~9, 0~4
      return ['≥25kg', '10~24kg', '5~9kg', '0~4kg']
    } else {
      // 右手：≥30, 10~29, 5~9, 0~4
      return ['≥30kg', '10~29kg', '5~9kg', '0~4kg']
    }
  }
}

/**
 * 分类映射
 */
export const QMG_CATEGORIES = {
  eyes: { name: '眼睛', items: [] as QMGItemConfig[] },
  bulbar: { name: '延髓', items: [] as QMGItemConfig[] },
  respiratory: { name: '呼吸', items: [] as QMGItemConfig[] },
  limbs: { name: '四肢', items: [] as QMGItemConfig[] }
}

// 初始化分类
QMG_ITEMS.forEach(item => {
  QMG_CATEGORIES[item.category].items.push(item)
})

