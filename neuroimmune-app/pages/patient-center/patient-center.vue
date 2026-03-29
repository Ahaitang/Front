<template>
	<view class="container">
		<!-- 医生端：病人中心 -->
		<template v-if="isDoctor">
			<!-- 搜索和筛选区 -->
			<view class="filter-section">
				<view class="search-bar">
					<text class="app-icon uniui-search"></text>
					<input class="search-input" type="text" placeholder="搜索患者姓名" v-model="keyword" @input="onSearchPatient" />
				</view>
				<view class="disease-tags">
					<view class="tag" :class="{ active: currentDisease === '' }" @click="selectDisease('')">全部</view>
					<view class="tag" :class="{ active: currentDisease === 'MS' }" @click="selectDisease('MS')">MS</view>
					<view class="tag" :class="{ active: currentDisease === 'NMOSD' }" @click="selectDisease('NMOSD')">NMOSD</view>
					<view class="tag" :class="{ active: currentDisease === 'MG' }" @click="selectDisease('MG')">MG</view>
					<view class="tag more" @click="showMoreDiseases">
						更多
						<text class="app-icon uniui-arrowdown"></text>
					</view>
				</view>
			</view>

			<!-- 统计概览 -->
			<view class="stats-overview">
				<view class="stats-left">
					<text class="stats-label">患者总数</text>
					<text class="stats-num">{{ filteredPatientList.length }}</text>
				</view>
				<view class="stats-right">
					<view class="stat-badge pending">
						<text class="badge-num">{{ pendingCount }}</text>
						<text class="badge-label">待随访</text>
					</view>
				</view>
			</view>

			<!-- 患者列表 -->
			<view class="patient-list">
				<view class="patient-card" v-for="(p, i) in filteredPatientList" :key="i">
					<view class="card-header" @click="goPatientInfo(p)">
						<view class="avatar-wrap">
							<image class="patient-avatar" :src="p.avatar || '/static/component.png'" mode="aspectFill"></image>
							<view class="online-dot" v-if="p.hasFollowUp"></view>
						</view>
						<view class="patient-info">
							<view class="info-row">
								<text class="patient-name">{{ p.name }}</text>
								<text class="patient-gender">{{ p.gender }}</text>
							</view>
							<view class="info-meta">
								<text class="patient-age">{{ p.age }}岁</text>
								<view class="disease-tag" :class="getDiseaseClass(p.diseaseType)" v-if="p.diseaseType">
									{{ getDiseaseShort(p.diseaseType) }}
								</view>
							</view>
						</view>
						<text class="app-icon uniui-arrowright"></text>
					</view>
					<view class="card-footer">
						<view class="action-btn follow" @click="navTo('/pages/doctor/add-follow/add-follow?patientId=' + p.id)">
							<text class="app-icon uniui-list"></text>
							<text>随访</text>
						</view>
						<view class="action-btn call" @click="callP(p.phone)">
							<text class="app-icon uniui-phone-filled"></text>
							<text>电话</text>
						</view>
						<view class="action-btn info" @click="goPatientInfo(p)">
							<text class="app-icon uniui-info-filled"></text>
							<text>详情</text>
						</view>
					</view>
				</view>
			</view>
			<view class="empty-state" v-if="!filteredPatientList.length">
				<text class="app-icon empty-icon uniui-contact"></text>
				<text class="empty-text">暂无患者</text>
				<text class="empty-tip">添加患者后将在此显示</text>
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
			<view class="stats-row card">
				<view class="stat-item" @click="navTo('/pages/patient/follow-plan/follow-plan')">
					<text class="app-icon primary uniui-calendar-filled"></text>
					<text class="stat-num">{{ stats.followUpCount }}</text>
					<text class="stat-label">随访次数</text>
				</view>
				<view class="stat-item" @click="navTo('/pages/patient/medication-advice/medication-advice')">
					<text class="app-icon primary uniui-compose"></text>
					<text class="stat-num">{{ stats.medicationCount }}</text>
					<text class="stat-label">用药记录</text>
				</view>
				<view class="stat-item" @click="navTo('/pages/patient/doctor-advice/doctor-advice')">
					<text class="app-icon primary uniui-chatbubble-filled"></text>
					<text class="stat-num">{{ stats.adviceCount }}</text>
					<text class="stat-label">医生建议</text>
				</view>
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
				<view class="menu-item" @click="navTo('/pages/patient/upload-external/upload-external')">
					<text class="menu-label"><text class="app-icon muted uniui-cloud-upload-filled"></text> 外院资料</text>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
				<view class="menu-item" @click="navTo('/pages/patient/visit-history/visit-history')">
					<text class="menu-label"><text class="app-icon muted uniui-calendar"></text> 本院就诊记录</text>
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
import { getDoctorPatientDetails } from '@/api/relation.js'

export default {
	data() {
		return {
			keyword: '',
			patientList: [],
			userInfo: {},
			doctorBound: false,
			stats: { followUpCount: 0, medicationCount: 0, adviceCount: 0 },
			currentDisease: '',
			diseaseOptions: [
				{ label: '全部疾病', value: '' },
				{ label: 'MS（多发性硬化）', value: 'MS' },
				{ label: 'NMOSD（视神经脊髓炎）', value: 'NMOSD' },
				{ label: 'MG（重症肌无力）', value: 'MG' },
				{ label: 'MOGAD（MOG抗体病）', value: 'MOGAD' },
				{ label: '自身免疫性脑炎', value: '自身免疫性脑炎' },
				{ label: 'GBS（格林-巴利综合征）', value: 'GBS' },
				{ label: 'CIDP（慢性炎性脱髓鞘性多发性神经病）', value: 'CIDP' },
				{ label: '其它疾病', value: '其它疾病' }
			]
		};
	},
	computed: {
		isDoctor() {
			return (uni.getStorageSync('role') || 'patient') === 'doctor';
		},
		currentDiseaseLabel() {
			const found = this.diseaseOptions.find(d => d.value === this.currentDisease)
			return found ? found.label : '全部疾病'
		},
		filteredPatientList() {
			let list = this.patientList
			// 按疾病筛选
			if (this.currentDisease) {
				list = list.filter(p => p.diseaseType === this.currentDisease)
			}
			// 按姓名搜索
			const k = (this.keyword || '').trim().toLowerCase();
			if (k) {
				list = list.filter((p) => (p.name || '').toLowerCase().indexOf(k) >= 0);
			}
			return list;
			},
			pendingCount() {
				return this.patientList.filter(p => p.hasFollowUp).length
			}
		},
		onLoad() {
		this.userInfo = uni.getStorageSync('userInfo') || {};
		this.doctorBound = !!uni.getStorageSync('doctorBound');
		// 根据角色动态设置导航栏标题
		if (this.isDoctor) {
			uni.setNavigationBarTitle({ title: '患者管理' });
		} else {
			uni.setNavigationBarTitle({ title: '我的' });
		}
	},
	onShow() {
		if (!uni.getStorageSync('token')) {
			uni.reLaunch({ url: '/pages/login/login' });
			return;
		}
		this.userInfo = uni.getStorageSync('userInfo') || {};
		this.doctorBound = !!uni.getStorageSync('doctorBound');
		this.loadData();
	},
	methods: {
		async loadData() {
			if (this.isDoctor) {
				// 医生端：加载患者列表（从关系表获取）
				try {
					const doctorId = this.userInfo.id
					if (!doctorId) {
						console.error('医生ID不存在')
						return
					}
					console.log('加载患者列表, doctorId:', doctorId)
					const patients = await getDoctorPatientDetails(doctorId)
					console.log('患者列表响应:', patients)
					if (patients && patients.length) {
						this.patientList = patients.map(p => ({
							id: p.patientId,
							name: p.patientName,
							gender: p.gender === 'male' ? '男' : (p.gender === 'female' ? '女' : p.gender),
							age: p.age,
							phone: p.phone || '',
							avatar: '',
							hasFollowUp: p.hasFollowUp,
							diseaseType: p.diseaseType || ''
						}))
						console.log('处理后的患者列表:', this.patientList)
					}
				} catch (e) {
					console.error('加载患者列表失败:', e);
				}
			} else {
				// 患者端：加载统计数据
				try {
					const followRes = await getFollowUpList({ pageNum: 1, pageSize: 100 });
					if (followRes) {
						this.stats.followUpCount = followRes.total || 0;
					}
					const medRes = await getMedicationList({ pageNum: 1, pageSize: 100 });
					if (medRes) {
						this.stats.medicationCount = medRes.total || 0;
					}
				} catch (e) {
					console.error('加载统计数据失败:', e);
					this.stats = {
						followUpCount: 2,
						medicationCount: 1,
						adviceCount: 0
					};
				}
			}
		},
		goPatientInfo(p) {
			uni.navigateTo({ url: '/pages/doctor/patient-info/patient-info?id=' + (p.id || '1') });
		},
		navTo(url) {
			uni.navigateTo({ url });
		},
		onSearchPatient() {},
		onDiseaseChange(e) {
			const selected = this.diseaseOptions[e.detail.value]
			this.currentDisease = selected.value
		},
		selectDisease(value) {
			this.currentDisease = value
		},
		showMoreDiseases() {
			const moreOptions = this.diseaseOptions.filter(d => d.value)
			if (!moreOptions.length) {
				uni.showToast({ title: '没有更多选项', icon: 'none' })
				return
			}
			uni.showActionSheet({
				itemList: moreOptions.map(d => d.label),
				success: (res) => {
					const selected = moreOptions[res.tapIndex]
					if (selected) {
						this.currentDisease = selected.value
					}
				},
				fail: (err) => {
					console.log('ActionSheet cancelled or failed:', err)
				}
			})
		},
		getDiseaseClass(type) {
			const classMap = {
				'MS': 'ms',
				'NMOSD': 'nmosd',
				'MG': 'mg',
				'MOGAD': 'mogad',
				'自身免疫性脑炎': 'ae',
				'GBS': 'gbs',
				'CIDP': 'cidp',
				'其它疾病': 'other'
			}
			return classMap[type] || 'other'
		},
		getDiseaseShort(type) {
			const shortMap = {
				'MS': 'MS',
				'NMOSD': 'NMOSD',
				'MG': 'MG',
				'MOGAD': 'MOGAD',
				'自身免疫性脑炎': '自免脑',
				'GBS': 'GBS',
				'CIDP': 'CIDP',
				'其它疾病': '其他'
			}
			return shortMap[type] || type
		},
		callP(phone) {
			if (phone) uni.makePhoneCall({ phoneNumber: phone });
			else uni.showToast({ title: '暂无电话', icon: 'none' });
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
						uni.showToast({ title: '已退出登录', icon: 'success' });
						setTimeout(() => {
							uni.reLaunch({ url: '/pages/login/login' });
						}, 800);
					}
				}
			});
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container { min-height: 100vh; background: $app-bg; padding: 24rpx 24rpx 180rpx; }
.card { background: $app-card-bg; border-radius: $app-radius; padding: 28rpx; margin-bottom: 24rpx; box-shadow: $app-shadow; }

/* 搜索筛选区 */
.filter-section {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 24rpx;
	margin-bottom: 24rpx;
	box-shadow: $app-shadow;
}

.search-bar {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 20rpx 24rpx;
	background: $app-bg;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
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

.disease-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.disease-tags .tag {
	font-size: 26rpx;
	color: $app-text-secondary;
	padding: 12rpx 24rpx;
	background: $app-bg;
	border-radius: 20rpx;
	border: 1rpx solid $app-border;
}

.disease-tags .tag.active {
	background: $app-primary;
	color: #fff;
	border-color: $app-primary;
}

.disease-tags .tag.more {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.disease-tags .tag.more .app-icon {
	font-size: 20rpx;
}

/* 统计概览 */
.stats-overview {
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	border-radius: $app-radius;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(99, 102, 241, 0.3);
}

.stats-left {
	display: flex;
	flex-direction: column;
}

.stats-label {
	font-size: 28rpx;
	color: rgba(255,255,255,0.85);
	margin-bottom: 8rpx;
}

.stats-num {
	font-size: 56rpx;
	font-weight: bold;
	color: #fff;
}

.stats-right {
	display: flex;
	gap: 16rpx;
}

.stat-badge {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16rpx 28rpx;
	background: rgba(255,255,255,0.2);
	border-radius: 16rpx;
}

.stat-badge.pending .badge-num {
	font-size: 36rpx;
	font-weight: bold;
	color: #FCD34D;
}

.stat-badge .badge-label {
	font-size: 22rpx;
	color: rgba(255,255,255,0.85);
	margin-top: 4rpx;
}

/* 患者卡片 */
.patient-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.patient-card {
	background: $app-card-bg;
	border-radius: $app-radius;
	box-shadow: $app-shadow;
	overflow: hidden;
}

.card-header {
	display: flex;
	align-items: center;
	padding: 28rpx;
}

.avatar-wrap {
	position: relative;
	margin-right: 20rpx;
}

.patient-avatar {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
}

.online-dot {
	position: absolute;
	right: 0;
	bottom: 0;
	width: 20rpx;
	height: 20rpx;
	border-radius: 50%;
	background: #10B981;
	border: 3rpx solid #fff;
}

.patient-info {
	flex: 1;
}

.info-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 8rpx;
}

.patient-name {
	font-size: 32rpx;
	font-weight: bold;
	color: $app-text;
}

.patient-gender {
	font-size: 24rpx;
	color: $app-text-muted;
	padding: 4rpx 12rpx;
	background: $app-bg;
	border-radius: 8rpx;
}

.info-meta {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.patient-age {
	font-size: 26rpx;
	color: $app-text-secondary;
}

.disease-tag {
	font-size: 22rpx;
	padding: 6rpx 16rpx;
	border-radius: 12rpx;
	font-weight: 500;
}

.disease-tag.ms { background: #DBEAFE; color: #2563EB; }
.disease-tag.nmosd { background: #FCE7F3; color: #DB2777; }
.disease-tag.mg { background: #D1FAE5; color: #059669; }
.disease-tag.mogad { background: #FEF3C7; color: #D97706; }
.disease-tag.ae { background: #E0E7FF; color: #4F46E5; }
.disease-tag.gbs { background: #FED7AA; color: #EA580C; }
.disease-tag.cidp { background: #CFFAFE; color: #0891B2; }
.disease-tag.other { background: #F3F4F6; color: #6B7280; }

.card-header .app-icon {
	font-size: 32rpx;
	color: $app-text-muted;
}

.card-footer {
	display: flex;
	border-top: 1rpx solid $app-border;
	padding: 20rpx 28rpx;
	background: $app-bg;
}

.action-btn {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx;
	border-radius: 12rpx;
}

.action-btn .app-icon {
	font-size: 36rpx;
}

.action-btn text:last-child {
	font-size: 24rpx;
	color: $app-text-secondary;
}

.action-btn.follow .app-icon { color: $app-primary; }
.action-btn.call .app-icon { color: #10B981; }
.action-btn.info .app-icon { color: #6366F1; }

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 80rpx 0;
}

.empty-icon {
	font-size: 120rpx;
	color: $app-text-muted !important;
	margin-bottom: 24rpx;
}

.empty-text {
	font-size: 32rpx;
	color: $app-text-secondary;
	margin-bottom: 12rpx;
}

.empty-tip {
	font-size: 26rpx;
	color: $app-text-muted;
}
.my-card { position: relative; display: flex; flex-direction: column; align-items: center; padding: 48rpx; }
.my-avatar { width: 160rpx; height: 160rpx; border-radius: 50%; margin-bottom: 20rpx; }
.my-name-row { display: flex; align-items: center; }
.my-name { font-size: 32rpx; font-weight: bold; color: $app-text; margin-right: 12rpx; }
.my-badge { width: 24rpx; height: 24rpx; border-radius: 50%; background: $app-success; }
.auth-tag { background: $app-primary; border-radius: 6rpx; padding: 4rpx 12rpx; margin-left: 12rpx; }
.auth-tag text { font-size: 22rpx; color: #fff; }
.my-id { font-size: 24rpx; color: $app-text-muted; margin-top: 8rpx; display: block; }
.my-meta { font-size: 28rpx; color: $app-text-secondary; margin-top: 8rpx; display: block; }
.edit-icon { position: absolute; right: 28rpx; top: 48rpx; font-size: 28rpx; color: $app-primary; display: inline-flex; align-items: center; gap: 6rpx; }
.stats-row { display: flex; justify-content: space-around; padding: 32rpx; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-item .app-icon { margin-bottom: 8rpx; }
.stat-num { font-size: 36rpx; font-weight: bold; color: $app-text; }
.stat-label { font-size: 24rpx; color: $app-text-muted; margin-top: 8rpx; }
.menu-status.ok { color: $app-success; font-size: 26rpx; margin-right: 8rpx; }
.menu-status.warn { color: $app-error; font-size: 26rpx; margin-right: 8rpx; }
.logout-wrap { margin-top: 40rpx; padding: 0 24rpx; }
.logout-btn { width: 100%; height: 88rpx; line-height: 88rpx; background: #fff; color: $app-error; border: 1rpx solid $app-error; border-radius: $app-radius-sm; font-size: 32rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx; }
.logout-btn::after { border: none; }
.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 0; border-bottom: 1rpx solid $app-border; }
.menu-item:last-child { border-bottom: none; }
.menu-label { font-size: 28rpx; color: $app-text; display: inline-flex; align-items: center; gap: 16rpx; }
.menu-right { display: flex; align-items: center; gap: 8rpx; }
</style>