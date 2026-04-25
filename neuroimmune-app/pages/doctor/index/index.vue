<template>
	<view class="container">
		<!-- 顶部用户卡片 -->
		<view class="header-card">
			<view class="user-info">
				<image class="avatar" :src="userInfo.avatar || '/static/component.png'" mode="aspectFill"></image>
				<view class="user-meta">
					<text class="greeting">{{ greeting }}</text>
					<text class="username">{{ userInfo.name || '医生' }}</text>
					<text class="subtitle">{{ userInfo.title || '主治医师' }}</text>
				</view>
				<view class="header-actions">
					<view class="action-btn" @click="handleLogout">
						<text class="app-icon uniui-arrowleft"></text>
					</view>
				</view>
			</view>
			<!-- 医院科室信息 -->
			<view class="hospital-info" v-if="userInfo.hospital || userInfo.department">
				<text class="hospital-name">{{ userInfo.hospital || '未知医院' }}</text>
				<text class="department-name">{{ userInfo.department || '未知科室' }}</text>
			</view>
		</view>

		<!-- 工作概览 -->
		<view class="overview-section">
			<view class="overview-grid">
				<view class="overview-item" @click="navTo('/pages/doctor/follow-plan/follow-plan')">
					<view class="overview-icon pending">
						<text class="app-icon uniui-clock"></text>
					</view>
					<text class="overview-num">{{ stats.pendingFollowups }}</text>
					<text class="overview-label">待随访</text>
				</view>
				<view class="overview-item" @click="navTo('/pages/doctor/patient-list/patient-list')">
					<view class="overview-icon patient">
						<text class="app-icon uniui-contact-filled"></text>
					</view>
					<text class="overview-num">{{ stats.totalPatients }}</text>
					<text class="overview-label">患者总数</text>
				</view>
				<view class="overview-item" @click="navTo('/pages/doctor/episode-list/episode-list')">
					<view class="overview-icon episode">
						<text class="app-icon uniui-pulse"></text>
					</view>
					<text class="overview-num">{{ stats.totalEpisodes }}</text>
					<text class="overview-label">发作记录</text>
				</view>
				<view class="overview-item" @click="navTo('/pages/doctor/medical-record/medical-record')">
					<view class="overview-icon record">
						<text class="app-icon uniui-folder-add-filled"></text>
					</view>
					<text class="overview-num">{{ stats.totalMedicalRecords }}</text>
					<text class="overview-label">病例统计</text>
				</view>
				<view class="overview-item" @click="navTo('/pages/doctor/medication-list/medication-list')">
					<view class="overview-icon medication">
						<text class="app-icon uniui-medal"></text>
					</view>
					<text class="overview-num">{{ stats.activeMedications }}</text>
					<text class="overview-label">用药方案</text>
				</view>
			</view>
		</view>

		<!-- 患者列表 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">我的患者</text>
				<text class="section-more" @click="goPatientCenter">查看全部</text>
			</view>
			<view class="patient-list" v-if="recentPatients.length">
				<view class="patient-item" v-for="(item, i) in recentPatients" :key="i"
					@click="navTo('/pages/doctor/patient-info/patient-info?id=' + item.id)">
					<image class="patient-avatar" :src="item.avatar || '/static/component.png'" mode="aspectFill"></image>
					<view class="patient-content">
						<view class="patient-head">
							<text class="patient-name">{{ item.name }}</text>
							<text class="patient-meta">{{ item.gender }} {{ item.age }}岁</text>
						</view>
						<text class="patient-disease" v-if="item.diseaseType">{{ item.diseaseType }}</text>
					</view>
					<view class="patient-tag" v-if="item.hasFollowUp">待随访</view>
				</view>
			</view>
			<view class="empty-tip" v-else>暂无患者数据</view>
		</view>

		<!-- 快捷操作 -->
		<view class="section quick-section">
			<view class="action-grid">
				<view class="action-item" @click="navTo('/pages/doctor/add-patient/add-patient')">
					<view class="action-icon patient-add">
						<text class="app-icon uniui-personadd-filled"></text>
					</view>
					<text class="action-text">添加患者</text>
				</view>
				<view class="action-item" @click="navTo('/pages/doctor/add-episode/add-episode')">
					<view class="action-icon episode">
						<text class="app-icon uniui-pulse"></text>
					</view>
					<text class="action-text">添加发作</text>
				</view>
				<view class="action-item" @click="navTo('/pages/doctor/add-follow/add-follow')">
					<view class="action-icon follow">
						<text class="app-icon uniui-list"></text>
					</view>
					<text class="action-text">添加随访</text>
				</view>
				<view class="action-item" @click="navTo('/pages/doctor/add-medication/add-medication')">
					<view class="action-icon medication">
						<text class="app-icon uniui-compose"></text>
					</view>
					<text class="action-text">用药建议</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getDoctorPatientDetails } from '@/api/relation.js'
import { getStats } from '@/api/dashboard.js'

export default {
	data() {
		return {
			userInfo: {},
			allPatients: [],
			stats: {
				pendingFollowups: 0,
				totalPatients: 0,
				totalEpisodes: 0,
				totalMedicalRecords: 0,
				activeMedications: 0
			},
			diseaseTypes: [
				{ label: 'MS', value: 'MS', count: 0 },
				{ label: 'NMOSD', value: 'NMOSD', count: 0 },
				{ label: 'MG', value: 'MG', count: 0 },
				{ label: 'MOGAD', value: 'MOGAD', count: 0 },
				{ label: '自身免疫性脑炎', value: '自身免疫性脑炎', count: 0 },
				{ label: 'GBS', value: 'GBS', count: 0 },
				{ label: 'CIDP', value: 'CIDP', count: 0 },
				{ label: '其它', value: '其它疾病', count: 0 }
			]
		}
	},
	computed: {
		greeting() {
			const hour = new Date().getHours()
			if (hour < 6) return '夜深了'
			if (hour < 9) return '早上好'
			if (hour < 12) return '上午好'
			if (hour < 14) return '中午好'
			if (hour < 18) return '下午好'
			if (hour < 22) return '晚上好'
			return '夜深了'
		},
		recentPatients() {
			return this.allPatients.slice(0, 5)
		}
	},
	onLoad() {
		this.userInfo = uni.getStorageSync('userInfo') || {}
	},
	onShow() {
		if (!uni.getStorageSync('token')) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}
		this.loadData()
	},
	methods: {
		async loadData() {
			const doctorId = this.userInfo.id
			if (!doctorId) return

			// 并行获取统计数据
			this.loadStats()
			this.loadPatients(doctorId)
		},
		async loadStats() {
			try {
				// 使用dashboard统计接口获取主要数据
				const statsRes = await getStats()
				console.log('dashboard stats响应:', statsRes)
				if (statsRes) {
					this.stats.totalPatients = statsRes.totalPatients || 0
					this.stats.pendingFollowups = statsRes.pendingFollowUps || 0
					this.stats.activeMedications = statsRes.totalMedications || 0
					this.stats.totalEpisodes = statsRes.totalEpisodes || 0
					this.stats.totalMedicalRecords = statsRes.totalMedicalRecords || 0
					console.log('提取后的stats:', this.stats)
				}
			} catch (e) {
				console.error('获取统计数据失败:', e)
			}
		},
		async loadPatients(doctorId) {
			try {
				const patients = await getDoctorPatientDetails(doctorId)
				if (patients && patients.length) {
					this.allPatients = patients.map(p => ({
						id: p.patientId,
						name: p.patientName,
						gender: p.gender === 'male' ? '男' : (p.gender === 'female' ? '女' : p.gender),
						age: p.age,
						phone: p.phone,
						avatar: '',
						hasFollowUp: p.hasFollowUp,
						diseaseType: p.diseaseType || ''
					}))

					// 更新患者总数
					this.stats.totalPatients = this.allPatients.length

					// 统计各疾病类型数量
					this.diseaseTypes.forEach(d => {
						d.count = this.allPatients.filter(p => p.diseaseType === d.value).length
					})
				}
			} catch (e) {
				console.error('获取患者列表失败:', e)
			}
		},
		navTo(url) {
			if (!url) return
			uni.navigateTo({ url })
		},
		goPatientCenter() {
			uni.navigateTo({ url: '/pages/doctor/patient-list/patient-list' })
		},
		handleLogout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('token')
						uni.removeStorageSync('userInfo')
						uni.removeStorageSync('role')
						uni.showToast({ title: '已退出登录', icon: 'success' })
						setTimeout(() => {
							uni.reLaunch({ url: '/pages/login/login' })
						}, 800)
					}
				}
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
	padding-bottom: 120rpx;
}

/* 顶部用户卡片 */
.header-card {
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	padding: 40rpx 32rpx 32rpx;
}

.user-info {
	display: flex;
	align-items: center;
}

.avatar {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	border: 4rpx solid rgba(255,255,255,0.3);
	margin-right: 24rpx;
}

.user-meta {
	flex: 1;
}

.greeting {
	font-size: 26rpx;
	color: rgba(255,255,255,0.85);
	display: block;
	margin-bottom: 8rpx;
}

.username {
	font-size: 36rpx;
	color: #fff;
	font-weight: bold;
	display: block;
}

.subtitle {
	font-size: 26rpx;
	color: rgba(255,255,255,0.75);
	display: block;
	margin-top: 6rpx;
}

.header-actions {
	display: flex;
	gap: 20rpx;
}

.action-btn {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.2);
	display: flex;
	align-items: center;
	justify-content: center;
}

.action-btn .app-icon {
	font-size: 36rpx !important;
	color: #fff !important;
}

/* 医院科室信息 */
.hospital-info {
	margin-top: 24rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(255,255,255,0.2);
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.hospital-name {
	font-size: 28rpx;
	color: #fff;
	font-weight: 500;
}

.department-name {
	font-size: 26rpx;
	color: rgba(255,255,255,0.85);
	padding: 6rpx 16rpx;
	background: rgba(255,255,255,0.2);
	border-radius: 16rpx;
}

/* 工作概览 */
.overview-section {
	margin: -20rpx 24rpx 24rpx;
	padding: 28rpx;
	background: $app-card-bg;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.overview-grid {
	display: flex;
	justify-content: space-between;
}

.overview-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 20%;
}

.overview-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
}

.overview-icon .app-icon {
	font-size: 32rpx !important;
	color: #fff !important;
}

.overview-icon.pending { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }
.overview-icon.patient { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); }
.overview-icon.episode { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); }
.overview-icon.record { background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%); }
.overview-icon.medication { background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); }

.overview-num {
	font-size: 32rpx;
	font-weight: bold;
	color: $app-text;
	display: block;
}

.overview-label {
	font-size: 22rpx;
	color: $app-text-muted;
	margin-top: 6rpx;
}

/* 通用区块 */
.section {
	margin: 24rpx;
	padding: 28rpx;
	background: $app-card-bg;
	border-radius: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: $app-text;
}

.section-more {
	font-size: 26rpx;
	color: $app-primary;
}

/* 快捷操作 */
.quick-section {
	padding: 24rpx;
}

.action-grid {
	display: flex;
	justify-content: space-between;
}

.action-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 25%;
}

.action-icon {
	width: 88rpx;
	height: 88rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
}

.action-icon .app-icon {
	font-size: 40rpx !important;
	color: #fff !important;
}

.action-icon.patient-add { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
.action-icon.episode { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); }
.action-icon.follow { background: $app-primary; }
.action-icon.medication { background: #EC4899; }

.action-text {
	font-size: 26rpx;
	color: $app-text;
}

/* 患者列表 */
.patient-list {
	display: flex;
	flex-direction: column;
}

.patient-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.patient-item:last-child {
	border-bottom: none;
}

.patient-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	margin-right: 16rpx;
}

.patient-content {
	flex: 1;
}

.patient-head {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 6rpx;
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
	font-size: 24rpx;
	color: $app-text-secondary;
	padding: 4rpx 12rpx;
	background: $app-primary-bg;
	border-radius: 8rpx;
}

.patient-tag {
	font-size: 22rpx;
	color: #F59E0B;
	background: #FEF3C7;
	padding: 6rpx 14rpx;
	border-radius: 16rpx;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	text-align: center;
	padding: 40rpx 0;
}
</style>