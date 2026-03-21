<template>
	<view class="container">
		<view class="card">
			<view class="tips">
				<text>上传您在其他医院的就诊资料（检查报告、病历等），便于主治医生全面了解您的病情。</text>
			</view>
			<view class="upload-area" @click="chooseImage">
				<text class="upload-icon">+</text>
				<text class="upload-text">点击上传图片/文件</text>
			</view>
			<view class="file-list" v-if="files.length">
				<view class="file-item" v-for="(f, i) in files" :key="i">
					<text class="file-name">{{ f.name || '已上传' }}</text>
					<text class="file-del" @click="delFile(i)">删除</text>
				</view>
			</view>
			<view class="form-item">
				<text class="label">备注（选填）</text>
				<textarea class="textarea" v-model="remark" placeholder="如：2024年某院检查报告" />
			</view>
			<button class="btn primary" @click="submit">提交</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return { files: [], remark: '' };
		},
		methods: {
			chooseImage() {
				uni.chooseImage({
					count: 9 - this.files.length,
					success: (res) => {
						res.tempFilePaths.forEach((path) => {
							this.files.push({ path, name: '图片' });
						});
					}
				});
			},
			delFile(i) {
				this.files.splice(i, 1);
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
	.upload-area { border: 2rpx dashed #ddd; border-radius: 12rpx; padding: 60rpx; text-align: center; margin-bottom: 24rpx; }
	.upload-icon { font-size: 64rpx; color: #999; display: block; }
	.upload-text { font-size: 28rpx; color: #999; margin-top: 16rpx; display: block; }
	.file-item { display: flex; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
	.file-del { font-size: 28rpx; color: #FA5151; }
	.form-item { margin: 24rpx 0; }
	.label { font-size: 28rpx; color: #333; display: block; margin-bottom: 12rpx; }
	.textarea { font-size: 30rpx; min-height: 160rpx; background: #f5f5f5; border-radius: 12rpx; padding: 20rpx; }
	.btn { margin-top: 32rpx; height: 88rpx; line-height: 88rpx; border-radius: 12rpx; font-size: 32rpx; }
	.btn.primary { background: #007AFF; color: #fff; }
</style>
