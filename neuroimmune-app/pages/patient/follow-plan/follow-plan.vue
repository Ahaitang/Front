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
				<text>{{ showAll ? '查看当日' : '查看全部记录' }}</text>
			</view>
			<text class="total-count" v-if="showAll">共 {{ followList.length }} 条随访记录</text>
		</view>

		<!-- 随访列表 -->
		<view class="section">
			<view class="empty-tip" v-if="filteredFollowList.length === 0">
				<text class="app-icon uniui-calendar"></text>
				<text>{{ showAll ? '暂无随访记录' : '当日暂无随访安排' }}</text>
			</view>
			<view class="follow-item card" v-for="(item, i) in filteredFollowList" :key="item.id || i" @click="viewFollowDetail(item)">
				<view class="follow-left">
					<view class="follow-icon" :class="item.statusClass">
						<text class="app-icon uniui-notification-filled"></text>
					</view>
					<view class="follow-info">
						<text class="follow-project">{{ item.followUpExamTypeName || '随访' }}</text>
						<text class="follow-cycle" v-if="item.outpatientCycleType">
							门诊：{{ formatCycleText(item) }}
						</text>
						<text class="follow-hospital" v-if="item.hospitalizationTime">
							住院：{{ formatDate(new Date(item.hospitalizationTime)) }}
						</text>
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

		<!-- 随访详情弹窗 -->
		<uni-popup ref="detailPopup" type="bottom" :safe-area="true">
			<view class="detail-popup">
				<view class="popup-header">
					<text class="popup-title">随访详情</text>
					<text class="popup-close" @click="closeDetailPopup">×</text>
				</view>
				<view class="popup-body" v-if="selectedFollow">
					<view class="detail-card">
						<view class="detail-row">
							<text class="detail-label">随访类型</text>
							<text class="detail-value">{{ selectedFollow.followUpExamTypeName || '随访' }}</text>
						</view>
						<view class="detail-row" v-if="selectedFollow.outpatientCycleType">
							<text class="detail-label">门诊周期</text>
							<text class="detail-value">{{ formatCycleText(selectedFollow) }}</text>
						</view>
						<view class="detail-row" v-if="selectedFollow.hospitalizationTime">
							<text class="detail-label">住院时间</text>
							<text class="detail-value">{{ formatDate(new Date(selectedFollow.hospitalizationTime)) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">检查项目</text>
							<text class="detail-value">{{ selectedFollow.examinationItems || '无' }}</text>
						</view>
						<view class="detail-row" v-if="selectedFollow.doctorName">
							<text class="detail-label">随访医生</text>
							<text class="detail-value">{{ selectedFollow.doctorName }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">随访状态</text>
							<text class="detail-value" :class="getStatusClass(selectedFollow.status)">{{ getStatusText(selectedFollow.status) }}</text>
						</view>
						<view class="detail-row" v-if="selectedFollow.notes">
							<text class="detail-label">备注</text>
							<text class="detail-value notes">{{ selectedFollow.notes }}</text>
						</view>
					</view>
				</view>
			</view>
		</uni-popup>

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
			showAll: false,
			followList: [],
			selectedFollow: null,
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
		filteredFollowList() {
			let list = this.followList;

			// 如果不是查看全部，则按选中日期筛选
			if (!this.showAll) {
				list = list.filter(item => this.isFollowUpOnDate(item, this.selectedDate));
			}

			// 调试日志
			console.log('=== 随访列表调试 ===');
			console.log('followList总数:', this.followList.length);
			console.log('筛选后数量:', list.length);
			console.log('showAll:', this.showAll);
			console.log('selectedDate:', this.selectedDate);
			console.log('followList数据:', this.followList);

			return list.map(f => ({
				...f,
				statusText: this.getStatusText(f.status),
				statusClass: this.getStatusClass(f.status)
			}));
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
		formatCycleText(item) {
			const typeMap = {
				'monthly': '每月',
				'weekly': '每周',
				'quarterly': '每季度'
			};
			const slotMap = {
				'morning': '上午',
				'afternoon': '下午',
				'evening': '晚间'
			};

			const typeLabel = typeMap[item.outpatientCycleType] || '';
			const value = item.outpatientCycleValue || '';
			const slotLabel = slotMap[item.outpatientTimeSlot] || '';

			if (item.outpatientCycleType === 'weekly') {
				const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
				const weekNum = parseInt(value);
				// 边界检查：周几必须是1-7
				if (weekNum >= 1 && weekNum <= 7) {
					const weekLabel = weekDays[weekNum - 1];
					return `${typeLabel}周${weekLabel}${slotLabel}`;
				}
				// 无效值时仅显示周期类型和时段
				return `${typeLabel}${slotLabel}`;
			}

			// 月/季度周期：显示具体日期
			if (value) {
				return `${typeLabel}${value}号${slotLabel}`;
			}
			// 无周期值时仅显示周期类型和时段
			return `${typeLabel}${slotLabel}`;
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
		getStatusText(status) {
			const map = {
				0: '待随访',
				1: '已完成',
				2: '已取消'
			};
			return map[status] || '待随访';
		},
		getStatusClass(status) {
			const map = {
				0: 'status-pending',
				1: 'status-completed',
				2: 'status-cancelled'
			};
			return map[status] || 'status-pending';
		},
		// 判断随访是否在指定日期
		isFollowUpOnDate(item, dateStr) {
			// 门诊周期随访判断
			let outpatientMatch = false;
			if (item.outpatientCycleType) {
				const selected = new Date(dateStr);
				const value = parseInt(item.outpatientCycleValue) || 0;

				if (item.outpatientCycleType === 'weekly') {
					const selectedDayOfWeek = selected.getDay();
					const targetDay = value === 7 ? 0 : value;
					outpatientMatch = selectedDayOfWeek === targetDay;
				} else if (item.outpatientCycleType === 'monthly') {
					outpatientMatch = selected.getDate() === value;
				} else if (item.outpatientCycleType === 'quarterly') {
					outpatientMatch = selected.getDate() === value;
				}
			}

			// 住院时间判断
			let hospitalMatch = false;
			if (item.hospitalizationTime) {
				const hospDate = this.formatDate(new Date(item.hospitalizationTime));
				hospitalMatch = hospDate === dateStr;
			}

			// 如果两者都有，满足任一条件即显示
			// 如果只有门诊周期，按门诊匹配
			// 如果只有住院时间，按住院匹配
			// 如果都没有，默认显示
			if (item.outpatientCycleType && item.hospitalizationTime) {
				return outpatientMatch || hospitalMatch;
			} else if (item.outpatientCycleType) {
				return outpatientMatch;
			} else if (item.hospitalizationTime) {
				return hospitalMatch;
			}
			return true;
		},
		async loadData() {
			try {
				const allFollowRes = await getFollowUpList({ pageNum: 1, pageSize: 100 });

				if (allFollowRes && allFollowRes.list) {
					this.followList = allFollowRes.list.map(f => ({
						id: f.id,
						// 新字段（带默认值保护）
						followUpExamTypeName: f.followUpExamTypeName || '',
						outpatientCycleType: f.outpatientCycleType || '',
						outpatientCycleValue: f.outpatientCycleValue || '',
						outpatientTimeSlot: f.outpatientTimeSlot || '',
						hospitalizationTime: f.hospitalizationTime || '',
						examinationItems: f.examinationItems || '',
						// 保留字段
						doctorName: f.doctorName || '',
						status: f.status,
						notes: f.notes || ''
					}));

					// 如果有 highlightId，自动打开对应详情
					if (this.highlightId) {
						const targetItem = this.followList.find(f => f.id === this.highlightId);
						if (targetItem) {
							this.$nextTick(() => {
								this.viewFollowDetail(targetItem);
							});
						}
						this.highlightId = null;
					}
				}
			} catch (e) {
				console.error('加载随访信息失败:', e);
			}
		},
		viewFollowDetail(item) {
			this.selectedFollow = item;
			this.$refs.detailPopup.open();
		},
		closeDetailPopup() {
			this.$refs.detailPopup.close();
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

/* 查看全部按钮 */
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

/* 区块 */
.section {
	margin: 0 $app-spacing-md;
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

.follow-cycle,
.follow-hospital {
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

.detail-value.status-pending {
	color: $app-warning;
}

.detail-value.status-completed {
	color: $app-success;
}

.detail-value.status-cancelled {
	color: #9CA3AF;
}

.detail-value.notes {
	text-align: left;
	word-break: break-all;
}
</style>