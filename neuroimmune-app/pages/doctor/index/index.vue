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
				<view class="action-item" @click="navTo('/pages/doctor/add-clinic/add-clinic')">
					<view class="action-icon clinic">
						<text class="app-icon uniui-calendar-filled"></text>
					</view>
					<text class="action-text">添加门诊</text>
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
				<view class="action-item" @click="navTo('/pages/doctor/follow-plan/follow-plan')">
					<view class="action-icon plan">
						<text class="app-icon uniui-notification-filled"></text>
					</view>
					<text class="action-text">随访计划</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getDoctorPatientDetails, countDoctorPatients } from '@/api/relation.js'

export default {
	data() {
		return {
			userInfo: {},
			allPatients: [],
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
			uni.switchTab({ url: '/pages/patient-center/patient-center' })
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

.action-icon.clinic { background: #3B82F6; }
.action-icon.follow { background: $app-primary; }
.action-icon.medication { background: #EC4899; }
.action-icon.plan { background: #F59E0B; }

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