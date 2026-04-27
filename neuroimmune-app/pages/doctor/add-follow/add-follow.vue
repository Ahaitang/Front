<template>
	<view class="container">
		<view class="card">
			<!-- 患者选择 -->
			<view class="form-item">
				<text class="label">患者</text>
				<view class="picker-wrap" @click="selectPatient">
					<text class="picker-text" :class="{ placeholder: !form.patientName }">
						{{ form.patientName || '请选择患者' }}
					</text>
					<text class="app-icon uniui-arrowright"></text>
				</view>
			</view>

			<!-- 随访检查类型 -->
			<view class="form-item">
				<text class="label">随访检查类型</text>
				<picker mode="selector" :range="examTypeOptions" range-key="name" @change="onExamTypeChange">
					<view class="picker-wrap">
						<text class="picker-text" :class="{ placeholder: !selectedExamTypeName }">
							{{ selectedExamTypeName || '请选择随访检查类型' }}
						</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<!-- 检查项目多选 -->
			<view class="form-item" v-if="examItemOptions.length > 0">
				<text class="label">检查项目</text>
				<view class="checkbox-group">
					<view
						class="checkbox-item"
						:class="{ checked: selectedExamItems.includes(item) }"
						@click="toggleExamItem(item)"
						v-for="(item, idx) in examItemOptions"
						:key="idx"
					>
						<text class="checkbox-icon">
							<text class="app-icon" :class="selectedExamItems.includes(item) ? 'uniui-checkbox-filled' : 'uniui-checkbox'"></text>
						</text>
						<text class="checkbox-label">{{ item }}</text>
					</view>
				</view>
			</view>

			<!-- 详细信息区域 -->
			<view class="section-title">详细信息</view>

			<!-- 门诊随访周期 -->
			<view class="form-item">
				<text class="label">门诊随访周期</text>
				<view class="cycle-row">
					<picker mode="selector" :range="cycleTypeOptions" range-key="label" @change="onCycleTypeChange" class="cycle-picker">
						<view class="picker-wrap small">
							<text class="picker-text">{{ cycleTypeOptions[form.cycleTypeIndex]?.label || '请选择' }}</text>
							<text class="app-icon uniui-arrowright"></text>
						</view>
					</picker>
					<picker mode="selector" :range="cycleValueOptions" @change="onCycleValueChange" class="cycle-picker">
						<view class="picker-wrap small">
							<text class="picker-text" :class="{ placeholder: !form.cycleValue }">
								{{ form.cycleValue || '请选择' }}
							</text>
							<text class="app-icon uniui-arrowright"></text>
						</view>
					</picker>
					<picker mode="selector" :range="timeSlotOptions" range-key="label" @change="onTimeSlotChange" class="cycle-picker">
						<view class="picker-wrap small">
							<text class="picker-text">{{ timeSlotOptions[form.timeSlotIndex]?.label || '请选择' }}</text>
							<text class="app-icon uniui-arrowright"></text>
						</view>
					</picker>
				</view>
			</view>

			<!-- 住院时间 -->
			<view class="form-item">
				<text class="label">住院时间</text>
				<uni-datetime-picker type="date" v-model="form.hospitalizationTime" :placeholder="'请选择住院时间'" />
			</view>

			<!-- 备注 -->
			<view class="form-item">
				<text class="label">备注</text>
				<textarea class="textarea" placeholder="选填" v-model="form.notes" />
			</view>

			<button class="btn primary" @click="submit" :loading="loading">保存</button>
		</view>
	</view>
</template>

<script>
import { createFollowUp } from '@/api/followup.js'
import { getDoctorPatientDetails } from '@/api/relation.js'
import { getDictByType } from '@/api/dict.js'

export default {
	data() {
		return {
			form: {
				patientId: '',
				patientName: '',
				followUpExamTypeId: null,
				examinationItems: '',
				cycleTypeIndex: 0,
				cycleValue: '',
				timeSlotIndex: 0,
				hospitalizationTime: '',
				notes: ''
			},
			patients: [],
			examTypeOptions: [],        // 随访检查类型列表（字典）
			examItemOptions: [],        // 检查项目选项（从 description 解析）
			selectedExamItems: [],      // 已选检查项目
			loading: false,
			// 周期类型选项
			cycleTypeOptions: [
				{ label: '每月', value: 'monthly' },
				{ label: '每周', value: 'weekly' },
				{ label: '每季度', value: 'quarterly' }
			],
			// 时间段选项
			timeSlotOptions: [
				{ label: '上午', value: 'morning' },
				{ label: '下午', value: 'afternoon' },
				{ label: '晚上', value: 'evening' }
			]
		};
	},
	computed: {
		selectedExamTypeName() {
			const selected = this.examTypeOptions.find(t => t.id === this.form.followUpExamTypeId);
			return selected ? selected.name : '';
		},
		// 根据周期类型生成周期值选项
		cycleValueOptions() {
			const type = this.cycleTypeOptions[this.form.cycleTypeIndex]?.value;
			if (type === 'monthly') {
				// 每月1-28号（考虑到部分月份天数）
				return Array.from({ length: 28 }, (_, i) => `${i + 1}号`);
			} else if (type === 'weekly') {
				// 每周周一到周日
				return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
			} else if (type === 'quarterly') {
				// 每季度固定日期
				return ['1月1日', '4月1日', '7月1日', '10月1日'];
			}
			return [];
		}
	},
	onLoad(op) {
		if (op.patientId) {
			this.form.patientId = op.patientId;
			this.form.patientName = op.patientName || '已选患者';
		}
		this.loadPatients();
		this.loadExamTypes();
	},
	methods: {
		// 加载患者列表
		async loadPatients() {
			const userInfo = uni.getStorageSync('userInfo') || {};
			if (!userInfo.id) return;
			try {
				const patients = await getDoctorPatientDetails(userInfo.id);
				if (patients && patients.length) {
					this.patients = patients;
				}
			} catch (e) {
				console.error('获取患者列表失败:', e);
			}
		},
		// 加载随访检查类型字典
		async loadExamTypes() {
			try {
				const types = await getDictByType('followUpExamType');
				if (types && types.length) {
					// 只保留启用的字典项
					this.examTypeOptions = types.filter(t => t.isActive === 1);
				}
			} catch (e) {
				console.error('获取随访检查类型失败:', e);
			}
		},
		// 选择患者
		selectPatient() {
			if (this.patients.length === 0) {
				uni.showToast({ title: '暂无可选患者', icon: 'none' });
				return;
			}
			const items = this.patients.map(p => p.patientName);
			uni.showActionSheet({
				itemList: items,
				success: (res) => {
					const patient = this.patients[res.tapIndex];
					this.form.patientId = patient.patientId;
					this.form.patientName = patient.patientName;
				}
			});
		},
		// 选择随访检查类型
		onExamTypeChange(e) {
			const idx = e.detail.value;
			const selected = this.examTypeOptions[idx];
			if (selected) {
				this.form.followUpExamTypeId = selected.id;
				// 解析 description 中的检查项目（逗号分隔）
				if (selected.description) {
					this.examItemOptions = selected.description.split(',').map(s => s.trim()).filter(s => s);
				} else {
					this.examItemOptions = [];
				}
				// 清空已选项
				this.selectedExamItems = [];
				this.form.examinationItems = '';
			}
		},
		// 切换检查项目选中状态
		toggleExamItem(item) {
			const idx = this.selectedExamItems.indexOf(item);
			if (idx > -1) {
				this.selectedExamItems.splice(idx, 1);
			} else {
				this.selectedExamItems.push(item);
			}
			// 更新表单字段（逗号分隔）
			this.form.examinationItems = this.selectedExamItems.join(',');
		},
		// 选择周期类型
		onCycleTypeChange(e) {
			this.form.cycleTypeIndex = e.detail.value;
			// 切换类型时清空周期值
			this.form.cycleValue = '';
		},
		// 选择周期值
		onCycleValueChange(e) {
			this.form.cycleValue = this.cycleValueOptions[e.detail.value];
		},
		// 选择时间段
		onTimeSlotChange(e) {
			this.form.timeSlotIndex = e.detail.value;
		},
		// 提交表单
		async submit() {
			if (!this.form.patientId) {
				uni.showToast({ title: '请选择患者', icon: 'none' });
				return;
			}
			if (!this.form.followUpExamTypeId) {
				uni.showToast({ title: '请选择随访检查类型', icon: 'none' });
				return;
			}

			this.loading = true;
			const userInfo = uni.getStorageSync('userInfo') || {};

			try {
				await createFollowUp({
					patientId: this.form.patientId,
					patientName: this.form.patientName,
					doctorId: userInfo.id,
					doctorName: userInfo.name,
					followUpExamTypeId: this.form.followUpExamTypeId,
					examinationItems: this.form.examinationItems || null,
					outpatientCycleType: this.cycleTypeOptions[this.form.cycleTypeIndex]?.value || null,
					outpatientCycleValue: this.form.cycleValue || null,
					outpatientTimeSlot: this.timeSlotOptions[this.form.timeSlotIndex]?.value || null,
					hospitalizationTime: (this.form.hospitalizationTime && this.form.hospitalizationTime.length === 10
						? this.form.hospitalizationTime + ' 00:00:00'
						: this.form.hospitalizationTime) || null,
					notes: this.form.notes || null,
					status: 0
				});
				uni.showToast({ title: '已保存', icon: 'success' });
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
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
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
	font-size: 30rpx;
	height: 80rpx;
	background: $app-bg;
	border-radius: 12rpx;
	padding: 0 24rpx;
	width: calc(100% - 48rpx);
}

.textarea {
	font-size: 28rpx;
	min-height: 160rpx;
	background: $app-bg;
	border-radius: 12rpx;
	padding: 20rpx 24rpx;
	width: calc(100% - 48rpx);
}

.picker-wrap {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 80rpx;
	background: $app-bg;
	border-radius: 12rpx;
	padding: 0 24rpx;
}

.picker-wrap.small {
	height: 70rpx;
	padding: 0 16rpx;
}

.picker-text {
	font-size: 30rpx;
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

.btn {
	margin-top: 40rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 12rpx;
	font-size: 32rpx;
}

.btn.primary {
	background: $app-primary;
	color: #fff;
}

/* 检查项目多选样式 */
.checkbox-group {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	background: $app-bg;
	border-radius: 12rpx;
	padding: 20rpx;
}

.checkbox-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 20rpx;
	background: $app-card-bg;
	border-radius: 8rpx;
	border: 1rpx solid $app-border;
}

.checkbox-item.checked {
	background: rgba($app-primary, 0.1);
	border-color: $app-primary;
}

.checkbox-icon {
	font-size: 28rpx;
}

.checkbox-icon .app-icon {
	font-size: 32rpx;
	color: $app-text-muted;
}

.checkbox-item.checked .checkbox-icon .app-icon {
	color: $app-primary;
}

.checkbox-label {
	font-size: 26rpx;
	color: $app-text;
}

/* 周期组合输入样式 */
.cycle-row {
	display: flex;
	gap: 12rpx;
}

.cycle-picker {
	flex: 1;
}
</style>