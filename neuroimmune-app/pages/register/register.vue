<template>
	<view class="container">
		<!-- 装饰背景 -->
		<view class="bg-decoration">
			<view class="circle circle-1"></view>
			<view class="circle circle-2"></view>
		</view>

		<!-- 步骤指示器 -->
		<view class="steps-indicator">
			<view class="step" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
				<text class="step-num">1</text>
				<text class="step-label">基本信息</text>
			</view>
			<view class="step-line" :class="{ active: currentStep >= 2 }"></view>
			<view class="step" :class="{ active: currentStep >= 2 }">
				<text class="step-num">2</text>
				<text class="step-label">提交注册</text>
			</view>
		</view>

		<!-- Step 1: 基本信息 -->
		<view class="form card" v-if="currentStep === 1">
			<view class="form-item">
				<text class="label">手机号</text>
				<view class="input-wrap">
					<text class="app-icon sm muted uniui-phone-filled"></text>
					<input class="input" type="number" placeholder="请输入手机号" v-model="form.phone" maxlength="11" @blur="checkPhone" />
				</view>
				<text class="error-msg" v-if="phoneExists">该手机号已注册</text>
			</view>
			<view class="form-item">
				<text class="label">密码</text>
				<view class="input-wrap">
					<text class="app-icon sm muted uniui-locked-filled"></text>
					<input class="input" type="text" password placeholder="6-20位密码" v-model="form.password" />
				</view>
			</view>
			<view class="form-item">
				<text class="label">确认密码</text>
				<view class="input-wrap">
					<text class="app-icon sm muted uniui-locked-filled"></text>
					<input class="input" type="text" password placeholder="再次输入密码" v-model="form.confirmPassword" />
				</view>
				<text class="error-msg" v-if="form.confirmPassword && form.password !== form.confirmPassword">密码不一致</text>
			</view>
			<view class="form-item">
				<text class="label">姓名</text>
				<view class="input-wrap">
					<text class="app-icon sm muted uniui-person-filled"></text>
					<input class="input" type="text" placeholder="请输入姓名" v-model="form.name" />
				</view>
			</view>
			<view class="form-item">
				<text class="label">性别</text>
				<view class="gender-options">
					<view class="gender-item" :class="{ active: form.gender === '男' }" @click="form.gender = '男'">
						<text class="app-icon uniui-person-filled"></text>
						<text class="gender-text">男</text>
					</view>
					<view class="gender-item" :class="{ active: form.gender === '女' }" @click="form.gender = '女'">
						<text class="app-icon uniui-person-filled"></text>
						<text class="gender-text">女</text>
					</view>
				</view>
			</view>
			<view class="form-item">
				<text class="label">出生日期</text>
				<view class="input-wrap">
					<text class="app-icon sm muted uniui-calendar-filled"></text>
					<picker mode="date" :value="form.birthDate" @change="onDateChange">
						<view class="picker-value">{{ form.birthDate || '请选择出生日期' }}</view>
					</picker>
				</view>
			</view>
			<button class="btn primary" @click="nextStep">下一步</button>
		</view>

		<!-- Step 2: 确认提交 -->
		<view class="confirm card" v-if="currentStep === 2">
			<view class="confirm-title">请确认注册信息</view>
			<view class="confirm-list">
				<view class="confirm-item">
					<text class="confirm-label">手机号</text>
					<text class="confirm-value">{{ form.phone }}</text>
				</view>
				<view class="confirm-item">
					<text class="confirm-label">姓名</text>
					<text class="confirm-value">{{ form.name }}</text>
				</view>
				<view class="confirm-item">
					<text class="confirm-label">性别</text>
					<text class="confirm-value">{{ form.gender }}</text>
				</view>
				<view class="confirm-item">
					<text class="confirm-label">出生日期</text>
					<text class="confirm-value">{{ form.birthDate }}</text>
				</view>
			</view>
			<view class="tips-box">
				<text class="tips-text">注册成功后，可在小程序内选择医生进行绑定</text>
			</view>
			<view class="step-actions">
				<button class="btn secondary" @click="prevStep">上一步</button>
				<button class="btn primary" @click="submitRegister" :loading="loading">提交注册</button>
			</view>
		</view>

		<!-- Step 3: 成功提示 -->
		<view class="success-wrap card" v-if="currentStep === 3">
			<view class="success-icon">
				<text class="app-icon uniui-checkbox-filled"></text>
			</view>
			<text class="success-title">注册成功!</text>
			<text class="success-msg">您的账号已创建成功，可以直接登录使用。</text>
			<button class="btn primary" @click="backToLogin">返回登录</button>
		</view>
	</view>
</template>

<script>
import { register, checkPhoneExists } from '@/api/auth.js'

export default {
	data() {
		return {
			currentStep: 1,
			form: {
				phone: '',
				password: '',
				confirmPassword: '',
				name: '',
				gender: '男',
				birthDate: ''
			},
			phoneExists: false,
			loading: false
		}
	},
	methods: {
		async checkPhone() {
			if (this.form.phone.length === 11) {
				try {
					const res = await checkPhoneExists(this.form.phone)
					this.phoneExists = res && res.exists
				} catch (e) {
					console.error('检查手机号失败:', e)
				}
			}
		},
		validateStep1() {
			if (!this.form.phone || this.form.phone.length !== 11) {
				uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
				return false
			}
			if (this.phoneExists) {
				uni.showToast({ title: '该手机号已注册', icon: 'none' })
				return false
			}
			if (!this.form.password || this.form.password.length < 6) {
				uni.showToast({ title: '密码至少6位', icon: 'none' })
				return false
			}
			if (this.form.password !== this.form.confirmPassword) {
				uni.showToast({ title: '密码不一致', icon: 'none' })
				return false
			}
			if (!this.form.name || this.form.name.length < 2) {
				uni.showToast({ title: '请输入姓名', icon: 'none' })
				return false
			}
			if (!this.form.birthDate) {
				uni.showToast({ title: '请选择出生日期', icon: 'none' })
				return false
			}
			return true
		},
		nextStep() {
			if (this.currentStep === 1) {
				if (!this.validateStep1()) return
			}
			this.currentStep++
		},
		prevStep() {
			this.currentStep--
		},
		onDateChange(e) {
			this.form.birthDate = e.detail.value
		},
		async submitRegister() {
			this.loading = true
			try {
				await register({
					phone: this.form.phone,
					password: this.form.password,
					name: this.form.name,
					gender: this.form.gender,
					birthDate: this.form.birthDate
				})
				this.currentStep = 3
			} catch (e) {
				uni.showToast({ title: '注册失败，请重试', icon: 'none' })
			} finally {
				this.loading = false
			}
		},
		backToLogin() {
			uni.redirectTo({ url: '/pages/login/login' })
		}
	}
}
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding: 40rpx 32rpx;
	position: relative;
	overflow: hidden;
}

// 装饰背景（参考登录页）
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

// 步骤指示器
.steps-indicator {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 32rpx;
	padding: 20rpx 0;
}

.step {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.step-num {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: $app-hover-bg;
	color: $app-text-muted;
	font-size: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: $app-transition;
}

.step.active .step-num {
	background: $app-primary;
	color: #fff;
}

.step.done .step-num {
	background: $app-success;
	color: #fff;
}

.step-label {
	font-size: 24rpx;
	color: $app-text-muted;
	transition: $app-transition;
}

.step.active .step-label {
	color: $app-primary;
	font-weight: 500;
}

.step-line {
	width: 80rpx;
	height: 4rpx;
	background: $app-border;
	margin: 0 8rpx;
	transition: $app-transition;
}

.step-line.active {
	background: $app-primary;
}

// 卡片样式
.card {
	background: $app-card-bg;
	border-radius: $app-radius-lg;
	padding: 40rpx 32rpx;
	box-shadow: $app-shadow-md;
	position: relative;
}

// 表单样式（参考登录页）
.form-item {
	margin-bottom: 28rpx;
}

.form-item:last-of-type {
	margin-bottom: 0;
}

.label {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	display: block;
	margin-bottom: 12rpx;
}

.input-wrap {
	display: flex;
	align-items: center;
	height: 88rpx;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	padding: 0 24rpx;
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

.picker-value {
	flex: 1;
	font-size: 30rpx;
	color: $app-text;
}

.error-msg {
	font-size: 24rpx;
	color: $app-error;
	margin-top: 8rpx;
}

// 性别选择
.gender-options {
	display: flex;
	gap: 24rpx;
}

.gender-item {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	font-size: 30rpx;
	color: $app-text-secondary;
	border: 2rpx solid transparent;
	transition: $app-transition;
}

.gender-item .app-icon {
	font-size: 32rpx !important;
	color: $app-text-muted !important;
}

.gender-item.active {
	background: $app-primary-bg;
	border-color: $app-primary;
	color: $app-primary;
}

.gender-item.active .app-icon {
	color: $app-primary !important;
}

.gender-text {
	font-size: 28rpx;
}

// 按钮
.btn {
	height: 88rpx;
	line-height: 88rpx;
	border-radius: $app-radius-sm;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
	margin-top: 32rpx;
	transition: $app-transition;
}

.btn::after {
	border: none;
}

.btn.primary {
	background: $app-gradient-primary;
	color: #fff;
	box-shadow: $app-shadow-primary;
}

.btn.primary:active {
	transform: scale(0.98);
	box-shadow: $app-shadow;
}

.btn.primary[disabled] {
	background: $app-hover-bg;
	color: $app-text-muted;
	box-shadow: none;
}

.btn.secondary {
	background: $app-hover-bg;
	color: $app-text-secondary;
	box-shadow: none;
}

.btn.secondary:active {
	transform: scale(0.98);
}

.step-actions {
	display: flex;
	gap: 24rpx;
	margin-top: 32rpx;
}

.step-actions .btn {
	flex: 1;
	margin-top: 0;
}

// 确认信息
.confirm-title {
	font-size: 36rpx;
	font-weight: 600;
	color: $app-text;
	text-align: center;
	margin-bottom: 32rpx;
}

.confirm-list {
	padding: 24rpx;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
}

.confirm-item {
	display: flex;
	justify-content: space-between;
	padding: 16rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.confirm-item:last-child {
	border-bottom: none;
}

.confirm-label {
	font-size: 28rpx;
	color: $app-text-muted;
}

.confirm-value {
	font-size: 28rpx;
	color: $app-text;
}

// 提示信息
.tips-box {
	background: $app-primary-bg;
	border-radius: $app-radius-sm;
	padding: 16rpx 24rpx;
	margin-top: 24rpx;
}

.tips-text {
	font-size: 24rpx;
	color: $app-primary;
	line-height: 1.5;
}

// 成功页面
.success-wrap {
	text-align: center;
	padding: 60rpx 40rpx;
}

.success-icon {
	font-size: 120rpx;
	color: $app-success;
	margin-bottom: 32rpx;
}

.success-title {
	font-size: 40rpx;
	font-weight: 600;
	color: $app-text;
	display: block;
	margin-bottom: 16rpx;
}

.success-msg {
	font-size: 28rpx;
	color: $app-text-secondary;
	display: block;
	margin-bottom: 40rpx;
	line-height: 1.6;
}
</style>