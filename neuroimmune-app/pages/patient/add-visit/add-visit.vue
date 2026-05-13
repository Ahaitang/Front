<template>
	<view class="container">
		<view class="form-card card">
			<view class="form-item">
				<text class="form-label">就诊类型</text>
				<view class="type-options">
					<view class="type-option" :class="{ active: form.type === '门诊病历' }" @click="form.type = '门诊病历'">门诊</view>
					<view class="type-option" :class="{ active: form.type === '住院病历' }" @click="form.type = '住院病历'">住院</view>
					<view class="type-option" :class="{ active: form.type === '外院病历' }" @click="form.type = '外院病历'">外院</view>
				</view>
			</view>

			<view class="form-item">
				<text class="form-label">就诊时间</text>
				<uni-datetime-picker type="datetime" v-model="form.date" :placeholder="'请选择就诊时间'" />
			</view>

			<view class="form-item">
				<text class="form-label">医院名称</text>
				<input class="form-input" v-model="form.hospital" placeholder="请输入医院名称" />
			</view>

			<view class="form-item">
				<text class="form-label">科室</text>
				<input class="form-input" v-model="form.department" placeholder="请输入科室" />
			</view>

			<view class="form-item">
				<text class="form-label">接诊医生</text>
				<input class="form-input" v-model="form.doctorName" placeholder="请输入医生姓名（选填）" />
			</view>

			<view class="form-item">
				<text class="form-label">诊断结果</text>
				<textarea class="form-textarea" v-model="form.diagnosis" placeholder="请输入诊断结果" />
			</view>

			<view class="form-item">
				<text class="form-label">病情描述</text>
				<textarea class="form-textarea" v-model="form.content" placeholder="请输入病情描述、治疗方案等（选填）" />
			</view>

			<!-- 图片上传区域 -->
			<view class="form-item">
				<text class="form-label">病历图片</text>
				<view class="upload-area" @click="chooseImage">
					<text class="app-icon uniui-cloud-upload-filled"></text>
					<text class="upload-text">点击上传图片（选填）</text>
				</view>
				<view class="image-list" v-if="uploadImages.length">
					<view class="image-item" v-for="(img, i) in uploadImages" :key="i">
						<image class="preview-img" :src="img" mode="aspectFill" @click="previewImage(img)" />
						<view class="del-btn" @click="delImage(i)">×</view>
					</view>
				</view>
				<view class="ocr-btn" v-if="uploadImages.length && !ocrResult" @click="doOCR">
					<text class="app-icon uniui-scan"></text>
					<text>识别病历内容</text>
				</view>
				<view class="ocr-result" v-if="ocrResult">
					<text class="ocr-tip">已识别内容，可手动修改上方信息</text>
				</view>
			</view>
		</view>

		<view class="submit-bar">
			<button class="submit-btn" @click="submit" :loading="loading">保存就诊记录</button>
		</view>
	</view>
</template>

<script>
import { createMedicalRecord } from '@/api/medicalRecord.js'
import { uploadFile } from '@/api/request.js'
import { parseMedicalRecord } from '@/api/ocr.js'

export default {
	data() {
		return {
			form: {
				type: '门诊病历',
				date: '',
				hospital: '',
				department: '',
				doctorName: '',
				diagnosis: '',
				content: ''
			},
			uploadImages: [],
			ocrResult: false,
			loading: false
		}
	},
	onLoad() {
		// 默认今天的日期
		const today = new Date()
		this.form.date = this.formatDateTime(today)
	},
	methods: {
		formatDateTime(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			const h = String(date.getHours()).padStart(2, '0')
			const min = String(date.getMinutes()).padStart(2, '0')
			const s = String(date.getSeconds()).padStart(2, '0')
			return `${y}-${m}-${d} ${h}:${min}:${s}`
		},
		chooseImage() {
			uni.chooseImage({
				count: 9 - this.uploadImages.length,
				success: (res) => {
					this.uploadImages = [...this.uploadImages, ...res.tempFilePaths]
					this.ocrResult = false
				}
			})
		},
		delImage(i) {
			this.uploadImages.splice(i, 1)
			this.ocrResult = false
		},
		previewImage(current) {
			uni.previewImage({
				current: current,
				urls: this.uploadImages
			})
		},
		async doOCR() {
			if (!this.uploadImages.length) return

			uni.showLoading({ title: '识别中...' })
			try {
				// 先上传图片获取URL
				const urls = []
				for (const path of this.uploadImages) {
					const res = await uploadFile(path)
					if (res && res.url) {
						urls.push(res.url)
					}
				}

				// 调用OCR识别
				const ocrRes = await parseMedicalRecord(urls)
				if (ocrRes) {
					// 自动填充识别结果
					if (ocrRes.hospital) this.form.hospital = ocrRes.hospital
					if (ocrRes.department) this.form.department = ocrRes.department
					if (ocrRes.diagnosis) this.form.diagnosis = ocrRes.diagnosis
					if (ocrRes.content) this.form.content = ocrRes.content
					this.ocrResult = true
					uni.hideLoading()
					uni.showToast({ title: '识别成功', icon: 'success' })
				}
			} catch (e) {
				uni.hideLoading()
				console.error('OCR识别失败:', e)
				uni.showToast({ title: '识别失败，请手动填写', icon: 'none' })
			}
		},
		async submit() {
			// 表单验证
			if (!this.form.hospital.trim()) {
				uni.showToast({ title: '请输入医院名称', icon: 'none' })
				return
			}
			if (!this.form.department.trim()) {
				uni.showToast({ title: '请输入科室', icon: 'none' })
				return
			}

			this.loading = true
			uni.showLoading({ title: '保存中...' })

			try {
				const userInfo = uni.getStorageSync('userInfo') || {}

				// 上传图片
				let attachmentUrls = []
				if (this.uploadImages.length > 0) {
					for (const path of this.uploadImages) {
						const res = await uploadFile(path)
						if (res && res.url) {
							attachmentUrls.push(res.url)
						}
					}
				}

				const data = {
					type: this.form.type,
					date: this.form.date,
					hospital: this.form.hospital,
					department: this.form.department,
					doctorName: this.form.doctorName,
					diagnosis: this.form.diagnosis,
					content: this.form.content,
					attachments: attachmentUrls.join(','),
					patientId: userInfo.id
				}

				await createMedicalRecord(data)
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

.type-options {
	display: flex;
	gap: 20rpx;
}

.type-option {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: $app-text-secondary;
	transition: all 0.2s;
}

.type-option.active {
	border-color: $app-primary;
	background: $app-primary-bg;
	color: $app-primary;
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

.ocr-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	margin-top: 24rpx;
	padding: 20rpx;
	background: $app-primary-bg;
	border-radius: 12rpx;
	color: $app-primary;
	font-size: 28rpx;
}

.ocr-btn .app-icon {
	font-size: 32rpx;
}

.ocr-result {
	margin-top: 16rpx;
}

.ocr-tip {
	font-size: 26rpx;
	color: $app-success;
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