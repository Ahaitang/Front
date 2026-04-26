<template>
	<view class="custom-tabbar">
		<view
			v-for="(item, index) in tabList"
			:key="index"
			class="tabbar-item"
			:class="{ active: currentIndex === index }"
			@click="switchTab(index)"
		>
			<image
				class="tabbar-icon"
				:src="currentIndex === index ? item.selectedIconPath : item.iconPath"
				mode="aspectFit"
			></image>
			<text class="tabbar-text">{{ item.text }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'CustomTabbar',
	props: {
		current: {
			type: Number,
			default: 0
		}
	},
	computed: {
		isDoctor() {
			return (uni.getStorageSync('role') || 'patient') === 'doctor';
		},
		tabList() {
			const baseList = [
				{
					pagePath: '/pages/index/index',
					iconPath: '/static/component.png',
					selectedIconPath: '/static/componentHL.png',
					text: '首页'
				},
				{
					pagePath: '/pages/schedule/schedule',
					iconPath: '/static/template.png',
					selectedIconPath: '/static/templateHL.png',
					text: '每日安排'
				},
				{
					pagePath: '/pages/patient-center/patient-center',
					iconPath: '/static/extui.png',
					selectedIconPath: '/static/extuiHL.png',
					text: this.isDoctor ? '个人中心' : '我的'
				}
			];
			return baseList;
		},
		currentIndex() {
			return this.current;
		}
	},
	methods: {
		switchTab(index) {
			const item = this.tabList[index];
			uni.switchTab({
				url: item.pagePath
			});
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.custom-tabbar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 100rpx;
	background: #ffffff;
	border-top: 1rpx solid #E5E7EB;
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding-bottom: env(safe-area-inset-bottom);
	z-index: 999;
}

.tabbar-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex: 1;
	height: 100%;
}

.tabbar-icon {
	width: 48rpx;
	height: 48rpx;
	margin-bottom: 4rpx;
}

.tabbar-text {
	font-size: 22rpx;
	color: #9CA3AF;
}

.tabbar-item.active .tabbar-text {
	color: $app-primary;
}
</style>