<template>
	<view class="container">
		<!-- 统计概览 -->
		<view class="stats-card">
			<view class="stat-item">
				<text class="stat-num pending">{{ pendingList.length }}</text>
				<text class="stat-label">待随访</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-num completed">{{ completedList.length }}</text>
				<text class="stat-label">已完成</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-num">{{ totalCount }}</text>
				<text class="stat-label">总计</text>
			</view>
		</view>

		<!-- 搜索栏 -->
		<view class="search-bar">
			<text class="app-icon uniui-search"></text>
			<input class="search-input" type="text" placeholder="搜索患者姓名" v-model="keyword" @confirm="doSearch" />
			<text class="search-btn" @click="doSearch">搜索</text>
		</view>

		<!-- 篮选标签 -->
		<view class="filter-tags">
			<view class="tag" :class="{ active: filterStatus === 'all' }" @click="changeFilter('all')">全部</view>
			<view class="tag" :class="{ active: filterStatus === 'pending' }" @click="changeFilter('pending')">待随访</view>
			<view class="tag" :class="{ active: filterStatus === 'completed' }" @click="changeFilter('completed')">已完成</view>
		</view>

		<!-- 随访列表 -->
		<scroll-view class="follow-scroll" scroll-y @scrolltolower="loadMore" lower-threshold="100">
			<!-- 待随访列表 -->
			<template v-if="filterStatus === 'all' || filterStatus === 'pending'">
				<view class="section-title" v-if="filteredPendingList.length && filterStatus === 'all'">
					<view class="title-dot pending"></view>
					<text>待随访</text>
					<text class="count">{{ filteredPendingList.length }}</text>
				</view>
				<view class="follow-card pending" v-for="(item, i) in filteredPendingList" :key="'p'+i" @click="goPatient(item.patientId)">
					<view class="card-header">
						<view class="patient-info">
							<view class="avatar-wrap">
								<text class="avatar-text">{{ item.patientName.charAt(0) }}</text>
							</view>
							<view class="patient-meta">
								<text class="patient-name">{{ item.patientName }}</text>
								<text class="project-tag">{{ item.examTypeName || '随访' }}</text>
							</view>
						</view>
						<view class="status-badge pending">待随访</view>
					</view>
					<view class="card-body">
						<view class="info-row" v-if="item.outpatientCycle">
							<text class="app-icon uniui-calendar"></text>
							<text>门诊周期: {{ item.outpatientCycle }}</text>
						</view>
						<view class="info-row" v-if="item.hospitalizationTime">
							<text class="app-icon uniui-calendar"></text>
							<text>住院时间: {{ item.hospitalizationTime }}</text>
						</view>
						<view class="info-row" v-if="item.examinationItems">
							<text class="app-icon uniui-list"></text>
							<text>检查项目: {{ item.examinationItems }}</text>
						</view>
						<view class="info-row" v-if="item.notes">
							<text class="app-icon uniui-paperclip"></text>
							<text>备注: {{ item.notes }}</text>
						</view>
					</view>
					<view class="card-footer">
						<view class="action-btn primary" @click.stop="goPatient(item.patientId)">
							<text class="app-icon uniui-compose"></text>
							<text>去随访</text>
						</view>
						<view class="action-btn" @click.stop="callPatient(item.phone)">
							<text class="app-icon uniui-phone-filled"></text>
							<text>电话</text>
						</view>
					</view>
				</view>
			</template>

			<!-- 已完成列表 -->
			<template v-if="filterStatus === 'all' || filterStatus === 'completed'">
				<view class="section-title" v-if="filteredCompletedList.length && filterStatus === 'all'">
					<view class="title-dot completed"></view>
					<text>已完成</text>
					<text class="count">{{ filteredCompletedList.length }}</text>
				</view>
				<view class="follow-card completed" v-for="(item, i) in filteredCompletedList" :key="'c'+i" @click="goPatient(item.patientId)">
					<view class="card-header">
						<view class="patient-info">
							<view class="avatar-wrap completed">
								<text class="avatar-text">{{ item.patientName.charAt(0) }}</text>
							</view>
							<view class="patient-meta">
								<text class="patient-name">{{ item.patientName }}</text>
								<text class="project-tag completed">{{ item.examTypeName || '随访' }}</text>
							</view>
						</view>
						<view class="status-badge completed">已完成</view>
					</view>
					<view class="card-body">
						<view class="info-row" v-if="item.outpatientCycle">
							<text class="app-icon uniui-calendar"></text>
							<text>门诊周期: {{ item.outpatientCycle }}</text>
						</view>
						<view class="info-row" v-if="item.hospitalizationTime">
							<text class="app-icon uniui-calendar"></text>
							<text>住院时间: {{ item.hospitalizationTime }}</text>
						</view>
						<view class="info-row" v-if="item.examinationItems">
							<text class="app-icon uniui-list"></text>
							<text>检查项目: {{ item.examinationItems }}</text>
						</view>
					</view>
				</view>
			</template>

			<!-- 加载状态 -->
			<view class="load-status" v-if="displayList.length">
				<text class="loading-text" v-if="loading">加载中...</text>
				<text class="no-more-text" v-else-if="noMore">没有更多了</text>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-if="!filteredPendingList.length && !filteredCompletedList.length && !loading">
				<text class="app-icon empty-icon uniui-calendar"></text>
				<text class="empty-text">暂无随访记录</text>
			</view>
		</scroll-view>

		<!-- 添加按钮 -->
		<view class="add-btn" @click="navTo('/pages/doctor/add-follow/add-follow')">
			<text class="app-icon uniui-plus-filled"></text>
		</view>
	</view>
</template>

<script>
import { getFollowUpList } from '@/api/followup.js'

export default {
	data() {
		return {
			keyword: '',
			filterStatus: 'all',
			pendingList: [],
			completedList: [],
			pageNum: 1,
			pageSize: 20,
			loading: false,
			noMore: false
		}
	},
	computed: {
		filteredPendingList() {
			let list = this.pendingList
			if (this.keyword) {
				const k = this.keyword.toLowerCase()
				list = list.filter(item => item.patientName.toLowerCase().includes(k))
			}
			return list
		},
		filteredCompletedList() {
			let list = this.completedList
			if (this.keyword) {
				const k = this.keyword.toLowerCase()
				list = list.filter(item => item.patientName.toLowerCase().includes(k))
			}
			return list
		},
		totalCount() {
			return this.filteredPendingList.length + this.filteredCompletedList.length
		},
		displayList() {
			if (this.filterStatus === 'pending') return this.filteredPendingList
			if (this.filterStatus === 'completed') return this.filteredCompletedList
			return [...this.filteredPendingList, ...this.filteredCompletedList]
		}
	},
	onShow() {
		this.loadData()
	},
	methods: {
		async loadData() {
			if (this.loading) return

			this.loading = true
			try {
				const params = {
					pageNum: this.pageNum,
					pageSize: this.pageSize
				}

				const res = await getFollowUpList(params)
				if (res && res.list) {
					const newPending = res.list
						.filter(f => f.status === 0)
						.filter(f => f.isValid !== false) // 过滤无效记录
						.map(f => ({
							id: f.id,
							patientId: f.patientId,
							patientName: f.patientName || '患者',
							examTypeName: f.followUpExamTypeName || '',
							outpatientCycle: this.formatOutpatientCycle(f),
							hospitalizationTime: this.formatDate(f.hospitalizationTime),
							examinationItems: f.examinationItems || '',
							notes: f.notes || '',
							phone: f.patientPhone || ''
						}))

					const newCompleted = res.list
						.filter(f => f.status === 1)
						.filter(f => f.isValid !== false) // 过滤无效记录
						.map(f => ({
							id: f.id,
							patientId: f.patientId,
							patientName: f.patientName || '患者',
							examTypeName: f.followUpExamTypeName || '',
							outpatientCycle: this.formatOutpatientCycle(f),
							hospitalizationTime: this.formatDate(f.hospitalizationTime),
							examinationItems: f.examinationItems || ''
						}))

					if (this.pageNum === 1) {
						this.pendingList = newPending
						this.completedList = newCompleted
					} else {
						this.pendingList = [...this.pendingList, ...newPending]
						this.completedList = [...this.completedList, ...newCompleted]
					}

					this.noMore = res.list.length < this.pageSize
				} else {
					if (this.pageNum === 1) {
						this.pendingList = []
						this.completedList = []
					}
					this.noMore = true
				}
			} catch (e) {
				console.error('加载随访列表失败:', e)
				if (this.pageNum === 1) {
					this.pendingList = []
					this.completedList = []
				}
				this.noMore = true
			} finally {
				this.loading = false
			}
		},
		// 格式化日期
		formatDate(dateStr) {
			if (!dateStr) return ''
			const d = new Date(dateStr)
			const y = d.getFullYear()
			const m = String(d.getMonth() + 1).padStart(2, '0')
			const day = String(d.getDate()).padStart(2, '0')
			return `${y}-${m}-${day}`
		},
		// 格式化门诊随访周期
		formatOutpatientCycle(item) {
			if (!item) return ''
			const type = item.outpatientCycleType
			const value = item.outpatientCycleValue
			const slot = item.outpatientTimeSlot

			if (!type || !value) return ''

			// 周期类型中文映射
			const typeMap = {
				'monthly': '每月',
				'weekly': '每周',
				'quarterly': '每季度'
			}
			// 时间段中文映射
			const slotMap = {
				'morning': '上午',
				'afternoon': '下午',
				'evening': '晚上'
			}

			const typeText = typeMap[type] || type
			const slotText = slotMap[slot] || slot || ''

			// 组合显示: 每月5号 上午 / 每周周一 下午
			return `${typeText}${value}${slotText ? ' ' + slotText : ''}`
		},
		doSearch() {
			// 搜索时重置列表
			this.pageNum = 1
			this.noMore = false
			this.loadData()
		},
		loadMore() {
			if (this.noMore || this.loading) return
			this.pageNum++
			this.loadData()
		},
		changeFilter(status) {
			this.filterStatus = status
		},
		goPatient(id) {
			uni.navigateTo({ url: '/pages/doctor/patient-info/patient-info?id=' + (id || '') })
		},
		callPatient(phone) {
			if (phone) uni.makePhoneCall({ phoneNumber: phone })
			else uni.showToast({ title: '暂无电话', icon: 'none' })
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
	padding: 24rpx 24rpx 140rpx;
	display: flex;
	flex-direction: column;
}

/* 统计概览 */
.stats-card {
	display: flex;
	align-items: center;
	justify-content: space-around;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	border-radius: 20rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(99, 102, 241, 0.3);
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-num {
	font-size: 48rpx;
	font-weight: bold;
	color: #fff;
}

.stat-num.pending {
	color: #FCD34D;
}

.stat-num.completed {
	color: #86EFAC;
}

.stat-label {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.85);
	margin-top: 8rpx;
}

.stat-divider {
	width: 1rpx;
	height: 60rpx;
	background: rgba(255, 255, 255, 0.2);
}

/* 搜索栏 */
.search-bar {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 20rpx 24rpx;
	background: $app-card-bg;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	box-shadow: $app-shadow;
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
}

/* 篮选标签 */
.filter-tags {
	display: flex;
	gap: 16rpx;
	margin-bottom: 24rpx;
}

.filter-tags .tag {
	font-size: 26rpx;
	color: $app-text-secondary;
	padding: 12rpx 28rpx;
	background: $app-card-bg;
	border-radius: 20rpx;
	box-shadow: $app-shadow;
}

.filter-tags .tag.active {
	background: $app-primary;
	color: #fff;
}

/* 随访列表滚动区 */
.follow-scroll {
	flex: 1;
	min-height: 500rpx;
}

/* 列表区块标题 */
.section-title {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 20rpx;
	font-size: 28rpx;
	font-weight: bold;
	color: $app-text;
}

.title-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
}

.title-dot.pending {
	background: #F59E0B;
}

.title-dot.completed {
	background: #10B981;
}

.section-title .count {
	font-size: 24rpx;
	color: $app-text-muted;
	font-weight: normal;
}

/* 随访卡片 */
.follow-card {
	background: $app-card-bg;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
	box-shadow: $app-shadow;
}

.follow-card.pending {
	border-left: 6rpx solid #F59E0B;
}

.follow-card.completed {
	border-left: 6rpx solid #10B981;
	opacity: 0.85;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx;
	border-bottom: 1rpx solid $app-border;
}

.patient-info {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.avatar-wrap {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-wrap.completed {
	background: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%);
}

.avatar-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
}

.patient-meta {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.patient-name {
	font-size: 32rpx;
	font-weight: bold;
	color: $app-text;
}

.project-tag {
	font-size: 22rpx;
	color: #F59E0B;
	background: #FEF3C7;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	display: inline-block;
}

.project-tag.completed {
	color: #10B981;
	background: #D1FAE5;
}

.status-badge {
	font-size: 22rpx;
	padding: 8rpx 20rpx;
	border-radius: 16rpx;
}

.status-badge.pending {
	background: #FEF3C7;
	color: #F59E0B;
}

.status-badge.completed {
	background: #D1FAE5;
	color: #10B981;
}

.card-body {
	padding: 20rpx 24rpx;
}

.info-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 26rpx;
	color: $app-text-secondary;
	margin-bottom: 12rpx;
}

.info-row:last-child {
	margin-bottom: 0;
}

.info-row .app-icon {
	font-size: 28rpx;
	color: $app-text-muted;
}

.card-footer {
	display: flex;
	gap: 16rpx;
	padding: 16rpx 24rpx;
	background: $app-bg;
}

.action-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	padding: 16rpx;
	border-radius: 12rpx;
	font-size: 26rpx;
	background: #F3F4F6;
	color: $app-text-secondary;
}

.action-btn .app-icon {
	font-size: 28rpx;
}

.action-btn.primary {
	background: $app-primary;
	color: #fff;
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

.empty-icon {
	font-size: 120rpx !important;
	color: $app-text-muted;
	opacity: 0.3;
	margin-bottom: 24rpx;
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
</style>