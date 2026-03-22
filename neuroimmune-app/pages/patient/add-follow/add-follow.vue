<template>
	<view class="container">
		<view class="card">
			<!-- 随访类型 -->
			<view class="form-item">
				<text class="label">随访类型</text>
				<view class="type-options">
					<view class="type-option" :class="{ active: form.type === '门诊随访' }" @click="form.type = '门诊随访'">门诊随访</view>
					<view class="type-option" :class="{ active: form.type === '住院随访' }" @click="form.type = '住院随访'">住院随访</view>
					<view class="type-option" :class="{ active: form.type === '自定义' }" @click="form.type = '自定义'">自定义</view>
				</view>
			</view>

			<!-- 随访日期 -->
			<view class="form-item">
				<text class="label">随访日期</text>
				<picker mode="date" :value="form.date" @change="onDateChange">
					<view class="picker-wrap">
						<text class="picker-text" :class="{ placeholder: !form.date }">{{ form.date || '请选择日期' }}</text>
						<text class="app-icon uniui-calendar"></text>
					</view>
				</picker>
			</view>

			<!-- 随访项目 -->
			<view class="form-item">
				<text class="label">随访项目</text>
				<input class="input" type="text" placeholder="请输入随访项目名称" v-model="form.project" />
			</view>

			<!-- 详细信息分隔 -->
			<view class="section-title">详细信息</view>

			<!-- 门诊随访时间 -->
			<view class="form-item">
				<text class="label">门诊随访时间</text>
				<picker mode="multiSelector" :range="dateTimeRange" @change="onOutpatientTimeChange" @columnchange="onColumnChange">
					<view class="picker-wrap">
						<text class="picker-text" :class="{ placeholder: !form.outpatientTime }">
							{{ form.outpatientTime || '请选择门诊时间' }}
						</text>
						<text class="app-icon uniui-calendar"></text>
					</view>
				</picker>
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

			<!-- 检查检验项目 -->
			<view class="form-item">
				<text class="label">检查检验项目</text>
				<view class="template-selector">
					<view class="template-btn" :class="{ active: selectedTemplate === 'immunosuppressant' }" @click="selectTemplate('immunosuppressant')">
						免疫抑制剂
					</view>
					<view class="template-btn" :class="{ active: selectedTemplate === 'biologic' }" @click="selectTemplate('biologic')">
						生物制剂
					</view>
					<view class="template-btn" :class="{ active: selectedTemplate === 'custom' }" @click="selectTemplate('custom')">
						自定义
					</view>
				</view>
				<view class="exam-items" v-if="selectedTemplate !== 'custom'">
					<view class="exam-item" v-for="(item, index) in currentExamItems" :key="index"
						:class="{ selected: selectedExamItems.includes(item) }" @click="toggleExamItem(item)">
						<text class="app-icon" :class="selectedExamItems.includes(item) ? 'uniui-checkbox-filled' : 'uniui-circle'"></text>
						<text class="exam-item-text">{{ item }}</text>
					</view>
				</view>
				<textarea class="textarea" placeholder="已选项目或自定义输入" v-model="form.examinationItems" />
			</view>

			<!-- 医院 -->
			<view class="form-item">
				<text class="label">医院</text>
				<input class="input" type="text" placeholder="请输入医院名称" v-model="form.hospital" />
			</view>

			<!-- 科室 -->
			<view class="form-item">
				<text class="label">科室</text>
				<input class="input" type="text" placeholder="请输入科室名称" v-model="form.department" />
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

export default {
	data() {
		return {
			form: {
				type: '门诊随访',
				date: '',
				project: '',
				outpatientTime: '',
				hospitalizationTime: '',
				examinationItems: '',
				hospital: '',
				department: '',
				notes: ''
			},
			selectedTemplate: 'immunosuppressant',
			selectedExamItems: [],
			loading: false,
			dateTimeRange: [[], [], []],
			// 检查项目模板
			examTemplates: {
				'immunosuppressant': {
					name: '免疫抑制剂随访',
					items: ['血常规', '肝肾功能', '电解质']
				},
				'biologic': {
					name: '生物制剂随访',
					items: ['淋巴细胞亚群', 'TSPOT（结核感染T细胞检测）']
				},
				'custom': {
					name: '自定义',
					items: []
				}
			}
		};
	},
	computed: {
		currentExamItems() {
			return this.examTemplates[this.selectedTemplate]?.items || [];
		}
	},
	onLoad() {
		this.initDateTimeRange();
		// 默认今天的日期
		const today = new Date();
		this.form.date = this.formatDate(today);
		// 默认选中第一个模板的所有项目
		this.selectTemplate('immunosuppressant');
	},
	methods: {
		formatDate(date) {
			const y = date.getFullYear();
			const m = String(date.getMonth() + 1).padStart(2, '0');
			const d = String(date.getDate()).padStart(2, '0');
			return `${y}-${m}-${d}`;
		},
		initDateTimeRange() {
			// 初始化日期时间选择器范围
			const hours = [];
			for (let i = 8; i <= 18; i++) {
				hours.push(i + '时');
			}
			const minutes = [];
			for (let i = 0; i < 60; i += 15) {
				minutes.push(i.toString().padStart(2, '0') + '分');
			}
			this.dateTimeRange = [['上午', '下午'], hours, minutes];
		},
		onDateChange(e) {
			this.form.date = e.detail.value;
		},
		onOutpatientTimeChange(e) {
			const val = e.detail.value;
			const period = this.dateTimeRange[0][val[0]];
			let hour = parseInt(this.dateTimeRange[1][val[1]]);
			if (period === '下午' && hour < 12) hour += 12;
			const minute = this.dateTimeRange[2][val[2]].replace('分', '');
			this.form.outpatientTime = `${this.form.date} ${hour}:${minute}`;
		},
		onColumnChange(e) {
			// 列变化处理
		},
		onHospitalizationChange(e) {
			this.form.hospitalizationTime = e.detail.value;
		},
		selectTemplate(template) {
			this.selectedTemplate = template;
			if (template !== 'custom') {
				// 默认选中所有模板项目
				this.selectedExamItems = [...this.examTemplates[template].items];
				this.updateExamItems();
			} else {
				this.selectedExamItems = [];
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
		async submit() {
			// 表单验证
			if (!this.form.project.trim()) {
				uni.showToast({ title: '请输入随访项目', icon: 'none' });
				return;
			}

			this.loading = true;
			const userInfo = uni.getStorageSync('userInfo') || {};

			try {
				await createFollowUp({
					patientId: userInfo.id,
					patientName: userInfo.name || userInfo.realName,
					type: this.form.type,
					date: this.form.date,
					project: this.form.project,
					status: 'pending',
					outpatientTime: this.form.outpatientTime || null,
					hospitalizationTime: this.form.hospitalizationTime || null,
					examinationItems: this.form.examinationItems,
					hospital: this.form.hospital,
					department: this.form.department,
					notes: this.form.notes
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

.type-options {
	display: flex;
	gap: 16rpx;
}

.type-option {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: $app-text-secondary;
	transition: all 0.2s;
}

.type-option.active {
	border-color: $app-primary;
	background: $app-primary-bg;
	color: $app-primary;
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

.template-selector {
	display: flex;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.template-btn {
	flex: 1;
	text-align: center;
	padding: 16rpx 0;
	border: 2rpx solid $app-border;
	border-radius: 8rpx;
	font-size: 26rpx;
	color: $app-text-secondary;
}

.template-btn.active {
	border-color: $app-primary;
	background: $app-primary-bg;
	color: $app-primary;
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