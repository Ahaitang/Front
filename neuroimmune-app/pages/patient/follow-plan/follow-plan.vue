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

		<!-- 今日随访列表 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">今日随访安排</text>
			</view>
			<view class="empty-tip" v-if="todayFollowList.length === 0">
				<text class="app-icon uniui-calendar"></text>
				<text>今日暂无随访安排</text>
			</view>
			<view class="follow-item card" v-for="(item, i) in todayFollowList" :key="i" @click="viewFollowDetail(item)">
				<view class="follow-left">
					<view class="follow-icon" :class="item.statusClass">
						<text class="app-icon uniui-notification-filled"></text>
					</view>
					<view class="follow-info">
						<text class="follow-project">{{ item.project || '随访' }}</text>
						<text class="follow-doctor">随访医生：{{ item.doctorName || '医生' }}</text>
						<text class="follow-time">时间：{{ item.date }}</text>
						<view class="follow-detail" v-if="item.hospital || item.department">
							<text>{{ item.hospital }} {{ item.department }}</text>
						</view>
						<view class="follow-detail" v-if="item.examinationItems">
							<text>检查：{{ item.examinationItems }}</text>
						</view>
					</view>
				</view>
				<view class="follow-status" :class="item.statusClass">{{ item.statusText }}</view>
			</view>
		</view>

		<!-- 近期随访 -->
		<view class="section" v-if="upcomingFollowList.length > 0">
			<view class="section-header">
				<text class="section-title">近期随访</text>
				<text class="section-more" @click="showAllFollowUp = true">查看全部</text>
			</view>
			<view class="follow-item card" v-for="(item, i) in upcomingFollowList" :key="i" @click="viewFollowDetail(item)">
				<view class="follow-left">
					<view class="follow-icon" :class="item.statusClass">
						<text class="app-icon uniui-calendar-filled"></text>
					</view>
					<view class="follow-info">
						<text class="follow-project">{{ item.project || '随访' }}</text>
						<text class="follow-doctor">随访医生：{{ item.doctorName || '医生' }}</text>
						<text class="follow-time">{{ item.date }}</text>
						<view class="follow-detail" v-if="item.hospital || item.department">
							<text>{{ item.hospital }} {{ item.department }}</text>
						</view>
						<view class="follow-detail" v-if="item.examinationItems">
							<text>检查：{{ item.examinationItems }}</text>
						</view>
					</view>
				</view>
				<view class="follow-status" :class="item.statusClass">{{ item.statusText }}</view>
			</view>
		</view>

		<!-- 日历弹窗 -->
		<uni-calendar ref="calendar" :insert="false" @confirm="onCalendarConfirm" />

		<!-- 添加按钮 -->
		<view class="add-btn" @click="goToAdd">
			<text class="app-icon uniui-plus"></text>
		</view>
	</view>
</template>

<script>
import { getFollowUpList } from '@/api/followup.js'

export default {
	data() {
		return {
			selectedDate: '',
			currentYear: new Date().getFullYear(),
			currentMonth: new Date().getMonth() + 1,
			weekDays: [],
			weekLabels: ['一', '二', '三', '四', '五', '六', '日'],
			baseOffset: 0,
			showAllFollowUp: false,
			followList: []
		};
	},
	computed: {
		weekRangeText() {
			if (this.weekDays.length < 7) return '';
			const first = this.weekDays[0];
			const last = this.weekDays[6];
			return `${first.date.substring(5)} - ${last.date.substring(5)}`;
		},
		todayFollowList() {
			return this.followList.filter(f => {
				if (!f.date) return false;
				// 处理日期格式，提取 yyyy-MM-dd 部分
				const followDate = f.date.split('T')[0].split(' ')[0];
				return followDate === this.selectedDate;
			}).map(f => ({
				...f,
				statusText: this.getStatusText(f.status),
				statusClass: this.getStatusClass(f.status)
			}));
		},
		upcomingFollowList() {
			const today = new Date(this.selectedDate);
			today.setHours(0, 0, 0, 0);
			return this.followList.filter(f => {
				if (!f.date) return false;
				const followDateStr = f.date.split('T')[0].split(' ')[0];
				const followDate = new Date(followDateStr);
				followDate.setHours(0, 0, 0, 0);
				return followDate > today;
			}).slice(0, 5).map(f => ({
				...f,
				statusText: this.getStatusText(f.status),
				statusClass: this.getStatusClass(f.status)
			}));
		}
	},
	onLoad() {
		this.initWeekDays();
	},
	onShow() {
		this.loadData();
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

			// 如果没有选中日期，默认选中今天
			if (!this.selectedDate) {
				this.selectedDate = todayStr;
			}

			// 更新当前年月
			this.currentYear = monday.getFullYear();
			this.currentMonth = monday.getMonth() + 1;
		},
		selectDay(index) {
			this.selectedDate = this.weekDays[index].date;
		},
		prevWeek() {
			this.baseOffset--;
			this.initWeekDays();
			// 如果选中的日期不在当前周，选中周一
			const inCurrentWeek = this.weekDays.some(d => d.date === this.selectedDate);
			if (!inCurrentWeek) {
				this.selectedDate = this.weekDays[0].date;
			}
		},
		nextWeek() {
			this.baseOffset++;
			this.initWeekDays();
			// 如果选中的日期不在当前周，选中周一
			const inCurrentWeek = this.weekDays.some(d => d.date === this.selectedDate);
			if (!inCurrentWeek) {
				this.selectedDate = this.weekDays[0].date;
			}
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
			}
		},
		getStatusText(status) {
			const map = {
				'pending': '待随访',
				'completed': '已完成',
				'cancelled': '已取消'
			};
			return map[status] || status || '待随访';
		},
		getStatusClass(status) {
			const map = {
				'pending': 'status-pending',
				'completed': 'status-completed',
				'cancelled': 'status-cancelled'
			};
			return map[status] || 'status-pending';
		},
		async loadData() {
			try {
				const allFollowRes = await getFollowUpList({ pageNum: 1, pageSize: 100 });

				if (allFollowRes && allFollowRes.list) {
					this.followList = allFollowRes.list.map(f => ({
						id: f.id,
						project: f.project,
						doctorName: f.doctorName,
						date: f.date,
						status: f.status,
						content: f.content,
						outpatientTime: f.outpatientTime,
						hospitalizationTime: f.hospitalizationTime,
						examinationItems: f.examinationItems,
						hospital: f.hospital,
						department: f.department,
						notes: f.notes
					}));
				}
			} catch (e) {
				console.error('加载随访信息失败:', e);
			}
		},
		viewFollowDetail(item) {
			uni.showToast({
				title: item.project || '随访详情',
				icon: 'none'
			});
		},
		goToAdd() {
			uni.navigateTo({
				url: '/pages/patient/add-follow/add-follow'
			});
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding-bottom: 60rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: $app-spacing-md;
	margin: $app-spacing-md;
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
	background: rgba(13, 148, 136, 0.15);
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
	background: rgba(13, 148, 136, 0.05);
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
.section {
	margin: 0 $app-spacing-md;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $app-spacing-md;
}

.section-title {
	font-size: 32rpx;
	font-weight: 700;
	color: $app-text;
}

.section-more {
	font-size: 26rpx;
	color: $app-primary;
	font-weight: 500;
}

/* 空状态 */
.empty-tip {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80rpx 0;
	color: $app-text-muted;
	font-size: 28rpx;
}

.empty-tip .app-icon {
	font-size: 100rpx;
	margin-bottom: $app-spacing-md;
	opacity: 0.4;
}

/* 随访项 */
.follow-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $app-spacing-sm;
	padding: $app-spacing-md;
	background: $app-card-bg;
	border-radius: $app-radius;
	box-shadow: $app-shadow;
	transition: $app-transition;
}

.follow-item:active {
	transform: scale(0.99);
	box-shadow: $app-shadow-sm;
}

.follow-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.follow-icon {
	width: 88rpx;
	height: 88rpx;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: $app-spacing-md;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.follow-icon .app-icon {
	font-size: 44rpx;
	color: #fff;
}

.follow-icon.status-pending {
	background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
}

.follow-icon.status-completed {
	background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
}

.follow-icon.status-cancelled {
	background: linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 100%);
}

.follow-info {
	flex: 1;
}

.follow-project {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
	color: $app-text;
	margin-bottom: 10rpx;
}

.follow-doctor,
.follow-time {
	display: block;
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 6rpx;
}

.follow-detail {
	margin-top: 10rpx;
}

.follow-detail text {
	font-size: 22rpx;
	color: $app-text-secondary;
	background: $app-primary-bg;
	padding: 6rpx 14rpx;
	border-radius: 10rpx;
}

.follow-status {
	font-size: 24rpx;
	padding: 10rpx 24rpx;
	border-radius: 24rpx;
	font-weight: 500;
}

.follow-status.status-pending {
	background: $app-warning-bg;
	color: $app-warning;
}

.follow-status.status-completed {
	background: $app-success-bg;
	color: $app-success;
}

.follow-status.status-cancelled {
	background: #F3F4F6;
	color: #9CA3AF;
}

/* 添加按钮 */
.add-btn {
	position: fixed;
	right: 48rpx;
	bottom: 80rpx;
	width: 112rpx;
	height: 112rpx;
	background: $app-gradient-primary;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $app-shadow-primary;
	transition: $app-transition;
}

.add-btn:active {
	transform: scale(0.95);
	box-shadow: $app-shadow;
}

.add-btn .app-icon {
	font-size: 52rpx;
	color: #fff;
}
</style>