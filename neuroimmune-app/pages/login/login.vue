<template>
	<view class="container">
		<view class="header">
			<view class="logo-wrap">
				<text class="app-icon lg primary uniui-staff-filled"></text>
			</view>
			<text class="title">神经免疫随访</text>
			<text class="subtitle">登录后使用完整功能</text>
		</view>
		<view class="form card">
			<view class="form-item">
				<text class="label">手机号</text>
				<view class="input-wrap">
					<text class="app-icon sm muted uniui-phone-filled"></text>
					<input class="input" type="number" placeholder="请输入手机号码" v-model="form.phone" maxlength="11" />
				</view>
			</view>
			<view class="form-item">
				<text class="label">密码</text>
				<view class="input-wrap">
					<text class="app-icon sm muted uniui-locked-filled"></text>
					<input class="input" type="password" placeholder="请输入密码" v-model="form.password" />
				</view>
			</view>
			<view class="form-item">
				<text class="label">登录身份</text>
				<view class="role-options">
					<view class="role-item" :class="{ active: form.role === 'patient' }" @click="form.role = 'patient'">
						<text class="role-text">患者</text>
					</view>
					<view class="role-item" :class="{ active: form.role === 'doctor' }" @click="form.role = 'doctor'">
						<text class="role-text">医生</text>
					</view>
				</view>
			</view>
			<button class="btn primary" @click="handleLogin" :loading="loading">登录</button>
		</view>
	</view>
</template>

<script>
import { login } from '@/api/auth.js'

export default {
	data() {
		return {
			form: { phone: '', password: '', role: 'patient' },
			loading: false
		};
	},
	onLoad() {
		const token = uni.getStorageSync('token');
		if (token) {
			const role = uni.getStorageSync('role');
			if (role === 'doctor') {
				uni.reLaunch({ url: '/pages/doctor/index/index' });
			} else {
				uni.reLaunch({ url: '/pages/index/index' });
			}
		}
	},
	methods: {
		async handleLogin() {
			if (!this.form.phone || !this.form.password) {
				uni.showToast({ title: '请填写手机号和密码', icon: 'none' });
				return;
			}
			this.loading = true;
			try {
				// 调用统一登录接口
				const res = await login({
					username: this.form.phone,
					password: this.form.password,
					role: this.form.role
				});
				if (res && res.token) {
					uni.setStorageSync('token', res.token);
					uni.setStorageSync('userInfo', res.user || {});
					uni.setStorageSync('role', res.role || this.form.role);
					uni.showToast({ title: '登录成功' });
					setTimeout(() => {
						if (this.form.role === 'doctor') {
							uni.reLaunch({ url: '/pages/doctor/index/index' });
						} else {
							uni.switchTab({ url: '/pages/index/index' });
						}
					}, 500);
				}
			} catch (e) {
				uni.showToast({ title: '登录失败，请检查账号密码', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},
		navTo(url) {
			uni.navigateTo({ url });
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';
.container { min-height: 100vh; background: $app-bg; padding: 64rpx 40rpx; }
.header { text-align: center; margin-bottom: 56rpx; }
.logo-wrap {
	width: 120rpx; height: 120rpx; margin: 0 auto 24rpx;
	background: $app-primary-bg; border-radius: 32rpx;
	display: flex; align-items: center; justify-content: center;
}
.logo-wrap .app-icon { font-size: 64rpx !important; color: $app-primary !important; }
.title { font-size: 44rpx; font-weight: bold; color: $app-text; display: block; letter-spacing: 2rpx; }
.subtitle { font-size: 28rpx; color: $app-text-secondary; display: block; margin-top: 16rpx; }
.card {
	background: $app-card-bg; border-radius: $app-radius; padding: 40rpx;
	box-shadow: $app-shadow-card;
}
.form-item { margin-bottom: 36rpx; }
.form-item:last-of-type { margin-bottom: 0; }
.label { font-size: 28rpx; color: $app-text; display: block; margin-bottom: 16rpx; }
.input-wrap {
	display: flex; align-items: center;
	height: 88rpx; background: #F3F4F6; border-radius: $app-radius-sm;
	padding: 0 24rpx; gap: 16rpx;
}
.input { flex: 1; font-size: 30rpx; color: $app-text; }
.role-options { display: flex; gap: 24rpx; }
.role-item {
	flex: 1; height: 80rpx; display: flex; align-items: center; justify-content: center;
	background: #F3F4F6; border-radius: $app-radius-sm; border: 2rpx solid transparent;
}
.role-item.active { background: $app-primary-bg; border-color: $app-primary; }
.role-text { font-size: 28rpx; color: $app-text; }
.role-item.active .role-text { color: $app-primary; font-weight: 500; }
.btn {
	margin-top: 48rpx; height: 96rpx; line-height: 96rpx;
	border-radius: $app-radius-sm; font-size: 32rpx; font-weight: 500;
	background: $app-primary; color: #fff; border: none;
}
.btn::after { border: none; }
.link-row { text-align: center; margin-top: 40rpx; }
.link { font-size: 28rpx; color: $app-primary; display: inline-flex; align-items: center; gap: 8rpx; }
</style>