<template>
	<view class="container">
		<!-- 装饰背景 -->
		<view class="bg-decoration">
			<view class="circle circle-1"></view>
			<view class="circle circle-2"></view>
		</view>

		<view class="header">
			<view class="logo-wrap">
				<text class="app-icon lg primary uniui-staff-filled"></text>
			</view>
			<text class="title">神经免疫随访</text>
			<text class="subtitle">专业随访管理，守护健康每一步</text>
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
					<input class="input" type="text" password placeholder="请输入密码" v-model="form.password" />
				</view>
			</view>
			<view class="form-item">
				<text class="label">登录身份</text>
				<view class="role-options">
					<view class="role-item" :class="{ active: form.role === 'patient' }" @click="form.role = 'patient'">
						<text class="app-icon uniui-person-filled"></text>
						<text class="role-text">患者</text>
					</view>
					<view class="role-item" :class="{ active: form.role === 'doctor' }" @click="form.role = 'doctor'">
						<text class="app-icon uniui-staff-filled"></text>
						<text class="role-text">医生</text>
					</view>
				</view>
			</view>
			<button class="btn primary" @click="handleLogin" :loading="loading">登录</button>
		</view>

		<view class="footer">
			<text class="footer-text">登录即表示同意</text>
			<text class="footer-link">《用户协议》</text>
			<text class="footer-text">和</text>
			<text class="footer-link">《隐私政策》</text>
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
			uni.reLaunch({ url: '/pages/index/index' });
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
				const res = await login({
					username: this.form.phone,
					password: this.form.password,
					role: this.form.role
				});
				if (res && res.token) {
					uni.setStorageSync('token', res.token);
					uni.setStorageSync('userInfo', res.user || {});
					uni.setStorageSync('role', res.role || this.form.role);
					uni.showToast({ title: '登录成功', icon: 'success' });
					setTimeout(() => {
						uni.switchTab({ url: '/pages/index/index' });
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

.container {
	min-height: 100vh;
	background: $app-bg;
	padding: 80rpx 40rpx;
	position: relative;
	overflow: hidden;
}

/* 装饰背景 */
.bg-decoration {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	overflow: hidden;
}

.circle {
	position: absolute;
	border-radius: 50%;
	opacity: 0.5;
}

.circle-1 {
	width: 400rpx;
	height: 400rpx;
	background: linear-gradient(135deg, rgba(8, 145, 178, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
	top: -100rpx;
	right: -100rpx;
}

.circle-2 {
	width: 300rpx;
	height: 300rpx;
	background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%);
	bottom: 200rpx;
	left: -80rpx;
}

.header {
	text-align: center;
	margin-bottom: 64rpx;
	position: relative;
}

.logo-wrap {
	width: 140rpx;
	height: 140rpx;
	margin: 0 auto 28rpx;
	background: $app-gradient-primary;
	border-radius: 36rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $app-shadow-primary;
}

.logo-wrap .app-icon {
	font-size: 72rpx !important;
	color: #fff !important;
}

.title {
	font-size: 48rpx;
	font-weight: 700;
	color: $app-text;
	display: block;
	letter-spacing: 2rpx;
	margin-bottom: 12rpx;
}

.subtitle {
	font-size: 28rpx;
	color: $app-text-secondary;
	display: block;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius-lg;
	padding: 48rpx 40rpx;
	box-shadow: $app-shadow-md;
	position: relative;
}

.form-item {
	margin-bottom: 36rpx;
}

.form-item:last-of-type {
	margin-bottom: 0;
}

.label {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
	margin-bottom: 16rpx;
}

.input-wrap {
	display: flex;
	align-items: center;
	height: 96rpx;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	padding: 0 28rpx;
	gap: 16rpx;
	transition: $app-transition;
}

.input-wrap:focus-within {
	background: #fff;
	box-shadow: 0 0 0 2rpx $app-primary;
}

.input {
	flex: 1;
	font-size: 30rpx;
	color: $app-text;
}

.role-options {
	display: flex;
	gap: 24rpx;
}

.role-item {
	flex: 1;
	height: 100rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	border: 2rpx solid transparent;
	transition: $app-transition;
}

.role-item .app-icon {
	font-size: 40rpx !important;
	color: $app-text-muted !important;
	transition: $app-transition;
}

.role-item.active {
	background: $app-primary-bg;
	border-color: $app-primary;
}

.role-item.active .app-icon {
	color: $app-primary !important;
}

.role-text {
	font-size: 28rpx;
	color: $app-text-secondary;
	transition: $app-transition;
}

.role-item.active .role-text {
	color: $app-primary;
	font-weight: 500;
}

.btn {
	margin-top: 48rpx;
	height: 100rpx;
	line-height: 100rpx;
	border-radius: $app-radius-sm;
	font-size: 34rpx;
	font-weight: 600;
	background: $app-gradient-primary;
	color: #fff;
	border: none;
	box-shadow: $app-shadow-primary;
	transition: $app-transition;
}

.btn:active {
	transform: scale(0.98);
	box-shadow: $app-shadow;
}

.btn::after {
	border: none;
}

.footer {
	position: fixed;
	bottom: 60rpx;
	left: 0;
	right: 0;
	text-align: center;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
}

.footer-text {
	font-size: 24rpx;
	color: $app-text-muted;
}

.footer-link {
	font-size: 24rpx;
	color: $app-primary;
}
</style>