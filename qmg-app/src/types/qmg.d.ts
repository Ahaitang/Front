/**
 * QMG评分系统类型定义
 */

/**
 * 患者信息接口
 */
export interface Patient {
  /** 姓名 */
  name: string
  /** 性别：'male' | 'female' */
  gender: 'male' | 'female'
  /** 住院号 */
  admissionNumber: string
  /** 手机号（必填） */
  phone: string
}

/**
 * 选择项数据（支持区间和具体数值）
 */
export interface SelectionValue {
  /** 选择的区间值 */
  range: string | number
  /** 具体数值（可选，仅当需要输入时） */
  value?: number
}

/**
 * QMG测评记录接口
 */
export interface QMGRecord {
  /** 记录ID（如果有，表示是已存在的记录，用于更新） */
  id?: number
  /** 患者信息 */
  patient: Patient
  /** 测评日期 */
  assessmentDate: string
  /** 创建时间（可选） */
  createTime?: string | null
  /** 选择的选项映射（支持区间和具体数值） */
  selections: Record<string, string | number | SelectionValue>
  /** 自动计算的得分 */
  score: {
    /** 各项得分 */
    itemScores: Record<string, number>
    /** 总分（满分39分） */
    totalScore: number
    /** 分类得分 */
    categoryScores: {
      eyes: number
      bulbar: number
      respiratory: number
      limbs: number
    }
  }
  /** 修改人角色 */
  modifiedBy: 'patient' | 'doctor'
}

/**
 * QMG评分项枚举
 */
export enum QMGItem {
  /** 复视/下垂 */
  DIPLOPIA_PTOSIS = 'diplopiaPtosis',
  /** 上肢抬起 */
  ARM_RAISE = 'armRaise',
  /** 下肢与抬头 */
  LEG_RAISE_HEAD_LIFT = 'legRaiseHeadLift',
  /** 握力 */
  GRIP_STRENGTH = 'gripStrength',
  /** 肺活量 */
  VITAL_CAPACITY = 'vitalCapacity',
  /** 构音障碍 */
  DYSARTHRIA = 'dysarthria'
}

