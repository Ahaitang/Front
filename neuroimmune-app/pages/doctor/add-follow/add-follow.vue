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
						<text class="picker-text" :class="{ placeholder: !form.followUpExamTypeName }">
							{{ form.followUpExamTypeName || '请选择类型' }}
						</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<!-- 检查项目（根据类型动态显示） -->
			<view class="form-item" v-if="examItemsList.length > 0">
				<text class="label">检查检验项目</text>
				<view class="checkbox-group">
					<view
						class="checkbox-item"
						:class="{ checked: selectedExamItems.includes(item) }"
						@click="toggleExamItem(item)"
						v-for="(item, idx) in examItemsList"
						:key="idx"
					>
						<text class="checkbox-icon">
							<text class="app-icon" :class="selectedExamItems.includes(item) ? 'uniui-checkbox-filled' : 'uniui-checkbox'"></text>
						</text>
						<text class="checkbox-label">{{ item }}</text>
					</view>
				</view>
				<textarea class="textarea" placeholder="已选项目或自定义输入" v-model="form.examinationItems" />
			</view>

			<!-- 详细信息区域 -->
			<view class="section-title">门诊随访周期</view>

			<!-- 周期类型 -->
			<view class="form-item">
				<text class="label">周期类型</text>
				<picker mode="selector" :range="cycleTypeOptions" range-key="label" @change="onCycleTypeChange">
					<view class="picker-wrap">
						<text class="picker-text">{{ cycleTypeOptions[form.cycleTypeIndex]?.label || '请选择' }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<!-- 周期值 - 根据类型显示不同选择器 -->
			<view class="form-item">
				<text class="label">周期值</text>
				<!-- 每月：选择几号 -->
				<picker mode="selector" :range="monthDayOptions" @change="onCycleValueChange" v-if="currentCycleType === 'monthly'">
					<view class="picker-wrap">
						<text class="picker-text" :class="{ placeholder: !form.cycleValue }">
							{{ form.cycleValue || '请选择几号' }}
						</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
				<!-- 每周：选择周几 -->
				<picker mode="selector" :range="weekDayOptions" @change="onCycleValueChange" v-else-if="currentCycleType === 'weekly'">
					<view class="picker-wrap">
						<text class="picker-text" :class="{ placeholder: !form.cycleValue }">
							{{ form.cycleValue || '请选择周几' }}
						</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
				<!-- 每季度：选择具体日期 -->
				<uni-datetime-picker
					type="date"
					v-model="form.cycleDate"
					:placeholder="'请选择日期'"
					@change="onQuarterlyDateChange"
					v-else-if="currentCycleType === 'quarterly'"
				/>
				<view class="picker-wrap" v-else>
					<text class="picker-text placeholder">请先选择周期类型</text>
				</view>
			</view>

			<!-- 时间段 -->
			<view class="form-item">
				<text class="label">时间段</text>
				<picker mode="selector" :range="timeSlotOptions" range-key="label" @change="onTimeSlotChange">
					<view class="picker-wrap">
						<text class="picker-text">{{ timeSlotOptions[form.timeSlotIndex]?.label || '请选择' }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<!-- 住院时间 -->
			<view class="section-title">住院时间</view>
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
				// 随访检查类型
				followUpExamTypeId: null,
				followUpExamTypeName: '',
				// 检查项目（中文顿号分隔）
				examinationItems: '',
				cycleTypeIndex: 0,
				cycleValue: '',
				cycleDate: '',      // 季度周期用日期
				timeSlotIndex: 0,
				hospitalizationTime: '',
				notes: ''
			},
			patients: [],
			// 随访检查类型选项（从 followUpExamType 字典获取）
			examTypeOptions: [],
			// 检查项目列表（根据选中类型的 description 解析）
			examItemsList: [],
			selectedExamItems: [],
			loading: false,
			// 周期类型选项
			cycleTypeOptions: [
				{ label: '每月', value: 'monthly' },
				{ label: '每周', value: 'weekly' },
				{ label: '每季度', value: 'quarterly' }
			],
			// 每月几号选项 (1-28号)
			monthDayOptions: Array.from({ length: 28 }, (_, i) => `${i + 1}号`),
			// 每周周几选项
			weekDayOptions: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
			// 时间段选项
			timeSlotOptions: [
				{ label: '上午', value: 'morning' },
				{ label: '下午', value: 'afternoon' },
				{ label: '晚间', value: 'evening' }
			]
		};
	},
	computed: {
		currentCycleType() {
			return this.cycleTypeOptions[this.form.cycleTypeIndex]?.value || '';
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
				const items = await getDictByType('followUpExamType');
				if (items && items.length) {
					// 只保留启用的字典项
					this.examTypeOptions = items.filter(t => t.isActive === 1);
					// 默认选中第一个类型
					if (this.examTypeOptions.length > 0) {
						this.selectExamType(this.examTypeOptions[0].id);
					}
				}
			} catch (e) {
				console.error('获取随访检查类型失败:', e);
			}
		},
		// 选择随访检查类型
		selectExamType(typeId) {
			this.form.followUpExamTypeId = typeId;
			const type = this.examTypeOptions.find(t => t.id === typeId);
			if (type) {
				this.form.followUpExamTypeName = type.name;
				// 解析 description 中的 JSON 数组
				try {
					this.examItemsList = JSON.parse(type.description || '[]');
					// 默认选中所有项目
					this.selectedExamItems = [...this.examItemsList];
					this.updateExamItemsText();
				} catch (e) {
					this.examItemsList = [];
					this.selectedExamItems = [];
				}
			}
		},
		// 随访检查类型下拉变化
		onExamTypeChange(e) {
			const index = e.detail.value;
			if (index >= 0 && index < this.examTypeOptions.length) {
				this.selectExamType(this.examTypeOptions[index].id);
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
		// 切换检查项目选中状态
		toggleExamItem(item) {
			const idx = this.selectedExamItems.indexOf(item);
			if (idx > -1) {
				this.selectedExamItems.splice(idx, 1);
			} else {
				this.selectedExamItems.push(item);
			}
			this.updateExamItemsText();
		},
		// 更新检查项目文本（中文顿号分隔）
		updateExamItemsText() {
			this.form.examinationItems = this.selectedExamItems.join('、');
		},
		// 选择周期类型
		onCycleTypeChange(e) {
			this.form.cycleTypeIndex = e.detail.value;
			// 切换类型时清空周期值
			this.form.cycleValue = '';
			this.form.cycleDate = '';
		},
		// 选择周期值（每月/每周用）
		onCycleValueChange(e) {
			const type = this.currentCycleType;
			if (type === 'monthly') {
				this.form.cycleValue = this.monthDayOptions[e.detail.value];
			} else if (type === 'weekly') {
				this.form.cycleValue = this.weekDayOptions[e.detail.value];
			}
		},
		// 季度日期选择
		onQuarterlyDateChange(e) {
			// e 是数组格式 [年, 月, 日] 或字符串
			let dateStr = '';
			if (Array.isArray(e)) {
				dateStr = `${e[1]}月${e[2]}日`;
			} else if (typeof e === 'string') {
				// 解析 YYYY-MM-DD 格式
				const parts = e.split('-');
				if (parts.length === 3) {
					dateStr = `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
				}
			}
			this.form.cycleValue = dateStr;
			this.form.cycleDate = typeof e === 'string' ? e : (Array.isArray(e) ? `${e[0]}-${String(e[1]).padStart(2,'0')}-${String(e[2]).padStart(2,'0')}` : '');
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

			this.loading = true;
			const userInfo = uni.getStorageSync('userInfo') || {};

			try {
				await createFollowUp({
					patientId: this.form.patientId,
					patientName: this.form.patientName,
					doctorId: userInfo.id,
					doctorName: userInfo.name,
					// 随访检查类型（新增）
					followUpExamTypeId: this.form.followUpExamTypeId || null,
					followUpExamTypeName: this.form.followUpExamTypeName || null,
					// 检查项目
					examinationItems: this.form.examinationItems || null,
					outpatientCycleType: this.currentCycleType || null,
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

.empty-tip {
	padding: 20rpx;
	text-align: center;
	color: $app-text-muted;
	font-size: 26rpx;
}
</style>