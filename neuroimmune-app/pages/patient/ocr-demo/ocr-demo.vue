<template>
	<view class="container">
		<view class="card">
			<view class="card-title">图像识别</view>
			<view class="card-desc">上传图片进行文字识别，支持医疗报告、检验单等</view>

			<view class="upload-area" @click="chooseImage">
				<view class="upload-content" v-if="!imagePath">
					<text class="app-icon uniui-plusempty"></text>
					<text class="upload-text">点击上传图片</text>
					<text class="upload-tip">支持 JPG、PNG 格式</text>
				</view>
				<image v-else class="preview-image" :src="imagePath" mode="aspectFit"></image>
			</view>

			<view class="btn-group">
				<button class="btn" :class="{ disabled: !imagePath }" :disabled="!imagePath || loading"
					@click="recognizeImage('general')">
					{{ loading ? '识别中...' : '通用识别' }}
				</button>
				<button class="btn primary" :class="{ disabled: !imagePath }" :disabled="!imagePath || loading"
					@click="recognizeImage('medical')">
					{{ loading ? '识别中...' : '医疗报告识别' }}
				</button>
			</view>
		</view>

		<!-- 识别结果 -->
		<view class="card result-card" v-if="result">
			<view class="card-header">
				<text class="card-title">识别结果</text>
				<text class="copy-btn" @click="copyResult">复制</text>
			</view>
			<view class="result-content">
				<view class="result-item" v-if="result.demo">
					<text class="demo-tag">演示模式</text>
				</view>
				<view class="result-item" v-if="result.type">
					<text class="label">识别类型：</text>
					<text class="value">{{ result.type }}</text>
				</view>
				<view class="result-text" v-if="result.content">
					<text class="label">识别内容：</text>
					<text class="content-text">{{ result.content }}</text>
				</view>
				<view class="result-item" v-if="result.parsed && result.parsed.diagnosis">
					<text class="label">诊断信息：</text>
					<text class="value highlight">{{ result.parsed.diagnosis }}</text>
				</view>
				<view class="result-item" v-if="result.parsed && result.parsed.items">
					<text class="label">检查项目：</text>
					<text class="value">{{ result.parsed.items }}</text>
				</view>
				<view class="result-item error" v-if="!result.success">
					<text class="label">错误信息：</text>
					<text class="value">{{ result.message }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { recognizeGeneral, recognizeMedicalReport } from '@/api/ocr.js'

export default {
	data() {
		return {
			imagePath: '',
			result: null,
			loading: false
		}
	},
	methods: {
		chooseImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.imagePath = res.tempFilePaths[0]
					this.result = null
				}
			})
		},
		async recognizeImage(type) {
			if (!this.imagePath || this.loading) return

			this.loading = true
			this.result = null

			try {
				let res
				if (type === 'medical') {
					res = await recognizeMedicalReport(this.imagePath)
				} else {
					res = await recognizeGeneral(this.imagePath)
				}
				this.result = res
			} catch (e) {
				console.error('识别失败:', e)
				this.result = {
					success: false,
					message: '识别失败，请重试'
				}
			} finally {
				this.loading = false
			}
		},
		copyResult() {
			if (!this.result || !this.result.content) return
			uni.setClipboardData({
				data: this.result.content,
				success: () => {
					uni.showToast({ title: '已复制', icon: 'success' })
				}
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
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	margin-bottom: 24rpx;
	box-shadow: $app-shadow;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: $app-text;
}

.card-desc {
	font-size: 26rpx;
	color: $app-text-muted;
	margin-bottom: 24rpx;
}

.upload-area {
	border: 2rpx dashed $app-border;
	border-radius: 16rpx;
	min-height: 300rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24rpx;
	overflow: hidden;
}

.upload-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx;
}

.upload-content .app-icon {
	font-size: 80rpx;
	color: $app-text-muted;
	margin-bottom: 16rpx;
}

.upload-text {
	font-size: 30rpx;
	color: $app-text-secondary;
	margin-bottom: 8rpx;
}

.upload-tip {
	font-size: 24rpx;
	color: $app-text-muted;
}

.preview-image {
	width: 100%;
	height: 300rpx;
}

.btn-group {
	display: flex;
	gap: 20rpx;
}

.btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	background: $app-bg;
	color: $app-text;
	border: none;
}

.btn.primary {
	background: $app-primary;
	color: #fff;
}

.btn.disabled {
	opacity: 0.5;
}

.result-card {
	padding: 24rpx;
}

.result-content {
	margin-top: 16rpx;
}

.result-item {
	display: flex;
	align-items: flex-start;
	padding: 16rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.result-item:last-child {
	border-bottom: none;
}

.result-item.error .value {
	color: #EF4444;
}

.result-text {
	padding: 16rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.label {
	font-size: 26rpx;
	color: $app-text-muted;
	margin-right: 12rpx;
}

.value {
	font-size: 28rpx;
	color: $app-text;
	flex: 1;
}

.value.highlight {
	color: $app-primary;
	font-weight: 500;
}

.content-text {
	font-size: 28rpx;
	color: $app-text;
	line-height: 1.6;
	margin-top: 12rpx;
	display: block;
	background: $app-bg;
	padding: 20rpx;
	border-radius: 12rpx;
}

.demo-tag {
	font-size: 22rpx;
	color: #F59E0B;
	background: #FEF3C7;
	padding: 6rpx 16rpx;
	border-radius: 16rpx;
}

.copy-btn {
	font-size: 26rpx;
	color: $app-primary;
}
</style>