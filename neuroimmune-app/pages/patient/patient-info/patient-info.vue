<template>
	<view class="container">
		<view class="user-card card">
			<image class="avatar" :src="me.avatar || '/static/component.png'" mode="aspectFill"></image>
			<view class="meta">
				<text class="name">{{ me.name }}</text>
				<text class="age-gender">{{ calculatedAge }}岁 {{ me.gender }}</text>
				<button class="btn-link" @click="navToFollow">查看随访</button>
			</view>
		</view>
		<view class="block card">
			<view class="block-title">基本信息</view>
			<view class="row"><text class="label">电话</text><text class="value">{{ me.phone }}</text></view>
			<view class="row"><text class="label">身份证号</text><text class="value">{{ me.idCard }}</text></view>
			<view class="row"><text class="label">民族</text><text class="value">{{ me.nation }}</text></view>
			<view class="row"><text class="label">出生日期</text><text class="value">{{ me.birthDate }}</text></view>
			<view class="row"><text class="label">婚姻状况</text><text class="value">{{ me.marital }}</text></view>
			<view class="row"><text class="label">居住地</text><text class="value">{{ me.address }}</text></view>
		</view>
		<view class="block card">
			<view class="block-title">就诊信息</view>
			<view class="row"><text class="label">门诊科室</text><text class="value">{{ me.department }}</text></view>
			<view class="row"><text class="label">患病类型</text><text class="value">{{ me.patientType }}</text></view>
		</view>
	</view>
</template>

<script>
	import { getPatientById } from '@/api/patient.js'

	export default {
		data() {
			return {
				me: {
					name: '',
					gender: '',
					phone: '',
					idCard: '',
					nation: '',
					birthDate: '',
					marital: '',
					address: '',
					department: '',
					patientType: ''
				}
			};
		},
		computed: {
			// 根据出生日期计算年龄
			calculatedAge() {
				if (!this.me.birthDate) return '--'
				const birth = new Date(this.me.birthDate)
				const today = new Date()
				let age = today.getFullYear() - birth.getFullYear()
				const monthDiff = today.getMonth() - birth.getMonth()
				if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
					age--
				}
				return age >= 0 ? age : '--'
			}
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
							this.me.name = patient.name || '';
							this.me.gender = patient.gender || '';
							this.me.phone = patient.phone || '';
							this.me.idCard = patient.idCard || '';
							this.me.nation = patient.nation || '';
							this.me.birthDate = patient.birthDate ? patient.birthDate.split(' ')[0] : '';
							this.me.marital = patient.marital || '';
							this.me.address = patient.address || '';
							this.me.department = patient.department || '';
							this.me.patientType = patient.patientType || '';
						}
					} catch (e) {
						console.error('加载患者信息失败:', e);
						this.me.name = userInfo.name || '';
						this.me.phone = userInfo.phone || '';
					}
				} else {
					this.me.name = userInfo.name || '';
					this.me.phone = userInfo.phone || '';
				}
			},
			navToFollow() {
				uni.navigateTo({ url: '/pages/patient/follow-plan/follow-plan' });
			}
		}
	};
</script>

<style lang="scss" scoped>
	.container { min-height: 100vh; background: #F5F5F5; padding: 24rpx 24rpx 60rpx; }
	.card { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 24rpx; }
	.user-card { display: flex; align-items: center; }
	.avatar { width: 120rpx; height: 120rpx; border-radius: 50%; margin-right: 24rpx; }
	.name { font-size: 34rpx; font-weight: bold; color: #333; display: block; }
	.age-gender { font-size: 28rpx; color: #666; display: block; margin-top: 8rpx; }
	.btn-link { margin-top: 16rpx; font-size: 28rpx; color: #007AFF; padding: 0; background: none; }
	.block-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
	.row { padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
	.row:last-child { border-bottom: none; }
	.label { font-size: 28rpx; color: #999; margin-right: 16rpx; }
	.value { font-size: 28rpx; color: #333; }
</style>
