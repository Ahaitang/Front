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

		<!-- 查看全部按钮 -->
		<view class="view-all-bar">
			<view class="view-all-btn" :class="{ active: showAll }" @click="toggleShowAll">
				<text class="app-icon" :class="showAll ? 'uniui-eye-slash' : 'uniui-eye'"></text>
				<text>{{ showAll ? '查看当日' : '查看全部' }}</text>
			</view>
			<text class="total-count" v-if="showAll">共 {{ list.length }} 条用药建议</text>
		</view>

		<!-- 用药列表 -->
		<view class="empty card" v-if="filteredList.length === 0">
			<text class="empty-tip">{{ showAll ? '暂无用药建议' : '当日暂无用药建议' }}</text>
		</view>
		<template v-else>
			<view class="card item" v-for="(item, i) in filteredList" :key="i">
				<view class="item-head">
					<text class="name">{{ item.medicationName }}</text>
					<text class="date">开具日期：{{ item.date }}</text>
				</view>
				<view class="item-body">
					<text class="label">剂量：</text><text class="value">{{ item.dosage }}{{ item.unit || '' }}</text>
				</view>
				<view class="item-body">
					<text class="label">频率：</text><text class="value">{{ item.frequency }}</text>
				</view>
				<view class="item-body" v-if="item.route">
					<text class="label">用药途径：</text><text class="value">{{ item.route }}</text>
				</view>
				<view class="item-body" v-if="item.duration">
					<text class="label">服用时间段：</text><text class="value highlight">{{ item.duration }}</text>
				</view>
				<view class="item-body" v-if="item.notes">
					<text class="label">备注：</text><text class="value">{{ item.notes }}</text>
				</view>
				<view class="item-footer" v-if="item.doctorName">
					<text class="doctor">开具医生：{{ item.doctorName }}</text>
				</view>
			</view>
		</template>

		<!-- 日历弹窗 -->
		<uni-calendar ref="calendar" :insert="false" @confirm="onCalendarConfirm" />
	</view>
</template>

<script>
import { getMedicationList } from '@/api/medication.js'

export default {
	data() {
		return {
			currentDate: '',
			dateTabs: [],
			list: [],
			showAll: false
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
		filteredList() {
			if (this.showAll) {
				return this.list;
			}
			// 按日期过滤
			return this.list.filter(item => {
				if (!item.date) return false;
				const itemDate = item.date.split('T')[0].split(' ')[0];
				return itemDate === this.currentDate;
			});
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
			if (this.showAll) {
				this.showAll = false;
			}
		},
		prevDay() {
			const d = new Date(this.currentDate);
			d.setDate(d.getDate() - 1);
			this.currentDate = this.formatDate(d);
			this.generateDateTabs();
			if (this.showAll) {
				this.showAll = false;
			}
		},
		nextDay() {
			const d = new Date(this.currentDate);
			d.setDate(d.getDate() + 1);
			this.currentDate = this.formatDate(d);
			this.generateDateTabs();
			if (this.showAll) {
				this.showAll = false;
			}
		},
		openCalendar() {
			this.$refs.calendar.open();
		},
		onCalendarConfirm(e) {
			if (e.fulldate) {
				this.currentDate = e.fulldate;
				this.generateDateTabs();
				if (this.showAll) {
					this.showAll = false;
				}
			}
		},
		toggleShowAll() {
			this.showAll = !this.showAll;
		},
		async loadData() {
			try {
				const res = await getMedicationList({ pageNum: 1, pageSize: 100 });
				if (res && res.list) {
					this.list = res.list.map(m => ({
						id: m.id,
						medicationName: m.medicationName,
						date: m.date,
						dosage: m.dosage,
						unit: m.unit || '',
						frequency: m.frequency,
						route: m.route,
						duration: m.duration,
						notes: m.notes,
						doctorName: m.doctorName
					}));
				}
			} catch (e) {
				console.error('加载用药建议失败:', e);
			}
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container { min-height: 100vh; background: $app-bg; padding-bottom: 60rpx; }

.card { background: $app-card-bg; border-radius: $app-radius; padding: 28rpx; margin: 24rpx; box-shadow: $app-shadow; }

/* 日期选择器 */
.date-picker {
	margin-bottom: 0;
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

/* 查看全部 */
.view-all-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 24rpx;
	margin: 24rpx 0;
}

.view-all-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 28rpx;
	color: $app-primary;
	padding: 12rpx 24rpx;
	border: 1rpx solid $app-primary;
	border-radius: 32rpx;
}

.view-all-btn.active {
	background: $app-primary;
	color: #fff;
}

.view-all-btn .app-icon {
	font-size: 32rpx;
}

.total-count {
	font-size: 26rpx;
	color: $app-text-muted;
}

/* 用药项 */
.item {
	margin-top: 0;
}

.empty-tip { font-size: 28rpx; color: $app-text-muted; display: block; text-align: center; padding: 40rpx 0; }
.item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; padding-bottom: 16rpx; border-bottom: 1rpx solid #f0f0f0; }
.name { font-size: 32rpx; font-weight: bold; color: $app-text; }
.date { font-size: 24rpx; color: $app-text-muted; }
.item-body { font-size: 28rpx; color: $app-text-secondary; margin-bottom: 12rpx; display: flex; }
.item-body .label { color: $app-text-muted; min-width: 160rpx; }
.item-body .value { color: $app-text; flex: 1; }
.item-body .highlight { color: $app-primary; font-weight: 500; }
.item-footer { margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
.doctor { font-size: 24rpx; color: $app-text-secondary; }
</style>