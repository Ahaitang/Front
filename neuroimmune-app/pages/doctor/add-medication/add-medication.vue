<template>
	<view class="container">
		<view class="card">
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-contact-filled"></text> 患者</text>
				<input class="input" type="text" placeholder="请选择患者" v-model="form.patient" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-compose"></text> 用药建议内容</text>
				<textarea class="textarea" placeholder="请输入用药建议" v-model="form.content" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-calendar-filled"></text> 生效时间</text>
				<input class="input" type="text" placeholder="请选择时间" v-model="form.time" />
			</view>
			<button class="btn primary" @click="submit">保存</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				form: { patient: '', content: '', time: '' },
				patientId: '',
				patientName: ''
			};
		},
		onLoad(op) {
			if (op.patientId) {
				this.patientId = op.patientId;
				this.patientName = op.patientName || '已选患者';
				this.form.patient = this.patientName;
			}
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
	@import '@/static/app-theme.scss';
	.container { min-height: 100vh; background: $app-bg; padding: 24rpx; }
	.card { background: $app-card-bg; border-radius: $app-radius; padding: 28rpx; box-shadow: $app-shadow; }
	.form-item { margin-bottom: 32rpx; }
	.label { font-size: 28rpx; color: $app-text; display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx; }
	.input { font-size: 30rpx; height: 72rpx; background: #F3F4F6; border-radius: $app-radius-sm; padding: 0 24rpx; color: $app-text; }
	.textarea { font-size: 30rpx; min-height: 160rpx; background: #F3F4F6; border-radius: $app-radius-sm; padding: 20rpx 24rpx; color: $app-text; width: 100%; box-sizing: border-box; }
	.btn { margin-top: 32rpx; height: 88rpx; line-height: 88rpx; border-radius: $app-radius-sm; font-size: 32rpx; }
	.btn.primary { background: $app-primary; color: #fff; }
	.btn::after { border: none; }
</style>
