<template>
	<view class="container">
		<view class="toolbar">
			<text class="app-icon primary uniui-calendar-filled"></text>
			<text class="month">{{ currentYear }}.{{ pad(currentMonth) }}</text>
			<text class="today-btn" @click="goToday">今天</text>
		</view>
		<view class="week-row card">
			<view class="day-wrapper" v-for="(d, i) in weekDays" :key="i" @click="selectDay(i)">
				<text class="day" :class="{ active: d.date === selectedDate, today: d.isToday }">{{ d.day }}</text>
				<text class="weekday-label">{{ weekLabels[i] }}</text>
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
			<view class="schedule-item" v-for="(item, i) in scheduleList.medication" :key="'m'+i">
				<text class="time">{{ item.time }}</text>
				<text class="who">{{ item.who }}</text>
				<text class="date">{{ item.date }}</text>
			</view>
		</view>
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
	.container { min-height: 100vh; background: $app-bg; padding: 24rpx 24rpx 120rpx; }
	.toolbar {
		display: flex; align-items: center; gap: 16rpx; margin-bottom: 24rpx;
	}
	.month { font-size: 32rpx; font-weight: bold; color: $app-text; }
	.today-btn {
		font-size: 28rpx; color: $app-primary; margin-left: auto;
		padding: 8rpx 20rpx; border: 1rpx solid $app-primary; border-radius: 24rpx;
	}
	.week-row { display: flex; justify-content: space-around; margin-bottom: 32rpx; }
	.day-wrapper {
		display: flex; flex-direction: column; align-items: center; padding: 8rpx;
	}
	.day {
		font-size: 32rpx; color: $app-text-secondary; padding: 16rpx 24rpx; border-radius: 50%;
		transition: all 0.2s;
	}
	.day.active { background: $app-primary; color: #fff; }
	.day.today { color: $app-primary; font-weight: bold; }
	.day.today.active { color: #fff; }
	.weekday-label { font-size: 22rpx; color: $app-text-muted; margin-top: 4rpx; }
	.card { background: $app-card-bg; border-radius: $app-radius; padding: 28rpx; margin-bottom: 24rpx; box-shadow: $app-shadow; }
	.block-title { font-size: 30rpx; font-weight: bold; color: $app-text; margin-bottom: 20rpx; display: flex; align-items: center; gap: 12rpx; }
	.empty-tip { font-size: 26rpx; color: $app-text-muted; }
	.schedule-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid $app-border; }
	.schedule-item:last-child { border-bottom: none; }
	.time { font-size: 28rpx; color: $app-text; margin-right: 24rpx; min-width: 180rpx; }
	.who { font-size: 28rpx; color: $app-text-secondary; flex: 1; }
	.date { font-size: 26rpx; color: $app-text-muted; }
</style>
