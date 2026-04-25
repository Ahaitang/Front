<template>
	<view class="container">
		<!-- 医生端：个人中心 -->
		<template v-if="isDoctor">
			<!-- 个人信息卡片 -->
			<view class="doctor-header">
				<image class="doctor-avatar" :src="userInfo.avatar || '/static/component.png'" mode="aspectFill"></image>
				<view class="doctor-meta">
					<text class="doctor-name">{{ userInfo.name || '医生' }}</text>
					<text class="doctor-title">{{ userInfo.title || '主治医师' }}</text>
				</view>
				<view class="doctor-info">
					<text class="info-item" v-if="userInfo.hospital">{{ userInfo.hospital }}</text>
					<text class="info-tag" v-if="userInfo.department">{{ userInfo.department }}</text>
				</view>
				<view class="edit-btn" @click="navTo('/pages/doctor/my-info/my-info')">
					<text class="app-icon uniui-compose"></text>
					<text>编辑</text>
				</view>
			</view>

			<!-- 功能菜单 -->
			<view class="menu-section">
				<view class="section-title">患者管理</view>
				<view class="menu-card">
					<view class="menu-item" @click="navTo('/pages/doctor/patient-list/patient-list')">
						<view class="menu-icon patient">
							<text class="app-icon uniui-contact-filled"></text>
						</view>
						<text class="menu-label">患者列表</text>
						<text class="app-icon muted uniui-arrowright"></text>
					</view>
				</view>
			</view>

			<view class="menu-section">
				<view class="section-title">记录管理</view>
				<view class="menu-card">
					<view class="menu-item" @click="navTo('/pages/doctor/follow-plan/follow-plan')">
						<view class="menu-icon follow">
							<text class="app-icon uniui-calendar-filled"></text>
						</view>
						<text class="menu-label">随访计划</text>
						<text class="app-icon muted uniui-arrowright"></text>
					</view>
					<view class="menu-item" @click="navTo('/pages/doctor/medication-list/medication-list')">
						<view class="menu-icon medication">
							<text class="app-icon uniui-compose"></text>
						</view>
						<text class="menu-label">用药建议</text>
						<text class="app-icon muted uniui-arrowright"></text>
					</view>
					<view class="menu-item" @click="navTo('/pages/doctor/medical-record/medical-record')">
						<view class="menu-icon record">
							<text class="app-icon uniui-folder-add-filled"></text>
						</view>
						<text class="menu-label">病历记录</text>
						<text class="app-icon muted uniui-arrowright"></text>
					</view>
					<view class="menu-item" @click="navTo('/pages/doctor/episode-list/episode-list')">
						<view class="menu-icon episode">
							<text class="app-icon uniui-pulse"></text>
						</view>
						<text class="menu-label">发作记录</text>
						<text class="app-icon muted uniui-arrowright"></text>
					</view>
				</view>
			</view>

			<view class="menu-section">
				<view class="section-title">其他</view>
				<view class="menu-card">
					<view class="menu-item" @click="navTo('/pages/doctor/my-info/my-info')">
						<view class="menu-icon setting">
							<text class="app-icon uniui-gear-filled"></text>
						</view>
						<text class="menu-label">个人信息</text>
						<text class="app-icon muted uniui-arrowright"></text>
					</view>
					<view class="menu-item" @click="handleLogout">
						<view class="menu-icon logout">
							<text class="app-icon uniui-arrowleft"></text>
						</view>
						<text class="menu-label logout-text">退出登录</text>
					</view>
				</view>
			</view>
		</template>

		<!-- 患者端：我的（个人中心） -->
		<template v-else>
			<view class="my-card card">
				<image class="my-avatar" :src="userInfo.avatar || '/static/component.png'" mode="aspectFill"></image>
				<view class="my-name-row">
					<text class="my-name">{{ userInfo.name || '张哲瀚' }}</text>
					<view class="auth-tag" v-if="userInfo.isRealAuth"><text>已实名</text></view>
					<view class="my-badge" v-else></view>
				</view>
				<text class="my-id">ID: {{ userInfo.id || '未登录' }}</text>
				<text class="my-meta">{{ userInfo.gender || '男' }} | {{ userInfo.age || '45' }}岁</text>
				<text class="edit-icon" @click="navTo('/pages/patient/my-info/my-info')"><text class="app-icon sm uniui-compose"></text> 编辑</text>
			</view>
			<view class="menu-list card">
				<view class="menu-item" @click="navTo('/pages/patient/my-info/my-info')">
					<text class="menu-label"><text class="app-icon muted uniui-person-filled"></text> 个人资料</text>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
				<view class="menu-item" @click="navTo('/pages/patient/real-auth/real-auth')">
					<text class="menu-label"><text class="app-icon muted uniui-auth-filled"></text> 实名认证</text>
					<view class="menu-right">
						<text class="menu-status" :class="userInfo.isRealAuth ? 'ok' : 'warn'">{{ userInfo.isRealAuth ? '已认证' : '未认证' }}</text>
						<text class="app-icon sm muted uniui-arrowright"></text>
					</view>
				</view>
				<view class="menu-item" @click="navTo('/pages/patient/real-auth/real-auth')">
					<text class="menu-label"><text class="app-icon muted uniui-staff-filled"></text> 绑定医生</text>
					<view class="menu-right">
						<text class="menu-status" :class="doctorBound ? 'ok' : 'warn'">{{ doctorBound ? '已绑定' : '未绑定' }}</text>
						<text class="app-icon sm muted uniui-arrowright"></text>
					</view>
				</view>
			</view>
			<view class="menu-list card">
				<view class="menu-item" @click="navTo('/pages/patient/medical-record/medical-record')">
					<text class="menu-label"><text class="app-icon muted uniui-folder-add-filled"></text> 我的病历</text>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
				<view class="menu-item" @click="navTo('/pages/patient/follow-plan/follow-plan')">
					<text class="menu-label"><text class="app-icon muted uniui-calendar-filled"></text> 随访列表</text>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
				<view class="menu-item" @click="navTo('/pages/patient/medication-advice/medication-advice')">
					<text class="menu-label"><text class="app-icon muted uniui-compose"></text> 用药记录</text>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
				<view class="menu-item" @click="navTo('/pages/patient/disease-episode/disease-episode')">
					<text class="menu-label"><text class="app-icon muted uniui-pulse"></text> 疾病发作记录</text>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
			</view>
			<view class="menu-list card">
				<view class="menu-item">
					<text class="menu-label"><text class="app-icon muted uniui-help-filled"></text> 帮助反馈</text>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
				<view class="menu-item">
					<text class="menu-label"><text class="app-icon muted uniui-phone-filled"></text> 客服电话</text>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
				<view class="menu-item">
					<text class="menu-label"><text class="app-icon muted uniui-info-filled"></text> 关于我们</text>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
			</view>
			<view class="logout-wrap">
				<button class="logout-btn" @click="handleLogout"><text class="app-icon uniui-gear-filled"></text> 退出登录</button>
			</view>
		</template>

		<!-- 自定义tabBar -->
		<custom-tabbar :current="2" />
	</view>
</template>

<script>
import { getFollowUpList } from '@/api/followup.js'
import { getMedicationList } from '@/api/medication.js'

export default {
	data() {
		return {
			userInfo: {},
			doctorBound: false,
			// 患者端统计数据
			stats: { followUpCount: 0, medicationCount: 0 }
		}
	},
	computed: {
		isDoctor() {
			return (uni.getStorageSync('role') || 'patient') === 'doctor'
		}
	},
	onLoad() {
		this.userInfo = uni.getStorageSync('userInfo') || {}
		this.doctorBound = !!uni.getStorageSync('doctorBound')
		// 根据角色动态设置导航栏标题
		if (this.isDoctor) {
			uni.setNavigationBarTitle({ title: '我的' })
		} else {
			uni.setNavigationBarTitle({ title: '我的' })
		}
	},
	onShow() {
		if (!uni.getStorageSync('token')) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}
		this.userInfo = uni.getStorageSync('userInfo') || {}
		this.doctorBound = !!uni.getStorageSync('doctorBound')
		this.loadData()
	},
	methods: {
		async loadData() {
			if (!this.isDoctor) {
				await this.loadPatientStats()
			}
		},
		async loadPatientStats() {
			try {
				const followRes = await getFollowUpList({ pageNum: 1, pageSize: 100 })
				if (followRes) {
					this.stats.followUpCount = followRes.total || 0
				}
				const medRes = await getMedicationList({ pageNum: 1, pageSize: 100 })
				if (medRes) {
					this.stats.medicationCount = medRes.total || 0
				}
			} catch (e) {
				console.error('加载患者统计数据失败:', e)
			}
		},
		navTo(url) {
			uni.navigateTo({ url })
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
						uni.removeStorageSync('doctorBound')
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
	padding: $app-spacing-md;
	padding-bottom: 200rpx;
}

/* 医生端个人中心样式 */
.doctor-header {
	background: $app-gradient-doctor;
	border-radius: $app-radius;
	padding: 48rpx 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: $app-spacing-md;
	box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.25);
	position: relative;
}

.doctor-avatar {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	border: 6rpx solid rgba(255, 255, 255, 0.3);
	margin-bottom: 20rpx;
}

.doctor-meta {
	text-align: center;
}

.doctor-name {
	font-size: 36rpx;
	font-weight: 700;
	color: #fff;
	display: block;
}

.doctor-title {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.85);
	margin-top: 8rpx;
	display: block;
}

.doctor-info {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-top: 16rpx;
}

.info-item {
	font-size: 26rpx;
	color: #fff;
}

.info-tag {
	font-size: 24rpx;
	color: #fff;
	background: rgba(255, 255, 255, 0.2);
	padding: 8rpx 20rpx;
	border-radius: 16rpx;
}

.edit-btn {
	position: absolute;
	right: 24rpx;
	top: 24rpx;
	display: flex;
	align-items: center;
	gap: 8rpx;
	background: rgba(255, 255, 255, 0.2);
	padding: 12rpx 24rpx;
	border-radius: 20rpx;
	font-size: 26rpx;
	color: #fff;
}

.edit-btn .app-icon {
	font-size: 28rpx;
}

/* 菜单区块 */
.menu-section {
	margin-bottom: $app-spacing-md;
}

.section-title {
	font-size: 30rpx;
	font-weight: 600;
	color: $app-text;
	margin-bottom: $app-spacing-sm;
	padding-left: $app-spacing-sm;
}

.menu-card {
	background: $app-card-bg;
	border-radius: $app-radius;
	box-shadow: $app-shadow;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 24rpx 28rpx;
	border-bottom: 1rpx solid $app-divider;
	transition: $app-transition;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-item:active {
	background: $app-hover-bg;
}

.menu-icon {
	width: 56rpx;
	height: 56rpx;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.menu-icon .app-icon {
	font-size: 28rpx !important;
	color: #fff !important;
}

.menu-icon.patient { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); }
.menu-icon.follow { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }
.menu-icon.medication { background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%); }
.menu-icon.record { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); }
.menu-icon.episode { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); }
.menu-icon.setting { background: linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%); }
.menu-icon.logout { background: rgba(239, 68, 68, 0.1); }

.menu-icon.logout .app-icon {
	color: $app-error !important;
}

.menu-label {
	flex: 1;
	font-size: 30rpx;
	color: $app-text;
	font-weight: 500;
}

.menu-label.logout-text {
	color: $app-error;
}

.menu-item .app-icon.muted {
	font-size: 28rpx;
	color: $app-text-muted;
}

/* 患者端样式 */
.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: $app-spacing-md;
	margin-bottom: $app-spacing-md;
	box-shadow: $app-shadow;
}

.my-card {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $app-spacing-xl $app-spacing-md;
	background: $app-gradient-primary;
}

.my-avatar {
	width: 180rpx;
	height: 180rpx;
	border-radius: 50%;
	margin-bottom: $app-spacing-md;
	border: 6rpx solid rgba(255, 255, 255, 0.3);
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.my-name-row {
	display: flex;
	align-items: center;
}

.my-name {
	font-size: 36rpx;
	font-weight: 700;
	color: #fff;
	margin-right: $app-spacing-sm;
}

.my-badge {
	width: 24rpx;
	height: 24rpx;
	border-radius: 50%;
	background: $app-success;
}

.auth-tag {
	background: rgba(255,255,255,0.2);
	border-radius: 8rpx;
	padding: 8rpx 16rpx;
	margin-left: $app-spacing-sm;
}

.auth-tag text {
	font-size: 24rpx;
	color: #fff;
	font-weight: 500;
}

.my-id {
	font-size: 26rpx;
	color: rgba(255,255,255,0.85);
	margin-top: 10rpx;
	display: block;
}

.my-meta {
	font-size: 28rpx;
	color: rgba(255,255,255,0.85);
	margin-top: 8rpx;
	display: block;
}

.edit-icon {
	position: absolute;
	right: $app-spacing-md;
	top: $app-spacing-xl;
	font-size: 28rpx;
	color: #fff;
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	background: rgba(255,255,255,0.2);
	padding: 12rpx 24rpx;
	border-radius: 24rpx;
}

.menu-list {
	padding: 0 $app-spacing-md;
}

.menu-list .menu-item {
	padding: $app-spacing-md 0;
	border-bottom: 1rpx solid $app-divider;
}

.menu-list .menu-item:last-child {
	border-bottom: none;
}

.menu-list .menu-label {
	display: inline-flex;
	align-items: center;
	gap: $app-spacing-md;
}

.menu-list .menu-right {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.menu-status.ok {
	color: $app-success;
	font-size: 26rpx;
	margin-right: 8rpx;
	font-weight: 500;
}

.menu-status.warn {
	color: $app-error;
	font-size: 26rpx;
	margin-right: 8rpx;
	font-weight: 500;
}

.logout-wrap {
	margin-top: $app-spacing-xl;
	padding: 0 $app-spacing-md;
}

.logout-btn {
	width: 100%;
	height: 96rpx;
	line-height: 96rpx;
	background: #fff;
	color: $app-error;
	border: 2rpx solid $app-error;
	border-radius: $app-radius-sm;
	font-size: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $app-spacing-sm;
	font-weight: 500;
	transition: $app-transition;
}

.logout-btn:active {
	background: $app-error-bg;
}

.logout-btn::after {
	border: none;
}
</style>