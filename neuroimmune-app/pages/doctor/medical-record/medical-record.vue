<template>
	<view class="container">
		<!-- 患者选择 -->
		<view class="patient-select card" @click="showPatientPicker">
			<view class="select-left">
				<text class="app-icon uniui-contact-filled"></text>
				<text class="select-label">选择患者</text>
			</view>
			<view class="select-right">
				<text class="select-value" :class="{ placeholder: !selectedPatient }">{{ selectedPatient ? selectedPatient.name : '请选择患者' }}</text>
				<text class="app-icon uniui-arrowright"></text>
			</view>
		</view>

		<!-- 日期范围筛选 -->
		<view class="date-filter card">
			<view class="date-row">
				<view class="date-item" @click="showStartDatePicker = true">
					<text class="date-label">开始日期</text>
					<view class="date-value-wrap">
						<text class="date-value">{{ startDate || '请选择' }}</text>
						<text class="app-icon sm uniui-arrowdown"></text>
					</view>
				</view>
				<text class="date-sep">至</text>
				<view class="date-item" @click="showEndDatePicker = true">
					<text class="date-label">结束日期</text>
					<view class="date-value-wrap">
						<text class="date-value">{{ endDate || '请选择' }}</text>
						<text class="app-icon sm uniui-arrowdown"></text>
					</view>
				</view>
			</view>
			<view class="quick-dates">
				<text class="quick-tag" :class="{ active: quickRange === 'week' }" @click="setQuickRange('week')">近一周</text>
				<text class="quick-tag" :class="{ active: quickRange === 'month' }" @click="setQuickRange('month')">近一月</text>
				<text class="quick-tag" :class="{ active: quickRange === 'three' }" @click="setQuickRange('three')">近三月</text>
				<text class="quick-tag" :class="{ active: quickRange === 'all' }" @click="setQuickRange('all')">全部</text>
			</view>
		</view>

		<!-- 病历列表 -->
		<view class="record-list" v-if="selectedPatient && recordList.length">
			<view class="record-item card" v-for="(item, index) in recordList" :key="index" @click="viewRecord(item)">
				<view class="record-header">
					<view class="record-type">
						<text class="app-icon uniui-folder-add-filled"></text>
						<text class="type-text">{{ item.recordType }}</text>
					</view>
					<text class="record-date">{{ item.recordDate }}</text>
				</view>
				<view class="record-content">
					<text class="record-title">{{ item.title }}</text>
					<text class="record-desc">{{ item.description }}</text>
				</view>
				<view class="record-footer">
					<view class="record-files" v-if="item.fileCount">
						<text class="app-icon sm uniui-image"></text>
						<text>{{ item.fileCount }}个附件</text>
					</view>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
			</view>
		</view>

		<!-- 未选择患者提示 -->
		<view class="empty-state" v-if="!selectedPatient">
			<text class="app-icon uniui-contact"></text>
			<text class="empty-text">请先选择患者</text>
			<text class="empty-hint">选择患者后可查看病历列表</text>
		</view>

		<!-- 无数据提示 -->
		<view class="empty-state" v-else-if="!recordList.length">
			<text class="app-icon uniui-folder-add"></text>
			<text class="empty-text">暂无病历记录</text>
		</view>

		<!-- 患者选择弹窗 -->
		<view class="picker-mask" v-if="showPicker" @click="showPicker = false">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-title">选择患者</text>
					<view class="search-bar">
						<text class="app-icon sm uniui-search"></text>
						<input class="search-input" placeholder="搜索患者姓名" v-model="searchKeyword" />
					</view>
				</view>
				<scroll-view class="picker-list" scroll-y>
					<view class="picker-item" v-for="(p, i) in filteredPatients" :key="i" @click="selectPatient(p)">
						<image class="picker-avatar" :src="p.avatar || '/static/component.png'" mode="aspectFill"></image>
						<view class="picker-info">
							<text class="picker-name">{{ p.name }}</text>
							<text class="picker-meta">{{ p.gender }} · {{ p.age }}岁 · {{ p.diseaseType || '未知' }}</text>
						</view>
						<view class="picker-check" v-if="selectedPatient && selectedPatient.id === p.id">
							<text class="app-icon uniui-checkmarkempty"></text>
						</view>
					</view>
				</scroll-view>
				<view class="picker-footer">
					<text class="picker-cancel" @click="showPicker = false">取消</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getPatientList } from '@/api/patient.js'
import { getMedicalRecordList } from '@/api/medicalRecord.js'

export default {
	data() {
		return {
			showPicker: false,
			searchKeyword: '',
			patientList: [],
			selectedPatient: null,
			startDate: '',
			endDate: '',
			quickRange: 'all',
			recordList: []
		}
	},
	computed: {
		filteredPatients() {
			const k = this.searchKeyword.trim().toLowerCase()
			if (!k) return this.patientList
			return this.patientList.filter(p => (p.name || '').toLowerCase().includes(k))
		}
	},
	onLoad() {
		this.loadPatients()
		this.initDates()
	},
	methods: {
		async loadPatients() {
			try {
				const res = await getPatientList({ pageNum: 1, pageSize: 200 })
				if (res && res.list) {
					this.patientList = res.list.map(p => ({
						id: p.id,
						name: p.name,
						gender: p.gender || '男',
						age: p.age || 45,
						diseaseType: p.diseaseType || ''
					}))
				}
			} catch (e) {
				// 模拟数据
				this.patientList = [
					{ id: 1, name: '张三', gender: '男', age: 45, diseaseType: 'MS' },
					{ id: 2, name: '李四', gender: '女', age: 38, diseaseType: 'NMOSD' },
					{ id: 3, name: '王五', gender: '男', age: 52, diseaseType: 'MG' },
					{ id: 4, name: '赵六', gender: '女', age: 35, diseaseType: 'MOGAD' }
				]
			}
		},
		initDates() {
			const today = new Date()
			this.endDate = this.formatDate(today)
			const threeMonthAgo = new Date(today.setMonth(today.getMonth() - 3))
			this.startDate = this.formatDate(threeMonthAgo)
		},
		formatDate(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		setQuickRange(range) {
			this.quickRange = range
			const today = new Date()
			this.endDate = this.formatDate(today)

			if (range === 'all') {
				this.startDate = ''
				this.endDate = ''
			} else if (range === 'week') {
				const d = new Date()
				d.setDate(d.getDate() - 7)
				this.startDate = this.formatDate(d)
			} else if (range === 'month') {
				const d = new Date()
				d.setMonth(d.getMonth() - 1)
				this.startDate = this.formatDate(d)
			} else if (range === 'three') {
				const d = new Date()
				d.setMonth(d.getMonth() - 3)
				this.startDate = this.formatDate(d)
			}

			if (this.selectedPatient) {
				this.loadRecords()
			}
		},
		showPatientPicker() {
			this.showPicker = true
		},
		selectPatient(patient) {
			this.selectedPatient = patient
			this.showPicker = false
			this.loadRecords()
		},
		async loadRecords() {
			if (!this.selectedPatient) return

			try {
				const params = {
					patientId: this.selectedPatient.id,
					startDate: this.startDate,
					endDate: this.endDate
				}
				const res = await getMedicalRecordList(params)
				if (res && res.list) {
					this.recordList = res.list
				}
			} catch (e) {
				// 模拟数据
				this.recordList = [
					{
						id: 1,
						recordType: '门诊病历',
						title: '神经内科门诊',
						description: '主诉：双下肢无力3月余。诊断：多发性硬化',
						recordDate: '2024-03-15',
						fileCount: 3
					},
					{
						id: 2,
						recordType: '检查报告',
						title: '头颅MRI',
						description: '脑白质多发脱髓鞘病灶，符合MS影像学表现',
						recordDate: '2024-03-10',
						fileCount: 5
					},
					{
						id: 3,
						recordType: '化验报告',
						title: '脑脊液检查',
						description: '脑脊液寡克隆带阳性，IgG指数升高',
						recordDate: '2024-03-08',
						fileCount: 2
					},
					{
						id: 4,
						recordType: '住院病历',
						title: '神经免疫科住院',
						description: '入院诊断：多发性硬化，予激素冲击治疗',
						recordDate: '2024-02-20',
						fileCount: 8
					}
				]
			}
		},
		viewRecord(item) {
			uni.navigateTo({
				url: `/pages/doctor/record-detail/record-detail?id=${item.id}`
			})
		}
	}
}
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding: 24rpx;
	padding-bottom: 40rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

/* 患者选择 */
.patient-select {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.select-left {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.select-left .app-icon {
	font-size: 36rpx;
	color: #6366F1;
}

.select-label {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
}

.select-right {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.select-value {
	font-size: 28rpx;
	color: $app-text;
}

.select-value.placeholder {
	color: $app-text-muted;
}

.select-right .app-icon {
	font-size: 24rpx;
	color: $app-text-muted;
}

/* 日期筛选 */
.date-filter {
	margin-bottom: 24rpx;
}

.date-row {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.date-item {
	flex: 1;
}

.date-label {
	font-size: 24rpx;
	color: $app-text-muted;
	display: block;
	margin-bottom: 8rpx;
}

.date-value-wrap {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx 20rpx;
	background: $app-bg;
	border-radius: 12rpx;
}

.date-value {
	font-size: 28rpx;
	color: $app-text;
}

.date-sep {
	font-size: 28rpx;
	color: $app-text-muted;
	margin: 0 16rpx;
	padding-top: 32rpx;
}

.quick-dates {
	display: flex;
	gap: 16rpx;
}

.quick-tag {
	font-size: 24rpx;
	color: $app-text-secondary;
	padding: 10rpx 20rpx;
	background: $app-bg;
	border-radius: 20rpx;
}

.quick-tag.active {
	background: rgba(99, 102, 241, 0.1);
	color: #6366F1;
}

/* 病历列表 */
.record-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.record-item {
	padding: 24rpx;
}

.record-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.record-type {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.record-type .app-icon {
	font-size: 28rpx;
	color: #6366F1;
}

.type-text {
	font-size: 24rpx;
	color: #6366F1;
	background: rgba(99, 102, 241, 0.1);
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
}

.record-date {
	font-size: 24rpx;
	color: $app-text-muted;
}

.record-content {
	margin-bottom: 16rpx;
}

.record-title {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
	margin-bottom: 8rpx;
}

.record-desc {
	font-size: 26rpx;
	color: $app-text-secondary;
	display: block;
	line-height: 1.5;
}

.record-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 16rpx;
	border-top: 1rpx solid $app-border;
}

.record-files {
	display: flex;
	align-items: center;
	gap: 6rpx;
	font-size: 24rpx;
	color: $app-text-muted;
}

.record-files .app-icon {
	color: $app-text-muted !important;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 100rpx 0;
}

.empty-state .app-icon {
	font-size: 100rpx !important;
	color: #D1D5DB !important;
	margin-bottom: 24rpx;
}

.empty-text {
	font-size: 30rpx;
	color: $app-text-muted;
	margin-bottom: 8rpx;
}

.empty-hint {
	font-size: 26rpx;
	color: #D1D5DB;
}

/* 患者选择弹窗 */
.picker-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
}

.picker-content {
	width: 100%;
	background: #fff;
	border-radius: 24rpx 24rpx 0 0;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
}

.picker-header {
	padding: 32rpx;
	border-bottom: 1rpx solid $app-border;
}

.picker-title {
	font-size: 32rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
	margin-bottom: 20rpx;
}

.search-bar {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 16rpx 20rpx;
	background: $app-bg;
	border-radius: 12rpx;
}

.search-bar .app-icon {
	color: $app-text-muted;
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: $app-text;
}

.picker-list {
	flex: 1;
	max-height: 60vh;
}

.picker-item {
	display: flex;
	align-items: center;
	padding: 24rpx 32rpx;
	border-bottom: 1rpx solid $app-border;
}

.picker-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	margin-right: 20rpx;
}

.picker-info {
	flex: 1;
}

.picker-name {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
}

.picker-meta {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
}

.picker-check {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #6366F1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.picker-check .app-icon {
	font-size: 24rpx;
	color: #fff;
}

.picker-footer {
	padding: 24rpx 32rpx;
	border-top: 1rpx solid $app-border;
}

.picker-cancel {
	text-align: center;
	font-size: 30rpx;
	color: $app-text-secondary;
}
</style>