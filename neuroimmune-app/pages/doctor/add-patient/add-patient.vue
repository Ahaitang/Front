<template>
	<view class="container">
		<view class="form-card card">
			<view class="form-item">
				<text class="form-label">患者姓名 <text class="required">*</text></text>
				<input class="form-input" v-model="form.name" placeholder="请输入患者姓名" />
			</view>

			<view class="form-item">
				<text class="form-label">性别 <text class="required">*</text></text>
				<picker mode="selector" :range="genderOptions" @change="onGenderChange">
					<view class="picker-input">
						<text class="picker-value">{{ form.gender || '请选择性别' }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="form-label">年龄 <text class="required">*</text></text>
				<input class="form-input" type="number" v-model="form.age" placeholder="请输入年龄" />
			</view>

			<view class="form-item">
				<text class="form-label">手机号码</text>
				<input class="form-input" type="number" v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
			</view>

			<view class="form-item">
				<text class="form-label">疾病类型</text>
				<picker mode="selector" :range="diseaseOptions" range-key="label" @change="onDiseaseChange">
					<view class="picker-input">
						<text class="picker-value">{{ form.diseaseLabel || '请选择疾病类型' }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="form-label">备注</text>
				<textarea class="form-textarea" v-model="form.notes" placeholder="其他需要记录的信息" />
			</view>
		</view>

		<view class="submit-bar">
			<button class="submit-btn" @click="submit" :loading="loading">保存患者信息</button>
		</view>
	</view>
</template>

<script>
import { createPatient } from '@/api/patient.js'
import { bindDoctor } from '@/api/relation.js'

export default {
	data() {
		return {
			genderOptions: ['男', '女'],
			diseaseOptions: [
				{ label: 'MS', value: 'MS' },
				{ label: 'NMOSD', value: 'NMOSD' },
				{ label: 'MG', value: 'MG' },
				{ label: 'MOGAD', value: 'MOGAD' },
				{ label: '自身免疫性脑炎', value: 'AUTO_ENCEPHALITIS' },
				{ label: 'GBS', value: 'GBS' },
				{ label: 'CIDP', value: 'CIDP' },
				{ label: '其他', value: 'OTHER' }
			],
			form: {
				name: '',
				gender: '',
				age: '',
				phone: '',
				diseaseType: '',
				diseaseLabel: '',
				notes: ''
			},
			loading: false
		}
	},
	methods: {
		onGenderChange(e) {
			this.form.gender = this.genderOptions[e.detail.value]
		},
		onDiseaseChange(e) {
			const item = this.diseaseOptions[e.detail.value]
			this.form.diseaseType = item.value
			this.form.diseaseLabel = item.label
		},
		async submit() {
			if (!this.form.name.trim()) {
				uni.showToast({ title: '请填写患者姓名', icon: 'none' })
				return
			}
			if (!this.form.gender) {
				uni.showToast({ title: '请选择性别', icon: 'none' })
				return
			}
			if (!this.form.age) {
				uni.showToast({ title: '请填写年龄', icon: 'none' })
				return
			}

			this.loading = true
			try {
				const userInfo = uni.getStorageSync('userInfo') || {}
				const patientData = {
					name: this.form.name,
					gender: this.form.gender === '男' ? 'male' : 'female',
					age: parseInt(this.form.age),
					phone: this.form.phone,
					diseaseType: this.form.diseaseType,
					diseaseTypes: this.form.diseaseType ? [this.form.diseaseType] : [],
					notes: this.form.notes
				}
				const patientId = await createPatient(patientData)
				if (patientId && userInfo.id) {
					await bindDoctor(patientId, userInfo.id, 'doctor', '医生添加患者')
				}
				uni.showToast({ title: '添加成功', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 800)
			} catch (e) {
				console.error('添加患者失败:', e)
				uni.showToast({ title: '添加失败', icon: 'none' })
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

.form-item {
	margin-bottom: 32rpx;
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	margin-bottom: 12rpx;
}

.required {
	color: #EF4444;
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
	min-height: 120rpx;
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