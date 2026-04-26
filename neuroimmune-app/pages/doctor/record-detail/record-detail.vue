<template>
	<view class="container">
		<!-- 患者信息卡片 -->
		<view class="patient-card card">
			<view class="patient-header">
				<view class="avatar-wrap">
					<text class="avatar-text">{{ record.patientName ? record.patientName.charAt(0) : '?' }}</text>
				</view>
				<view class="patient-info">
					<text class="patient-name">{{ record.patientName || '未知患者' }}</text>
					<text class="patient-meta" v-if="record.patientGender">{{ record.patientGender }} · {{ record.patientAge }}岁</text>
				</view>
				<view class="patient-action" @click="goPatientInfo">
					<text class="app-icon uniui-arrowright"></text>
				</view>
			</view>
		</view>

		<!-- 病历基本信息 -->
		<view class="info-card card">
			<view class="info-header">
				<text class="info-title">病历信息</text>
				<text class="record-type">{{ record.type || '门诊病历' }}</text>
			</view>

			<view class="info-list">
				<view class="info-item">
					<text class="info-label">病历日期</text>
					<text class="info-value">{{ record.dateText || '未记录' }}</text>
				</view>
				<view class="info-item" v-if="record.hospital">
					<text class="info-label">就诊医院</text>
					<text class="info-value">{{ record.hospital }}</text>
				</view>
				<view class="info-item" v-if="record.department">
					<text class="info-label">就诊科室</text>
					<text class="info-value">{{ record.department }}</text>
				</view>
			</view>
		</view>

		<!-- 诊断信息 -->
		<view class="diagnosis-card card" v-if="record.diagnosis">
			<view class="card-title">
				<text class="app-icon uniui-medal"></text>
				<text>诊断结果</text>
			</view>
			<text class="diagnosis-text">{{ record.diagnosis }}</text>
		</view>

		<!-- 病历内容 -->
		<view class="content-card card" v-if="record.content">
			<view class="card-title">
				<text class="app-icon uniui-list"></text>
				<text>病历内容</text>
			</view>
			<text class="content-text">{{ record.content }}</text>
		</view>

		<!-- 关联发作记录 -->
		<view class="episode-card card" v-if="record.relatedEpisodeId">
			<view class="card-title">
				<text class="app-icon uniui-pulse"></text>
				<text>关联发作记录</text>
			</view>
			<view class="episode-link" @click="goEpisodeDetail">
				<text class="link-text">查看关联的发作记录</text>
				<text class="app-icon uniui-arrowright"></text>
			</view>
		</view>

		<!-- 附件图片 -->
		<view class="attachment-card card" v-if="attachments.length">
			<view class="card-title">
				<text class="app-icon uniui-image"></text>
				<text>病历附件（{{ attachments.length }}）</text>
			</view>
			<view class="image-grid">
				<view class="image-item" v-for="(img, i) in attachments" :key="i" @click="previewImage(img)">
					<image class="preview-img" :src="img" mode="aspectFill"></image>
				</view>
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="action-bar">
			<button class="edit-btn" @click="editRecord">
				<text class="app-icon uniui-compose"></text>
				<text>编辑病历</text>
			</button>
		</view>
	</view>
</template>

<script>
import { getMedicalRecordById } from '@/api/medicalRecord.js'

export default {
	data() {
		return {
			recordId: '',
			record: {
				id: '',
				patientId: '',
				patientName: '',
				patientGender: '',
				patientAge: '',
				type: '门诊病历',
				dateText: '',
				diagnosis: '',
				content: '',
				hospital: '',
				department: '',
				attachments: '',
				relatedEpisodeId: ''
			},
			attachments: []
		}
	},
	onLoad(options) {
		if (options.id) {
			this.recordId = options.id
			this.loadRecordDetail()
		}
	},
	methods: {
		async loadRecordDetail() {
			try {
				uni.showLoading({ title: '加载中...' })
				const res = await getMedicalRecordById(this.recordId)
				if (res) {
					this.record = {
						id: res.id,
						patientId: res.patientId,
						patientName: res.patientName || '未知患者',
						patientGender: res.gender || '',
						patientAge: res.age || '',
						type: res.type || '门诊病历',
						dateText: this.formatDate(res.date),
						diagnosis: res.diagnosis || '',
						content: res.content || '',
						hospital: res.hospital || '',
						department: res.department || '',
						attachments: res.attachments || '',
						relatedEpisodeId: res.relatedEpisodeId || ''
					}

					if (res.attachments) {
						this.attachments = res.attachments.split(',').filter(url => url.trim())
					}
				}
				uni.hideLoading()
			} catch (e) {
				uni.hideLoading()
				console.error('加载病历详情失败:', e)
				uni.showToast({ title: '加载失败', icon: 'none' })
			}
		},
		formatDate(dateStr) {
			if (!dateStr) return ''
			const date = new Date(dateStr)
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		goPatientInfo() {
			if (this.record.patientId) {
				uni.navigateTo({
					url: '/pages/doctor/patient-info/patient-info?id=' + this.record.patientId
				})
			}
		},
		goEpisodeDetail() {
			if (this.record.relatedEpisodeId) {
				uni.navigateTo({
					url: '/pages/patient/episode-detail/episode-detail?id=' + this.record.relatedEpisodeId
				})
			}
		},
		previewImage(current) {
			uni.previewImage({
				current,
				urls: this.attachments
			})
		},
		editRecord() {
			uni.navigateTo({
				url: '/pages/doctor/edit-record/edit-record?id=' + this.recordId
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
	padding-bottom: 140rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	margin-bottom: 24rpx;
	box-shadow: $app-shadow;
}

/* 患者信息卡片 */
.patient-header {
	display: flex;
	align-items: center;
}

.avatar-wrap {
	width: 72rpx;
	height: 72rpx;
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

.patient-info {
	flex: 1;
}

.patient-name {
	font-size: 32rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
}

.patient-meta {
	font-size: 26rpx;
	color: $app-text-muted;
	margin-top: 6rpx;
}

.patient-action {
	padding: 12rpx;
}

.patient-action .app-icon {
	font-size: 28rpx;
	color: $app-text-muted;
}

/* 信息卡片 */
.info-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.info-title {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
}

.record-type {
	font-size: 24rpx;
	color: $app-primary;
	background: $app-primary-bg;
	padding: 6rpx 16rpx;
	border-radius: 12rpx;
}

.info-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.info-label {
	font-size: 28rpx;
	color: $app-text-muted;
}

.info-value {
	font-size: 28rpx;
	color: $app-text;
}

/* 卡片标题 */
.card-title {
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
	margin-bottom: 16rpx;
}

.card-title .app-icon {
	font-size: 28rpx;
	color: $app-primary;
}

/* 诊断内容 */
.diagnosis-text, .content-text {
	font-size: 28rpx;
	color: $app-text-secondary;
	line-height: 1.6;
}

/* 关联发作 */
.episode-link {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16rpx 20rpx;
	background: $app-bg;
	border-radius: 12rpx;
}

.link-text {
	font-size: 28rpx;
	color: #EF4444;
}

.episode-link .app-icon {
	font-size: 24rpx;
	color: #EF4444;
}

/* 附件图片 */
.image-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.image-item {
	width: 200rpx;
	height: 200rpx;
	border-radius: 12rpx;
	overflow: hidden;
}

.preview-img {
	width: 100%;
	height: 100%;
}

/* 操作栏 */
.action-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 24rpx;
	background: $app-card-bg;
	box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.05);
}

.edit-btn {
	width: 100%;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	background: $app-primary;
	color: #fff;
	font-size: 32rpx;
	font-weight: 500;
	border-radius: 12rpx;
	border: none;
}

.edit-btn .app-icon {
	font-size: 32rpx;
}
</style>