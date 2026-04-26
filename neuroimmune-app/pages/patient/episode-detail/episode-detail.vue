<template>
	<view class="container">
		<!-- 发作基本信息 -->
		<view class="episode-card card">
			<view class="episode-header">
				<text class="episode-number">第 {{ episode.episodeNumber }} 次发作</text>
				<text class="episode-date">{{ episode.episodeDate }}</text>
			</view>

			<view class="info-section" v-if="episode.chiefComplaint">
				<text class="section-label">主诉</text>
				<text class="section-value">{{ episode.chiefComplaint }}</text>
			</view>

			<view class="info-section" v-if="episode.symptoms">
				<text class="section-label">症状表现</text>
				<text class="section-value">{{ episode.symptoms }}</text>
			</view>

			<view class="info-section" v-if="episode.diseaseProgress">
				<text class="section-label">病情变化过程</text>
				<text class="section-value">{{ episode.diseaseProgress }}</text>
			</view>

			<view class="info-section" v-if="episode.treatmentProcess">
				<text class="section-label">诊治经过</text>
				<text class="section-value">{{ episode.treatmentProcess }}</text>
			</view>

			<view class="info-section" v-if="episode.diagnosis">
				<text class="section-label">诊断结果</text>
				<text class="section-value highlight">{{ episode.diagnosis }}</text>
			</view>

			<view class="info-row" v-if="episode.hospital || episode.department">
				<text class="info-tag" v-if="episode.hospital">{{ episode.hospital }}</text>
				<text class="info-tag" v-if="episode.department">{{ episode.department }}</text>
			</view>

			<view class="info-section" v-if="episode.notes">
				<text class="section-label">备注</text>
				<text class="section-value">{{ episode.notes }}</text>
			</view>
		</view>

		<!-- 关联病历 -->
		<view class="related-records card">
			<view class="section-header">
				<text class="section-title">关联病历</text>
				<text class="add-btn" @click="showUploadModal">+ 添加病历</text>
			</view>

			<text class="empty-tip" v-if="!relatedRecords.length">暂无关联病历，点击上方按钮上传图片自动添加</text>

			<view class="record-list" v-if="relatedRecords.length">
				<view class="record-item" v-for="(item, i) in relatedRecords" :key="i" @click="viewRecord(item)">
					<view class="record-left">
						<text class="record-type">{{ item.type }}</text>
						<text class="record-date">{{ item.date }}</text>
					</view>
					<view class="record-content">
						<text class="record-title" v-if="item.diagnosis">{{ item.diagnosis }}</text>
						<text class="record-desc">{{ item.content || '无内容' }}</text>
					</view>
					<view class="record-images" v-if="item.attachments">
						<image v-for="(img, idx) in item.attachments.split(',').slice(0,3)" :key="idx" :src="img" mode="aspectFill" class="thumb-img" @click.stop="previewImage(img, item.attachments)" />
					</view>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
			</view>
		</view>

		<!-- 上传病历弹窗 -->
		<view class="upload-modal" v-if="showModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">添加病历</text>
					<text class="modal-tip">上传图片将自动创建病历记录</text>
				</view>

				<!-- 病历类型选择 -->
				<view class="type-section">
					<text class="type-label">病历类型</text>
					<view class="type-options">
						<view class="type-item" :class="{ active: selectedType === '门诊病历' }" @click="selectType('门诊病历')">
							<text>门诊病历</text>
						</view>
						<view class="type-item" :class="{ active: selectedType === '住院病历' }" @click="selectType('住院病历')">
							<text>住院病历</text>
						</view>
						<view class="type-item" :class="{ active: selectedType === '检查报告' }" @click="selectType('检查报告')">
							<text>检查报告</text>
						</view>
						<view class="type-item" :class="{ active: selectedType === '化验报告' }" @click="selectType('化验报告')">
							<text>化验报告</text>
						</view>
						<view class="type-item" :class="{ active: selectedType === '其他资料' }" @click="selectType('其他资料')">
							<text>其他资料</text>
						</view>
					</view>
				</view>

				<!-- 就诊日期 -->
				<view class="date-section">
					<text class="date-label">就诊日期</text>
					<picker mode="date" :value="recordDate" @change="onDateChange">
						<view class="date-picker">
							<text class="date-value">{{ recordDate }}</text>
							<text class="app-icon uniui-calendar"></text>
						</view>
					</picker>
				</view>

				<!-- 上传按钮 -->
				<view class="upload-area" @click="chooseImage">
					<text class="app-icon uniui-cloud-upload-filled"></text>
					<text class="upload-text">点击上传图片</text>
				</view>

				<!-- 已选图片 -->
				<view class="image-list" v-if="uploadImages.length">
					<view class="image-item" v-for="(img, i) in uploadImages" :key="i">
						<image class="preview-img" :src="img" mode="aspectFill" />
						<view class="del-btn" @click="delImage(i)">×</view>
					</view>
				</view>

				<!-- 操作按钮 -->
				<view class="modal-actions">
					<button class="cancel-btn" @click="closeModal">取消</button>
					<button class="submit-btn" :loading="loading" :disabled="!uploadImages.length" @click="submitUpload">确认上传</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getEpisodeById } from '@/api/episode.js'
import { createMedicalRecord, getMedicalRecordList } from '@/api/medicalRecord.js'
import { parseMedicalRecord } from '@/api/ocr.js'
import { uploadFile } from '@/api/request.js'

export default {
	data() {
		return {
			episodeId: '',
			episode: {
				episodeNumber: 1,
				episodeDate: '',
				chiefComplaint: '',
				symptoms: '',
				diseaseProgress: '',
				treatmentProcess: '',
				diagnosis: '',
				hospital: '',
				department: '',
				notes: ''
			},
			relatedRecords: [],
			showModal: false,
			selectedType: '门诊病历',
			recordDate: '',
			uploadImages: [],
			loading: false
		}
	},
	onLoad(options) {
		if (options.id) {
			this.episodeId = options.id
			this.loadEpisode()
			this.loadRelatedRecords()
		}
		// 默认就诊日期为今天
		const today = new Date()
		this.recordDate = this.formatDate(today)
	},
	methods: {
		formatDate(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		async loadEpisode() {
			try {
				const res = await getEpisodeById(this.episodeId)
				if (res) {
					this.episode = {
						episodeNumber: res.episodeNumber || 1,
						episodeDate: this.formatDateStr(res.episodeDate),
						chiefComplaint: res.chiefComplaint || '',
						symptoms: res.symptoms || '',
						diseaseProgress: res.diseaseProgress || '',
						treatmentProcess: res.treatmentProcess || '',
						diagnosis: res.diagnosis || '',
						hospital: res.hospital || '',
						department: res.department || '',
						notes: res.notes || ''
					}
				}
			} catch (e) {
				console.error('加载发作记录失败:', e)
				uni.showToast({ title: '加载失败', icon: 'none' })
			}
		},
		async loadRelatedRecords() {
			try {
				const userInfo = uni.getStorageSync('userInfo') || {}
				const res = await getMedicalRecordList({
					patientId: userInfo.id,
					relatedEpisodeId: this.episodeId,
					pageNum: 1,
					pageSize: 50
				})
				if (res && res.list) {
					this.relatedRecords = res.list.map(r => ({
						id: r.id,
						type: r.type || '门诊病历',
						date: this.formatDateStr(r.date),
						diagnosis: r.diagnosis || '',
						content: r.content || '',
						attachments: r.attachments || ''
					}))
				}
			} catch (e) {
				console.error('加载关联病历失败:', e)
			}
		},
		formatDateStr(date) {
			if (!date) return ''
			return date.split('T')[0].split(' ')[0]
		},
		showUploadModal() {
			this.showModal = true
		},
		closeModal() {
			this.showModal = false
			this.uploadImages = []
		},
		selectType(type) {
			this.selectedType = type
		},
		onDateChange(e) {
			this.recordDate = e.detail.value
		},
		chooseImage() {
			uni.chooseImage({
				count: 9 - this.uploadImages.length,
				success: (res) => {
					this.uploadImages = [...this.uploadImages, ...res.tempFilePaths]
				}
			})
		},
		delImage(i) {
			this.uploadImages.splice(i, 1)
		},
		async submitUpload() {
			if (!this.uploadImages.length) {
				uni.showToast({ title: '请先上传图片', icon: 'none' })
				return
			}

			this.loading = true
			uni.showLoading({ title: '上传中...' })

			try {
				// 上传图片
				const urls = []
				for (const path of this.uploadImages) {
					const res = await uploadFile(path)
					if (res && res.url) {
						urls.push(res.url)
					}
				}

				// OCR识别（可选）
				let content = ''
				try {
					const ocrRes = await parseMedicalRecord(urls)
					if (ocrRes && ocrRes.content) {
						content = ocrRes.content
					}
				} catch (e) {
					console.log('OCR识别失败，跳过')
				}

				// 创建病历记录
				const userInfo = uni.getStorageSync('userInfo') || {}
				await createMedicalRecord({
					patientId: userInfo.id,
					patientName: userInfo.name,
					type: this.selectedType,
					date: this.recordDate,
					content: content,
					attachments: urls.join(','),
					relatedEpisodeId: this.episodeId
				})

				uni.hideLoading()
				uni.showToast({ title: '添加成功', icon: 'success' })
				this.closeModal()
				this.loadRelatedRecords()
			} catch (e) {
				uni.hideLoading()
				console.error('上传失败:', e)
				uni.showToast({ title: '上传失败', icon: 'none' })
			} finally {
				this.loading = false
			}
		},
		viewRecord(item) {
			// 显示病历详情
			let content = `类型：${item.type}\n日期：${item.date}\n`
			if (item.diagnosis) content += `诊断：${item.diagnosis}\n`
			content += `\n${item.content || '暂无内容'}`

			uni.showModal({
				title: '病历详情',
				content: content,
				showCancel: false
			})
		},
		previewImage(current, attachments) {
			const urls = attachments.split(',').filter(url => url)
			uni.previewImage({
				current: current,
				urls: urls
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
	padding-bottom: 60rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: $app-spacing-md;
	margin-bottom: $app-spacing-md;
	box-shadow: $app-shadow;
}

/* 发作基本信息 */
.episode-card {
	padding: $app-spacing-lg;
}

.episode-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $app-spacing-md;
	padding-bottom: $app-spacing-md;
	border-bottom: 1rpx solid $app-divider;
}

.episode-number {
	font-size: 36rpx;
	font-weight: bold;
	color: $app-primary;
}

.episode-date {
	font-size: 28rpx;
	color: $app-text-muted;
}

.info-section {
	margin-bottom: $app-spacing-md;
}

.section-label {
	display: block;
	font-size: 26rpx;
	color: $app-text-muted;
	margin-bottom: 10rpx;
}

.section-value {
	display: block;
	font-size: 30rpx;
	color: $app-text;
	line-height: 1.6;
}

.section-value.highlight {
	color: $app-primary;
	font-weight: 500;
}

.info-row {
	display: flex;
	gap: $app-spacing-sm;
	margin-top: $app-spacing-md;
}

.info-tag {
	font-size: 26rpx;
	color: $app-text-secondary;
	padding: 10rpx 20rpx;
	background: $app-primary-bg;
	border-radius: 8rpx;
}

/* 关联病历 */
.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $app-spacing-md;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: $app-text;
}

.add-btn {
	font-size: 28rpx;
	color: $app-primary;
	font-weight: 500;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	text-align: center;
	padding: 40rpx 0;
}

.record-list {
	display: flex;
	flex-direction: column;
	gap: $app-spacing-sm;
}

.record-item {
	display: flex;
	align-items: center;
	padding: $app-spacing-md;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	transition: $app-transition;
}

.record-item:active {
	background: #EBEDEF;
}

.record-left {
	display: flex;
	flex-direction: column;
	margin-right: $app-spacing-md;
	min-width: 120rpx;
}

.record-type {
	font-size: 24rpx;
	color: $app-primary;
	font-weight: 500;
}

.record-date {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
}

.record-content {
	flex: 1;
}

.record-title {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
}

.record-desc {
	font-size: 26rpx;
	color: $app-text-secondary;
	display: block;
	margin-top: 8rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.record-images {
	display: flex;
	gap: 10rpx;
	margin-right: $app-spacing-sm;
}

.thumb-img {
	width: 60rpx;
	height: 60rpx;
	border-radius: 8rpx;
}

/* 上传弹窗 */
.upload-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
}

.modal-content {
	width: 100%;
	background: $app-card-bg;
	border-radius: 32rpx 32rpx 0 0;
	padding: $app-spacing-lg;
	max-height: 80vh;
}

.modal-header {
	text-align: center;
	margin-bottom: $app-spacing-lg;
}

.modal-title {
	font-size: 34rpx;
	font-weight: bold;
	color: $app-text;
	display: block;
}

.modal-tip {
	font-size: 26rpx;
	color: $app-primary;
	margin-top: 10rpx;
	display: block;
}

.type-section {
	margin-bottom: $app-spacing-md;
}

.type-label {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
	margin-bottom: $app-spacing-sm;
}

.type-options {
	display: flex;
	flex-wrap: wrap;
	gap: $app-spacing-sm;
}

.type-item {
	font-size: 26rpx;
	color: $app-text-secondary;
	padding: 16rpx 28rpx;
	background: $app-hover-bg;
	border-radius: 24rpx;
	border: 2rpx solid transparent;
	transition: $app-transition;
}

.type-item.active {
	background: $app-primary-bg;
	color: $app-primary;
	border-color: $app-primary;
}

.date-section {
	margin-bottom: $app-spacing-md;
}

.date-label {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
	margin-bottom: $app-spacing-sm;
}

.date-picker {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $app-spacing-md;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
}

.date-value {
	font-size: 30rpx;
	color: $app-text;
}

.date-picker .app-icon {
	font-size: 36rpx;
	color: $app-primary;
}

.upload-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $app-spacing-xl;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	border: 2rpx dashed $app-border;
	margin-bottom: $app-spacing-md;
}

.upload-area .app-icon {
	font-size: 80rpx;
	color: $app-primary;
	margin-bottom: $app-spacing-sm;
}

.upload-text {
	font-size: 28rpx;
	color: $app-text-muted;
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: $app-spacing-sm;
	margin-bottom: $app-spacing-md;
}

.image-item {
	position: relative;
	width: 160rpx;
	height: 160rpx;
}

.preview-img {
	width: 100%;
	height: 100%;
	border-radius: $app-radius-sm;
}

.del-btn {
	position: absolute;
	top: -12rpx;
	right: -12rpx;
	width: 40rpx;
	height: 40rpx;
	background: $app-error;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	line-height: 1;
}

.modal-actions {
	display: flex;
	gap: $app-spacing-md;
}

.cancel-btn,
.submit-btn {
	flex: 1;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: $app-radius-sm;
	font-size: 32rpx;
	font-weight: 500;
}

.cancel-btn {
	background: $app-hover-bg;
	color: $app-text-secondary;
	border: none;
}

.submit-btn {
	background: $app-primary;
	color: #fff;
	border: none;
}

.submit-btn[disabled] {
	opacity: 0.5;
}
</style>