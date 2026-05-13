<template>
	<view class="container">
		<view class="card header">
			<image class="avatar" :src="form.avatar || '/static/component.png'" mode="aspectFill"></image>
			<view class="avatar-edit" @click="chooseAvatar"><text class="app-icon sm uniui-camera-filled"></text> 更换头像</view>
		</view>
		<view class="card form">
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-person-filled"></text> 姓名</text>
				<input class="input" v-model="form.name" placeholder="请输入姓名" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-person"></text> 性别</text>
				<picker mode="selector" :range="['男','女']" @change="onGenderChange">
					<view class="picker">{{ form.gender || '请选择' }}</view>
				</picker>
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-calendar"></text> 出生日期</text>
				<uni-datetime-picker type="date" :value="form.birthDate" @change="onBirthDateChange" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-phone-filled"></text> 手机号码</text>
				<input class="input" type="number" v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-auth-filled"></text> 身份证号</text>
				<input class="input" v-model="form.idCard" placeholder="请输入身份证号" type="idcard" />
			</view>
			<view class="form-item disease-section">
				<text class="label"><text class="app-icon sm muted uniui-medical"></text> 疾病分类（可多选）</text>
				<view class="disease-checkboxes">
					<view class="disease-item" v-for="d in diseaseOptions" :key="d.value" @click="toggleDisease(d.value)">
						<view class="checkbox" :class="{ checked: form.diseaseTypes.includes(d.value) }">
							<text class="app-icon uniui-checkmarkempty" v-if="form.diseaseTypes.includes(d.value)"></text>
						</view>
						<text class="disease-label">{{ d.label }}</text>
					</view>
				</view>
			</view>
			<button class="btn primary" @click="save" :loading="saving">保存</button>
		</view>
	</view>
</template>

<script>
import { getPatientById, updatePatient } from '@/api/patient.js'
import { uploadFile } from '@/api/request.js'

export default {
	data() {
		return {
			diseaseOptions: [
				{ label: 'MS（多发性硬化）', value: 'MS' },
				{ label: 'NMOSD（视神经脊髓炎）', value: 'NMOSD' },
				{ label: 'MG（重症肌无力）', value: 'MG' },
				{ label: 'MOGAD（MOG抗体病）', value: 'MOGAD' },
				{ label: '自身免疫性脑炎', value: 'AUTO_ENCEPHALITIS' },
				{ label: 'GBS（格林-巴利综合征）', value: 'GBS' },
				{ label: 'CIDP（慢性炎性脱髓鞘性多发性神经病）', value: 'CIDP' },
				{ label: '其它疾病', value: 'OTHER' }
			],
			form: {
				avatar: '',
				name: '',
				gender: '',
				birthDate: '',
				phone: '',
				idCard: '',
				diseaseTypes: []
			},
			saving: false
		};
	},
	onLoad() {
		this.loadPatientInfo();
	},
	methods: {
		async loadPatientInfo() {
			const userInfo = uni.getStorageSync('userInfo') || {};
			if (userInfo.id) {
				try {
					const patient = await getPatientById(userInfo.id);
					if (patient) {
						this.form.name = patient.name || '';
						this.form.gender = patient.gender || '';
						this.form.birthDate = patient.birthDate ? patient.birthDate.split(' ')[0] : '';
						this.form.phone = patient.phone || '';
						this.form.idCard = patient.idCard || '';
						this.form.avatar = patient.avatar || '';
						this.form.diseaseTypes = patient.diseaseTypes || [];
						// 同步更新本地存储
						uni.setStorageSync('userInfo', {
							id: patient.id,
							name: patient.name,
							gender: patient.gender,
							phone: patient.phone,
							avatar: patient.avatar,
							isRealAuth: patient.isRealAuth,
							diseaseTypes: patient.diseaseTypes
						});
					}
				} catch (e) {
					console.error('加载患者信息失败:', e);
					// 使用本地存储作为备份
					this.form.name = userInfo.name || '';
					this.form.gender = userInfo.gender || '';
					this.form.phone = userInfo.phone || '';
					this.form.idCard = userInfo.idCard || '';
					this.form.avatar = userInfo.avatar || '';
					this.form.diseaseTypes = userInfo.diseaseTypes || [];
				}
			} else {
				// 未登录，使用本地存储
				this.form.name = userInfo.name || '';
				this.form.gender = userInfo.gender || '';
				this.form.phone = userInfo.phone || '';
				this.form.idCard = userInfo.idCard || '';
				this.form.avatar = userInfo.avatar || '';
				this.form.diseaseTypes = userInfo.diseaseTypes || [];
			}
		},
		onGenderChange(e) {
			this.form.gender = ['男', '女'][e.detail.value];
		},
		onBirthDateChange(e) {
			this.form.birthDate = e;
		},
		toggleDisease(value) {
			const index = this.form.diseaseTypes.indexOf(value);
			if (index > -1) {
				this.form.diseaseTypes.splice(index, 1);
			} else {
				this.form.diseaseTypes.push(value);
			}
		},
		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				success: async (res) => {
					const tempPath = res.tempFilePaths[0];
					uni.showToast({ title: '上传中...', icon: 'loading' });
					try {
						const uploadRes = await uploadFile(tempPath);
						this.form.avatar = uploadRes.url;
						uni.hideToast();
						uni.showToast({ title: '头像已更新', icon: 'success' });
					} catch (e) {
						uni.hideToast();
						uni.showToast({ title: '上传失败', icon: 'none' });
						console.error('头像上传失败:', e);
					}
				}
			});
		},
		async save() {
			if (this.saving) return;
			this.saving = true;

			const userInfo = uni.getStorageSync('userInfo') || {};
			if (!userInfo.id) {
				// 仅保存到本地
				uni.setStorageSync('userInfo', {
					...userInfo,
					name: this.form.name,
					gender: this.form.gender,
					birthDate: this.form.birthDate,
					phone: this.form.phone,
					idCard: this.form.idCard,
					avatar: this.form.avatar,
					diseaseTypes: this.form.diseaseTypes
				});
				uni.showToast({ title: '保存成功', icon: 'success' });
				this.saving = false;
				return;
			}

				try {
					// 同步到后端 - 日期格式补充时分秒
					const birthDateFormatted = this.form.birthDate
						? (this.form.birthDate.includes(" ") ? this.form.birthDate : this.form.birthDate + " 00:00:00")
						: null;
					await updatePatient(userInfo.id, {
						name: this.form.name,
						gender: this.form.gender,
						birthDate: birthDateFormatted,
						phone: this.form.phone,
						idCard: this.form.idCard,
						avatar: this.form.avatar,
						diseaseTypes: this.form.diseaseTypes
					});

				// 更新本地存储
				uni.setStorageSync('userInfo', {
					id: userInfo.id,
					name: this.form.name,
					gender: this.form.gender,
					phone: this.form.phone,
					avatar: this.form.avatar,
					isRealAuth: userInfo.isRealAuth,
					diseaseTypes: this.form.diseaseTypes
				});

				uni.showToast({ title: '保存成功', icon: 'success' });
			} catch (e) {
				console.error('保存失败:', e);
				uni.showToast({ title: '保存失败', icon: 'none' });
			}

			this.saving = false;
		},
		navTo(url) {
			uni.navigateTo({ url });
		}
	}
};
</script>

<style lang="scss" scoped>
	@import '@/static/app-theme.scss';
	.container { min-height: 100vh; background: $app-bg; padding: 24rpx 24rpx 60rpx; }
	.card { background: $app-card-bg; border-radius: $app-radius; padding: 28rpx; margin-bottom: 24rpx; box-shadow: $app-shadow; }
	.header { display: flex; flex-direction: column; align-items: center; padding: 48rpx; }
	.avatar { width: 160rpx; height: 160rpx; border-radius: 50%; margin-bottom: 20rpx; }
	.avatar-edit { font-size: 28rpx; color: $app-primary; display: inline-flex; align-items: center; gap: 8rpx; }
	.form-item { margin-bottom: 32rpx; }
	.label { font-size: 28rpx; color: $app-text; display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx; }
	.input { font-size: 30rpx; height: 72rpx; background: #F3F4F6; border-radius: $app-radius-sm; padding: 0 24rpx; color: $app-text; }
	.picker { font-size: 30rpx; height: 72rpx; line-height: 72rpx; background: #F3F4F6; border-radius: $app-radius-sm; padding: 0 24rpx; color: $app-text; }

	/* 疾病多选样式 */
	.disease-section {
		margin-bottom: 40rpx;
	}
	.disease-checkboxes {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		margin-top: 12rpx;
	}
	.disease-item {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 16rpx 20rpx;
		background: #F3F4F6;
		border-radius: $app-radius-sm;
	}
	.checkbox {
		width: 40rpx;
		height: 40rpx;
		border: 2rpx solid #D1D5DB;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fff;
	}
	.checkbox.checked {
		background: $app-primary;
		border-color: $app-primary;
	}
	.checkbox.checked .app-icon {
		color: #fff;
		font-size: 24rpx;
	}
	.disease-label {
		font-size: 28rpx;
		color: $app-text;
	}

	.btn { margin-top: 24rpx; height: 88rpx; line-height: 88rpx; border-radius: $app-radius-sm; font-size: 32rpx; }
	.btn.primary { background: $app-primary; color: #fff; }
	.btn::after { border: none; }
	.link-block { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, $app-primary-bg, #fff); }
	.link-label { font-size: 30rpx; font-weight: bold; color: $app-text; display: inline-flex; align-items: center; gap: 12rpx; }
</style>