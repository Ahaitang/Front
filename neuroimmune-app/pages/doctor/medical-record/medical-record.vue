<template>
	<view class="container">
		<!-- 搜索栏 -->
		<view class="search-bar card">
			<text class="app-icon uniui-search"></text>
			<input class="search-input" placeholder="搜索病历标题/诊断" v-model="searchKeyword" @confirm="doSearch" />
			<text class="search-btn" @click="doSearch">搜索</text>
			<view class="add-btn" @click="navTo('/pages/doctor/upload-record/upload-record')">
				<text class="app-icon uniui-plus-filled"></text>
			</view>
		</view>

		<!-- 患者筛选 -->
		<view class="patient-filter card">
			<view class="filter-row" @click="showPatientPicker = true">
				<text class="filter-label">患者筛选</text>
				<view class="filter-value">
					<text class="filter-text" :class="{ placeholder: !selectedPatient }">{{ selectedPatient ? selectedPatient.name : '全部患者' }}</text>
					<text class="app-icon uniui-arrowright"></text>
				</view>
			</view>
		</view>

		<!-- 病历列表 -->
		<scroll-view class="record-scroll" scroll-y @scrolltolower="loadMore" lower-threshold="100">
			<view class="record-list" v-if="recordList.length">
				<view class="record-item card" v-for="(item, index) in recordList" :key="index" @click="viewRecord(item)">
					<view class="record-header">
						<view class="patient-tag">
							<text class="app-icon uniui-contact-filled"></text>
							<text class="patient-name">{{ item.patientName }}</text>
						</view>
						<text class="record-date">{{ item.dateText }}</text>
					</view>
					<view class="record-body">
						<view class="record-type-row">
							<text class="type-tag">{{ item.type || '门诊病历' }}</text>
							<view class="episode-link" v-if="item.relatedEpisodeId" @click.stop="viewEpisode(item)">
								<text class="app-icon uniui-pulse"></text>
								<text class="link-text">关联发作</text>
							</view>
						</view>
						<text class="record-title">{{ item.diagnosis || item.title || '病历记录' }}</text>
						<text class="record-desc" v-if="item.content">{{ item.content }}</text>
					</view>
					<view class="record-footer">
						<view class="record-meta">
							<text class="meta-item" v-if="item.hospital">{{ item.hospital }}</text>
							<text class="meta-item" v-if="item.department">{{ item.department }}</text>
						</view>
						<view class="record-files" v-if="item.attachments">
							<text class="app-icon uniui-image"></text>
							<text>{{ item.fileCount || 1 }}个附件</text>
						</view>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</view>
			</view>

			<!-- 加载状态 -->
			<view class="load-status" v-if="recordList.length">
				<text class="loading-text" v-if="loading">加载中...</text>
				<text class="no-more-text" v-else-if="noMore">没有更多了</text>
			</view>

			<!-- 无数据提示 -->
			<view class="empty-state" v-if="!recordList.length && !loading">
				<text class="app-icon uniui-folder-add"></text>
				<text class="empty-text">暂无病历记录</text>
			</view>
		</scroll-view>

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
							<text class="picker-meta">查看所有病历记录</text>
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
import { getMedicalRecordList } from '@/api/medicalRecord.js'

export default {
	data() {
		return {
			showPatientPicker: false,
			searchKeyword: '',
			patientSearchKeyword: '',
			patientList: [],
			selectedPatient: null,
			recordList: [],
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
		this.loadRecords()
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
		async loadRecords() {
			if (this.loading) return

			this.loading = true
			try {
				const params = {
					pageNum: this.pageNum,
					pageSize: this.pageSize,
					keyword: this.searchKeyword.trim()
				}
				if (this.selectedPatient) {
					params.patientId = this.selectedPatient.id
				}

				const res = await getMedicalRecordList(params)
				if (res && res.list) {
					const newList = res.list.map(item => ({
						id: item.id,
						patientId: item.patientId,
						patientName: item.patientName || '未知患者',
						type: item.type || '门诊病历',
						dateText: this.formatDateText(item.date),
						diagnosis: item.diagnosis,
						title: item.title || item.diagnosis,
						content: item.content,
						hospital: item.hospital,
						department: item.department,
						attachments: item.attachments,
						fileCount: item.attachments ? item.attachments.split(',').length : 0,
						relatedEpisodeId: item.relatedEpisodeId
					}))

					if (this.pageNum === 1) {
						this.recordList = newList
					} else {
						this.recordList = [...this.recordList, ...newList]
					}

					this.noMore = newList.length < this.pageSize
				} else {
					if (this.pageNum === 1) {
						this.recordList = []
					}
					this.noMore = true
				}
			} catch (e) {
				console.error('加载病历记录失败:', e)
				if (this.pageNum === 1) {
					this.recordList = []
				}
				this.noMore = true
			} finally {
				this.loading = false
			}
		},
		formatDateText(dateStr) {
			if (!dateStr) return ''
			const date = new Date(dateStr)
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		doSearch() {
			this.pageNum = 1
			this.noMore = false
			this.loadRecords()
		},
		loadMore() {
			if (this.noMore || this.loading) return
			this.pageNum++
			this.loadRecords()
		},
		selectPatient(patient) {
			this.selectedPatient = patient
			this.showPatientPicker = false
			this.pageNum = 1
			this.noMore = false
			this.loadRecords()
		},
		clearPatientFilter() {
			this.selectedPatient = null
			this.showPatientPicker = false
			this.pageNum = 1
			this.noMore = false
			this.loadRecords()
		},
		viewRecord(item) {
			uni.navigateTo({
				url: `/pages/doctor/record-detail/record-detail?id=${item.id}`
			})
		},
		viewEpisode(item) {
			if (item.relatedEpisodeId) {
				uni.navigateTo({
					url: `/pages/doctor/episode-list/episode-list?id=${item.relatedEpisodeId}`
				})
			}
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
	display: flex;
	flex-direction: column;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

/* 搜索栏 */
.search-bar {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 24rpx;
}

.search-bar .app-icon {
	font-size: 32rpx;
	color: $app-text-muted;
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: $app-text;
}

.search-btn {
	font-size: 28rpx;
	color: $app-primary;
	padding: 0 16rpx;
}

.add-btn {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #6366F1;
	border-radius: 50%;
}

.add-btn .app-icon {
	font-size: 32rpx;
	color: #fff;
}

/* 患者筛选 */
.patient-filter {
	margin-bottom: 24rpx;
}

.filter-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.filter-label {
	font-size: 28rpx;
	color: $app-text;
}

.filter-value {
	display: flex;
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

/* 病历列表滚动区 */
.record-scroll {
	flex: 1;
	min-height: 500rpx;
}

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

.patient-tag {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.patient-tag .app-icon {
	font-size: 28rpx;
	color: $app-primary;
}

.patient-name {
	font-size: 28rpx;
	color: $app-primary;
	font-weight: 500;
}

.record-date {
	font-size: 24rpx;
	color: $app-text-muted;
}

.record-body {
	margin-bottom: 16rpx;
}

.record-type-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 12rpx;
}

.type-tag {
	font-size: 24rpx;
	color: $app-text-secondary;
	background: $app-bg;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
}

.episode-link {
	display: flex;
	align-items: center;
	gap: 6rpx;
}

.episode-link .app-icon {
	font-size: 24rpx;
	color: #EF4444;
}

.link-text {
	font-size: 24rpx;
	color: #EF4444;
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
	line-height: 1.6;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
}

.record-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 16rpx;
	border-top: 1rpx solid $app-border;
}

.record-meta {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.meta-item {
	font-size: 24rpx;
	color: $app-text-muted;
}

.record-files {
	display: flex;
	align-items: center;
	gap: 6rpx;
	font-size: 24rpx;
	color: $app-text-muted;
}

.record-files .app-icon {
	font-size: 24rpx !important;
	color: $app-text-muted !important;
}

.record-footer .app-icon {
	font-size: 24rpx;
	color: $app-text-muted;
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
	padding: 120rpx 0;
}

.empty-state .app-icon {
	font-size: 100rpx !important;
	color: #D1D5DB !important;
	margin-bottom: 24rpx;
}

.empty-text {
	font-size: 30rpx;
	color: $app-text-muted;
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

.avatar-wrap {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
}

.avatar-text {
	font-size: 24rpx;
	font-weight: bold;
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