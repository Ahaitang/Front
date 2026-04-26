<template>
	<view class="container">
		<!-- 统计概览 -->
		<view class="stats-card">
			<view class="stat-item">
				<text class="stat-num">{{ totalCount }}</text>
				<text class="stat-label">发作总数</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-num severe">{{ severeCount }}</text>
				<text class="stat-label">重度发作</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-num recent">{{ recentCount }}</text>
				<text class="stat-label">近30天</text>
			</view>
		</view>

		<!-- 搜索栏 -->
		<view class="search-bar">
			<text class="app-icon uniui-search"></text>
			<input class="search-input" type="text" placeholder="搜索患者姓名" v-model="keyword" />
			<text class="search-btn" @click="applyTimeFilter">搜索</text>
			<view class="add-btn" @click="navTo('/pages/doctor/add-episode/add-episode')">
				<text class="app-icon uniui-plus-filled"></text>
			</view>
		</view>

		<!-- 时间筛选 -->
		<view class="time-filter">
			<view class="time-row">
				<picker mode="date" :value="startDate" @change="onStartDateChange">
					<view class="picker-btn">{{ startDate || '开始日期' }}</view>
				</picker>
				<text class="time-sep">至</text>
				<picker mode="date" :value="endDate" @change="onEndDateChange">
					<view class="picker-btn">{{ endDate || '结束日期' }}</view>
				</picker>
				<view class="filter-actions">
					<text class="filter-btn reset" @click="resetTimeFilter">重置</text>
					<text class="filter-btn apply" @click="applyTimeFilter">查询</text>
				</view>
			</view>
		</view>

		<!-- 严重程度筛选 -->
		<view class="filter-tags">
			<view class="tag" :class="{ active: filterSeverity === 'all' }" @click="filterSeverity = 'all'">全部</view>
			<view class="tag" :class="{ active: filterSeverity === 'mild' }" @click="filterSeverity = 'mild'">轻度</view>
			<view class="tag" :class="{ active: filterSeverity === 'moderate' }" @click="filterSeverity = 'moderate'">中度</view>
			<view class="tag" :class="{ active: filterSeverity === 'severe' }" @click="filterSeverity = 'severe'">重度</view>
		</view>

		<!-- 发作记录列表 -->
		<view class="episode-list">
			<view class="episode-card" v-for="(item, i) in filteredList" :key="i" @click="goPatient(item.patientId)">
				<view class="card-header">
					<view class="patient-info">
						<view class="avatar-wrap">
							<text class="avatar-text">{{ item.patientName.charAt(0) }}</text>
						</view>
						<view class="patient-meta">
							<text class="patient-name">{{ item.patientName }}</text>
							<text class="episode-type">{{ item.symptomType || '疾病发作' }}</text>
						</view>
					</view>
					<view class="severity-badge" :class="item.severityClass">{{ item.severityText }}</view>
				</view>
				<view class="card-body">
					<view class="info-row">
						<text class="app-icon uniui-calendar"></text>
						<text>{{ item.date }}</text>
					</view>
					<view class="info-row" v-if="item.symptoms">
						<text class="app-icon uniui-list"></text>
						<text class="symptoms-text">{{ item.symptoms }}</text>
					</view>
					<view class="info-row" v-if="item.duration">
						<text class="app-icon uniui-clock"></text>
						<text>持续时间: {{ item.duration }}</text>
					</view>
				</view>
				<view class="card-footer">
					<view class="action-btn primary" @click.stop="showDetail(item)">
						<text class="app-icon uniui-eye"></text>
						<text>查看详情</text>
					</view>
					<view class="action-btn" @click.stop="goPatient(item.patientId)">
						<text class="app-icon uniui-contact-filled"></text>
						<text>患者档案</text>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-if="!filteredList.length">
				<text class="app-icon empty-icon uniui-pulse"></text>
				<text class="empty-text">暂无发作记录</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getEpisodeList } from '@/api/episode.js'

export default {
	data() {
		return {
			keyword: '',
			filterSeverity: 'all',
			startDate: '',
			endDate: '',
			episodeList: [],
			totalCount: 0,
			severeCount: 0,
			recentCount: 0
		}
	},
	computed: {
		filteredList() {
			let list = this.episodeList
			// 按姓名筛选
			if (this.keyword) {
				const k = this.keyword.toLowerCase()
				list = list.filter(item => item.patientName.toLowerCase().includes(k))
			}
			// 按严重程度筛选
			if (this.filterSeverity !== 'all') {
				list = list.filter(item => item.severity === this.filterSeverity)
			}
			// 按时间筛选
			if (this.startDate || this.endDate) {
				list = list.filter(item => {
					if (!item.date) return false
					const d = item.date.split('T')[0].split(' ')[0]
					if (this.startDate && d < this.startDate) return false
					if (this.endDate && d > this.endDate) return false
					return true
				})
			}
			return list
		}
	},
	onShow() {
		this.loadData()
	},
	methods: {
		onStartDateChange(e) {
			this.startDate = e.detail.value
		},
		onEndDateChange(e) {
			this.endDate = e.detail.value
		},
		resetTimeFilter() {
			this.startDate = ''
			this.endDate = ''
		},
		applyTimeFilter() {
			// 计算属性自动响应变化
		},
		async loadData() {
			try {
				const res = await getEpisodeList({ pageNum: 1, pageSize: 100 })
				if (res && res.list) {
					this.episodeList = res.list.map(e => ({
						id: e.id,
						patientId: e.patientId,
						patientName: e.patientName || '患者',
						date: e.episodeDate ? (typeof e.episodeDate === 'string' ? e.episodeDate.split('T')[0] : e.episodeDate) : '',
						symptomType: e.symptomType || '疾病发作',
						symptoms: e.symptoms || '',
						duration: e.duration || '',
						treatment: e.treatment || '',
						severity: e.severity || 'moderate',
						severityText: this.getSeverityText(e.severity),
						severityClass: this.getSeverityClass(e.severity)
					}))
					this.totalCount = res.total || this.episodeList.length
					this.severeCount = this.episodeList.filter(e => e.severity === 'severe' || e.severity === 'critical').length
					// 计算近30天发作次数
					const today = new Date()
					const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
					const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
					this.recentCount = this.episodeList.filter(e => e.date && e.date >= thirtyDaysAgoStr).length
				}
			} catch (e) {
				console.error('加载发作记录失败:', e)
			}
		},
		getSeverityText(severity) {
			const map = {
				'mild': '轻度',
				'moderate': '中度',
				'severe': '重度',
				'critical': '严重'
			}
			return map[severity] || '中度'
		},
		getSeverityClass(severity) {
			const map = {
				'mild': 'mild',
				'moderate': 'moderate',
				'severe': 'severe',
				'critical': 'critical'
			}
			return map[severity] || 'moderate'
		},
		showDetail(item) {
			let content = `发作日期：${item.date || '未知'}\n`
			content += `发作类型：${item.symptomType || '疾病发作'}\n`
			content += `严重程度：${item.severityText}\n`
			content += `患者：${item.patientName}\n`
			if (item.symptoms) content += `症状描述：${item.symptoms}\n`
			if (item.duration) content += `持续时间：${item.duration}\n`
			if (item.treatment) content += `处理措施：${item.treatment}\n`

			uni.showModal({
				title: '发作记录详情',
				content: content,
				confirmText: '复制',
				success: (res) => {
					if (res.confirm) {
						uni.setClipboardData({
							data: content,
							success: () => {
								uni.showToast({ title: '已复制', icon: 'success' })
							}
						})
					}
				}
			})
		},
		goPatient(id) {
			uni.navigateTo({ url: '/pages/doctor/patient-info/patient-info?id=' + (id || '1') })
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
	padding: 24rpx 24rpx 60rpx;
}

/* 统计概览 */
.stats-card {
	display: flex;
	align-items: center;
	justify-content: space-around;
	background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
	border-radius: 20rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(245, 158, 11, 0.3);
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

.stat-num.severe {
	color: #FEE2E2;
}

.stat-num.recent {
	color: #FEF3C7;
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
	color: #F59E0B;
	padding: 0 16rpx;
}

.add-btn {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #F59E0B;
	border-radius: 50%;
}

.add-btn .app-icon {
	font-size: 32rpx;
	color: #fff;
}

/* 时间筛选 */
.time-filter {
	background: $app-card-bg;
	border-radius: 16rpx;
	padding: 20rpx 24rpx;
	margin-bottom: 20rpx;
	box-shadow: $app-shadow;
}

.time-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex-wrap: wrap;
}

.picker-btn {
	font-size: 26rpx;
	color: $app-text;
	background: $app-hover-bg;
	padding: 14rpx 20rpx;
	border-radius: 12rpx;
	min-width: 140rpx;
	text-align: center;
}

.time-sep {
	font-size: 26rpx;
	color: $app-text-muted;
}

.filter-actions {
	display: flex;
	gap: 16rpx;
	margin-left: auto;
}

.filter-btn {
	font-size: 26rpx;
	padding: 14rpx 24rpx;
	border-radius: 12rpx;
}

.filter-btn.reset {
	color: $app-text-muted;
	background: $app-hover-bg;
}

.filter-btn.apply {
	color: #fff;
	background: #F59E0B;
}

/* 筛选标签 */
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
	background: #F59E0B;
	color: #fff;
}

/* 发作卡片 */
.episode-card {
	background: $app-card-bg;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
	box-shadow: $app-shadow;
	border-left: 6rpx solid #F59E0B;
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
	background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
	display: flex;
	align-items: center;
	justify-content: center;
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

.episode-type {
	font-size: 22rpx;
	color: #F59E0B;
	background: #FEF3C7;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	display: inline-block;
}

.severity-badge {
	font-size: 22rpx;
	padding: 8rpx 20rpx;
	border-radius: 16rpx;
	font-weight: 500;
}

.severity-badge.mild {
	background: #D1FAE5;
	color: #10B981;
}

.severity-badge.moderate {
	background: #FEF3C7;
	color: #F59E0B;
}

.severity-badge.severe {
	background: #FEE2E2;
	color: #EF4444;
}

.severity-badge.critical {
	background: #FECACA;
	color: #DC2626;
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

.symptoms-text {
	flex: 1;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
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
	background: #F59E0B;
	color: #fff;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 80rpx 0;
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
</style>