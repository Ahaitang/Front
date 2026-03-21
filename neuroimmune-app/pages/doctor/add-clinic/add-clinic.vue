<template>
	<view class="container">
		<view class="card">
			<view class="form-item"><text class="label">预约时间</text><input class="input" type="text" placeholder="请选择时间" v-model="form.time" /></view>
			<view class="form-item"><text class="label">患者</text><input class="input" type="text" placeholder="请选择或输入患者" v-model="form.patient" /></view>
			<view class="form-item"><text class="label">备注</text><input class="input" type="text" placeholder="选填" v-model="form.remark" /></view>
			<button class="btn primary" @click="submit">保存</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				form: { time: '', patient: '', remark: '' }
			};
		},
		methods: {
			submit() {
				uni.showToast({ title: '已保存', icon: 'success' });
				setTimeout(() => uni.navigateBack(), 800);
			}
		}
	};
</script>

<style lang="scss" scoped>
	.container { min-height: 100vh; background: #F5F5F5; padding: 24rpx; }
	.card { background: #fff; border-radius: 16rpx; padding: 28rpx; }
	.form-item { margin-bottom: 32rpx; }
	.label { font-size: 28rpx; color: #333; display: block; margin-bottom: 12rpx; }
	.input { font-size: 30rpx; height: 72rpx; background: #f5f5f5; border-radius: 12rpx; padding: 0 24rpx; }
	.btn { margin-top: 32rpx; height: 88rpx; line-height: 88rpx; border-radius: 12rpx; font-size: 32rpx; }
	.btn.primary { background: #007AFF; color: #fff; }
</style>
