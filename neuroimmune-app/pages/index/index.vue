<template>
	<view class="container">
		<!-- 医生端首页 -->
		<template v-if="isDoctor">
			<!-- 顶部用户卡片 -->
			<view class="header-card doctor">
				<view class="user-info">
					<image class="avatar" :src="userInfo.avatar || '/static/component.png'" mode="aspectFill"></image>
					<view class="user-meta">
						<text class="greeting">{{ greeting }}</text>
						<text class="username">{{ userInfo.name || '医生' }}</text>
					</view>
					<view class="header-actions">
						<view class="action-btn" @click="handleLogout">
							<text class="app-icon uniui-arrowleft"></text>
						</view>
					</view>
				</view>
				<!-- 医院科室信息 -->
				<view class="doctor-info-card">
					<text class="app-icon sm uniui-home-filled"></text>
					<text class="info-text">{{ userInfo.hospital || '神经免疫科' }}</text>
					<text class="info-tag">{{ userInfo.department || '主治医师' }}</text>
				</view>
			</view>

			<!-- 工作概览 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">工作概览</text>
				</view>
				<view class="health-grid">
					<view class="health-item" @click="goPatientCenter">
						<view class="health-icon-wrap doctor-primary">
							<text class="app-icon uniui-contact-filled"></text>
						</view>
						<text class="health-value">{{ doctorStats.patientCount }}</text>
						<text class="health-label">我的患者</text>
					</view>
					<view class="health-item" @click="navTo('/pages/doctor/follow-plan/follow-plan')">
						<view class="health-icon-wrap doctor-warning">
							<text class="app-icon uniui-notification-filled"></text>
						</view>
						<text class="health-value">{{ doctorStats.pendingFollow }}</text>
						<text class="health-label">待随访</text>
					</view>
					<view class="health-item" @click="navTo('/pages/doctor/medical-record/medical-record')">
						<view class="health-icon-wrap doctor-success">
							<text class="app-icon uniui-folder-add-filled"></text>
						</view>
						<text class="health-value">{{ doctorStats.medicalRecord }}</text>
						<text class="health-label">病历查看</text>
					</view>
					<view class="health-item" @click="navTo('/pages/doctor/medication-list/medication-list')">
						<view class="health-icon-wrap doctor-info">
							<text class="app-icon uniui-compose"></text>
						</view>
						<text class="health-value">{{ doctorStats.medicationCount }}</text>
						<text class="health-label">用药建议</text>
					</view>
				</view>
			</view>

			<!-- 快速操作 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">快速操作</text>
				</view>
				<view class="quick-grid">
					<view class="quick-item" @click="goPatientCenter">
						<view class="quick-icon doctor">
							<text class="app-icon uniui-contact-filled"></text>
						</view>
						<text class="quick-text">患者管理</text>
					</view>
					<view class="quick-item" @click="navTo('/pages/doctor/add-follow/add-follow')">
						<view class="quick-icon doctor">
							<text class="app-icon uniui-plus-filled"></text>
						</view>
						<text class="quick-text">添加随访</text>
					</view>
					<view class="quick-item" @click="navTo('/pages/doctor/upload-record/upload-record')">
						<view class="quick-icon doctor">
							<text class="app-icon uniui-cloud-upload-filled"></text>
						</view>
						<text class="quick-text">上传病历</text>
					</view>
					<view class="quick-item" @click="navTo('/pages/doctor/add-medication/add-medication')">
						<view class="quick-icon doctor">
							<text class="app-icon uniui-compose"></text>
						</view>
						<text class="quick-text">添加用药</text>
					</view>
				</view>
			</view>
		</template>

		<!-- 患者端首页 -->
		<template v-else>
			<!-- 顶部用户卡片 -->
			<view class="header-card">
				<view class="user-info">
					<image class="avatar" :src="userInfo.avatar || '/static/component.png'" mode="aspectFill"></image>
					<view class="user-meta">
						<text class="greeting">{{ greeting }}</text>
						<text class="username">{{ userInfo.name || '患者' }}</text>
					</view>
					<view class="header-actions">
						<view class="action-btn" @click="navTo('/pages/patient/my-info/my-info')">
							<text class="app-icon uniui-gear-filled"></text>
						</view>
					</view>
				</view>
				<view class="doctor-bind-card" v-if="doctorBound">
					<text class="app-icon sm uniui-contact-filled"></text>
					<text class="bind-label">主治医生</text>
					<text class="bind-name">{{ doctorName }}</text>
				</view>
				<view class="doctor-bind-card unbind" v-else @click="navTo('/pages/patient/real-auth/real-auth')">
					<text class="app-icon sm uniui-plus-filled"></text>
					<text class="bind-label">绑定主治医生</text>
				</view>
			</view>

			<!-- 健康概览 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">健康概览</text>
				</view>
				<view class="health-grid">
					<view class="health-item" @click="navTo('/pages/patient/follow-plan/follow-plan')">
						<view class="health-icon-wrap warning">
							<text class="app-icon uniui-notification-filled"></text>
						</view>
						<text class="health-value">{{ pendingFollowUps.length }}</text>
						<text class="health-label">待随访</text>
					</view>
					<view class="health-item" @click="navTo('/pages/patient/medication-advice/medication-advice')">
						<view class="health-icon-wrap primary">
							<text class="app-icon uniui-compose"></text>
						</view>
						<text class="health-value">{{ recentMedications.length }}</text>
						<text class="health-label">用药建议</text>
					</view>
					<view class="health-item" @click="navTo('/pages/patient/visit-history/visit-history')">
						<view class="health-icon-wrap success">
							<text class="app-icon uniui-calendar-filled"></text>
						</view>
						<text class="health-value">{{ visitCount }}</text>
						<text class="health-label">就诊记录</text>
					</view>
					<view class="health-item" @click="navTo('/pages/patient/doctor-advice/doctor-advice')">
						<view class="health-icon-wrap info">
							<text class="app-icon uniui-chatbubble-filled"></text>
						</view>
						<text class="health-value">{{ adviceCount }}</text>
						<text class="health-label">医生建议</text>
					</view>
				</view>
			</view>

			<!-- 随访提醒 -->
			<view class="section" v-if="pendingFollowUps.length">
				<view class="section-header">
					<text class="section-title">随访提醒</text>
					<text class="section-more" @click="navTo('/pages/patient/follow-plan/follow-plan')">查看全部</text>
				</view>
				<view class="reminder-list">
					<view class="reminder-item" v-for="(item, i) in pendingFollowUps" :key="i" @click="navTo('/pages/patient/follow-plan/follow-plan')">
						<view class="reminder-left">
							<view class="reminder-icon">
								<text class="app-icon uniui-calendar-filled"></text>
							</view>
							<view class="reminder-content">
								<text class="reminder-title">{{ item.title }}</text>
								<text class="reminder-meta">{{ item.date }} · {{ item.doctorName }}</text>
							</view>
						</view>
						<text class="reminder-tag">待完成</text>
					</view>
				</view>
			</view>

			<!-- 功能入口 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">我的健康</text>
				</view>
				<view class="menu-list">
					<view class="menu-item" @click="navTo('/pages/patient/medical-record/medical-record')">
						<view class="menu-icon medical">
							<text class="app-icon uniui-folder-add-filled"></text>
						</view>
						<view class="menu-content">
							<text class="menu-title">我的病历</text>
							<text class="menu-desc">查看病历资料</text>
						</view>
						<text class="app-icon sm muted uniui-arrowright"></text>
					</view>
					<view class="menu-item" @click="navTo('/pages/patient/medication-advice/medication-advice')">
						<view class="menu-icon medication">
							<text class="app-icon uniui-compose"></text>
						</view>
						<view class="menu-content">
							<text class="menu-title">用药建议</text>
							<text class="menu-desc">查看用药建议</text>
						</view>
						<text class="app-icon sm muted uniui-arrowright"></text>
					</view>
					<view class="menu-item" @click="navTo('/pages/patient/doctor-advice/doctor-advice')">
						<view class="menu-icon advice">
							<text class="app-icon uniui-chatbubble-filled"></text>
						</view>
						<view class="menu-content">
							<text class="menu-title">医生建议</text>
							<text class="menu-desc">查看医生建议</text>
						</view>
						<text class="app-icon sm muted uniui-arrowright"></text>
					</view>
					<view class="menu-item" @click="navTo('/pages/patient/follow-plan/follow-plan')">
						<view class="menu-icon follow">
							<text class="app-icon uniui-calendar-filled"></text>
						</view>
						<view class="menu-content">
							<text class="menu-title">随访安排</text>
							<text class="menu-desc">查看随访计划</text>
						</view>
						<text class="app-icon sm muted uniui-arrowright"></text>
					</view>
				</view>
			</view>

			<!-- 最近用药建议 -->
			<view class="section" v-if="recentMedications.length">
				<view class="section-header">
					<text class="section-title">最近用药建议</text>
					<text class="section-more" @click="navTo('/pages/patient/medication-advice/medication-advice')">查看全部</text>
				</view>
				<view class="med-list">
					<view class="med-item" v-for="(item, i) in recentMedications" :key="i">
						<view class="med-name">{{ item.medicationName }}</view>
						<view class="med-dosage">{{ item.dosage }}{{ item.unit }} · {{ item.frequency }}</view>
						<view class="med-duration" v-if="item.duration">服用时间：{{ item.duration }}</view>
					</view>
				</view>
			</view>

			<!-- 快速操作 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">快速操作</text>
				</view>
				<view class="quick-grid">
					<view class="quick-item" @click="navTo('/pages/patient/upload-external/upload-external')">
						<view class="quick-icon">
							<text class="app-icon uniui-cloud-upload-filled"></text>
						</view>
						<text class="quick-text">上传外院资料</text>
					</view>
					<view class="quick-item" @click="navTo('/pages/patient/visit-history/visit-history')">
						<view class="quick-icon">
							<text class="app-icon uniui-calendar-filled"></text>
						</view>
						<text class="quick-text">就诊记录</text>
					</view>
					<view class="quick-item" @click="navTo('/pages/patient/external-supplement/external-supplement')">
						<view class="quick-icon">
							<text class="app-icon uniui-paperclip"></text>
						</view>
						<text class="quick-text">补充资料</text>
					</view>
				</view>
			</view>
		</template>

		<!-- 自定义tabBar -->
		<custom-tabbar :current="0" />
	</view>
</template>

<script>
// 患者端 API
import { getStats } from '@/api/dashboard.js'
import { getFollowUpList } from '@/api/followup.js'
import { getMedicationList } from '@/api/medication.js'
import { getPatientDoctor } from '@/api/relation.js'

export default {
	data() {
		return {
			userInfo: {},
			doctorBound: false,
			doctorName: '',
			// 患者端数据
			pendingFollowUps: [],
			recentMedications: [],
			visitCount: 0,
			adviceCount: 0,
			// 医生端数据
			doctorStats: {
				patientCount: 0,
				pendingFollow: 0,
				medicalRecord: 0,
				medicationCount: 0
			}
		};
	},
	computed: {
		isDoctor() {
			return (uni.getStorageSync('role') || 'patient') === 'doctor';
		},
		greeting() {
			const hour = new Date().getHours();
			if (hour < 6) return '夜深了';
			if (hour < 9) return '早上好';
			if (hour < 12) return '上午好';
			if (hour < 14) return '中午好';
			if (hour < 18) return '下午好';
			if (hour < 22) return '晚上好';
			return '夜深了';
		}
	},
	onLoad() {
		this.userInfo = uni.getStorageSync('userInfo') || {};
		this.doctorBound = !!uni.getStorageSync('doctorBound');
		this.doctorName = uni.getStorageSync('doctorName') || '';
		// 根据角色动态设置导航栏标题
		if (this.isDoctor) {
			uni.setNavigationBarTitle({ title: '医生工作台' });
		} else {
			uni.setNavigationBarTitle({ title: '即时随访' });
		}
	},
	onShow() {
		if (!uni.getStorageSync('token')) {
			uni.reLaunch({ url: '/pages/login/login' });
			return;
		}
		// 根据角色加载数据
		if (this.isDoctor) {
			this.loadDoctorData();
		} else {
			this.loadPatientData();
		}
	},
	methods: {
		// 医生端加载数据
		async loadDoctorData() {
			// 模拟数据，实际可从API获取
			this.doctorStats = {
				patientCount: 28,
				pendingFollow: 5,
				medicalRecord: 156,
				medicationCount: 12
			};
		},
		// 患者端加载数据
		// 患者端加载数据
		async loadPatientData() {
			try {
				// 获取绑定信息
				if (this.userInfo.id) {
					try {
						const binding = await getPatientDoctor(this.userInfo.id);
						if (binding) {
							this.doctorBound = true;
							this.doctorName = binding.doctorName;
							uni.setStorageSync('doctorBound', true);
							uni.setStorageSync('doctorName', binding.doctorName);
							uni.setStorageSync('doctorId', binding.doctorId);
						} else {
							this.doctorBound = false;
							uni.setStorageSync('doctorBound', false);
						}
					} catch (e) {
						// 使用本地存储的绑定信息
						this.doctorBound = !!uni.getStorageSync('doctorBound');
						this.doctorName = uni.getStorageSync('doctorName') || '';
					}
				}

				// 获取统计数据
				const stats = await getStats();
				if (stats) {
					this.visitCount = stats.visitCount || 0;
					this.adviceCount = stats.adviceCount || 0;
				}

				// 获取随访列表
				const followRes = await getFollowUpList({ pageNum: 1, pageSize: 10 });
				if (followRes && followRes.list) {
					const pendingList = followRes.list.filter(f => f.status === 'pending' || f.status === '待随访');
					this.pendingFollowUps = pendingList.slice(0, 3).map(f => ({
						id: f.id,
						title: f.project || '随访',
						date: f.followDate || f.date,
						doctorName: f.doctorName || '医生'
					}));
				}

				// 获取用药记录
				const medRes = await getMedicationList({ pageNum: 1, pageSize: 5 });
				if (medRes && medRes.list) {
					this.recentMedications = medRes.list.slice(0, 3).map(m => ({
						id: m.id,
						medicationName: m.medicationName,
						dosage: m.dosage,
						unit: m.unit || '',
						frequency: m.frequency,
						duration: m.duration
					}));
				}
			} catch (e) {
				console.error('加载数据失败:', e);
			}
		},
		goPatientCenter() {
			uni.switchTab({ url: '/pages/patient-center/patient-center' });
		},
		handleLogout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('token');
						uni.removeStorageSync('userInfo');
						uni.removeStorageSync('role');
						uni.removeStorageSync('doctorBound');
						uni.removeStorageSync('doctorName');
						uni.removeStorageSync('doctorId');
						uni.showToast({ title: '已退出登录', icon: 'success' });
						setTimeout(() => {
							uni.reLaunch({ url: '/pages/login/login' });
						}, 800);
					}
				}
			});
		},
		navTo(url) {
			if (!url) return;
			uni.navigateTo({ url });
		}
	}
};
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
	background: linear-gradient(135deg, $app-primary 0%, #14B8A6 100%);
	padding: 40rpx 32rpx 32rpx;
	position: relative;
}

.header-card.doctor {
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
}

.doctor-info-card {
	margin-top: 24rpx;
	background: rgba(255,255,255,0.15);
	border-radius: 16rpx;
	padding: 20rpx 24rpx;
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.doctor-info-card .app-icon {
	font-size: 32rpx !important;
	color: #fff !important;
}

.info-text {
	font-size: 28rpx;
	color: #fff;
	flex: 1;
}

.info-tag {
	font-size: 24rpx;
	color: #fff;
	background: rgba(255,255,255,0.2);
	padding: 6rpx 16rpx;
	border-radius: 16rpx;
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

.doctor-bind-card {
	margin-top: 24rpx;
	background: rgba(255,255,255,0.15);
	border-radius: 16rpx;
	padding: 20rpx 24rpx;
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.doctor-bind-card .app-icon {
	font-size: 32rpx !important;
	color: #fff !important;
}

.bind-label {
	font-size: 28rpx;
	color: rgba(255,255,255,0.85);
}

.bind-name {
	font-size: 28rpx;
	color: #fff;
	font-weight: 500;
	margin-left: auto;
}

.doctor-bind-card.unbind {
	justify-content: center;
	background: rgba(255,255,255,0.2);
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

/* 健康概览 */
.health-grid {
	display: flex;
	justify-content: space-between;
}

.health-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.health-icon-wrap {
	width: 72rpx;
	height: 72rpx;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
}

.health-icon-wrap .app-icon {
	font-size: 36rpx !important;
	color: #fff !important;
}

.health-icon-wrap.primary { background: $app-primary; }
.health-icon-wrap.warning { background: #F59E0B; }
.health-icon-wrap.success { background: #10B981; }
.health-icon-wrap.info { background: #3B82F6; }

/* 医生端工作概览图标 */
.health-icon-wrap.doctor-primary { background: #6366F1; }
.health-icon-wrap.doctor-warning { background: #F59E0B; }
.health-icon-wrap.doctor-success { background: #10B981; }
.health-icon-wrap.doctor-info { background: #EC4899; }

.health-value {
	font-size: 40rpx;
	font-weight: bold;
	color: $app-text;
}

.health-label {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
}

/* 随访提醒 */
.reminder-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.reminder-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #F9FAFB;
	border-radius: 14rpx;
	padding: 20rpx;
}

.reminder-left {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.reminder-icon {
	width: 48rpx;
	height: 48rpx;
	border-radius: 12rpx;
	background: $app-primary-bg;
	display: flex;
	align-items: center;
	justify-content: center;
}

.reminder-icon .app-icon {
	font-size: 28rpx !important;
	color: $app-primary !important;
}

.reminder-title {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
}

.reminder-meta {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
	display: block;
}

.reminder-tag {
	font-size: 24rpx;
	color: #F59E0B;
	background: #FEF3C7;
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
}

/* 功能菜单 */
.menu-list {
	display: flex;
	flex-direction: column;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.menu-icon .app-icon {
	font-size: 32rpx !important;
	color: #fff !important;
}

.menu-icon.medical { background: #8B5CF6; }
.menu-icon.medication { background: #EC4899; }
.menu-icon.advice { background: #3B82F6; }
.menu-icon.follow { background: $app-primary; }

/* 医生端菜单图标 */
.menu-icon.doctor-patient { background: #6366F1; }
.menu-icon.doctor-follow { background: #8B5CF6; }
.menu-icon.doctor-medication { background: #EC4899; }

.menu-content {
	flex: 1;
}

.menu-title {
	font-size: 30rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
}

.menu-desc {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
	display: block;
}

/* 最近用药 */
.med-list {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.med-item {
	background: #F9FAFB;
	border-radius: 12rpx;
	padding: 20rpx;
}

.med-name {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
}

.med-dosage {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
	display: block;
}

.med-duration {
	font-size: 22rpx;
	color: $app-primary;
	margin-top: 8rpx;
	display: block;
}

/* 快速操作 */
.quick-grid {
	display: flex;
	justify-content: space-around;
}

.quick-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.quick-icon {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	background: $app-primary-bg;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
}

.quick-icon .app-icon {
	font-size: 40rpx !important;
	color: $app-primary !important;
}

.quick-icon.doctor {
	background: rgba(99, 102, 241, 0.1);
}

.quick-icon.doctor .app-icon {
	color: #6366F1 !important;
}

.quick-text {
	font-size: 26rpx;
	color: $app-text;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	text-align: center;
	padding: 40rpx 0;
}
</style>