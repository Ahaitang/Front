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
				<text class="label"><text class="app-icon sm muted uniui-calendar"></text> 年龄</text>
				<input class="input" type="number" v-model="form.age" placeholder="请输入年龄" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-calendar-filled"></text> 出生日期</text>
				<input class="input" v-model="form.birthday" placeholder="如 1978-08-15" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-phone-filled"></text> 手机号码</text>
				<input class="input" type="number" v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-auth-filled"></text> 身份证号</text>
				<input class="input" v-model="form.idCard" placeholder="请输入身份证号" type="idcard" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-contact-filled"></text> 紧急联系人</text>
				<input class="input" v-model="form.emergencyContact" placeholder="选填" />
			</view>
			<view class="form-item">
				<text class="label"><text class="app-icon sm muted uniui-phone"></text> 紧急联系电话</text>
				<input class="input" type="number" v-model="form.emergencyPhone" placeholder="选填" />
			</view>
			<button class="btn primary" @click="save">保存</button>
		</view>
		<view class="card link-block" @click="navTo('/pages/patient/patient-info/patient-info')">
			<text class="link-label"><text class="app-icon primary uniui-folder-add-filled"></text> 查看完整患者信息</text>
			<text class="app-icon sm muted uniui-arrowright"></text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				form: {
					avatar: '',
					name: '张哲瀚',
					gender: '男',
					age: '45',
					birthday: '1978-08-15',
					phone: '',
					idCard: '',
					emergencyContact: '',
					emergencyPhone: ''
				}
			};
		},
		onLoad() {
			const u = uni.getStorageSync('userInfo') || {};
			this.form.name = u.name || this.form.name;
			this.form.gender = u.gender || this.form.gender;
			this.form.age = u.age ? String(u.age) : this.form.age;
			this.form.birthday = u.birthday || this.form.birthday;
			this.form.phone = u.phone || this.form.phone;
			this.form.idCard = u.idCard || this.form.idCard;
			this.form.avatar = u.avatar || '';
			this.form.emergencyContact = u.emergencyContact || '';
			this.form.emergencyPhone = u.emergencyPhone || '';
		},
		methods: {
			onGenderChange(e) {
				this.form.gender = ['男', '女'][e.detail.value];
			},
			chooseAvatar() {
				uni.chooseImage({
					count: 1,
					success: (res) => {
						this.form.avatar = res.tempFilePaths[0];
					}
				});
			},
			save() {
				const u = uni.getStorageSync('userInfo') || {};
				Object.assign(u, {
					name: this.form.name,
					gender: this.form.gender,
					age: this.form.age,
					birthday: this.form.birthday,
					phone: this.form.phone,
					idCard: this.form.idCard,
					avatar: this.form.avatar,
					emergencyContact: this.form.emergencyContact,
					emergencyPhone: this.form.emergencyPhone
				});
				uni.setStorageSync('userInfo', u);
				uni.showToast({ title: '保存成功', icon: 'success' });
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
	.btn { margin-top: 24rpx; height: 88rpx; line-height: 88rpx; border-radius: $app-radius-sm; font-size: 32rpx; }
	.btn.primary { background: $app-primary; color: #fff; }
	.btn::after { border: none; }
	.link-block { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, $app-primary-bg, #fff); }
	.link-label { font-size: 30rpx; font-weight: bold; color: $app-text; display: inline-flex; align-items: center; gap: 12rpx; }
</style>
