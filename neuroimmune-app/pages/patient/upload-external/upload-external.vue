<template>
	<view class="container">
		<view class="card">
			<view class="tips">
				<text>上传您在其他医院的就诊资料（检查报告、病历等），便于主治医生全面了解您的病情。</text>
			</view>

			<!-- 图片上传区域 -->
			<view class="section">
				<text class="section-title">上传图片</text>
				<view class="upload-area" @click="chooseImage">
					<text class="upload-icon">+</text>
					<text class="upload-text">点击上传图片</text>
				</view>
				<view class="image-list" v-if="images.length">
					<view class="image-item" v-for="(img, i) in images" :key="i">
						<image class="preview-img" :src="img" mode="aspectFill" />
						<view class="del-btn" @click="delImage(i)">×</view>
					</view>
				</view>
			</view>

			<!-- 文字内容 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">资料内容</text>
					<text class="section-tip" v-if="images.length" @click="parseImages">解析图片</text>
				</view>
				<textarea
					class="textarea"
					v-model="content"
					placeholder="请输入或粘贴就诊资料内容，也可上传图片后点击【解析图片】自动识别"
					:maxlength="2000"
				/>
				<text class="char-count">{{ content.length }}/2000</text>
			</view>

			<!-- 备注 -->
			<view class="section">
				<text class="section-title">备注（选填）</text>
				<input class="input" v-model="remark" placeholder="如：2024年某院检查报告" />
			</view>

			<button class="btn primary" :loading="loading" @click="submit">提交</button>
		</view>
	</view>
</template>

<script>
import { createMedicalRecord } from '@/api/medicalRecord.js'
import { parseMedicalRecord } from '@/api/ocr.js'

export default {
	data() {
		return {
			images: [],
			content: '',
			remark: '',
			loading: false
		}
	},
	methods: {
		chooseImage() {
			uni.chooseImage({
				count: 9 - this.images.length,
				success: (res) => {
					this.images = [...this.images, ...res.tempFilePaths]
					// 上传图片后自动解析
					this.parseImages()
				}
			})
		},
		delImage(i) {
			this.images.splice(i, 1)
		},
		async parseImages() {
			if (!this.images.length) {
				uni.showToast({ title: '请先上传图片', icon: 'none' })
				return
			}

			uni.showLoading({ title: '解析中...' })
			try {
				const res = await parseMedicalRecord(this.images)
				if (res && res.content) {
					// 追加到现有内容后
					if (this.content) {
						this.content += '\n\n' + res.content
					} else {
						this.content = res.content
					}
					uni.showToast({ title: '解析成功', icon: 'success' })
				}
			} catch (e) {
				console.error('解析失败:', e)
				uni.showToast({ title: '解析失败，请手动输入', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		},
		async submit() {
			if (!this.content.trim() && !this.images.length) {
				uni.showToast({ title: '请上传图片或输入内容', icon: 'none' })
				return
			}

			this.loading = true
			try {
				const userInfo = uni.getStorageSync('userInfo') || {}
				const data = {
					patientId: userInfo.id,
					patientName: userInfo.name,
					type: '外院病历',
					content: this.content,
					attachments: this.images.join(','),
					notes: this.remark
				}

				await createMedicalRecord(data)
				uni.showToast({ title: '提交成功', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 800)
			} catch (e) {
				console.error('提交失败:', e)
				uni.showToast({ title: '提交失败', icon: 'none' })
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
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

.tips {
	font-size: 28rpx;
	color: $app-text-muted;
	margin-bottom: 32rpx;
	line-height: 1.5;
}

.section {
	margin-bottom: 32rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.section-title {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	margin-bottom: 16rpx;
	display: block;
}

.section-header .section-title {
	margin-bottom: 0;
}

.section-tip {
	font-size: 26rpx;
	color: $app-primary;
}

.upload-area {
	border: 2rpx dashed $app-border;
	border-radius: $app-radius;
	padding: 48rpx;
	text-align: center;
	margin-bottom: 24rpx;
}

.upload-icon {
	font-size: 64rpx;
	color: $app-text-muted;
	display: block;
}

.upload-text {
	font-size: 28rpx;
	color: $app-text-muted;
	margin-top: 12rpx;
	display: block;
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
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
	background: #EF4444;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	line-height: 1;
}

.textarea {
	width: 100%;
	min-height: 240rpx;
	padding: 20rpx;
	border: 2rpx solid $app-border;
	border-radius: $app-radius;
	font-size: 28rpx;
	color: $app-text;
	background: $app-bg;
	box-sizing: border-box;
}

.char-count {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
}

.input {
	width: 100%;
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid $app-border;
	border-radius: $app-radius;
	font-size: 28rpx;
	color: $app-text;
	background: $app-bg;
	box-sizing: border-box;
}

.btn {
	margin-top: 32rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: $app-radius;
	font-size: 32rpx;
	font-weight: 500;
}

.btn.primary {
	background: $app-primary;
	color: #fff;
}
</style>