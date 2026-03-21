<template>
	<view class="container">
		<!-- 添加按钮 -->
		<view class="add-bar">
			<view class="add-btn" @click="navTo('/pages/patient/add-episode/add-episode')">
				<text class="app-icon uniui-plus"></text>
				<text>记录疾病发作</text>
			</view>
		</view>

		<!-- 统计卡片 -->
		<view class="stats-card card">
			<view class="stat-item">
				<text class="stat-value">{{ totalCount }}</text>
				<text class="stat-label">发作次数</text>
			</view>
		</view>

		<!-- 发作记录列表 -->
		<view class="empty card" v-if="list.length === 0">
			<text class="empty-tip">暂无发作记录</text>
			<text class="empty-desc">点击上方按钮记录您的疾病发作情况</text>
		</view>

		<view class="episode-item card" v-for="(item, i) in list" :key="i" @click="viewDetail(item)">
			<view class="episode-header">
				<view class="episode-number">第 {{ item.episodeNumber }} 次发作</view>
				<text class="episode-date">{{ item.episodeDate }}</text>
			</view>

			<view class="episode-section" v-if="item.chiefComplaint">
				<text class="section-label">主诉</text>
				<text class="section-value">{{ item.chiefComplaint }}</text>
			</view>

			<view class="episode-section" v-if="item.symptoms">
				<text class="section-label">症状</text>
				<text class="section-value">{{ item.symptoms }}</text>
			</view>

			<view class="episode-section" v-if="item.diagnosis">
				<text class="section-label">诊断</text>
				<text class="section-value highlight">{{ item.diagnosis }}</text>
			</view>

			<view class="episode-footer" v-if="item.hospital">
				<text class="hospital">{{ item.hospital }}</text>
				<text class="department" v-if="item.department">{{ item.department }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getEpisodesByPatient, getEpisodeCount } from '@/api/episode.js'

export default {
	data() {
		return {
			list: [],
			totalCount: 0
		}
	},
	onShow() {
		this.loadData()
	},
	methods: {
		async loadData() {
			const userInfo = uni.getStorageSync('userInfo') || {}

			try {
				const [listRes, countRes] = await Promise.all([
					getEpisodesByPatient(userInfo.id),
					getEpisodeCount(userInfo.id)
				])

				if (listRes) {
					this.list = listRes.map(e => ({
						id: e.id,
						episodeNumber: e.episodeNumber,
						episodeDate: this.formatDateStr(e.episodeDate),
						chiefComplaint: e.chiefComplaint,
						symptoms: e.symptoms,
						diseaseProgress: e.diseaseProgress,
						treatmentProcess: e.treatmentProcess,
						diagnosis: e.diagnosis,
						hospital: e.hospital,
						department: e.department,
						notes: e.notes
					}))
				}

				this.totalCount = countRes || this.list.length
			} catch (e) {
				console.error('加载发作记录失败:', e)
				// 模拟数据
				this.list = []
				this.totalCount = 0
			}
		},
		formatDateStr(date) {
			if (!date) return ''
			return date.split('T')[0].split(' ')[0]
		},
		navTo(url) {
			uni.navigateTo({ url })
		},
		viewDetail(item) {
			// 可以跳转到详情页或弹出详情
			uni.showModal({
				title: `第${item.episodeNumber}次发作详情`,
				content: `主诉：${item.chiefComplaint || '无'}\n症状：${item.symptoms || '无'}\n诊断：${item.diagnosis || '无'}`,
				showCancel: false
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
	padding-bottom: 60rpx;
}

.add-bar {
	margin-bottom: 24rpx;
}

.add-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	padding: 24rpx;
	background: $app-primary;
	border-radius: $app-radius;
	color: #fff;
	font-size: 30rpx;
	font-weight: 500;
}

.add-btn .app-icon {
	font-size: 36rpx;
}

.stats-card {
	display: flex;
	justify-content: center;
	padding: 32rpx;
	margin-bottom: 24rpx;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-value {
	font-size: 56rpx;
	font-weight: bold;
	color: $app-primary;
}

.stat-label {
	font-size: 26rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	margin-bottom: 24rpx;
	box-shadow: $app-shadow;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	display: block;
	text-align: center;
}

.empty-desc {
	font-size: 24rpx;
	color: $app-text-muted;
	display: block;
	text-align: center;
	margin-top: 8rpx;
}

.episode-item {
	padding: 24rpx;
}

.episode-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 16rpx;
	border-bottom: 1rpx solid $app-border;
}

.episode-number {
	font-size: 32rpx;
	font-weight: bold;
	color: $app-primary;
}

.episode-date {
	font-size: 26rpx;
	color: $app-text-muted;
}

.episode-section {
	margin-bottom: 16rpx;
}

.section-label {
	display: block;
	font-size: 24rpx;
	color: $app-text-muted;
	margin-bottom: 8rpx;
}

.section-value {
	display: block;
	font-size: 28rpx;
	color: $app-text;
	line-height: 1.6;
}

.section-value.highlight {
	color: $app-primary;
}

.episode-footer {
	display: flex;
	gap: 16rpx;
	margin-top: 16rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid $app-border;
}

.hospital, .department {
	font-size: 24rpx;
	color: $app-text-secondary;
	padding: 6rpx 16rpx;
	background: $app-primary-bg;
	border-radius: 8rpx;
}
</style>