<template>
	<view class="container">
		<view class="card">
			<!-- 随访检查类型 -->
			<view class="form-item">
				<text class="label">随访检查类型</text>
				<picker mode="selector" :range="examTypeOptions" range-key="name" @change="onExamTypeChange">
					<view class="picker-wrap">
						<text class="picker-text" :class="{ placeholder: !form.followUpExamTypeName }">
							{{ form.followUpExamTypeName || '请选择随访检查类型' }}
						</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<!-- 检查项目 -->
			<view class="form-item">
				<text class="label">检查项目</text>
				<view class="exam-items" v-if="examItemsList.length > 0">
					<view class="exam-item" v-for="(item, index) in examItemsList" :key="index"
						:class="{ selected: selectedExamItems.includes(item) }" @click="toggleExamItem(item)">
						<text class="app-icon" :class="selectedExamItems.includes(item) ? 'uniui-checkbox-filled' : 'uniui-circle'"></text>
						<text class="exam-item-text">{{ item }}</text>
					</view>
				</view>
				<textarea class="textarea" placeholder="请输入检查项目（多个项目用顿号分隔）" v-model="form.examinationItems" />
			</view>

			<!-- 详细信息分隔 -->
			<view class="section-title">详细信息</view>

			<!-- 门诊周期 -->
			<view class="form-item">
				<text class="label">门诊周期</text>
				<view class="cycle-row">
					<picker mode="selector" :range="cycleTypeOptions" range-key="label" @change="onCycleTypeChange" class="cycle-picker">
						<view class="picker-wrap small">
							<text class="picker-text">{{ getCycleTypeLabel(form.outpatientCycleType) }}</text>
							<text class="app-icon uniui-arrowright"></text>
						</view>
					</picker>
					<input class="input cycle-value" type="number" placeholder="周期值" v-model="form.outpatientCycleValue" />
				</view>
			</view>

			<!-- 门诊时间段 -->
			<view class="form-item">
				<text class="label">门诊时间段</text>
				<view class="time-slot-options">
					<view class="time-slot-option"
						v-for="slot in timeSlotOptions" :key="slot.value"
						:class="{ active: form.outpatientTimeSlot === slot.value }"
						@click="form.outpatientTimeSlot = slot.value">
						{{ slot.label }}
					</view>
				</view>
			</view>

			<!-- 住院时间 -->
			<view class="form-item">
				<text class="label">住院时间</text>
				<picker mode="date" :value="form.hospitalizationTime" @change="onHospitalizationChange">
					<view class="picker-wrap">
						<text class="picker-text" :class="{ placeholder: !form.hospitalizationTime }">
							{{ form.hospitalizationTime || '请选择住院时间' }}
						</text>
						<text class="app-icon uniui-calendar"></text>
					</view>
				</picker>
			</view>

			<!-- 备注 -->
			<view class="form-item">
				<text class="label">备注</text>
				<textarea class="textarea" placeholder="选填" v-model="form.notes" />
			</view>

			<button class="btn primary" @click="submit" :loading="loading">保存随访计划</button>
		</view>
	</view>
</template>

<script>
import { createFollowUp } from '@/api/followup.js'
import { getDictByType } from '@/api/dict.js'

export default {
	data() {
		return {
			form: {
				patientId: null,
				patientName: '',
				followUpExamTypeId: null,
				followUpExamTypeName: '',
				examinationItems: '',
				outpatientCycleType: 'monthly',
				outpatientCycleValue: '',
				outpatientTimeSlot: 'morning',
				hospitalizationTime: '',
				notes: ''
			},
			examTypeOptions: [],
			examItemsList: [],
			selectedExamItems: [],
			loading: false,
			cycleTypeOptions: [
				{ value: 'monthly', label: '每月' },
				{ value: 'weekly', label: '每周' },
				{ value: 'quarterly', label: '每季度' }
			],
			timeSlotOptions: [
				{ value: 'morning', label: '上午' },
				{ value: 'afternoon', label: '下午' },
				{ value: 'evening', label: '晚上' }
			]
		};
	},
	onLoad() {
		this.loadExamTypes();
	},
	methods: {
		async loadExamTypes() {
			try {
				const items = await getDictByType('followUpExamType');
				if (items && items.length) {
					this.examTypeOptions = items.filter(t => t.isActive === 1);
				}
			} catch (e) {
				console.error('加载随访检查类型失败:', e);
			}
		},
		onExamTypeChange(e) {
			const index = e.detail.value;
			const selected = this.examTypeOptions[index];
			if (selected) {
				this.form.followUpExamTypeId = selected.id;
				this.form.followUpExamTypeName = selected.name;
				// 解析 description 中的 JSON 数组
				try {
					this.examItemsList = JSON.parse(selected.description || '[]');
					this.selectedExamItems = [...this.examItemsList];
					this.updateExamItems();
				} catch (parseErr) {
					this.examItemsList = [];
					this.selectedExamItems = [];
				}
			}
		},
		toggleExamItem(item) {
			const index = this.selectedExamItems.indexOf(item);
			if (index > -1) {
				this.selectedExamItems.splice(index, 1);
			} else {
				this.selectedExamItems.push(item);
			}
			this.updateExamItems();
		},
		updateExamItems() {
			this.form.examinationItems = this.selectedExamItems.join('、');
		},
		onCycleTypeChange(e) {
			const index = e.detail.value;
			this.form.outpatientCycleType = this.cycleTypeOptions[index].value;
		},
		getCycleTypeLabel(value) {
			const found = this.cycleTypeOptions.find(opt => opt.value === value);
			return found ? found.label : '每月';
		},
		onHospitalizationChange(e) {
			this.form.hospitalizationTime = e.detail.value;
		},
		async submit() {
			// 表单验证
			if (!this.form.followUpExamTypeId) {
				uni.showToast({ title: '请选择随访检查类型', icon: 'none' });
				return;
			}

			this.loading = true;
			const userInfo = uni.getStorageSync('userInfo') || {};

			// 格式化住院时间
			let hospitalizationTime = null;
			if (this.form.hospitalizationTime) {
				hospitalizationTime = this.form.hospitalizationTime.length === 10
					? this.form.hospitalizationTime + ' 00:00:00'
					: this.form.hospitalizationTime;
			}

			try {
				await createFollowUp({
					patientId: userInfo.id,
					patientName: userInfo.name || userInfo.realName,
					followUpExamTypeId: this.form.followUpExamTypeId,
					followUpExamTypeName: this.form.followUpExamTypeName,
					examinationItems: this.form.examinationItems,
					outpatientCycleType: this.form.outpatientCycleType,
					outpatientCycleValue: this.form.outpatientCycleValue ? parseInt(this.form.outpatientCycleValue) : null,
					outpatientTimeSlot: this.form.outpatientTimeSlot,
					hospitalizationTime: hospitalizationTime,
					notes: this.form.notes,
					status: 0
				});
				uni.showToast({ title: '保存成功', icon: 'success' });
				setTimeout(() => uni.navigateBack(), 800);
			} catch (e) {
				console.error('保存失败:', e);
				uni.showToast({ title: '保存失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding: 24rpx;
	padding-bottom: 60rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

.form-item {
	margin-bottom: 28rpx;
}

.label {
	font-size: 28rpx;
	color: $app-text;
	display: block;
	margin-bottom: 12rpx;
	font-weight: 500;
}

.input {
	font-size: 28rpx;
	height: 80rpx;
	background: $app-bg;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	padding: 0 24rpx;
	width: calc(100% - 52rpx);
	color: $app-text;
	box-sizing: border-box;
}

.textarea {
	font-size: 28rpx;
	min-height: 120rpx;
	background: $app-bg;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	padding: 20rpx 24rpx;
	width: calc(100% - 52rpx);
	color: $app-text;
	box-sizing: border-box;
	margin-top: 16rpx;
}

.picker-wrap {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 80rpx;
	background: $app-bg;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	padding: 0 24rpx;
}

.picker-wrap.small {
	height: 72rpx;
	padding: 0 20rpx;
}

.picker-text {
	font-size: 28rpx;
	color: $app-text;
}

.picker-text.placeholder {
	color: $app-text-muted;
}

.picker-wrap .app-icon {
	font-size: 32rpx;
	color: $app-text-muted;
}

.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: $app-text;
	margin: 32rpx 0 20rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid $app-border;
}

.exam-items {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.exam-item {
	display: flex;
	align-items: center;
	padding: 12rpx 20rpx;
	background: $app-bg;
	border: 2rpx solid $app-border;
	border-radius: 8rpx;
	font-size: 26rpx;
	color: $app-text-secondary;
}

.exam-item.selected {
	border-color: $app-primary;
	background: $app-primary-bg;
	color: $app-primary;
}

.exam-item .app-icon {
	font-size: 32rpx;
	margin-right: 8rpx;
}

.exam-item.selected .app-icon {
	color: $app-primary;
}

.cycle-row {
	display: flex;
	gap: 16rpx;
	align-items: center;
}

.cycle-picker {
	flex: 1;
}

.cycle-value {
	flex: 1;
	font-size: 28rpx;
	height: 72rpx;
	background: $app-bg;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	padding: 0 24rpx;
	color: $app-text;
	box-sizing: border-box;
}

.time-slot-options {
	display: flex;
	gap: 16rpx;
}

.time-slot-option {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: $app-text-secondary;
	transition: all 0.2s;
}

.time-slot-option.active {
	border-color: $app-primary;
	background: $app-primary-bg;
	color: $app-primary;
}

.btn {
	margin-top: 40rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 12rpx;
	font-size: 32rpx;
	border: none;
}

.btn.primary {
	background: $app-primary;
	color: #fff;
}
</style>