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
						<view class="action-btn" @click="navTo('/pages/doctor/my-info/my-info')">
							<text class="app-icon uniui-gear-filled"></text>
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
					<view class="health-item" @click="navTo('/pages/doctor/episode-list/episode-list')">
						<view class="health-icon-wrap doctor-episode">
							<text class="app-icon uniui-fire-filled"></text>
						</view>
						<text class="health-value">{{ doctorStats.episodeCount }}</text>
						<text class="health-label">发作记录</text>
					</view>
				</view>
			</view>

			<!-- 待处理提醒 -->
			<view class="section" v-if="pendingDoctorFollowUps.length">
				<view class="section-header">
					<text class="section-title">待处理提醒</text>
					<text class="section-more" @click="navTo('/pages/doctor/follow-plan/follow-plan')">查看全部</text>
				</view>
				<view class="reminder-list">
					<view class="reminder-item doctor" v-for="(item, i) in pendingDoctorFollowUps" :key="i" @click="navTo('/pages/doctor/patient-info/patient-info?id=' + item.patientId)">
						<view class="reminder-left">
							<view class="reminder-icon doctor">
								<text class="app-icon uniui-calendar-filled"></text>
							</view>
							<view class="reminder-content">
								<text class="reminder-title">{{ item.patientName }} - {{ item.project }}</text>
								<text class="reminder-meta">随访日期: {{ item.date }}</text>
							</view>
						</view>
						<text class="reminder-tag doctor">待随访</text>
					</view>
				</view>
			</view>

			<!-- 快速操作 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">快速操作</text>
				</view>
				<view class="quick-grid">
					<view class="quick-item" @click="navTo('/pages/doctor/add-patient/add-patient')">
						<view class="quick-icon doctor">
							<text class="app-icon uniui-personadd-filled"></text>
						</view>
						<text class="quick-text">新增患者</text>
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
					<view class="quick-item" @click="navTo('/pages/doctor/add-episode/add-episode')">
						<view class="quick-icon doctor">
							<text class="app-icon uniui-fire-filled"></text>
						</view>
						<text class="quick-text">新增发作</text>
					</view>
				</view>
			</view>

			<!-- 最近患者 -->
			<view class="section" v-if="recentPatients.length">
				<view class="section-header">
					<text class="section-title">最近患者</text>
					<text class="section-more" @click="goPatientCenter">查看全部</text>
				</view>
				<view class="patient-list">
					<view class="patient-item" v-for="(item, i) in recentPatients" :key="i" @click="navTo('/pages/doctor/patient-info/patient-info?id=' + item.id)">
						<view class="patient-avatar">
							<text class="avatar-text">{{ item.name.charAt(0) }}</text>
						</view>
						<view class="patient-content">
							<text class="patient-name">{{ item.name }}</text>
							<text class="patient-meta">{{ item.gender }} | {{ item.age }}岁</text>
						</view>
						<text class="app-icon sm muted uniui-arrowright"></text>
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
						<view class="disease-tags-row" v-if="diseaseTypeLabels.length">
							<view class="mini-tag" v-for="(label, i) in diseaseTypeLabels" :key="i">{{ label }}</view>
						</view>
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
					<view class="health-item stat-only">
						<view class="health-icon-wrap warning">
							<text class="app-icon uniui-notification-filled"></text>
						</view>
						<text class="health-value">{{ pendingFollowUps.length }}</text>
						<text class="health-label">待随访</text>
					</view>
					<view class="health-item stat-only">
						<view class="health-icon-wrap primary">
							<text class="app-icon uniui-compose"></text>
						</view>
						<text class="health-value">{{ medicationCount }}</text>
						<text class="health-label">用药建议</text>
					</view>
					<view class="health-item stat-only">
						<view class="health-icon-wrap success">
							<text class="app-icon uniui-folder-add-filled"></text>
						</view>
						<text class="health-value">{{ visitCount }}</text>
						<text class="health-label">病历数量</text>
					</view>
					<view class="health-item stat-only">
						<view class="health-icon-wrap episode">
							<text class="app-icon uniui-fire-filled"></text>
						</view>
						<text class="health-value">{{ episodeCount }}</text>
						<text class="health-label">发作次数</text>
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
					<view class="menu-item" @click="navTo('/pages/patient/disease-episode/disease-episode')">
						<view class="menu-icon episode">
							<text class="app-icon uniui-fire-filled"></text>
						</view>
						<view class="menu-content">
							<text class="menu-title">疾病发作记录</text>
							<text class="menu-desc">查看发作记录</text>
						</view>
						<text class="app-icon sm muted uniui-arrowright"></text>
					</view>
				</view>
			</view>

			<!-- 快速操作 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">快速操作</text>
				</view>
				<view class="quick-grid">
					<view class="quick-item" @click="navTo('/pages/patient/add-visit/add-visit')">
						<view class="quick-icon">
							<text class="app-icon uniui-calendar"></text>
						</view>
						<text class="quick-text">就诊记录</text>
					</view>
					<view class="quick-item" @click="navTo('/pages/patient/add-episode/add-episode')">
						<view class="quick-icon">
							<text class="app-icon uniui-fire-filled"></text>
						</view>
						<text class="quick-text">发作记录</text>
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
import { getEpisodeCount } from '@/api/episode.js'
// 医生端 API
import { getMyPatients } from '@/api/patient.js'

export default {
	data() {
		return {
			userInfo: {},
			doctorBound: false,
			doctorName: '',
			// 患者端数据
			pendingFollowUps: [],
			medicationCount: 0,
			visitCount: 0,
			episodeCount: 0,
			// 医生端数据
			doctorStats: {
				patientCount: 0,
				pendingFollow: 0,
				medicalRecord: 0,
				medicationCount: 0,
				episodeCount: 0
			},
			// 医生端最近患者
			recentPatients: [],
			// 医生端待处理随访
			pendingDoctorFollowUps: []
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
		},
		diseaseTypeLabels() {
			const types = this.userInfo.diseaseTypes || [];
			const labelMap = {
				'MS': 'MS',
				'NMOSD': 'NMOSD',
				'MG': 'MG',
				'MOGAD': 'MOGAD',
				'AUTO_ENCEPHALITIS': '自免脑',
				'GBS': 'GBS',
				'CIDP': 'CIDP',
				'OTHER': '其他'
			};
			return types.map(t => labelMap[t] || t).slice(0, 3);
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
		// 刷新用户信息（包括疾病类型）
		this.userInfo = uni.getStorageSync('userInfo') || {};
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
			try {
				const statsRes = await getStats()
				console.log('医生端stats响应:', statsRes)
				if (statsRes) {
					this.doctorStats = {
						patientCount: statsRes.totalPatients || 0,
						pendingFollow: statsRes.pendingFollowUps || 0,
						medicalRecord: statsRes.totalMedicalRecords || 0,
						medicationCount: statsRes.totalMedications || 0,
						episodeCount: statsRes.totalEpisodes || 0
					}
				}
				// 获取最近患者列表（5条）
				const patientRes = await getMyPatients({ pageNum: 1, pageSize: 5 })
				if (patientRes && patientRes.list) {
					this.recentPatients = patientRes.list.map(p => ({
						id: p.id,
						name: p.name || '患者',
						gender: p.gender || '男',
						age: p.age || '-',
						diseaseType: p.diseaseTypes?.[0] || ''
					}))
				}
				// 获取待处理随访（3条）
				const followRes = await getFollowUpList({ pageNum: 1, pageSize: 10 })
				if (followRes && followRes.list) {
					const pendingList = followRes.list.filter(f => f.status === 0)
					this.pendingDoctorFollowUps = pendingList.slice(0, 3).map(f => ({
						id: f.id,
						patientId: f.patientId,
						patientName: f.patientName || '患者',
						date: f.date || '',
						project: f.project || '随访'
					}))
				}
			} catch (e) {
				console.error('加载医生端数据失败:', e)
			}
		},
		// 患者端加载数据
		async loadPatientData() {
			// 获取绑定信息
			if (this.userInfo.id) {
				try {
					const binding = await getPatientDoctor(this.userInfo.id);
					// bindStatus: 0-待审核, 1-已确认, null-未绑定
					if (binding && binding.bindStatus === 1) {
						// 已确认绑定，显示医生姓名
						this.doctorBound = true;
						this.doctorName = binding.doctorName;
						uni.setStorageSync('doctorBound', true);
						uni.setStorageSync('doctorName', binding.doctorName);
						uni.setStorageSync('doctorId', binding.doctorId);
					} else if (binding && binding.bindStatus === 0) {
						// 待审核状态，不显示医生姓名
						this.doctorBound = false;
						this.doctorName = '审核中';
						uni.setStorageSync('doctorBound', false);
						uni.setStorageSync('doctorName', '');
					} else {
						// 未绑定或其他状态
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
			try {
				const stats = await getStats();
				if (stats) {
					this.visitCount = stats.visitCount || 0;
				}
			} catch (e) {
				console.error('获取统计数据失败:', e);
			}

			// 获取发作次数
			if (this.userInfo.id) {
				try {
					this.episodeCount = await getEpisodeCount(this.userInfo.id) || 0;
				} catch (e) {
					this.episodeCount = 0;
				}
			}

			// 获取随访列表（只查询当前患者的随访）
			if (this.userInfo.id) {
				try {
					const followRes = await getFollowUpList({ pageNum: 1, pageSize: 10, patientId: this.userInfo.id });
					if (followRes && followRes.list) {
						const pendingList = followRes.list.filter(f => f.status === 0);
						this.pendingFollowUps = pendingList.slice(0, 3).map(f => ({
							id: f.id,
							title: f.project || '随访',
							date: f.date || '',
							doctorName: f.doctorName || '医生'
						}));
					}
				} catch (e) {
					console.error('获取随访列表失败:', e);
				}
			}

			// 获取用药记录数量
			try {
				const medRes = await getMedicationList({ pageNum: 1, pageSize: 100 });
				if (medRes) {
					this.medicationCount = medRes.total || 0;
				}
			} catch (e) {
				console.error('获取用药记录失败:', e);
			}
		},
		goPatientCenter() {
			if (this.isDoctor) {
				uni.navigateTo({ url: '/pages/doctor/patient-list/patient-list' });
			} else {
				uni.switchTab({ url: '/pages/patient-center/patient-center' });
			}
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
	padding-bottom: 140rpx;
}

/* 顶部用户卡片 */
.header-card {
	background: $app-gradient-primary;
	padding: 48rpx 32rpx 36rpx;
	position: relative;
	overflow: hidden;
}

.header-card::before {
	content: '';
	position: absolute;
	top: -80rpx;
	right: -60rpx;
	width: 280rpx;
	height: 280rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 50%;
	pointer-events: none;
}

.header-card.doctor {
	background: $app-gradient-doctor;
}

.doctor-info-card {
	margin-top: 28rpx;
	background: rgba(255,255,255,0.15);
	border-radius: $app-radius-sm;
	padding: 24rpx 28rpx;
	display: flex;
	align-items: center;
	gap: 16rpx;
	backdrop-filter: blur(10px);
}

.doctor-info-card .app-icon {
	font-size: 36rpx !important;
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
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
}

.user-info {
	display: flex;
	align-items: center;
}

.avatar {
	width: 104rpx;
	height: 104rpx;
	border-radius: 50%;
	border: 4rpx solid rgba(255,255,255,0.4);
	margin-right: 28rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.user-meta {
	flex: 1;
}

.greeting {
	font-size: 28rpx;
	color: rgba(255,255,255,0.85);
	display: block;
	margin-bottom: 8rpx;
}

.username {
	font-size: 40rpx;
	color: #fff;
	font-weight: 700;
	display: block;
}

/* 疾病标签行 */
.disease-tags-row {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
	margin-top: 8rpx;
}

.mini-tag {
	font-size: 22rpx;
	color: #fff;
	background: rgba(255,255,255,0.25);
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
}

.header-actions {
	display: flex;
	gap: 20rpx;
}

.action-btn {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: $app-transition;
}

.action-btn:active {
	background: rgba(255,255,255,0.3);
	transform: scale(0.95);
}

.action-btn .app-icon {
	font-size: 40rpx !important;
	color: #fff !important;
}

.doctor-bind-card {
	margin-top: 28rpx;
	background: rgba(255,255,255,0.15);
	border-radius: $app-radius-sm;
	padding: 24rpx 28rpx;
	display: flex;
	align-items: center;
	gap: 16rpx;
	backdrop-filter: blur(10px);
}

.doctor-bind-card .app-icon {
	font-size: 36rpx !important;
	color: #fff !important;
}

.bind-label {
	font-size: 28rpx;
	color: rgba(255,255,255,0.85);
}

.bind-name {
	font-size: 28rpx;
	color: #fff;
	font-weight: 600;
	margin-left: auto;
}

.doctor-bind-card.unbind {
	justify-content: center;
	background: rgba(255,255,255,0.2);
}

/* 通用区块 */
.section {
	margin: $app-spacing-md;
	padding: $app-spacing-md;
	background: $app-card-bg;
	border-radius: $app-radius;
	box-shadow: $app-shadow;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $app-spacing-md;
}

.section-title {
	font-size: 34rpx;
	font-weight: 700;
	color: $app-text;
}

.section-more {
	font-size: 26rpx;
	color: $app-primary;
	display: flex;
	align-items: center;
	gap: 4rpx;
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
	padding: $app-spacing-sm 0;
	transition: $app-transition;
}

.health-item:active {
	transform: scale(0.96);
}

.health-icon-wrap {
	width: 80rpx;
	height: 80rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.health-icon-wrap .app-icon {
	font-size: 40rpx !important;
	color: #fff !important;
}

.health-icon-wrap.primary { background: $app-primary; }
.health-icon-wrap.warning { background: $app-warning; }
.health-icon-wrap.success { background: $app-success; }
.health-icon-wrap.info { background: $app-info; }
.health-icon-wrap.episode { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }

/* 统计项样式（无点击效果） */
.health-item.stat-only:active {
	transform: none;
}

/* 医生端工作概览图标 */
.health-icon-wrap.doctor-primary { background: #6366F1; }
.health-icon-wrap.doctor-warning { background: $app-warning; }
.health-icon-wrap.doctor-success { background: $app-success; }
.health-icon-wrap.doctor-info { background: #EC4899; }
.health-icon-wrap.doctor-episode { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }

.health-value {
	font-size: 44rpx;
	font-weight: 700;
	color: $app-text;
}

.health-label {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 6rpx;
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
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	padding: 24rpx;
	transition: $app-transition;
}

.reminder-item:active {
	background: #EBEDEF;
}

.reminder-left {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.reminder-icon {
	width: 56rpx;
	height: 56rpx;
	border-radius: 14rpx;
	background: $app-primary-bg;
	display: flex;
	align-items: center;
	justify-content: center;
}

.reminder-icon.doctor {
	background: rgba(99, 102, 241, 0.1);
}

.reminder-icon .app-icon {
	font-size: 32rpx !important;
	color: $app-primary !important;
}

.reminder-icon.doctor .app-icon {
	color: #6366F1 !important;
}

.reminder-content {
	flex: 1;
}

.reminder-title {
	font-size: 30rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
}

.reminder-meta {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 6rpx;
	display: block;
}

.reminder-tag {
	font-size: 24rpx;
	color: $app-warning;
	background: $app-warning-bg;
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
	font-weight: 500;
}

.reminder-tag.doctor {
	color: #6366F1;
	background: rgba(99, 102, 241, 0.1);
}

/* 最近患者列表 */
.patient-list {
	display: flex;
	flex-direction: column;
}

.patient-item {
	display: flex;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid $app-divider;
	transition: $app-transition;
}

.patient-item:active {
	background: $app-hover-bg;
	margin: 0 -24rpx;
	padding-left: 24rpx;
	padding-right: 24rpx;
}

.patient-item:last-child {
	border-bottom: none;
}

.patient-avatar {
	width: 64rpx;
	height: 64rpx;
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

.patient-content {
	flex: 1;
}

.patient-name {
	font-size: 30rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
}

.patient-meta {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
	display: block;
}

/* 功能菜单 */
.menu-list {
	display: flex;
	flex-direction: column;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 28rpx 0;
	border-bottom: 1rpx solid $app-divider;
	transition: $app-transition;
}

.menu-item:active {
	background: $app-hover-bg;
	margin: 0 -28rpx;
	padding-left: 28rpx;
	padding-right: 28rpx;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-icon {
	width: 72rpx;
	height: 72rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.menu-icon .app-icon {
	font-size: 36rpx !important;
	color: #fff !important;
}

.menu-icon.medical { background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); }
.menu-icon.medication { background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%); }
.menu-icon.follow { background: $app-gradient-primary; }
.menu-icon.episode { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }

.menu-content {
	flex: 1;
}

.menu-title {
	font-size: 32rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
}

.menu-desc {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 6rpx;
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
	padding: $app-spacing-sm;
	transition: $app-transition;
}

.quick-item:active {
	transform: scale(0.95);
}

.quick-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	background: $app-primary-bg;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(8, 145, 178, 0.15);
	transition: $app-transition;
}

.quick-icon .app-icon {
	font-size: 44rpx !important;
	color: $app-primary !important;
}

.quick-icon.doctor {
	background: rgba(99, 102, 241, 0.1);
	box-shadow: 0 4rpx 16rpx rgba(99, 102, 241, 0.15);
}

.quick-icon.doctor .app-icon {
	color: #6366F1 !important;
}

.quick-text {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
}
</style>