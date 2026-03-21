<template>
	<view class="container">
		<view class="user-card card">
			<image class="avatar" :src="patient.avatar || '/static/component.png'" mode="aspectFill"></image>
			<view class="meta">
				<text class="name">{{ patient.name }}</text>
				<text class="age-gender">{{ patient.age }}岁 {{ patient.gender }}</text>
				<text class="disease-tag" v-if="patient.diseaseType">{{ patient.diseaseType }}</text>
			</view>
			<view class="contact-btns">
				<view class="icon-btn" @click="callPhone"><text class="app-icon uniui-phone"></text></view>
			</view>
		</view>
		<view class="stats-card card">
			<view class="stat-item">
				<text class="stat-value">{{ patient.followUpCount || 0 }}</text>
				<text class="stat-label">随访次数</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ patient.medicationCount || 0 }}</text>
				<text class="stat-label">用药记录</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ patient.episodeCount || 0 }}</text>
				<text class="stat-label">疾病发作</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ patient.adviceCount || 0 }}</text>
				<text class="stat-label">医生建议</text>
			</view>
		</view>
		<view class="quick-actions card">
			<view class="quick-title">快速操作</view>
			<view class="quick-grid">
				<view class="quick-item" @click="navTo('/pages/doctor/add-follow/add-follow?patientId=' + patientId + '&patientName=' + encodeURIComponent(patient.name))">
					<view class="quick-icon follow"><text class="app-icon uniui-list"></text></view>
					<text class="quick-text">创建随访</text>
				</view>
				<view class="quick-item" @click="navTo('/pages/doctor/add-medication/add-medication?patientId=' + patientId + '&patientName=' + encodeURIComponent(patient.name))">
					<view class="quick-icon med"><text class="app-icon uniui-compose"></text></view>
					<text class="quick-text">添加用药</text>
				</view>
				<view class="quick-item" @click="copyBasicInfo">
					<view class="quick-icon copy"><text class="app-icon uniui-paperclip"></text></view>
					<text class="quick-text">复制信息</text>
				</view>
			</view>
		</view>
		<view class="tabs-card card">
			<view class="tabs-header">
				<view class="tab" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基本信息</view>
				<view class="tab" :class="{ active: activeTab === 'follow' }" @click="activeTab = 'follow'">随访记录</view>
				<view class="tab" :class="{ active: activeTab === 'medication' }" @click="activeTab = 'medication'">用药记录</view>
				<view class="tab" :class="{ active: activeTab === 'episode' }" @click="activeTab = 'episode'">疾病发作</view>
			</view>
			<view class="tabs-content">
				<view v-show="activeTab === 'basic'" class="tab-panel">
					<view class="row"><text class="label">电话</text><text class="value">{{ patient.phone }}</text></view>
					<view class="row"><text class="label">身份证号</text><text class="value">{{ patient.idCard }}</text></view>
					<view class="row"><text class="label">疾病分类</text><text class="value highlight">{{ patient.diseaseType || '未分类' }}</text></view>
					<view class="row"><text class="label">民族</text><text class="value">{{ patient.nation }}</text></view>
					<view class="row"><text class="label">出生日期</text><text class="value">{{ patient.birthday }}</text></view>
					<view class="row"><text class="label">婚姻状况</text><text class="value">{{ patient.marital }}</text></view>
					<view class="row"><text class="label">居住地</text><text class="value">{{ patient.address }}</text></view>
					<view class="row"><text class="label">患者类型</text><text class="value">{{ patient.patientType }}</text></view>
					<view class="copy-btn-row">
						<button class="copy-btn" @click="copyBasicInfo">
							<text class="app-icon uniui-paperclip"></text>
							<text>复制基本信息</text>
						</button>
					</view>
				</view>
				<view v-show="activeTab === 'follow'" class="tab-panel">
					<text class="empty-tip" v-if="!followList.length">暂无随访记录</text>
					<view class="list-item" v-for="(item, i) in followList" :key="i">
						<view class="item-header">
							<text class="item-title">{{ item.title }}</text>
							<text class="item-status" :class="item.status">{{ item.statusText }}</text>
						</view>
						<text class="item-date">{{ item.date }}</text>
						<view class="item-actions">
							<text class="action-text" @click="copyFollowToVisit(item)">复制为就诊记录</text>
						</view>
					</view>
				</view>
				<view v-show="activeTab === 'medication'" class="tab-panel">
					<text class="empty-tip" v-if="!medicationList.length">暂无用药记录</text>
					<view class="list-item" v-for="(item, i) in medicationList" :key="i">
						<text class="item-title">{{ item.name }}</text>
						<text class="item-desc">{{ item.dosage }} {{ item.frequency }}</text>
						<text class="item-date">{{ item.date }}</text>
					</view>
				</view>
				<view v-show="activeTab === 'episode'" class="tab-panel">
					<text class="empty-tip" v-if="!episodeList.length">暂无疾病发作记录</text>
					<view class="list-item" v-for="(item, i) in episodeList" :key="i" @click="showEpisodeDetail(item)">
						<view class="item-header">
							<text class="item-title">第{{ item.episodeNumber }}次发作</text>
							<text class="item-date">{{ item.episodeDate }}</text>
						</view>
						<text class="item-desc">{{ item.chiefComplaint }}</text>
						<view class="item-actions">
							<text class="action-text" @click.stop="copyEpisodeToRecord(item)">复制为病历</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		<view class="actions">
			<button class="btn" @click="callPhone">打电话</button>
			<button class="btn primary" @click="fillVisit">填写就诊信息</button>
		</view>
	</view>
</template>

<script>
import { getPatientById } from '@/api/patient.js'
import { getFollowUpList } from '@/api/followup.js'
import { getMedicationList } from '@/api/medication.js'
import { getEpisodeList } from '@/api/episode.js'
import { createMedicalRecord } from '@/api/medicalRecord.js'

export default {
	data() {
		return {
			activeTab: 'basic',
			patientId: '',
			patient: {
				name: '',
				age: '',
				gender: '',
				phone: '',
				idCard: '',
				diseaseType: '',
				nation: '',
				birthday: '',
				marital: '',
				address: '',
				patientType: '',
				followUpCount: 0,
				medicationCount: 0,
				episodeCount: 0,
				adviceCount: 0
			},
			followList: [],
			medicationList: [],
			episodeList: []
		};
	},
	onLoad(op) {
		if (op.id) this.patientId = op.id;
		else this.patientId = '1';
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				const res = await getPatientById(this.patientId);
				if (res) {
					this.patient = {
						...res,
						name: res.name || '患者',
						age: res.age || 0,
						gender: res.gender === 'male' ? '男' : (res.gender === 'female' ? '女' : res.gender || '未知'),
						phone: res.phone || '',
						idCard: res.idCard || '',
						diseaseType: res.diseaseType || '',
						nation: res.nation || '汉族',
						birthday: res.birthday || '',
						marital: res.marital || '',
						address: res.address || '',
						patientType: res.patientType || '门诊患者',
						followUpCount: 0,
						medicationCount: 0,
						episodeCount: 0,
						adviceCount: 0
					};
				}
			} catch (e) {
				console.error('加载患者信息失败:', e);
			}

			// 加载随访记录
			try {
				const followRes = await getFollowUpList({ pageNum: 1, pageSize: 100, patientId: this.patientId });
				if (followRes && followRes.list) {
					this.followList = followRes.list.map(f => ({
						id: f.id,
						title: f.project || '随访',
						date: f.date,
						content: f.content,
						status: f.status === 'completed' ? 'completed' : 'pending',
						statusText: f.status === 'completed' ? '已完成' : '待随访'
					}));
					this.patient.followUpCount = followRes.total || this.followList.length;
				}
			} catch (e) {
				console.error('加载随访记录失败:', e);
			}

			// 加载用药记录
			try {
				const medRes = await getMedicationList({ pageNum: 1, pageSize: 100, patientId: this.patientId });
				if (medRes && medRes.list) {
					this.medicationList = medRes.list.map(m => ({
						name: m.medicationName,
						dosage: m.dosage + (m.unit || ''),
						frequency: m.frequency,
						date: m.date
					}));
					this.patient.medicationCount = medRes.total || this.medicationList.length;
				}
			} catch (e) {
				console.error('加载用药记录失败:', e);
			}

			// 加载疾病发作记录
			try {
				const epRes = await getEpisodeList({ pageNum: 1, pageSize: 100, patientId: this.patientId });
				if (epRes && epRes.list) {
					this.episodeList = epRes.list.map(ep => ({
						id: ep.id,
						episodeNumber: ep.episodeNumber,
						episodeDate: ep.episodeDate,
						chiefComplaint: ep.chiefComplaint,
						symptoms: ep.symptoms,
						diseaseProgress: ep.diseaseProgress,
						treatmentProcess: ep.treatmentProcess
					}));
					this.patient.episodeCount = epRes.total || this.episodeList.length;
				}
			} catch (e) {
				console.error('加载疾病发作记录失败:', e);
			}
		},
		callPhone() {
			if (this.patient.phone) {
				uni.makePhoneCall({ phoneNumber: this.patient.phone });
			} else {
				uni.showToast({ title: '暂无电话', icon: 'none' });
			}
		},
		fillVisit() {
			uni.navigateTo({
				url: '/pages/doctor/add-follow/add-follow?patientId=' + this.patientId + '&patientName=' + encodeURIComponent(this.patient.name)
			});
		},
		navTo(url) {
			uni.navigateTo({ url });
		},
		// 复制基本信息
		copyBasicInfo() {
			const info = `患者：${this.patient.name}
性别：${this.patient.gender}
年龄：${this.patient.age}岁
电话：${this.patient.phone}
疾病分类：${this.patient.diseaseType || '未分类'}
身份证号：${this.patient.idCard || '未填写'}
居住地：${this.patient.address || '未填写'}`;

			uni.setClipboardData({
				data: info,
				success: () => {
					uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
				}
			});
		},
		// 复制随访记录为就诊记录
		copyFollowToVisit(item) {
			uni.showModal({
				title: '确认复制',
				content: '将此随访记录复制为新病历记录？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await createMedicalRecord({
								patientId: this.patientId,
								patientName: this.patient.name,
								type: '门诊病历',
								diagnosis: item.title,
								content: item.content || '',
								date: item.date
							});
							uni.showToast({ title: '已复制为病历', icon: 'success' });
							this.loadData();
						} catch (e) {
							console.error('复制失败:', e);
							uni.showToast({ title: '复制失败', icon: 'none' });
						}
					}
				}
			});
		},
		// 查看疾病发作详情
		showEpisodeDetail(item) {
			const content = `第${item.episodeNumber}次发作
发作时间：${item.episodeDate}
主诉：${item.chiefComplaint || '无'}
症状：${item.symptoms || '无'}
病情变化：${item.diseaseProgress || '无'}
诊治经过：${item.treatmentProcess || '无'}`;

			uni.showModal({
				title: '疾病发作详情',
				content: content,
				confirmText: '复制',
				success: (res) => {
					if (res.confirm) {
						uni.setClipboardData({
							data: content,
							success: () => {
								uni.showToast({ title: '已复制', icon: 'success' });
							}
						});
					}
				}
			});
		},
		// 复制疾病发作记录为病历
		copyEpisodeToRecord(item) {
			uni.showModal({
				title: '确认复制',
				content: '将此疾病发作记录复制为新病历记录？',
				success: async (res) => {
					if (res.confirm) {
						const content = `主诉：${item.chiefComplaint || ''}
症状：${item.symptoms || ''}
病情变化：${item.diseaseProgress || ''}
诊治经过：${item.treatmentProcess || ''}`;

						try {
							await createMedicalRecord({
								patientId: this.patientId,
								patientName: this.patient.name,
								type: '住院病历',
								diagnosis: '待诊断',
								content: content,
								date: item.episodeDate
							});
							uni.showToast({ title: '已复制为病历', icon: 'success' });
							this.loadData();
						} catch (e) {
							console.error('复制失败:', e);
							uni.showToast({ title: '复制失败', icon: 'none' });
						}
					}
				}
			});
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding: 24rpx 24rpx 160rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	margin-bottom: 24rpx;
	box-shadow: $app-shadow;
}

.user-card {
	display: flex;
	align-items: center;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	margin-right: 24rpx;
}

.meta {
	flex: 1;
}

.name {
	font-size: 34rpx;
	font-weight: bold;
	color: $app-text;
	display: block;
}

.age-gender {
	font-size: 28rpx;
	color: $app-text-secondary;
	display: block;
	margin-top: 8rpx;
}

.disease-tag {
	display: inline-block;
	font-size: 24rpx;
	color: $app-primary;
	background: $app-primary-bg;
	padding: 6rpx 16rpx;
	border-radius: 16rpx;
	margin-top: 8rpx;
}

.contact-btns {
	display: flex;
	gap: 16rpx;
}

.icon-btn {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: $app-primary-bg;
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon-btn .app-icon {
	font-size: 36rpx;
	color: $app-primary;
}

.stats-card {
	display: flex;
	justify-content: space-around;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-value {
	font-size: 36rpx;
	font-weight: bold;
	color: $app-text;
}

.stat-label {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
}

.quick-title {
	font-size: 28rpx;
	font-weight: bold;
	color: $app-text;
	margin-bottom: 20rpx;
}

.quick-grid {
	display: flex;
	justify-content: space-around;
	flex-wrap: wrap;
}

.quick-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 33%;
	margin-bottom: 20rpx;
}

.quick-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
}

.quick-icon .app-icon {
	font-size: 40rpx;
	color: #fff;
}

.quick-icon.follow { background: $app-primary; }
.quick-icon.med { background: #EC4899; }
.quick-icon.copy { background: #8B5CF6; }

.quick-text {
	font-size: 24rpx;
	color: $app-text;
}

.tabs-header {
	display: flex;
	border-bottom: 1rpx solid $app-border;
	margin-bottom: 20rpx;
}

.tab {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	font-size: 26rpx;
	color: $app-text-muted;
}

.tab.active {
	color: $app-primary;
	font-weight: bold;
	border-bottom: 4rpx solid $app-primary;
}

.tab-panel .row {
	display: flex;
	justify-content: space-between;
	padding: 20rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.tab-panel .label {
	font-size: 28rpx;
	color: $app-text-muted;
}

.tab-panel .value {
	font-size: 28rpx;
	color: $app-text;
}

.tab-panel .value.highlight {
	color: $app-primary;
	font-weight: 500;
}

.copy-btn-row {
	margin-top: 24rpx;
}

.copy-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	background: $app-primary-bg;
	color: $app-primary;
	font-size: 28rpx;
	padding: 20rpx 0;
	border-radius: 12rpx;
	border: none;
}

.copy-btn .app-icon {
	font-size: 32rpx;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	display: block;
	padding: 40rpx 0;
	text-align: center;
}

.list-item {
	padding: 20rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.item-title {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
}

.item-desc {
	font-size: 26rpx;
	color: $app-text-secondary;
	display: block;
	margin-top: 6rpx;
}

.item-date {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 6rpx;
	display: block;
}

.item-status {
	font-size: 24rpx;
	padding: 4rpx 16rpx;
	border-radius: 16rpx;
}

.item-status.completed {
	background: #D1FAE5;
	color: #10B981;
}

.item-status.pending {
	background: #FEF3C7;
	color: #F59E0B;
}

.item-actions {
	margin-top: 12rpx;
}

.action-text {
	font-size: 24rpx;
	color: $app-primary;
}

.actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	padding: 24rpx;
	background: $app-card-bg;
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}

.btn {
	flex: 1;
	margin: 0 12rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 12rpx;
	font-size: 30rpx;
	background: $app-bg;
	color: $app-text;
	border: none;
}

.btn.primary {
	background: $app-primary;
	color: #fff;
}
</style>