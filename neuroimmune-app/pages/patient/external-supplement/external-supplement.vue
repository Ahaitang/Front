<template>
	<view class="container">
		<view class="card">
			<view class="tips">
				<text>补充或更新您之前上传的外院资料说明，便于医生更准确判断。</text>
			</view>
			<view class="form-item">
				<text class="label">补充内容</text>
				<textarea class="textarea" v-model="content" placeholder="请描述需要补充的资料或说明" />
			</view>
			<view class="upload-area" @click="chooseImage">
				<text class="upload-icon">+</text>
				<text class="upload-text">上传补充材料（选填）</text>
			</view>
			<button class="btn primary" @click="submit">提交</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return { content: '', files: [] };
		},
		methods: {
			chooseImage() {
				uni.chooseImage({ count: 9, success: (res) => { this.files = res.tempFilePaths; } });
			},
			submit() {
				uni.showToast({ title: '提交成功', icon: 'success' });
				setTimeout(() => uni.navigateBack(), 800);
			}
		}
	};
</script>

<style lang="scss" scoped>
	.container { min-height: 100vh; background: #F5F5F5; padding: 24rpx; }
	.card { background: #fff; border-radius: 16rpx; padding: 28rpx; }
	.tips { font-size: 28rpx; color: #666; margin-bottom: 32rpx; line-height: 1.5; }
	.form-item { margin-bottom: 24rpx; }
	.label { font-size: 28rpx; color: #333; display: block; margin-bottom: 12rpx; }
	.textarea { font-size: 30rpx; min-height: 200rpx; background: #f5f5f5; border-radius: 12rpx; padding: 20rpx; }
	.upload-area { border: 2rpx dashed #ddd; border-radius: 12rpx; padding: 40rpx; text-align: center; margin: 24rpx 0; }
	.upload-icon { font-size: 48rpx; color: #999; display: block; }
	.upload-text { font-size: 28rpx; color: #999; margin-top: 12rpx; display: block; }
	.btn { margin-top: 32rpx; height: 88rpx; line-height: 88rpx; border-radius: 12rpx; font-size: 32rpx; background: #007AFF; color: #fff; }
</style>
