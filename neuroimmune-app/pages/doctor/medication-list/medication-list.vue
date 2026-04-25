<template>
	<view class="container">
		<!-- 患者筛选 -->
		<view class="filter-bar card">
			<view class="filter-row" @click="showPatientPicker = true">
				<text class="app-icon uniui-contact-filled"></text>
				<text class="filter-label">患者筛选</text>
				<view class="filter-value">
					<text class="filter-text" :class="{ placeholder: !selectedPatient }">{{ selectedPatient ? selectedPatient.name : '全部患者' }}</text>
					<text class="app-icon uniui-arrowright"></text>
				</view>
			</view>
		</view>

		<!-- 统计信息 -->
		<view class="stats-card card">
			<view class="stats-item">
				<text class="stats-num">{{ medicationList.length }}</text>
				<text class="stats-label">条用药建议</text>
			view>
			<view class="stats-divider"></view>
			<view class="stats-item">
				<text class="stats-num">{{ patientCount }}</text>
				<text class="stats-label">位患者</text>
			</view>
		</view>

		<!-- 用药列表 -->
		<scroll-view class="med-scroll" scroll-y @scrolltolower="loadMore" lower-threshold="100">
			<view class="med-list" v-if="medicationList.length">
				<view class="med-item card" v-for="(item, index) in medicationList" :key="index" @click="goPatientDetail(item)">
					<view class="med-header">
						<view class="avatar-wrap">
							<text class="avatar-text">{{ item.patientName ? item.patientName.charAt(0) : '?' }}</text>
						</view>
						<view class="patient-info">
							<view class="patient-row">
								<text class="patient-name">{{ item.patientName }}</text>
								<text class="patient-meta">{{ item.gender }} · {{ item.age }}岁</text>
							</view>
							<text class="patient-disease" v-if="item.diseaseType">{{ item.diseaseType }}</text>
						</view>
						<text class="app-icon uniui-arrowright"></text>
					</view>
					<view class="med-content">
						<view class="med-row">
							<view class="med-icon-wrap">
								<text class="app-icon uniui-compose"></text>
							</view>
							<view class="med-detail">
								<text class="med-name">{{ item.medicationName }}</text>
								<text class="med-dosage">剂量：{{ item.dosage }}{{ item.unit }}</text>
							</view>
						</view>
						<view class="med-freq">
							<text class="app-icon uniui-time"></text>
							<text>{{ item.frequency }}</text>
						</view>
						<view class="med-duration" v-if="item.startDate">
							<text class="app-icon uniui-calendar"></text>
							<text>{{ item.startDate }} ~ {{ item.endDate || '长期' }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 加载状态 -->
			<view class="load-status" v-if="medicationList.length">
				<text class="loading-text" v-if="loading">加载中...</text>
				<text class="no-more-text" v-else-if="noMore">没有更多了</text>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-if="!medicationList.length && !loading">
				<text class="app-icon uniui-info-filled"></text>
				<text class="empty-text">暂无用药建议</text>
			</view>
		</scroll-view>

		<!-- 添加按钮 -->
		<view class="add-btn" @click="navTo('/pages/doctor/add-medication/add-medication')">
			<text class="app-icon uniui-plus-filled"></text>
		</view>

		<!-- 患者选择弹窗 -->
		<view class="picker-mask" v-if="showPatientPicker" @click="showPatientPicker = false">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-title">选择患者</text>
					<view class="search-row">
						<text class="app-icon uniui-search"></text>
						<input class="picker-search" placeholder="搜索患者姓名" v-model="patientSearchKeyword" />
					</view>
				</view>
				<scroll-view class="picker-list" scroll-y>
					<view class="picker-item all-item" @click="clearPatientFilter">
						<view class="all-icon-wrap">
							<text class="app-icon uniui-list"></text>
						</view>
						<view class="picker-info">
							<text class="picker-name">全部患者</text>
							<text class="picker-meta">查看所有用药建议</text>
						</view>
						<view class="picker-check" v-if="!selectedPatient">
							<text class="app-icon uniui-checkmarkempty"></text>
						</view>
					</view>
					<view class="picker-item" v-for="(p, i) in filteredPatients" :key="i" @click="selectPatient(p)">
						<view class="avatar-wrap">
							<text class="avatar-text">{{ p.name.charAt(0) }}</text>
						</view>
						<view class="picker-info">
							<text class="picker-name">{{ p.name }}</text>
							<text class="picker-meta">{{ p.gender }} · {{ p.age }}岁 · {{ p.diseaseType || '' }}</text>
						</view>
						<view class="picker-check" v-if="selectedPatient && selectedPatient.id === p.id">
							<text class="app-icon uniui-checkmarkempty"></text>
						</view>
					</view>
				</scroll-view>
				<view class="picker-footer">
					<text class="picker-cancel" @click="showPatientPicker = false">取消</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getDoctorPatientDetails } from '@/api/relation.js'
import { getMedicationList } from '@/api/medication.js'

export default {
	data() {
		return {
			showPatientPicker: false,
			patientSearchKeyword: '',
			patientList: [],
			selectedPatient: null,
			medicationList: [],
			patientCount: 0,
			pageNum: 1,
			pageSize: 20,
			loading: false,
			noMore: false
		}
	},
	computed: {
		filteredPatients() {
			const k = this.patientSearchKeyword.trim().toLowerCase()
			if (!k) return this.patientList
			return this.patientList.filter(p => (p.name || '').toLowerCase().includes(k))
		}
	},
	onLoad() {
		this.loadPatients()
		this.loadMedications()
	},
	methods: {
		async loadPatients() {
			const userInfo = uni.getStorageSync('userInfo') || {}
			try {
				const patients = await getDoctorPatientDetails(userInfo.id)
				if (patients && patients.length) {
					this.patientList = patients.map(p => ({
						id: p.patientId,
						name: p.patientName,
						gender: p.gender === 'male' ? '男' : (p.gender === 'female' ? '女' : p.gender),
						age: p.age,
						diseaseType: p.diseaseType || ''
					}))
				}
			} catch (e) {
				console.error('加载患者列表失败:', e)
			}
		},
		async loadMedications() {
			if (this.loading) return

			this.loading = true
			try {
				const params = {
					pageNum: this.pageNum,
					pageSize: this.pageSize
				}
				if (this.selectedPatient) {
					params.patientId = this.selectedPatient.id
				}

				const res = await getMedicationList(params)
				if (res && res.list) {
					const newList = res.list.map(m => ({
						id: m.id,
						patientId: m.patientId,
						patientName: m.patientName || '未知',
						gender: m.gender || '男',
						age: m.age || 45,
						diseaseType: m.diseaseType || '',
						medicationName: m.medicationName,
						dosage: m.dosage,
						unit: m.unit || 'mg',
						frequency: m.frequency || '每日1次',
						startDate: m.startDate,
						endDate: m.endDate
					}))

					if (this.pageNum === 1) {
						this.medicationList = newList
					} else {
						this.medicationList = [...this.medicationList, ...newList]
					}

					this.noMore = newList.length < this.pageSize

					// 统计患者数
					const patientIds = new Set(this.medicationList.map(m => m.patientId))
					this.patientCount = patientIds.size
				} else {
					if (this.pageNum === 1) {
						this.medicationList = []
						this.patientCount = 0
					}
					this.noMore = true
				}
			} catch (e) {
				console.error('加载用药列表失败:', e)
				if (this.pageNum === 1) {
					this.medicationList = []
					this.patientCount = 0
				}
				this.noMore = true
			} finally {
				this.loading = false
			}
		},
		loadMore() {
			if (this.noMore || this.loading) return
			this.pageNum++
			this.loadMedications()
		},
		selectPatient(patient) {
			this.selectedPatient = patient
			this.showPatientPicker = false
			this.pageNum = 1
			this.noMore = false
			this.loadMedications()
		},
		clearPatientFilter() {
			this.selectedPatient = null
			this.showPatientPicker = false
			this.pageNum = 1
			this.noMore = false
			this.loadMedications()
		},
		goPatientDetail(item) {
			uni.navigateTo({ url: '/pages/doctor/patient-info/patient-info?id=' + item.patientId })
		},
		navTo(url) {
			uni.navigateTo({ url })
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
	padding-bottom: 140rpx;
	display: flex;
	flex-direction: column;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

/* 篮选栏 */
.filter-bar {
	margin-bottom: 24rpx;
}

.filter-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.filter-row .app-icon {
	font-size: 32rpx;
	color: $app-primary;
}

.filter-label {
	font-size: 28rpx;
	color: $app-text;
}

.filter-value {
	flex: 1;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 8rpx;
}

.filter-text {
	font-size: 28rpx;
	color: $app-text;
}

.filter-text.placeholder {
	color: $app-text-muted;
}

.filter-value .app-icon {
	font-size: 24rpx;
	color: $app-text-muted;
}

/* 统计卡片 */
.stats-card {
	display: flex;
	align-items: center;
	justify-content: space-around;
	margin-bottom: 24rpx;
}

.stats-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stats-num {
	font-size: 48rpx;
	font-weight: bold;
	color: $app-primary;
}

.stats-label {
	font-size: 26rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
}

.stats-divider {
	width: 1rpx;
	height: 60rpx;
	background: $app-border;
}

/* 用药列表滚动区 */
.med-scroll {
	flex: 1;
	min-height: 500rpx;
}

.med-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.med-item {
	padding: 0;
	overflow: hidden;
}

.med-header {
	display: flex;
	align-items: center;
	padding: 24rpx 28rpx;
	border-bottom: 1rpx solid $app-border;
}

.avatar-wrap {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.avatar-text {
	font-size: 28rpx;
	font-weight: bold;
	color: #fff;
}

.patient-info {
	flex: 1;
}

.patient-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.patient-name {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
}

.patient-meta {
	font-size: 24rpx;
	color: $app-text-muted;
}

.patient-disease {
	font-size: 22rpx;
	color: $app-primary;
	background: $app-primary-bg;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	margin-top: 8rpx;
	display: inline-block;
}

.med-header .app-icon {
	font-size: 24rpx;
	color: $app-text-muted;
}

.med-content {
	padding: 20rpx 28rpx;
}

.med-row {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;
}

.med-icon-wrap {
	width: 48rpx;
	height: 48rpx;
	border-radius: 12rpx;
	background: $app-primary-bg;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
}

.med-icon-wrap .app-icon {
	font-size: 24rpx;
	color: $app-primary;
}

.med-detail {
	flex: 1;
}

.med-name {
	font-size: 28rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
}

.med-dosage {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
}

.med-freq, .med-duration {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 24rpx;
	color: $app-text-secondary;
	margin-top: 8rpx;
}

.med-freq .app-icon, .med-duration .app-icon {
	font-size: 24rpx !important;
	color: $app-text-muted !important;
}

/* 加载状态 */
.load-status {
	padding: 32rpx;
	text-align: center;
}

.loading-text {
	font-size: 26rpx;
	color: $app-text-muted;
}

.no-more-text {
	font-size: 26rpx;
	color: $app-text-muted;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;
}

.empty-state .app-icon {
	font-size: 80rpx !important;
	color: #D1D5DB !important;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: $app-text-muted;
}

/* 添加按钮 */
.add-btn {
	position: fixed;
	right: 40rpx;
	bottom: 140rpx;
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.4);
}

.add-btn .app-icon {
	font-size: 48rpx !important;
	color: #fff !important;
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

.search-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 16rpx 20rpx;
	background: $app-bg;
	border-radius: 12rpx;
}

.search-row .app-icon {
	color: $app-text-muted;
}

.picker-search {
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

.all-item {
	background: $app-bg;
}

.all-icon-wrap {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: $app-primary;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
}

.all-icon-wrap .app-icon {
	font-size: 28rpx;
	color: #fff;
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
	background: $app-primary;
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