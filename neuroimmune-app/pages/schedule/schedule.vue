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
			<view class="block-title"><text class="app-icon primary uniui-notification-filled"></text> 随访计划</view>
			<view class="empty-tip" v-if="!scheduleList.follow.length">暂无安排</view>
			<view class="schedule-item" v-for="(item, i) in scheduleList.follow" :key="'f'+i" @click="showFollowDetail(item)">
				<text class="time">{{ item.time }}</text>
				<text class="who">{{ item.who }}</text>
				<text class="date">{{ item.date }}</text>
				<text class="app-icon sm uniui-arrowright"></text>
			</view>
		</view>
		<view class="block card">
			<view class="block-title"><text class="app-icon primary uniui-compose"></text> 用药建议</view>
			<view class="empty-tip" v-if="!scheduleList.medication.length">暂无安排</view>
			<view class="schedule-item medication-item" v-for="(item, i) in scheduleList.medication" :key="'m'+i" @click="showMedicationDetail(item)">
				<view class="med-info">
					<text class="med-name">{{ item.content }}</text>
					<text class="med-freq">{{ item.time }}</text>
				</view>
				<view class="med-date">
					<text class="date-range">{{ item.date }} ~ {{ item.endDate || item.date }}</text>
				</view>
				<text class="who">{{ item.who }}</text>
				<text class="app-icon sm uniui-arrowright"></text>
			</view>
		</view>

		<!-- 日历弹窗 -->
		<uni-calendar ref="calendar" :insert="false" @confirm="onCalendarConfirm" />

		<!-- 随访详情弹窗 -->
		<uni-popup ref="followPopup" type="bottom" :safe-area="true">
			<view class="detail-popup">
				<view class="popup-header">
					<text class="popup-title">随访详情</text>
					<text class="popup-close" @click="closeFollowPopup">×</text>
				</view>
				<view class="popup-body" v-if="selectedFollow">
					<view class="detail-card">
						<view class="detail-row">
							<text class="detail-label">随访类型</text>
							<text class="detail-value">{{ selectedFollow.type || '随访' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">随访时间</text>
							<text class="detail-value">{{ selectedFollow.time }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">随访日期</text>
							<text class="detail-value">{{ selectedFollow.date }}</text>
						</view>
						<view class="detail-row" v-if="selectedFollow.content">
							<text class="detail-label">检查项目</text>
							<text class="detail-value">{{ selectedFollow.content }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">随访对象</text>
							<text class="detail-value">{{ selectedFollow.who }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">随访状态</text>
							<text class="detail-value" :class="getStatusClass(selectedFollow.status)">{{ getStatusText(selectedFollow.status) }}</text>
						</view>
					</view>
				</view>
			</view>
		</uni-popup>

		<!-- 用药详情弹窗 -->
		<uni-popup ref="medicationPopup" type="bottom" :safe-area="true">
			<view class="detail-popup">
				<view class="popup-header">
					<text class="popup-title">用药详情</text>
					<text class="popup-close" @click="closeMedicationPopup">×</text>
				</view>
				<view class="popup-body" v-if="selectedMedication">
					<view class="detail-card">
						<view class="detail-row medication-name">
							<text class="name-text">{{ selectedMedication.content }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">用药频率</text>
							<text class="detail-value">{{ selectedMedication.time }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">开始日期</text>
							<text class="detail-value">{{ selectedMedication.date }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">结束日期</text>
							<text class="detail-value highlight">{{ selectedMedication.endDate || selectedMedication.date }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">用药对象</text>
							<text class="detail-value">{{ selectedMedication.who }}</text>
						</view>
					</view>
				</view>
			</view>
		</uni-popup>

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
				follow: [],
				medication: []
			},
			isDoctor: false,
			baseOffset: 0,
			loading: false,
			selectedFollow: null,
			selectedMedication: null
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
			const currentDay = today.getDay();
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
			const inCurrentWeek = this.weekDays.some(d => d.date === this.selectedDate);
			if (!inCurrentWeek) {
				this.selectedDate = this.weekDays[0].date;
			}
			this.loadSchedule();
		},
		nextWeek() {
			this.baseOffset++;
			this.initWeekDays();
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
						follow: result.follow || [],
						medication: result.medication || []
					};
				}
			} catch (e) {
				console.error('获取日程失败:', e);
				this.scheduleList = this.isDoctor
					? {
						follow: [
							{ time: '09:00-10:00', who: '刘博超', date: this.selectedDate }
						],
						medication: [
							{ time: '14:00-15:00', who: '王某某', date: this.selectedDate }
						]
					}
					: {
						follow: [],
						medication: []
					};
			} finally {
				this.loading = false;
			}
		},
		getStatusText(status) {
			const map = {
				'0': '待随访',
				'1': '已完成',
				'2': '已取消'
			};
			return map[status] || '待随访';
		},
		getStatusClass(status) {
			const map = {
				'0': 'status-pending',
				'1': 'status-completed',
				'2': 'status-cancelled'
			};
			return map[status] || 'status-pending';
		},
		showFollowDetail(item) {
			this.selectedFollow = item;
			this.$refs.followPopup.open();
		},
		closeFollowPopup() {
			this.$refs.followPopup.close();
		},
		showMedicationDetail(item) {
			this.selectedMedication = item;
			this.$refs.medicationPopup.open();
		},
		closeMedicationPopup() {
			this.$refs.medicationPopup.close();
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding: $app-spacing-md;
	padding-bottom: 160rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: $app-spacing-md;
	margin-bottom: $app-spacing-md;
	box-shadow: $app-shadow;
}

/* 日期选择器 */
.date-picker {
	margin-bottom: $app-spacing-md;
}

.date-nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $app-spacing-md;
}

.nav-btn {
	width: 72rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: $app-primary-bg;
	border-radius: 50%;
	transition: $app-transition;
}

.nav-btn:active {
	background: rgba(8, 145, 178, 0.15);
	transform: scale(0.95);
}

.nav-btn .app-icon {
	font-size: 36rpx;
	color: $app-primary;
}

.current-date {
	text-align: center;
}

.date-text {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: $app-text;
}

.week-text {
	display: block;
	font-size: 26rpx;
	color: $app-text-muted;
	margin-top: 6rpx;
}

.date-tabs {
	display: flex;
	justify-content: space-between;
}

.date-tab {
	flex: 1;
	text-align: center;
	padding: 18rpx 0;
	border-radius: $app-radius-sm;
	transition: $app-transition;
}

.date-tab:active {
	background: rgba(8, 145, 178, 0.05);
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
	font-size: 34rpx;
	font-weight: 700;
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
	font-size: 32rpx;
	font-weight: 700;
	color: $app-text;
	margin-bottom: $app-spacing-md;
	display: flex;
	align-items: center;
	gap: $app-spacing-sm;
}

.block-title .app-icon {
	font-size: 36rpx !important;
}

.block-title .app-icon.primary {
	color: $app-primary !important;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	text-align: center;
	padding: 32rpx 0;
}

.schedule-item {
	display: flex;
	align-items: center;
	padding: $app-spacing-sm 0;
	border-bottom: 1rpx solid $app-divider;
	transition: $app-transition;
}

.schedule-item:active {
	background: $app-hover-bg;
	margin: 0 -28rpx;
	padding-left: 28rpx;
	padding-right: 28rpx;
}

.schedule-item:last-child {
	border-bottom: none;
}

.time {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	margin-right: $app-spacing-md;
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
	margin-bottom: 10rpx;
}

.med-name {
	font-size: 32rpx;
	color: $app-text;
	font-weight: 600;
	flex: 1;
}

.med-freq {
	font-size: 26rpx;
	color: $app-text-secondary;
}

.med-date {
	margin-bottom: 10rpx;
}

.date-range {
	font-size: 24rpx;
	color: $app-primary;
	background: $app-primary-bg;
	padding: 8rpx 16rpx;
	border-radius: 12rpx;
	font-weight: 500;
}

/* 详情弹窗 */
.detail-popup {
	background: $app-card-bg;
	border-radius: 24rpx 24rpx 0 0;
	max-height: 70vh;
}

.popup-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 32rpx;
	border-bottom: 1rpx solid $app-divider;
}

.popup-title {
	font-size: 32rpx;
	font-weight: 600;
	color: $app-text;
}

.popup-close {
	font-size: 48rpx;
	color: $app-text-muted;
	line-height: 1;
}

.popup-body {
	padding: 24rpx 32rpx;
}

.detail-card {
	background: $app-bg;
	border-radius: $app-radius;
	padding: 20rpx;
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 16rpx 0;
	border-bottom: 1rpx solid $app-divider;
}

.detail-row:last-child {
	border-bottom: none;
}

.detail-row.medication-name {
	justify-content: center;
	border-bottom: none;
	padding-bottom: 24rpx;
}

.name-text {
	font-size: 36rpx;
	font-weight: 600;
	color: $app-primary;
}

.detail-label {
	font-size: 28rpx;
	color: $app-text-muted;
	min-width: 140rpx;
}

.detail-value {
	font-size: 28rpx;
	color: $app-text;
	flex: 1;
	text-align: right;
}

.detail-value.highlight {
	color: $app-primary;
	font-weight: 500;
}

.detail-value.status-pending {
	color: $app-warning;
}

.detail-value.status-completed {
	color: $app-success;
}

.detail-value.status-cancelled {
	color: #9CA3AF;
}
</style>