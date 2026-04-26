<template>
	<view class="container">
		<view class="form-card card">
			<view class="form-item">
				<text class="form-label">发作日期</text>
				<picker mode="date" :value="form.episodeDate" @change="onDateChange">
					<view class="picker-input">
						<text class="picker-value">{{ form.episodeDate || '请选择日期' }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="form-label">主诉 <text class="required">*</text></text>
				<textarea class="form-textarea" v-model="form.chiefComplaint" placeholder="请描述主要症状和不适，如：右侧肢体无力3天" />
			</view>

			<view class="form-item">
				<text class="form-label">症状表现</text>
				<textarea class="form-textarea" v-model="form.symptoms" placeholder="请详细描述症状表现，如：视力模糊、肢体麻木、行走困难等" />
			</view>

			<view class="form-item">
				<text class="form-label">病情变化过程</text>
				<textarea class="form-textarea" v-model="form.diseaseProgress" placeholder="描述病情是如何发展的，症状加重或缓解的情况" />
			</view>

			<view class="form-item">
				<text class="form-label">诊治经过</text>
				<textarea class="form-textarea" v-model="form.treatmentProcess" placeholder="描述就诊和治疗过程，用药情况等" />
			</view>

			<view class="form-item">
				<text class="form-label">诊断结果</text>
				<textarea class="form-textarea" v-model="form.diagnosis" placeholder="医生的诊断结果" />
			</view>

			<view class="form-item">
				<text class="form-label">就诊医院</text>
				<input class="form-input" v-model="form.hospital" placeholder="请输入医院名称" />
			</view>

			<view class="form-item">
				<text class="form-label">科室</text>
				<input class="form-input" v-model="form.department" placeholder="请输入科室" />
			</view>

			<view class="form-item">
				<text class="form-label">备注</text>
				<textarea class="form-textarea" v-model="form.notes" placeholder="其他需要记录的信息" />
			</view>

			<!-- 图片上传区域 -->
			<view class="form-item">
				<text class="form-label">病历图片</text>
				<text class="form-tip">上传图片将自动创建病历记录并关联本次发作</text>
				<view class="upload-area" @click="chooseImage">
					<text class="app-icon uniui-cloud-upload-filled"></text>
					<text class="upload-text">点击上传图片</text>
				</view>
				<view class="image-list" v-if="uploadImages.length">
					<view class="image-item" v-for="(img, i) in uploadImages" :key="i">
						<image class="preview-img" :src="img" mode="aspectFill" @click="previewImage(img)" />
						<view class="del-btn" @click="delImage(i)">×</view>
					</view>
				</view>
			</view>
		</view>

		<view class="submit-bar">
			<button class="submit-btn" @click="submit" :loading="loading">保存发作记录</button>
		</view>
	</view>
</template>

<script>
import { createEpisode } from '@/api/episode.js'
import { createMedicalRecord } from '@/api/medicalRecord.js'
import { uploadFile } from '@/api/request.js'

export default {
	data() {
		return {
			form: {
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
			uploadImages: [],
			loading: false
		}
	},
	onLoad() {
		const today = new Date()
		this.form.episodeDate = this.formatDate(today)
	},
	methods: {
		formatDate(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		onDateChange(e) {
			this.form.episodeDate = e.detail.value
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
		previewImage(current) {
			uni.previewImage({
				current: current,
				urls: this.uploadImages
			})
		},
		async submit() {
			if (!this.form.chiefComplaint.trim()) {
				uni.showToast({ title: '请填写主诉', icon: 'none' })
				return
			}

			this.loading = true
			uni.showLoading({ title: '保存中...' })

			try {
				const userInfo = uni.getStorageSync('userInfo') || {}

				// 1. 创建发作记录
				const episodeData = {
					...this.form,
					episodeDate: this.form.episodeDate + ' 00:00:00',  // 转换为 LocalDateTime 格式
					patientId: userInfo.id,
					patientName: userInfo.name
				}
				const episodeId = await createEpisode(episodeData)

				// 2. 上传图片并创建关联病历
				if (this.uploadImages.length > 0 && episodeId) {
					const urls = []
					for (const path of this.uploadImages) {
						const res = await uploadFile(path)
						if (res && res.url) {
							urls.push(res.url)
						}
					}

					// 创建病历记录并关联发作
					await createMedicalRecord({
						patientId: userInfo.id,
						patientName: userInfo.name,
						type: '门诊病历',
						date: this.form.episodeDate + ' 00:00:00',  // 转换为 LocalDateTime 格式
						diagnosis: this.form.diagnosis || '',
						content: this.form.chiefComplaint || '',
						attachments: urls.join(','),
						hospital: this.form.hospital || '',
						department: this.form.department || '',
						relatedEpisodeId: episodeId
					})
				}

				uni.hideLoading()
				uni.showToast({ title: '保存成功', icon: 'success' })

				setTimeout(() => {
					uni.navigateBack()
				}, 1000)
			} catch (e) {
				uni.hideLoading()
				console.error('保存失败:', e)
				uni.showToast({ title: '保存失败', icon: 'none' })
			} finally {
				this.loading = false
			}
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
	padding-bottom: 160rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

.form-card {
	margin-bottom: 24rpx;
}

.form-item {
	margin-bottom: 32rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	margin-bottom: 16rpx;
}

.form-tip {
	display: block;
	font-size: 24rpx;
	color: $app-primary;
	margin-bottom: 16rpx;
}

.required {
	color: #EF4444;
}

.form-input {
	width: 100%;
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: $app-text;
	box-sizing: border-box;
}

.form-textarea {
	width: 100%;
	min-height: 160rpx;
	padding: 20rpx 24rpx;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: $app-text;
	box-sizing: border-box;
}

.picker-input {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
}

.picker-value {
	font-size: 28rpx;
	color: $app-text;
}

.picker-input .app-icon {
	font-size: 28rpx;
	color: $app-text-muted;
}

/* 图片上传样式 */
.upload-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 48rpx;
	background: $app-hover-bg;
	border-radius: 12rpx;
	border: 2rpx dashed $app-border;
}

.upload-area .app-icon {
	font-size: 64rpx;
	color: $app-primary;
	margin-bottom: 16rpx;
}

.upload-text {
	font-size: 28rpx;
	color: $app-text-muted;
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 24rpx;
}

.image-item {
	position: relative;
	width: 160rpx;
	height: 160rpx;
}

.preview-img {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
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

.submit-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 24rpx;
	background: $app-card-bg;
	box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.05);
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	background: $app-primary;
	color: #fff;
	font-size: 32rpx;
	font-weight: 500;
	border-radius: 12rpx;
	border: none;
}
</style>