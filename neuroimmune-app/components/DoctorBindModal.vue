<template>
	<view class="doctor-bind-modal" v-if="visible" @click.stop>
		<view class="modal-mask" @click="close"></view>
		<view class="modal-content">
			<view class="modal-header">
				<text class="modal-title">选择绑定医生</text>
				<text class="modal-subtitle">申请后需医生审核确认，请选择您的随访医生</text>
			</view>

			<view class="search-bar">
				<view class="search-wrap">
					<text class="app-icon sm muted uniui-search"></text>
					<input class="search-input" placeholder="搜索医生姓名或科室" v-model="doctorKeyword" />
				</view>
			</view>

			<scroll-view class="doctor-list" scroll-y>
				<view class="doctor-item"
					  v-for="doc in filteredDoctors"
					  :key="doc.id"
					  :class="{ selected: selectedDoctor && selectedDoctor.id === doc.id }"
					  @click="selectDoctor(doc)">
					<view class="doctor-avatar">
						<text class="avatar-text">{{ doc.name ? doc.name.charAt(0) : '医' }}</text>
					</view>
					<view class="doctor-info">
						<text class="doctor-name">{{ doc.name }}</text>
						<text class="doctor-dept">{{ doc.department || '神经内科' }}</text>
						<text class="doctor-hospital">{{ doc.hospital || '医院' }}</text>
					</view>
					<view class="select-icon" v-if="selectedDoctor && selectedDoctor.id === doc.id">
						<text class="app-icon uniui-checkbox-filled"></text>
					</view>
				</view>
				<view class="empty-state" v-if="filteredDoctors.length === 0">
					<text class="empty-text">暂无匹配医生</text>
				</view>
			</scroll-view>

			<view class="modal-footer">
				<button class="btn secondary" @click="skipBind">暂不绑定</button>
				<button class="btn primary" @click="confirmBind" :disabled="!selectedDoctor" :loading="loading">提交申请</button>
			</view>
		</view>
	</view>
</template>

<script>
import { getDoctorListForRegister, bindDoctor } from '@/api/auth.js'

export default {
	name: 'DoctorBindModal',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		patientId: {
			type: Number,
			default: 0
		}
	},
	data() {
		return {
			doctors: [],
			doctorKeyword: '',
			selectedDoctor: null,
			loading: false
		}
	},
	computed: {
		filteredDoctors() {
			if (!this.doctorKeyword) return this.doctors
			const k = this.doctorKeyword.toLowerCase()
			return this.doctors.filter(d =>
				d.name.toLowerCase().includes(k) ||
				(d.department && d.department.toLowerCase().includes(k))
			)
		}
	},
	watch: {
		visible(val) {
			if (val && this.doctors.length === 0) {
				this.loadDoctors()
			}
		}
	},
	methods: {
		async loadDoctors() {
			try {
				const res = await getDoctorListForRegister()
				this.doctors = res || []
			} catch (e) {
				console.error('加载医生列表失败:', e)
				this.doctors = []
			}
		},
		selectDoctor(doc) {
			this.selectedDoctor = doc
		},
		async confirmBind() {
			if (!this.selectedDoctor) {
				uni.showToast({ title: '请选择医生', icon: 'none' })
				return
			}
			if (!this.patientId || this.patientId === 0) {
				uni.showToast({ title: '患者信息异常，请重新登录', icon: 'none' })
				return
			}
			this.loading = true
			console.log('绑定请求:', { patientId: this.patientId, doctorId: this.selectedDoctor.id, bindMethod: 'patient' })
			try {
				await bindDoctor({
					patientId: this.patientId,
					doctorId: this.selectedDoctor.id,
					bindMethod: 'patient'
				})
				uni.showToast({ title: '申请已提交，等待医生审核', icon: 'success', duration: 2000 })
				this.$emit('bind-success', this.selectedDoctor)
				this.close()
			} catch (e) {
				console.error('绑定失败:', e)
				const msg = e?.data?.msg || e?.message || '绑定失败，请重试'
				uni.showToast({ title: msg, icon: 'none', duration: 2000 })
			} finally {
				this.loading = false
			}
		},
		skipBind() {
			this.$emit('skip')
			this.close()
		},
		close() {
			this.selectedDoctor = null
			this.doctorKeyword = ''
			this.$emit('close')
		}
	}
}
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.doctor-bind-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
}

.modal-content {
	width: 90%;
	max-width: 680rpx;
	background: $app-card-bg;
	border-radius: $app-radius-lg;
	overflow: hidden;
	position: relative;
	z-index: 1;
	box-sizing: border-box;
}

.modal-header {
	padding: 32rpx;
	text-align: center;
	background: $app-primary-bg;
}

.modal-title {
	font-size: 36rpx;
	font-weight: 600;
	color: $app-primary;
	display: block;
	margin-bottom: 8rpx;
}

.modal-subtitle {
	font-size: 26rpx;
	color: $app-text-secondary;
	display: block;
}

.search-bar {
	padding: 20rpx 32rpx;
	background: $app-card-bg;
}

.search-wrap {
	display: flex;
	align-items: center;
	height: 72rpx;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	padding: 0 24rpx;
	gap: 12rpx;
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: $app-text;
}

.doctor-list {
	max-height: 500rpx;
	padding: 0 32rpx 20rpx;
}

.doctor-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	margin-bottom: 16rpx;
	border: 2rpx solid transparent;
	transition: $app-transition;
	overflow: hidden;
	box-sizing: border-box;
}

.doctor-item:active {
	transform: scale(0.98);
}

.doctor-item.selected {
	border-color: $app-primary;
	background: $app-primary-bg;
}

.doctor-avatar {
	width: 64rpx;
	height: 64rpx;
	min-width: 64rpx;
	border-radius: 50%;
	background: $app-gradient-primary;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
}

.avatar-text {
	font-size: 28rpx;
	color: #fff;
}

.doctor-info {
	flex: 1;
	min-width: 0;
	overflow: hidden;
}

.doctor-name {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.doctor-dept, .doctor-hospital {
	font-size: 24rpx;
	color: $app-text-muted;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.select-icon {
	color: $app-primary;
	font-size: 40rpx;
	min-width: 40rpx;
	margin-left: 12rpx;
}

.empty-state {
	text-align: center;
	padding: 60rpx 0;
}

.empty-text {
	font-size: 28rpx;
	color: $app-text-muted;
}

.modal-footer {
	display: flex;
	gap: 24rpx;
	padding: 24rpx 32rpx;
	border-top: 1rpx solid $app-border;
}

.btn {
	height: 80rpx;
	line-height: 80rpx;
	border-radius: $app-radius-sm;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
	flex: 1;
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

.btn.primary[disabled] {
	background: $app-hover-bg;
	color: $app-text-muted;
	box-shadow: none;
}

.btn.secondary {
	background: $app-hover-bg;
	color: $app-text-secondary;
}
</style>