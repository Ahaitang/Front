<template>
	<view class="container">
		<!-- 日期选择器 -->
		<view class="date-picker card">
			<view class="date-nav">
				<view class="nav-btn" @click="prevDay">
					<text class="app-icon uniui-arrowleft"></text>
				</view>
				<view class="current-date" @click="openCalendar">
					<text class="date-text">{{ currentDateDisplay }}</text>
					<text class="week-text">{{ weekDayText }}</text>
				</view>
				<view class="nav-btn" @click="nextDay">
					<text class="app-icon uniui-arrowright"></text>
				</view>
			</view>
			<view class="date-tabs">
				<view class="date-tab" v-for="(item, index) in dateTabs" :key="index"
					:class="{ active: currentDate === item.date }" @click="selectDate(item.date)">
					<text class="tab-week">{{ item.week }}</text>
					<text class="tab-day">{{ item.day }}</text>
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
	</view>
</template>

<script>
import { getFollowUpList } from '@/api/followup.js'

export default {
	data() {
		return {
			currentDate: '',
			showAllFollowUp: false,
			followList: [],
			dateTabs: []
		};
	},
	computed: {
		currentDateDisplay() {
			if (!this.currentDate) return '';
			const d = new Date(this.currentDate);
			return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
		},
		weekDayText() {
			const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
			if (!this.currentDate) return '';
			return weeks[new Date(this.currentDate).getDay()];
		},
		todayFollowList() {
			if (!this.currentDate) return [];
			return this.followList.filter(f => {
				if (!f.date) return false;
				// 处理日期格式，提取 yyyy-MM-dd 部分
				const followDate = f.date.split('T')[0].split(' ')[0];
				return followDate === this.currentDate;
			}).map(f => ({
				...f,
				statusText: this.getStatusText(f.status),
				statusClass: this.getStatusClass(f.status)
			}));
		},
		upcomingFollowList() {
			if (!this.currentDate) return [];
			const today = new Date(this.currentDate);
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
		this.initDate();
		this.generateDateTabs();
	},
	onShow() {
		this.loadData();
	},
	methods: {
		initDate() {
			const today = new Date();
			this.currentDate = this.formatDate(today);
		},
		generateDateTabs() {
			const tabs = [];
			const weeks = ['日', '一', '二', '三', '四', '五', '六'];
			const today = new Date();

			for (let i = -2; i <= 4; i++) {
				const d = new Date(today);
				d.setDate(d.getDate() + i);
				const isToday = i === 0;
				tabs.push({
					date: this.formatDate(d),
					week: isToday ? '今' : '周' + weeks[d.getDay()],
					day: d.getDate()
				});
			}
			this.dateTabs = tabs;
		},
		formatDate(date) {
			const y = date.getFullYear();
			const m = String(date.getMonth() + 1).padStart(2, '0');
			const d = String(date.getDate()).padStart(2, '0');
			return `${y}-${m}-${d}`;
		},
		selectDate(date) {
			this.currentDate = date;
			this.loadData();
		},
		prevDay() {
			const d = new Date(this.currentDate);
			d.setDate(d.getDate() - 1);
			this.currentDate = this.formatDate(d);
			this.generateDateTabs();
			this.loadData();
		},
		nextDay() {
			const d = new Date(this.currentDate);
			d.setDate(d.getDate() + 1);
			this.currentDate = this.formatDate(d);
			this.generateDateTabs();
			this.loadData();
		},
		openCalendar() {
			this.$refs.calendar.open();
		},
		onCalendarConfirm(e) {
			if (e.fulldate) {
				this.currentDate = e.fulldate;
				this.generateDateTabs();
				this.loadData();
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
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding-bottom: 40rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	margin: 24rpx;
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

.date-tab.active .tab-week,
.date-tab.active .tab-day {
	color: $app-primary;
}

/* 区块 */
.section {
	margin: 0 24rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: $app-text;
}

.section-more {
	font-size: 26rpx;
	color: $app-primary;
}

/* 空状态 */
.empty-tip {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60rpx 0;
	color: $app-text-muted;
	font-size: 28rpx;
}

.empty-tip .app-icon {
	font-size: 80rpx;
	margin-bottom: 16rpx;
	opacity: 0.5;
}

/* 随访项 */
.follow-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
	padding: 24rpx;
}

.follow-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.follow-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.follow-icon .app-icon {
	font-size: 40rpx;
	color: #fff;
}

.follow-icon.status-pending {
	background: #F59E0B;
}

.follow-icon.status-completed {
	background: #10B981;
}

.follow-icon.status-cancelled {
	background: #9CA3AF;
}

.follow-info {
	flex: 1;
}

.follow-project {
	display: block;
	font-size: 30rpx;
	font-weight: bold;
	color: $app-text;
	margin-bottom: 8rpx;
}

.follow-doctor,
.follow-time {
	display: block;
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
}

.follow-detail {
	margin-top: 8rpx;
}

.follow-detail text {
	font-size: 22rpx;
	color: $app-text-secondary;
	background: $app-primary-bg;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
}

.follow-status {
	font-size: 24rpx;
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
}

.follow-status.status-pending {
	background: #FEF3C7;
	color: #F59E0B;
}

.follow-status.status-completed {
	background: #D1FAE5;
	color: #10B981;
}

.follow-status.status-cancelled {
	background: #F3F4F6;
	color: #9CA3AF;
}
</style>