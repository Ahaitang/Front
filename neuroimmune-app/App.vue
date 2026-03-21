<script>
	export default {
		onLaunch: function() {
			console.log('神经免疫随访系统启动');
			// 已登录则直接进入首页
			const token = uni.getStorageSync('token');
			if (token) {
				uni.reLaunch({ url: '/pages/index/index' });
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	@import '@/static/app-theme.scss';
	/* #ifndef APP-PLUS-NVUE */
	@import '@/static/app-icons.scss';
	/* #endif */

	page {
		background-color: #FAFAF9;
		height: 100%;
		font-size: 28rpx;
	}
</style>