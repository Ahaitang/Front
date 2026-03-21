<template>
	<view class="container">
		<view class="empty-tip card" v-if="!list.length">暂无医生建议</view>
		<view class="card item" v-for="(item, i) in list" :key="i">
			<view class="item-head">
				<text class="item-title">{{ item.title }}</text>
				<text class="item-date">{{ item.date }}</text>
			</view>
			<text class="item-content">{{ item.content }}</text>
			<view class="item-footer" v-if="item.doctorName">
				<text class="doctor">医生：{{ item.doctorName }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [
					{ title: '定期复查建议', date: '2025-02-20', content: '建议每3个月复查一次血常规及肝肾功能。', doctorName: '张医生' }
				]
			};
		}
	};
</script>

<style lang="scss" scoped>
	.container { min-height: 100vh; background: #F5F5F5; padding: 24rpx 24rpx 60rpx; }
	.card { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 24rpx; }
	.empty-tip { font-size: 28rpx; color: #999; text-align: center; padding: 60rpx; }
	.item-head { display: flex; justify-content: space-between; margin-bottom: 16rpx; }
	.item-title { font-size: 30rpx; font-weight: bold; color: #333; }
	.item-date { font-size: 26rpx; color: #999; }
	.item-content { font-size: 28rpx; color: #666; line-height: 1.6; display: block; }
	.item-footer { margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
	.doctor { font-size: 26rpx; color: #999; }
</style>
