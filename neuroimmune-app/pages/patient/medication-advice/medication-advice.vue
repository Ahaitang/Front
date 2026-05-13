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
			<view class="card item" v-for="(item, i) in filteredList" :key="i" @click="viewMedicationDetail(item)">
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
				<view class="item-body" v-if="item.endDate">
					<text class="label">有效期至：</text><text class="value highlight">{{ item.endDate }}</text>
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

		<!-- 用药详情弹窗 -->
		<uni-popup ref="detailPopup" type="bottom" :safe-area="true">
			<view class="detail-popup">
				<view class="popup-header">
					<text class="popup-title">用药详情</text>
					<text class="popup-close" @click="closeDetailPopup">×</text>
				</view>
				<view class="popup-body" v-if="selectedMedication">
					<view class="detail-card">
						<view class="detail-row medication-name">
							<text class="name-text">{{ selectedMedication.medicationName }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">开具日期</text>
							<text class="detail-value">{{ selectedMedication.date || '--' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">剂量</text>
							<text class="detail-value">{{ selectedMedication.dosage }}{{ selectedMedication.unit || '' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">频率</text>
							<text class="detail-value">{{ selectedMedication.frequency || '--' }}</text>
						</view>
						<view class="detail-row" v-if="selectedMedication.route">
							<text class="detail-label">用药途径</text>
							<text class="detail-value">{{ selectedMedication.route }}</text>
						</view>
						<view class="detail-row" v-if="selectedMedication.duration">
							<text class="detail-label">服用时间段</text>
							<text class="detail-value highlight">{{ selectedMedication.duration }}</text>
						</view>
						<view class="detail-row" v-if="selectedMedication.endDate">
							<text class="detail-label">有效期至</text>
							<text class="detail-value highlight">{{ selectedMedication.endDate }}</text>
						</view>
						<view class="detail-row" v-if="selectedMedication.doctorName">
							<text class="detail-label">开具医生</text>
							<text class="detail-value">{{ selectedMedication.doctorName }}</text>
						</view>
						<view class="detail-row" v-if="selectedMedication.notes">
							<text class="detail-label">备注</text>
							<text class="detail-value notes">{{ selectedMedication.notes }}</text>
						</view>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import { getMedicationList } from '@/api/medication.js'

export default {
	data() {
		return {
			selectedDate: '',
			currentYear: new Date().getFullYear(),
			currentMonth: new Date().getMonth() + 1,
			weekDays: [],
			weekLabels: ['一', '二', '三', '四', '五', '六', '日'],
			baseOffset: 0,
			list: [],
			showAll: false,
			selectedMedication: null,
			highlightId: null
		};
	},
	computed: {
		weekRangeText() {
			if (this.weekDays.length < 7) return '';
			const first = this.weekDays[0];
			const last = this.weekDays[6];
			return `${first.date.substring(5)} - ${last.date.substring(5)}`;
		},
		filteredList() {
			if (this.showAll) {
				return this.list;
			}
			// 按有效期过滤：当前日期在 [date, endDate] 范围内
			return this.list.filter(item => {
				if (!item.date) return false;

				const startDate = item.date.split('T')[0].split(' ')[0];
				const endDate = item.endDate ? item.endDate.split('T')[0].split(' ')[0] : null;

				// 当前日期
				const current = this.selectedDate;

				// 检查是否在有效期内
				if (current < startDate) return false;
				if (endDate && current > endDate) return false;

				return true;
			});
		}
	},
	onLoad(options) {
		this.initWeekDays();
		if (options && options.highlight) {
			this.highlightId = parseInt(options.highlight);
			this.showAll = true;
		}
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
			if (this.showAll) {
				this.showAll = false;
			}
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
						endDate: m.endDate,
						dosage: m.dosage,
						unit: m.unit || '',
						frequency: m.frequency,
						route: m.route,
						duration: m.duration,
						notes: m.notes,
						doctorName: m.doctorName
					}));

					// 如果有 highlightId，自动打开对应详情
					if (this.highlightId) {
						const targetItem = this.list.find(m => m.id === this.highlightId);
						if (targetItem) {
							this.$nextTick(() => {
								this.viewMedicationDetail(targetItem);
							});
						}
						this.highlightId = null;
					}
				}
			} catch (e) {
				console.error('加载用药建议失败:', e);
			}
		},
		viewMedicationDetail(item) {
			this.selectedMedication = item;
			this.$refs.detailPopup.open();
		},
		closeDetailPopup() {
			this.$refs.detailPopup.close();
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding-bottom: 80rpx;
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
	margin-bottom: 0;
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

/* 查看全部 */
.view-all-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 $app-spacing-md;
	margin: $app-spacing-md 0;
}

.view-all-btn {
	display: flex;
	align-items: center;
	gap: 10rpx;
	font-size: 28rpx;
	color: $app-primary;
	padding: 14rpx 28rpx;
	border: 2rpx solid $app-primary;
	border-radius: 32rpx;
	font-weight: 500;
	transition: $app-transition;
}

.view-all-btn:active {
	background: $app-primary-bg;
}

.view-all-btn.active {
	background: $app-primary;
	color: #fff;
}

.view-all-btn .app-icon {
	font-size: 36rpx;
}

.total-count {
	font-size: 26rpx;
	color: $app-text-muted;
}

/* 用药项 */
.empty .empty-tip {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60rpx 0;
}

.item {
	margin-top: 0;
	transition: $app-transition;
}

.item:active {
	transform: scale(0.99);
	box-shadow: $app-shadow-sm;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
}

.item-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $app-spacing-md;
	padding-bottom: $app-spacing-sm;
	border-bottom: 1rpx solid $app-divider;
}

.name {
	font-size: 34rpx;
	font-weight: 700;
	color: $app-text;
}

.date {
	font-size: 24rpx;
	color: $app-text-muted;
}

.item-body {
	font-size: 28rpx;
	color: $app-text-secondary;
	margin-bottom: $app-spacing-sm;
	display: flex;
	line-height: 1.5;
}

.item-body .label {
	color: $app-text-muted;
	min-width: 180rpx;
}

.item-body .value {
	color: $app-text;
	flex: 1;
}

.item-body .highlight {
	color: $app-primary;
	font-weight: 600;
}

.item-footer {
	margin-top: $app-spacing-sm;
	padding-top: $app-spacing-sm;
	border-top: 1rpx solid $app-divider;
}

.doctor {
	font-size: 24rpx;
	color: $app-text-secondary;
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

.detail-value.notes {
	text-align: left;
	word-break: break-all;
}
</style>