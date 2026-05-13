<template>
		<view class="container">
			<view class="card">
				<view class="tips">
					<text>完成实名认证后可绑定主治医生，享受完整随访服务。</text>
				</view>
				<view class="form-item">
					<text class="label">真实姓名</text>
					<input class="input" v-model="form.realName" placeholder="请输入真实姓名" />
				</view>
				<view class="form-item">
					<text class="label">身份证号</text>
					<input class="input" v-model="form.idCard" placeholder="请输入身份证号" type="idcard" maxlength="18" />
				</view>
				<view class="form-item">
					<text class="label">选择医生</text>
					<picker mode="selector" :range="doctors" range-key="name" @change="onDoctorChange">
						<view class="picker">
							<text v-if="selectedDoctor">{{ selectedDoctor.name }} - {{ selectedDoctor.title }}</text>
							<text v-else class="placeholder">请选择主治医生</text>
						</view>
					</picker>
				</view>
				<button class="btn primary" @click="submit" :loading="loading">提交认证并绑定医生</button>
			</view>

			<!-- 当前绑定信息 -->
			<view class="card" v-if="currentBinding">
				<view class="binding-header">
					<text class="binding-title">当前绑定医生</text>
					<text class="binding-status" :class="statusClass">{{ statusText }}</text>
				</view>
				<view class="binding-info">
					<text class="binding-name">{{ currentBinding.doctorName }}</text>
					<text class="binding-time" v-if="currentBinding.bindTime">绑定时间：{{ formatDate(currentBinding.bindTime) }}</text>
					<text class="binding-time" v-else-if="currentBinding.requestTime">申请时间：{{ formatDate(currentBinding.requestTime) }}</text>
				</view>
				<!-- 只有已确认状态才显示解绑按钮 -->
				<view class="binding-actions" v-if="currentBinding.bindStatus === 1">
					<button class="btn-outline" @click="handleUnbind">解除绑定</button>
				</view>
				<!-- 待审核提示 -->
				<view class="binding-tips" v-if="currentBinding.bindStatus === 0">
					<text>您的绑定申请正在审核中，请等待医生确认</text>
				</view>
				<!-- 已拒绝提示 -->
				<view class="binding-tips rejected" v-if="currentBinding.bindStatus === 2">
					<text>绑定申请已被拒绝，请重新选择医生提交申请</text>
				</view>
			</view>
		</view>
	</template>

	<script>
	import { getDoctorList, bindDoctor, getPatientDoctor, unbindPatient } from '@/api/relation.js'

	export default {
		data() {
			return {
				form: { realName: '', idCard: '', doctorId: '' },
				doctors: [],
				selectedDoctor: null,
				loading: false,
				currentBinding: null,
				patientId: null
			};
		},
		computed: {
			// bindStatus: 0-待审核, 1-已确认, 2-已拒绝
			statusText() {
				if (!this.currentBinding) return '';
				const status = this.currentBinding.bindStatus;
				if (status === 0) return '待审核';
				if (status === 1) return '生效中';
				if (status === 2) return '已拒绝';
				return '未知';
			},
			statusClass() {
				if (!this.currentBinding) return '';
				const status = this.currentBinding.bindStatus;
				if (status === 0) return 'pending';
				if (status === 1) return 'active';
				if (status === 2) return 'rejected';
				return '';
			}
		},
		onLoad() {
			const userInfo = uni.getStorageSync('userInfo') || {};
			this.form.realName = userInfo.realName || userInfo.name || '';
			this.form.idCard = userInfo.idCard || '';
			this.patientId = userInfo.id;
		},
		onShow() {
			this.loadDoctors();
			this.loadCurrentBinding();
		},
		methods: {
			async loadDoctors() {
				try {
					const res = await getDoctorList();
					if (res && res.length) {
						this.doctors = res.map(d => ({
							id: d.id,
							name: d.name,
							title: d.title || '医生',
							department: d.department,
							hospital: d.hospital
						}));
					}
				} catch (e) {
					console.error('加载医生列表失败:', e);
				}
			},
			async loadCurrentBinding() {
				if (!this.patientId) return;
				try {
					const res = await getPatientDoctor(this.patientId);
					this.currentBinding = res;
					// 只有已确认状态才更新本地存储为已绑定
					if (res && res.bindStatus === 1) {
						uni.setStorageSync('doctorBound', true);
						uni.setStorageSync('doctorName', res.doctorName);
						uni.setStorageSync('doctorId', res.doctorId);
					} else {
						uni.setStorageSync('doctorBound', false);
					}
				} catch (e) {
					console.error('加载绑定信息失败:', e);
				}
			},
			onDoctorChange(e) {
				const i = e.detail.value;
				this.selectedDoctor = this.doctors[i];
				this.form.doctorId = this.selectedDoctor.id;
			},
			async submit() {
				if (!this.form.realName) {
					uni.showToast({ title: '请填写真实姓名', icon: 'none' });
					return;
				}
				if (!this.form.idCard || this.form.idCard.length !== 18) {
					uni.showToast({ title: '请输入正确的身份证号', icon: 'none' });
					return;
				}
				if (!this.form.doctorId) {
					uni.showToast({ title: '请选择主治医生', icon: 'none' });
					return;
				}
				if (!this.patientId) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					return;
				}

				this.loading = true;
				try {
					// 绑定医生
					await bindDoctor(this.patientId, this.form.doctorId, 'patient', '实名认证绑定');

					uni.showToast({ title: '申请已提交，等待医生审核', icon: 'success' });
					setTimeout(() => uni.navigateBack(), 1000);
				} catch (e) {
					uni.showToast({ title: e.message || '绑定失败，请重试', icon: 'none' });
				} finally {
					this.loading = false;
				}
			},
			async handleUnbind() {
				uni.showModal({
					title: '确认解绑',
					content: '确定要解除与医生的绑定关系吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								await unbindPatient(this.patientId);
								uni.setStorageSync('doctorBound', false);
								uni.removeStorageSync('doctorName');
								uni.removeStorageSync('doctorId');
								this.currentBinding = null;
								uni.showToast({ title: '已解除绑定', icon: 'success' });
							} catch (e) {
								uni.showToast({ title: '解绑失败', icon: 'none' });
							}
						}
					}
				});
			},
			formatDate(dateStr) {
				if (!dateStr) return '-';
				const d = new Date(dateStr);
				return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			}
		}
	};
	</script>

	<style lang="scss" scoped>
	@import '@/static/app-theme.scss';

	.container {
		min-height: 100vh;
		background: $app-bg;
		padding: 24rpx;
	}

	.card {
		background: $app-card-bg;
		border-radius: 16rpx;
		padding: 28rpx;
		margin-bottom: 24rpx;
	}

	.tips {
		font-size: 28rpx;
		color: $app-text-secondary;
		margin-bottom: 32rpx;
		line-height: 1.5;
		padding: 20rpx;
		background: $app-primary-bg;
		border-radius: 12rpx;
		color: $app-primary;
	}

	.form-item {
		margin-bottom: 32rpx;
	}

	.label {
		font-size: 28rpx;
		color: $app-text;
		display: block;
		margin-bottom: 12rpx;
	}

	.input {
		font-size: 30rpx;
		height: 88rpx;
		background: #F5F5F5;
		border-radius: 12rpx;
		padding: 0 24rpx;
	}

	.picker {
		font-size: 30rpx;
		height: 88rpx;
		line-height: 88rpx;
		background: #F5F5F5;
		border-radius: 12rpx;
		padding: 0 24rpx;
		color: $app-text;
	}

	.placeholder {
		color: $app-text-muted;
	}

	.btn {
		margin-top: 32rpx;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 12rpx;
		font-size: 32rpx;
		border: none;
	}

	.btn.primary {
		background: $app-primary;
		color: #fff;
	}

	.btn::after {
		border: none;
	}

	/* 当前绑定信息 */
	.binding-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid $app-border;
	}

	.binding-title {
		font-size: 30rpx;
		font-weight: 500;
		color: $app-text;
	}

	.binding-status {
		font-size: 24rpx;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
	}

	.binding-status.active {
		background: #D1FAE5;
		color: #059669;
	}

	.binding-status.pending {
		background: #FEF3C7;
		color: #D97706;
	}

	.binding-status.rejected {
		background: #FEE2E2;
		color: #DC2626;
	}

	.binding-tips {
		font-size: 26rpx;
		color: $app-text-secondary;
		padding: 16rpx;
		background: #FEF3C7;
		border-radius: 8rpx;
		margin-top: 16rpx;
	}

	.binding-tips.rejected {
		background: #FEE2E2;
		color: #DC2626;
	}

	.binding-info {
		margin-bottom: 20rpx;
	}

	.binding-name {
		font-size: 32rpx;
		font-weight: bold;
		color: $app-text;
		display: block;
	}

	.binding-time {
		font-size: 26rpx;
		color: $app-text-muted;
		margin-top: 8rpx;
		display: block;
	}

	.btn-outline {
		font-size: 28rpx;
		color: $app-error;
		background: transparent;
		border: 1rpx solid $app-error;
		padding: 16rpx 32rpx;
		border-radius: 8rpx;
	}

	.btn-outline::after {
		border: none;
	}
	</style>