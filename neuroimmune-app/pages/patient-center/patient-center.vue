<template>
	<view class="container">
		<!-- 医生端：病人中心 -->
		<template v-if="isDoctor">
			<view class="search-bar card">
				<text class="app-icon sm muted uniui-search"></text>
				<input class="search-input" type="text" placeholder="请输入姓名搜索" v-model="keyword" @input="onSearchPatient" />
			</view>
			<view class="doctor-stats card">
				<text class="stats-title"><text class="app-icon primary uniui-contact-filled"></text> 患者管理</text>
				<view class="stats-row-inner">
					<view class="stat"><text class="num">{{ filteredPatientList.length }}</text><text class="txt">人</text></view>
				</view>
			</view>
			<view class="patient-list">
				<view class="patient-item card" v-for="(p, i) in filteredPatientList" :key="i">
					<view class="p-main" @click="goPatientInfo(p)">
						<image class="p-avatar" :src="p.avatar || '/static/component.png'" mode="aspectFill"></image>
						<view class="p-info">
							<text class="p-name">{{ p.name }}</text>
							<text class="p-meta">{{ p.gender || '男' }} {{ p.age || 45 }}岁</text>
							<text class="p-id" v-if="p.id">ID: {{ p.id }}</text>
						</view>
						<view class="p-badge" v-if="p.hasFollowUp"></view>
					</view>
					<view class="p-actions">
						<button class="btn-mini primary" @click="navTo('/pages/doctor/add-follow/add-follow?patientId=' + (p.id||'1'))">随访</button>
						<button class="btn-mini" @click="callP(p.phone)"><text class="app-icon sm uniui-phone-filled"></text> 电话</button>
					</view>
				</view>
			</view>
			<text class="empty-tip" v-if="!filteredPatientList.length">暂无患者</text>
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
	</view>
</template>

<script>
import { getPatientList } from '@/api/patient.js'
import { getFollowUpList } from '@/api/followup.js'
import { getMedicationList } from '@/api/medication.js'

export default {
	data() {
		return {
			keyword: '',
			patientList: [],
			userInfo: {},
			doctorBound: false,
			stats: { followUpCount: 0, medicationCount: 0, adviceCount: 0 }
		};
	},
	computed: {
		isDoctor() {
			return (uni.getStorageSync('role') || 'patient') === 'doctor';
		},
		filteredPatientList() {
			const k = (this.keyword || '').trim().toLowerCase();
			if (!k) return this.patientList;
			return this.patientList.filter((p) => (p.name || '').toLowerCase().indexOf(k) >= 0);
		}
	},
	onLoad() {
		this.userInfo = uni.getStorageSync('userInfo') || {};
		this.doctorBound = !!uni.getStorageSync('doctorBound');
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
				// 医生端：加载患者列表
				try {
					const res = await getPatientList({ pageNum: 1, pageSize: 100 });
					if (res && res.list) {
						this.patientList = res.list.map(p => ({
							id: p.id,
							name: p.name,
							gender: p.gender || '男',
							age: p.age || 45,
							phone: p.phone || '',
							avatar: '',
							hasFollowUp: p.hasFollowUp
						}));
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
.container { min-height: 100vh; background: $app-bg; padding: 24rpx 24rpx 120rpx; }
.card { background: $app-card-bg; border-radius: $app-radius; padding: 28rpx; margin-bottom: 24rpx; box-shadow: $app-shadow; }
.search-bar { display: flex; align-items: center; gap: 16rpx; }
.search-input { flex: 1; font-size: 28rpx; color: $app-text; }
.doctor-stats { margin-bottom: 24rpx; }
.stats-title { font-size: 30rpx; font-weight: bold; color: $app-text; display: flex; align-items: center; gap: 12rpx; }
.stats-row-inner { margin-top: 16rpx; }
.stat .num { font-size: 36rpx; font-weight: bold; color: $app-primary; }
.stat .txt { font-size: 28rpx; color: $app-text-secondary; margin-left: 8rpx; }
.patient-item { display: flex; flex-direction: column; margin-bottom: 24rpx; }
.patient-item .p-main { display: flex; align-items: center; flex: 1; }
.p-avatar { width: 88rpx; height: 88rpx; border-radius: 50%; margin-right: 24rpx; }
.p-info { display: flex; flex-direction: column; flex: 1; }
.p-name { font-size: 30rpx; color: $app-text; font-weight: bold; }
.p-meta { font-size: 26rpx; color: $app-text-muted; margin-top: 6rpx; }
.p-id { font-size: 24rpx; color: $app-text-muted; margin-top: 4rpx; }
.p-badge { width: 16rpx; height: 16rpx; border-radius: 50%; background: $app-success; margin-left: 12rpx; }
.p-actions { display: flex; gap: 16rpx; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid $app-border; }
.btn-mini { font-size: 24rpx; padding: 10rpx 28rpx; border-radius: 8rpx; background: #F3F4F6; display: inline-flex; align-items: center; gap: 6rpx; }
.btn-mini.primary { background: $app-primary; color: #fff; }
.btn-mini::after { border: none; }
.empty-tip { font-size: 28rpx; color: $app-text-muted; text-align: center; padding: 40rpx; }
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