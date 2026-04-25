<template>
	<view class="container">
		<view class="header-card">
			<image class="avatar" :src="form.avatar || '/static/component.png'" mode="aspectFill"></image>
			<view class="avatar-edit" @click="chooseAvatar">
				<text class="app-icon uniui-camera-filled"></text>
				<text>更换头像</text>
			</view>
		</view>

		<view class="form-card">
			<view class="form-item">
				<view class="item-left">
					<text class="app-icon uniui-person-filled"></text>
					<text class="label">姓名</text>
				</view>
				<input class="input" v-model="form.name" placeholder="请输入姓名" />
			</view>
			<view class="form-item">
				<view class="item-left">
					<text class="app-icon uniui-medal"></text>
					<text class="label">职称</text>
				</view>
				<picker mode="selector" :range="titleOptions" @change="onTitleChange">
					<view class="picker-row">
						<text class="picker-value">{{ form.title || '请选择职称' }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>
			<view class="form-item">
				<view class="item-left">
					<text class="app-icon uniui-home-filled"></text>
					<text class="label">医院</text>
				</view>
				<input class="input" v-model="form.hospital" placeholder="请输入医院名称" />
			</view>
			<view class="form-item">
				<view class="item-left">
					<text class="app-icon uniui-flag"></text>
					<text class="label">科室</text>
				</view>
				<input class="input" v-model="form.department" placeholder="请输入科室名称" />
			</view>
			<view class="form-item">
				<view class="item-left">
					<text class="app-icon uniui-phone-filled"></text>
					<text class="label">手机号码</text>
				</view>
				<input class="input" type="number" v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
			</view>
		</view>

		<view class="action-section">
			<button class="save-btn" @click="save" :loading="saving">
				<text class="app-icon uniui-checkmarkempty"></text>
				<text>保存修改</text>
			</button>
		</view>

		<view class="logout-section">
			<button class="logout-btn" @click="handleLogout">
				<text class="app-icon uniui-gear-filled"></text>
				<text>退出登录</text>
			</button>
		</view>
	</view>
</template>

<script>
import { getDoctorById, updateDoctor } from '@/api/doctor.js'

export default {
	data() {
		return {
			titleOptions: ['主任医师', '副主任医师', '主治医师', '住院医师', '医师', '助理医师'],
			form: {
				avatar: '',
				name: '',
				title: '',
				hospital: '',
				department: '',
				phone: ''
			},
			saving: false
		}
	},
	onLoad() {
		this.loadDoctorInfo()
	},
	methods: {
		async loadDoctorInfo() {
			const userInfo = uni.getStorageSync('userInfo') || {}
			if (userInfo.id) {
				try {
					const doctor = await getDoctorById(userInfo.id)
					if (doctor) {
						this.form.name = doctor.name || userInfo.name || ''
						this.form.title = doctor.title || ''
						this.form.hospital = doctor.hospital || ''
						this.form.department = doctor.department || ''
						this.form.phone = doctor.phone || userInfo.phone || ''
						this.form.avatar = doctor.avatar || userInfo.avatar || ''
					}
				} catch (e) {
					console.error('加载医生信息失败:', e)
					// 使用本地存储作为备份
					this.form.name = userInfo.name || ''
					this.form.phone = userInfo.phone || ''
					this.form.avatar = userInfo.avatar || ''
				}
			}
		},
		onTitleChange(e) {
			this.form.title = this.titleOptions[e.detail.value]
		},
		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				success: (res) => {
					this.form.avatar = res.tempFilePaths[0]
				}
			})
		},
		async save() {
			if (this.saving) return
			this.saving = true

			const userInfo = uni.getStorageSync('userInfo') || {}
			if (!userInfo.id) {
				uni.showToast({ title: '请先登录', icon: 'none' })
				this.saving = false
				return
			}

			try {
				await updateDoctor(userInfo.id, {
					name: this.form.name,
					title: this.form.title,
					hospital: this.form.hospital,
					department: this.form.department,
					phone: this.form.phone,
					avatar: this.form.avatar
				})

				// 更新本地存储
				uni.setStorageSync('userInfo', {
					...userInfo,
					name: this.form.name,
					title: this.form.title,
					hospital: this.form.hospital,
					department: this.form.department,
					phone: this.form.phone,
					avatar: this.form.avatar
				})

				uni.showToast({ title: '保存成功', icon: 'success' })
			} catch (e) {
				console.error('保存失败:', e)
				uni.showToast({ title: '保存失败', icon: 'none' })
			}

			this.saving = false
		},
		handleLogout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('token')
						uni.removeStorageSync('userInfo')
						uni.removeStorageSync('role')
						uni.showToast({ title: '已退出登录', icon: 'success' })
						setTimeout(() => {
							uni.reLaunch({ url: '/pages/login/login' })
						}, 800)
					}
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
	padding-bottom: 80rpx;
}

.header-card {
	background: $app-gradient-doctor;
	border-radius: $app-radius;
	padding: 48rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.25);
}

.avatar {
	width: 180rpx;
	height: 180rpx;
	border-radius: 50%;
	border: 6rpx solid rgba(255, 255, 255, 0.3);
	margin-bottom: 20rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.avatar-edit {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 26rpx;
	color: #fff;
	background: rgba(255, 255, 255, 0.2);
	padding: 12rpx 24rpx;
	border-radius: 20rpx;
}

.avatar-edit .app-icon {
	font-size: 28rpx;
}

.form-card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	margin-bottom: 24rpx;
	box-shadow: $app-shadow;
}

.form-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid $app-divider;
}

.form-item:last-child {
	border-bottom: none;
}

.item-left {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.item-left .app-icon {
	font-size: 32rpx;
	color: $app-primary;
}

.label {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
}

.input {
	flex: 1;
	font-size: 28rpx;
	color: $app-text;
	text-align: right;
	padding-left: 20rpx;
}

.picker-row {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.picker-value {
	font-size: 28rpx;
	color: $app-text-secondary;
}

.picker-row .app-icon {
	font-size: 24rpx;
	color: $app-text-muted;
}

.action-section {
	margin-bottom: 24rpx;
}

.save-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	height: 88rpx;
	background: $app-gradient-doctor;
	color: #fff;
	font-size: 32rpx;
	border-radius: $app-radius;
	border: none;
	box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.25);
}

.save-btn .app-icon {
	font-size: 36rpx;
}

.logout-section {
	margin-top: 24rpx;
}

.logout-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	height: 88rpx;
	background: #fff;
	color: $app-error;
	font-size: 30rpx;
	border-radius: $app-radius;
	border: 2rpx solid $app-error;
}

.logout-btn .app-icon {
	font-size: 32rpx;
}
</style>