<template>
  <view class="assessment-container">
    <!-- 患者信息卡片 -->
    <view v-if="patientInfo && patientInfo.name" class="patient-card">
      <view class="patient-header">
        <text class="patient-name">{{ patientInfo.name || '未命名患者' }}</text>
        <text class="patient-gender">{{ patientInfo.gender === 'male' ? '男' : '女' }}</text>
      </view>
      <view class="patient-info-row">
        <text class="patient-admission">住院号: {{ patientInfo.admissionNumber || '未填写' }}</text>
        <text v-if="patientInfo.phone" class="patient-phone">手机号: {{ patientInfo.phone }}</text>
      </view>
    </view>

    <!-- 进度条 -->
    <view class="progress-container">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <text class="progress-text">{{ currentStep + 1 }} / {{ QMG_ITEMS.length }}</text>
    </view>

    <!-- 当前问题卡片 -->
    <view class="card-container">
      <view class="assessment-card">
        <view class="item-title">
          <text class="item-number">{{ String(currentStep + 1) }}</text>
          <text class="item-name">{{ currentItem.name }}</text>
        </view>
        
        <view class="options-container">
          <view
            v-for="(option, optIndex) in getItemOptions(currentItem)"
            :key="optIndex"
            class="option-btn"
            :class="{ active: isOptionSelected(currentItem.key, option.value) }"
            @click="selectOption(currentItem.key, option.value, option.allowCustomInput)"
          >
            <text class="option-label">{{ option.label }}</text>
          </view>
        </view>

        <!-- 输入框（当选择区间且需要输入时显示） -->
        <view v-if="currentItem.hasInput && getSelectedRange(currentItem.key)" class="input-container">
          <input
            v-model="inputValues[currentItem.key]"
            class="value-input"
            type="digit"
            :placeholder="(currentItem.inputPlaceholder || '请输入数值') + (currentItem.inputUnit ? '（' + currentItem.inputUnit + '，可选）' : '（可选）')"
            @input="onInputValue(currentItem.key, $event)"
            @blur="saveInputValue(currentItem.key)"
          />
        </view>
        
        <!-- 自定义输入框（当选择允许输入的选项时显示） -->
        <view v-if="needsCustomInput(currentItem.key)" class="input-container">
          <textarea
            v-model="customInputValues[currentItem.key]"
            class="custom-input"
            :placeholder="'请输入' + currentItem.name + '的详细说明'"
            @blur="saveCustomInput(currentItem.key)"
            :maxlength="500"
          />
        </view>
      </view>
    </view>

    <!-- 导航按钮 -->
    <view class="footer-nav">
      <!-- 最后一个卡片：显示上一步和提交 -->
      <template v-if="currentStep === QMG_ITEMS.length - 1">
        <button
          v-if="currentStep > 0"
          class="nav-btn prev-btn"
          @click="prevStep"
        >
          上一步
        </button>
        <button
          class="nav-btn submit-btn"
          :disabled="!canSubmit"
          @click="submitAssessment"
        >
          提交
        </button>
      </template>
      <!-- 其他卡片：显示上一步和下一步 -->
      <template v-else>
        <button
          v-if="currentStep > 0"
          class="nav-btn prev-btn"
          @click="prevStep"
        >
          上一步
        </button>
        <button
          class="nav-btn next-btn"
          @click="nextStep"
        >
          下一步
        </button>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAssessmentStore } from '../../src/stores/assessment'
import { QMG_ITEMS, getGripStrengthLabels } from '../../src/utils/qmgScoreConstants'
import { validateAllItemsSelected } from '../../src/utils/qmgScoreCalculator'
import type { QMGItemConfig } from '../../src/utils/qmgScoreConstants'

const assessmentStore = useAssessmentStore()

// 当前步骤索引
const currentStep = ref(0)

// 患者信息
const patientInfo = computed(() => {
  if (!assessmentStore.currentRecord) {
    return { name: '', gender: 'male' as const, admissionNumber: '' }
  }
  return assessmentStore.currentRecord.patient
})

// 选择的选项（支持区间和具体数值）
const selections = ref<Record<string, string | number | { range: string | number; value?: number } | { value: string | number; customInput?: string }>>({})
// 输入框的值
const inputValues = ref<Record<string, string>>({})
// 自定义输入的值（用于允许输入的选项）
const customInputValues = ref<Record<string, string>>({})
// 记录哪些选项允许自定义输入
const optionAllowCustomInput = ref<Record<string, Record<string | number, boolean>>>({})

// 当前问题项
const currentItem = computed(() => {
  return QMG_ITEMS[currentStep.value]
})

// 进度百分比
const progressPercent = computed(() => {
  return ((currentStep.value + 1) / QMG_ITEMS.length) * 100
})


// 是否可以提交
const canSubmit = computed(() => {
  // 检查所有项目是否已选择
  const allSelected = QMG_ITEMS.every(item => {
    const selection = selections.value[item.key]
    if (!selection) {
      return false
    }
    
    // 处理需要输入数值的项目（格式：{ range: '选项值', value?: 输入的数值 }）
    if (typeof selection === 'object' && 'range' in selection) {
      // 对于需要输入的项目，只要有range就算已选择（value是可选的）
      return !!selection.range
    }
    
    // 处理允许自定义输入的选项（格式：{ value: '选项值', customInput?: '自定义文本' }）
    if (typeof selection === 'object' && 'value' in selection) {
      // 只要有value就算已选择（customInput是可选的）
      return !!selection.value
    }
    
    // 处理普通选项（直接是值）
    return true
  })
  return allSelected
})

// 获取项目选项（握力需要根据性别和左右手动态显示）
const getItemOptions = (item: QMGItemConfig) => {
  let options = item.options
  if (item.key === 'gripStrengthRight' || item.key === 'gripStrengthLeft') {
    const isLeft = item.key === 'gripStrengthLeft'
    const labels = getGripStrengthLabels(patientInfo.value.gender, isLeft)
    options = item.options.map((opt, index) => ({
      ...opt,
      label: labels[index] || opt.label
    }))
  }
  
  // 记录每个选项是否允许自定义输入
  if (!optionAllowCustomInput.value[item.key]) {
    optionAllowCustomInput.value[item.key] = {}
  }
  options.forEach(opt => {
    optionAllowCustomInput.value[item.key][opt.value] = opt.allowCustomInput || false
  })
  
  return options
}

// 判断选项是否被选中
const isOptionSelected = (itemKey: string, optionValue: string | number): boolean => {
  const selection = selections.value[itemKey]
  if (!selection) return false
  if (typeof selection === 'object' && 'range' in selection) {
    return selection.range === optionValue
  }
  if (typeof selection === 'object' && 'value' in selection) {
    return selection.value === optionValue
  }
  return selection === optionValue
}

// 获取已选择的区间值
const getSelectedRange = (itemKey: string): string | number | null => {
  const selection = selections.value[itemKey]
  if (!selection) return null
  if (typeof selection === 'object' && 'range' in selection) {
    return selection.range
  }
  return selection
}

// 选择选项
const selectOption = (itemKey: string, value: string | number, allowCustomInput: boolean = false) => {
  const item = QMG_ITEMS.find(i => i.key === itemKey)
  const isLastStep = currentStep.value === QMG_ITEMS.length - 1
  
  if (item?.hasInput) {
    // 需要输入数值的项目，存储为对象格式
    selections.value[itemKey] = {
      range: value,
      value: inputValues.value[itemKey] ? parseFloat(inputValues.value[itemKey]) : undefined
    }
    // 需要输入的项目不自动跳转，等待用户输入
    // 但如果是最后一步，需要强制触发响应式更新
    if (isLastStep) {
      selections.value = { ...selections.value }
    }
  } else if (allowCustomInput) {
    // 允许自定义输入的选项，存储为对象格式（包含value和customInput）
    const customInput = customInputValues.value[itemKey] || ''
    selections.value[itemKey] = {
      value: value,
      customInput: customInput
    }
    // 不自动跳转，等待用户输入自定义文本
    if (isLastStep) {
      selections.value = { ...selections.value }
    }
  } else {
    // 不需要输入的项目，直接存储值
    selections.value[itemKey] = value
    // 如果不是最后一步，自动跳转到下一步
    if (!isLastStep) {
      setTimeout(() => {
        currentStep.value++
      }, 300) // 延迟300ms，让用户看到选择反馈
    } else {
      // 如果是最后一步，强制触发响应式更新
      selections.value = { ...selections.value }
    }
  }
  
  // 更新到store（不计算得分，只在提交时计算）
  if (assessmentStore.currentRecord) {
    assessmentStore.updateSelections(selections.value as any)
  }
}

// 输入数值
const onInputValue = (itemKey: string, event: any) => {
  const value = event.detail.value
  inputValues.value[itemKey] = value
}

// 保存输入值
const saveInputValue = (itemKey: string) => {
  const selection = selections.value[itemKey]
  if (selection && typeof selection === 'object' && 'range' in selection) {
    const numValue = inputValues.value[itemKey] ? parseFloat(inputValues.value[itemKey]) : undefined
    selections.value[itemKey] = {
      range: selection.range,
      value: numValue
    }
    // 强制触发响应式更新
    selections.value = { ...selections.value }
    
    // 更新到store
    if (assessmentStore.currentRecord) {
      assessmentStore.updateSelections(selections.value as any)
    }
    
    // 输入完成后，如果不是最后一步，自动跳转到下一步
    if (currentStep.value < QMG_ITEMS.length - 1) {
      setTimeout(() => {
        currentStep.value++
      }, 300)
    }
  }
}

// 判断是否需要显示自定义输入框
const needsCustomInput = (itemKey: string): boolean => {
  const selection = selections.value[itemKey]
  if (!selection || typeof selection !== 'object' || 'range' in selection) {
    return false
  }
  // 检查是否是允许自定义输入的选项
  if ('value' in selection && 'customInput' in selection) {
    const optionMap = optionAllowCustomInput.value[itemKey]
    if (optionMap && optionMap[selection.value]) {
      return true
    }
  }
  return false
}

// 保存自定义输入
const saveCustomInput = (itemKey: string) => {
  const selection = selections.value[itemKey]
  if (selection && typeof selection === 'object' && 'value' in selection && 'customInput' in selection) {
    selections.value[itemKey] = {
      value: selection.value,
      customInput: customInputValues.value[itemKey] || ''
    }
    // 强制触发响应式更新
    selections.value = { ...selections.value }
    
    // 更新到store
    if (assessmentStore.currentRecord) {
      assessmentStore.updateSelections(selections.value as any)
    }
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 下一步
const nextStep = () => {
  if (currentStep.value < QMG_ITEMS.length - 1) {
    const itemKey = QMG_ITEMS[currentStep.value].key
    const item = QMG_ITEMS[currentStep.value]
    const selection = selections.value[itemKey]
    
    // 如果当前项需要输入且已选择区间，保存输入值
    if (item.hasInput && selection && typeof selection === 'object' && 'range' in selection) {
      const numValue = inputValues.value[itemKey] ? parseFloat(inputValues.value[itemKey]) : undefined
      selections.value[itemKey] = {
        range: selection.range,
        value: numValue
      }
      if (assessmentStore.currentRecord) {
        assessmentStore.updateSelections(selections.value as any)
      }
    }
    
    // 跳转到下一步
    currentStep.value++
  }
}

// 加载记录数据
const loadRecordData = () => {
  // 如果已有记录，加载选择项
  if (assessmentStore.currentRecord && assessmentStore.currentRecord.selections) {
    // 深拷贝确保响应式更新
    const loadedSelections = JSON.parse(JSON.stringify(assessmentStore.currentRecord.selections))
    selections.value = loadedSelections
    
    // 加载输入框的值
    QMG_ITEMS.forEach(item => {
      const selection = loadedSelections[item.key]
      
      // 加载需要输入数值的项目（格式：{ range: '选项值', value: 输入的数值 }）
      if (item.hasInput && selection && typeof selection === 'object' && 'range' in selection) {
        if (selection.value !== undefined) {
          inputValues.value[item.key] = String(selection.value)
        }
      }
      
      // 加载自定义输入的值（格式：{ value: '选项值', customInput: '自定义文本' }）
      if (selection && typeof selection === 'object' && 'customInput' in selection && selection.customInput) {
        customInputValues.value[item.key] = selection.customInput
      }
    })
  }
}

onMounted(() => {
  loadRecordData()
  // 总是从第一题开始显示
  currentStep.value = 0
  
  // 如果没有记录，返回患者列表
  if (!assessmentStore.currentRecord) {
    uni.redirectTo({
      url: '/pages/doctor/patient-list'
    })
  }
})

// 页面显示时重置到第一题（确保从其他页面返回时从第一题开始）
onShow(() => {
  // 如果已有记录，确保从第一题开始
  if (assessmentStore.currentRecord) {
    currentStep.value = 0
    // 重新加载数据（以防数据有更新）
    loadRecordData()
  }
})

// 提交测评
const submitAssessment = () => {
  // 在提交前，确保所有输入的数据都被保存到 selections 中
  QMG_ITEMS.forEach(item => {
    const itemKey = item.key
    const selection = selections.value[itemKey]
    
    // 处理需要输入数值的项目
    if (item.hasInput && selection && typeof selection === 'object' && 'range' in selection) {
      const numValue = inputValues.value[itemKey] ? parseFloat(inputValues.value[itemKey]) : undefined
      selections.value[itemKey] = {
        range: selection.range,
        value: numValue
      }
    }
    
    // 处理允许自定义输入的选项
    if (selection && typeof selection === 'object' && 'value' in selection && 'customInput' in selection) {
      const customInput = customInputValues.value[itemKey] || ''
      selections.value[itemKey] = {
        value: selection.value,
        customInput: customInput
      }
    }
  })
  
  // 强制触发响应式更新
  selections.value = { ...selections.value }
  
  // 再次验证，确保所有项目都已选择
  const allSelected = validateAllItemsSelected(selections.value)
  
  if (!allSelected) {
    // 找出未选择的项目
    const unselectedItems = QMG_ITEMS.filter(item => selections.value[item.key] === undefined)
    uni.showToast({
      title: `请完成所有项目，还有${unselectedItems.length}项未选择`,
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 保存选择到store（包含所有输入的数据）
  if (assessmentStore.currentRecord) {
    assessmentStore.updateSelections(selections.value)
  }

  // 跳转到结果页
  uni.navigateTo({
    url: '/pages/doctor/result'
  })
}
</script>

<style scoped>
.assessment-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fb 0%, #f5f7fa 100%);
  padding-bottom: 160rpx;
}

/* 患者信息卡片 - 增强设计 */
.patient-card {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #667eea 100%);
  padding: 50rpx 40rpx;
  margin: 0 30rpx 30rpx;
  border-radius: 24rpx;
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(30, 60, 114, 0.25);
  position: relative;
  overflow: hidden;
}

.patient-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
  position: relative;
  z-index: 1;
}

.patient-name {
  font-size: 40rpx;
  font-weight: 700;
  letter-spacing: 0.5rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.patient-gender {
  font-size: 26rpx;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10rpx);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  font-weight: 500;
}

.patient-info-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  position: relative;
  z-index: 1;
}

.patient-admission,
.patient-phone {
  font-size: 28rpx;
  opacity: 0.95;
  font-weight: 400;
  letter-spacing: 0.3rpx;
}

/* 进度条 - 美化设计 */
.progress-container {
  padding: 0 30rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.progress-bar {
  flex: 1;
  height: 12rpx;
  background: #e8ecf0;
  border-radius: 10rpx;
  overflow: hidden;
  box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.06);
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  background-size: 200% 100%;
  border-radius: 10rpx;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 26rpx;
  color: #667eea;
  min-width: 90rpx;
  text-align: right;
  font-weight: 600;
  letter-spacing: 0.5rpx;
}

/* 卡片容器 - 增强层次感 */
.card-container {
  padding: 0 30rpx;
  margin-bottom: 30rpx;
}

.assessment-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 50rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08), 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  min-height: 450rpx;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.assessment-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.item-title {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 50rpx;
  padding-bottom: 30rpx;
  border-bottom: 2rpx solid #f0f4f8;
  position: relative;
}

.item-title::after {
  content: '';
  position: absolute;
  bottom: -2rpx;
  left: 0;
  width: 60rpx;
  height: 2rpx;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2rpx;
}

.item-number {
  width: 64rpx;
  height: 64rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  position: relative;
}

.item-number::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16rpx;
  padding: 2rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

.item-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #1a202c;
  letter-spacing: 0.5rpx;
  line-height: 1.4;
}

/* 选项容器 - 优化间距 */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.option-btn {
  width: 100%;
  padding: 36rpx 32rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 2rpx solid #e8ecf0;
  border-radius: 16rpx;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.option-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.option-btn:active::before {
  width: 300%;
  height: 300%;
}

.option-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #ffffff;
  transform: translateY(-2rpx) scale(1.01);
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.35), 0 4rpx 12rpx rgba(118, 75, 162, 0.2);
}

.option-btn.active::before {
  background: rgba(255, 255, 255, 0.1);
}

.option-label {
  font-size: 30rpx;
  color: #2d3748;
  font-weight: 500;
  letter-spacing: 0.3rpx;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.option-btn.active .option-label {
  color: #ffffff;
  font-weight: 600;
}

/* 输入框容器 */
.input-container {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #f0f4f8;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


.value-input {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 2rpx solid #e8ecf0;
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 32rpx;
  color: #1a202c;
  font-weight: 500;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.value-input:focus {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.15);
  outline: none;
}

.value-input::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

/* 自定义输入框 */
.custom-input {
  width: 100%;
  min-height: 120rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 2rpx solid #e8ecf0;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  font-size: 28rpx;
  color: #1a202c;
  font-weight: 400;
  box-sizing: border-box;
  transition: all 0.3s ease;
  line-height: 1.6;
  resize: none;
}

.custom-input:focus {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.15);
  outline: none;
}

.custom-input::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.next-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.4);
}

.next-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
}

/* 导航按钮 - 现代化设计 */
.footer-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 20rpx;
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
}

.nav-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  min-width: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.4s, height 0.4s;
}

.nav-btn:active::before {
  width: 200%;
  height: 200%;
}

.prev-btn {
  background: linear-gradient(180deg, #f7f8fa 0%, #edeff2 100%);
  color: #4a5568;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.prev-btn:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.4);
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
}

.submit-btn[disabled] {
  background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e0 100%);
  color: #a0aec0;
  box-shadow: none;
  transform: none;
}

.submit-btn[disabled]:active {
  transform: none;
}
</style>

