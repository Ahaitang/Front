<template>
	<view class="container">
		<!-- 日期选择器 -->
		<view class="date-picker card">
			<view class="date-nav">
				<view class="nav-btn" @click="prevWeek">
					<text class="app-icon uniui-arrowleft"></text>
				</view>
				<view class="current-date" @click="openCalendar">
					<text class="date-text">{{ currentYear }}年{{ currentMonth }}月</text>
					<text class="week-text">{{ weekRangeText }}</text>
				</view>
				<view class="nav-btn" @click="nextWeek">
					<text class="app-icon uniui-arrowright"></text>
				</view>
			</view>
			<view class="date-tabs">
				<view class="date-tab" v-for="(d, i) in weekDays" :key="i"
					:class="{ active: d.date === selectedDate }" @click="selectDay(i)">
					<text class="tab-week">{{ d.isToday ? '今' : weekLabels[i] }}</text>
					<text class="tab-day" :class="{ today: d.isToday }">{{ d.day }}</text>
				</view>
			</view>
		</view>

		<view class="block card">
			<view class="block-title"><text class="app-icon primary uniui-location-filled"></text> 就诊计划</view>
			<view class="empty-tip" v-if="!scheduleList.visit.length">暂无安排</view>
			<view class="schedule-item" v-for="(item, i) in scheduleList.visit" :key="'v'+i">
				<text class="time">{{ item.time }}</text>
				<text class="who">{{ item.who }}</text>
				<text class="date">{{ item.date }}</text>
			</view>
		</view>
		<view class="block card">
			<view class="block-title"><text class="app-icon primary uniui-notification-filled"></text> 随访计划</view>
			<view class="empty-tip" v-if="!scheduleList.follow.length">暂无安排</view>
			<view class="schedule-item" v-for="(item, i) in scheduleList.follow" :key="'f'+i">
				<text class="time">{{ item.time }}</text>
				<text class="who">{{ item.who }}</text>
				<text class="date">{{ item.date }}</text>
			</view>
		</view>
		<view class="block card">
			<view class="block-title"><text class="app-icon primary uniui-compose"></text> 用药建议</view>
			<view class="empty-tip" v-if="!scheduleList.medication.length">暂无安排</view>
			<view class="schedule-item medication-item" v-for="(item, i) in scheduleList.medication" :key="'m'+i">
				<view class="med-info">
					<text class="med-name">{{ item.content }}</text>
					<text class="med-freq">{{ item.time }}</text>
				</view>
				<view class="med-date">
					<text class="date-range">{{ item.date }} ~ {{ item.endDate || item.date }}</text>
				</view>
				<text class="who">{{ item.who }}</text>
			</view>
		</view>

		<!-- 日历弹窗 -->
		<uni-calendar ref="calendar" :insert="false" @confirm="onCalendarConfirm" />

		<!-- 自定义tabBar -->
		<custom-tabbar :current="1" />
	</view>
</template>

<script>
	import api from '@/api/index.js'

	export default {
		data() {
			return {
				currentYear: new Date().getFullYear(),
				currentMonth: new Date().getMonth() + 1,
				selectedDate: this.formatDate(new Date()),
				weekDays: [],
				weekLabels: ['一', '二', '三', '四', '五', '六', '日'],
				scheduleList: {
					visit: [],
					follow: [],
					medication: []
				},
				isDoctor: false,
				baseOffset: 0, // 周偏移量，0表示当前周
				loading: false
			};
		},
		computed: {
			weekRangeText() {
				if (this.weekDays.length < 7) return '';
				const first = this.weekDays[0];
				const last = this.weekDays[6];
				return `${first.date.substring(5)} - ${last.date.substring(5)}`;
			}
		},
		onShow() {
			if (!uni.getStorageSync('token')) {
				uni.reLaunch({ url: '/pages/login/login' });
				return;
			}
		},
		onLoad() {
			this.isDoctor = (uni.getStorageSync('role') || '') === 'doctor';
			this.initWeekDays();
			this.loadSchedule();
		},
		methods: {
			pad(n) {
				return n < 10 ? '0' + n : '' + n;
			},
			formatDate(date) {
				const y = date.getFullYear();
				const m = this.pad(date.getMonth() + 1);
				const d = this.pad(date.getDate());
				return `${y}-${m}-${d}`;
			},
			initWeekDays() {
				const today = new Date();
				const todayStr = this.formatDate(today);
				const days = [];
				const currentDay = today.getDay(); // 0-6, 0是周日
				// 计算本周一的日期
				const monday = new Date(today);
				const diff = currentDay === 0 ? -6 : 1 - currentDay;
				monday.setDate(today.getDate() + diff + this.baseOffset * 7);

				for (let i = 0; i < 7; i++) {
					const d = new Date(monday);
					d.setDate(monday.getDate() + i);
					const dateStr = this.formatDate(d);
					days.push({
						date: dateStr,
						day: d.getDate(),
						isToday: dateStr === todayStr,
						fullDate: d
					});
				}
				this.weekDays = days;
				// 更新当前年月
				this.currentYear = monday.getFullYear();
				this.currentMonth = monday.getMonth() + 1;
			},
			selectDay(index) {
				this.selectedDate = this.weekDays[index].date;
				this.loadSchedule();
			},
			prevWeek() {
				this.baseOffset--;
				this.initWeekDays();
				// 如果选中的日期不在当前周，选中周一
				const inCurrentWeek = this.weekDays.some(d => d.date === this.selectedDate);
				if (!inCurrentWeek) {
					this.selectedDate = this.weekDays[0].date;
				}
				this.loadSchedule();
			},
			nextWeek() {
				this.baseOffset++;
				this.initWeekDays();
				// 如果选中的日期不在当前周，选中周一
				const inCurrentWeek = this.weekDays.some(d => d.date === this.selectedDate);
				if (!inCurrentWeek) {
					this.selectedDate = this.weekDays[0].date;
				}
				this.loadSchedule();
			},
			openCalendar() {
				this.$refs.calendar.open();
			},
			onCalendarConfirm(e) {
				if (e.fulldate) {
					this.selectedDate = e.fulldate;
					// 计算周偏移量
					const today = new Date();
					const selected = new Date(e.fulldate);
					const diffDays = Math.floor((selected - today) / (1000 * 60 * 60 * 24));
					this.baseOffset = Math.floor(diffDays / 7);
					this.initWeekDays();
					this.loadSchedule();
				}
			},
			goToday() {
				this.baseOffset = 0;
				this.initWeekDays();
				this.selectedDate = this.formatDate(new Date());
				this.loadSchedule();
			},
			async loadSchedule() {
				if (this.loading) return;
				this.loading = true;

				try {
					const result = await api.schedule.getScheduleByDate(this.selectedDate);
					if (result) {
						this.scheduleList = {
							visit: result.visit || [],
							follow: result.follow || [],
							medication: result.medication || []
						};
					}
				} catch (e) {
					console.error('获取日程失败:', e);
					// 如果API失败，使用模拟数据
					this.scheduleList = this.isDoctor
						? {
								visit: [
									{ time: '09:00-10:00', who: '刘博超', date: this.selectedDate }
								],
								follow: [
									{ time: '09:00-10:00', who: '刘博超', date: this.selectedDate }
								],
								medication: [
									{ time: '14:00-15:00', who: '王某某', date: this.selectedDate }
								]
						  }
						: {
								visit: [{ time: '09:00-10:00', who: '就诊医生', date: this.selectedDate }],
								follow: [],
								medication: []
						  };
				} finally {
					this.loading = false;
				}
			}
		}
	};
</script>

<style lang="scss" scoped>
	@import '@/static/app-theme.scss';

	.container {
		min-height: 100vh;
		background: $app-bg;
		padding: 24rpx 24rpx 120rpx;
	}

	.card {
		background: $app-card-bg;
		border-radius: $app-radius;
		padding: 28rpx;
		margin-bottom: 24rpx;
		box-shadow: $app-shadow;
	}

	/* 日期选择器 */
	.date-picker {
		margin-bottom: 24rpx;
	}

	.date-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24rpx;
	}

	.nav-btn {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $app-primary-bg;
		border-radius: 50%;
	}

	.nav-btn .app-icon {
		font-size: 32rpx;
		color: $app-primary;
	}

	.current-date {
		text-align: center;
	}

	.date-text {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: $app-text;
	}

	.week-text {
		display: block;
		font-size: 26rpx;
		color: $app-text-muted;
		margin-top: 4rpx;
	}

	.date-tabs {
		display: flex;
		justify-content: space-between;
	}

	.date-tab {
		flex: 1;
		text-align: center;
		padding: 16rpx 0;
		border-radius: 12rpx;
	}

	.date-tab.active {
		background: $app-primary-bg;
	}

	.tab-week {
		display: block;
		font-size: 24rpx;
		color: $app-text-muted;
	}

	.tab-day {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: $app-text;
		margin-top: 8rpx;
	}

	.tab-day.today {
		color: $app-primary;
	}

	.date-tab.active .tab-week,
	.date-tab.active .tab-day {
		color: $app-primary;
	}

	/* 区块 */
	.block-title {
		font-size: 30rpx;
		font-weight: bold;
		color: $app-text;
		margin-bottom: 20rpx;
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.empty-tip {
		font-size: 26rpx;
		color: $app-text-muted;
	}

	.schedule-item {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid $app-border;
	}

	.schedule-item:last-child {
		border-bottom: none;
	}

	.time {
		font-size: 28rpx;
		color: $app-text;
		margin-right: 24rpx;
		min-width: 180rpx;
	}

	.who {
		font-size: 28rpx;
		color: $app-text-secondary;
		flex: 1;
	}

	.date {
		font-size: 26rpx;
		color: $app-text-muted;
	}

	/* 用药建议项 */
	.medication-item {
		flex-direction: column;
		align-items: flex-start;
	}

	.med-info {
		display: flex;
		align-items: center;
		width: 100%;
		margin-bottom: 8rpx;
	}

	.med-name {
		font-size: 30rpx;
		color: $app-text;
		font-weight: 500;
		flex: 1;
	}

	.med-freq {
		font-size: 26rpx;
		color: $app-text-secondary;
	}

	.med-date {
		margin-bottom: 8rpx;
	}

	.date-range {
		font-size: 24rpx;
		color: $app-primary;
		background: $app-primary-bg;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
	}
</style>
