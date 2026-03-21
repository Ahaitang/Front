<template>
	<view class="container">
		<view class="user-card card">
			<image class="avatar" :src="me.avatar || '/static/component.png'" mode="aspectFill"></image>
			<view class="meta">
				<text class="name">{{ me.name }}</text>
				<text class="age-gender">{{ me.age }}岁 {{ me.gender }}</text>
				<button class="btn-link" @click="navToFollow">查看随访</button>
			</view>
		</view>
		<view class="block card">
			<view class="block-title">基本信息</view>
			<view class="row"><text class="label">电话</text><text class="value">{{ me.phone }}</text></view>
			<view class="row"><text class="label">身份证号</text><text class="value">{{ me.idCard }}</text></view>
			<view class="row"><text class="label">民族</text><text class="value">{{ me.nation }}</text></view>
			<view class="row"><text class="label">出生日期</text><text class="value">{{ me.birthday }}</text></view>
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
	export default {
		data() {
			return {
				me: {
					name: '张哲瀚',
					age: 45,
					gender: '男',
					phone: '183440293123',
					idCard: '422875658696486773',
					nation: '汉族',
					birthday: '1978-08-15',
					marital: '已婚',
					address: '广东省深圳市福田区莲花街道',
					department: '神经内科',
					patientType: '门诊患者'
				}
			};
		},
		onLoad() {
			const user = uni.getStorageSync('userInfo') || {};
			if (user.name) this.me.name = user.name;
			if (user.phone) this.me.phone = user.phone;
		},
		methods: {
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
