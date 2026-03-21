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
				<text class="form-label">就诊日期</text>
				<picker mode="date" :value="form.date" @change="onDateChange">
					<view class="picker-input">
						<text class="picker-value">{{ form.date || '请选择日期' }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
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
		</view>

		<view class="submit-bar">
			<button class="submit-btn" @click="submit" :loading="loading">保存就诊记录</button>
		</view>
	</view>
</template>

<script>
import { createMedicalRecord } from '@/api/medicalRecord.js'

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
			loading: false
		}
	},
	onLoad() {
		// 默认今天的日期
		const today = new Date()
		this.form.date = this.formatDate(today)
	},
	methods: {
		formatDate(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		onDateChange(e) {
			this.form.date = e.detail.value
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
			if (!this.form.diagnosis.trim()) {
				uni.showToast({ title: '请输入诊断结果', icon: 'none' })
				return
			}

			this.loading = true
			try {
				const userInfo = uni.getStorageSync('userInfo') || {}
				const data = {
					type: this.form.type,
					date: this.form.date,
					hospital: this.form.hospital,
					department: this.form.department,
					doctorName: this.form.doctorName,
					diagnosis: this.form.diagnosis,
					content: this.form.content,
					patientId: userInfo.id
				}

				await createMedicalRecord(data)
				uni.showToast({ title: '保存成功', icon: 'success' })

				setTimeout(() => {
					uni.navigateBack()
				}, 1000)
			} catch (e) {
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