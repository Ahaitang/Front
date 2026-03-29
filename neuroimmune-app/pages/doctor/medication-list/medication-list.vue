<template>
	<view class="container">
		<!-- 日期选择 -->
		<view class="date-bar card">
			<view class="date-btn" @click="prevDay">
				<text class="app-icon uniui-arrowleft"></text>
			</view>
			<view class="date-info" @click="showDatePicker">
				<text class="date-text">{{ formatDisplayDate(currentDate) }}</text>
				<text class="app-icon sm uniui-arrowdown"></text>
			</view>
			<view class="date-btn" @click="nextDay">
				<text class="app-icon uniui-arrowright"></text>
			</view>
			<view class="today-btn" @click="goToday">今天</view>
		</view>

		<!-- 统计信息 -->
		<view class="stats-card card">
			<view class="stats-item">
				<text class="stats-num">{{ medicationList.length }}</text>
				<text class="stats-label">条用药建议</text>
			</view>
			<view class="stats-divider"></view>
			<view class="stats-item">
				<text class="stats-num">{{ patientCount }}</text>
				<text class="stats-label">位患者</text>
			</view>
		</view>

		<!-- 用药列表 -->
		<view class="med-list" v-if="medicationList.length">
			<view class="med-item card" v-for="(item, index) in medicationList" :key="index" @click="goPatientDetail(item)">
				<view class="med-header">
					<image class="patient-avatar" :src="item.avatar || '/static/component.png'" mode="aspectFill"></image>
					<view class="patient-info">
						<view class="patient-row">
							<text class="patient-name">{{ item.patientName }}</text>
							<text class="patient-meta">{{ item.gender }} · {{ item.age }}岁</text>
						</view>
						<text class="patient-disease" v-if="item.diseaseType">{{ item.diseaseType }}</text>
					</view>
					<text class="app-icon sm muted uniui-arrowright"></text>
				</view>
				<view class="med-content">
					<view class="med-row">
						<view class="med-icon-wrap">
							<text class="app-icon uniui-compose"></text>
						</view>
						<view class="med-detail">
							<text class="med-name">{{ item.medicationName }}</text>
							<text class="med-dosage">剂量：{{ item.dosage }}{{ item.unit }}</text>
						</view>
					</view>
					<view class="med-freq">
						<text class="app-icon sm uniui-time"></text>
						<text>{{ item.frequency }}</text>
					</view>
					<view class="med-duration" v-if="item.startDate">
						<text class="app-icon sm uniui-calendar"></text>
						<text>{{ item.startDate }} ~ {{ item.endDate || '长期' }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<text class="app-icon uniui-info-filled"></text>
			<text class="empty-text">当日暂无用药建议</text>
		</view>

		<!-- 添加按钮 -->
		<view class="add-btn" @click="navTo('/pages/doctor/add-medication/add-medication')">
			<text class="app-icon uniui-plus-filled"></text>
		</view>
	</view>
</template>

<script>
import { getMedicationList } from '@/api/medication.js'

export default {
	data() {
		return {
			currentDate: new Date(),
			medicationList: [],
			patientCount: 0
		}
	},
	onLoad() {
		this.loadData()
	},
	methods: {
		async loadData() {
			try {
				const dateStr = this.formatDate(this.currentDate)
				const res = await getMedicationList({ date: dateStr, pageNum: 1, pageSize: 100 })
				if (res && res.list) {
					this.medicationList = res.list.map(m => ({
						id: m.id,
						patientId: m.patientId,
						patientName: m.patientName || '未知',
						gender: m.gender || '男',
						age: m.age || 45,
						diseaseType: m.diseaseType || '',
						medicationName: m.medicationName,
						dosage: m.dosage,
						unit: m.unit || 'mg',
						frequency: m.frequency || '每日1次',
						startDate: m.startDate,
						endDate: m.endDate
					}))
					// 统计患者数
					const patientIds = new Set(this.medicationList.map(m => m.patientId))
					this.patientCount = patientIds.size
				}
			} catch (e) {
				console.error('加载用药列表失败:', e)
				// 模拟数据
				this.medicationList = [
					{
						id: 1,
						patientId: 1,
						patientName: '张三',
						gender: '男',
						age: 45,
						diseaseType: 'MS',
						medicationName: '甲泼尼龙',
						dosage: '40',
						unit: 'mg',
						frequency: '每日1次，晨起服用',
						startDate: '2024-03-01',
						endDate: '2024-04-01'
					},
					{
						id: 2,
						patientId: 2,
						patientName: '李四',
						gender: '女',
						age: 38,
						diseaseType: 'NMOSD',
						medicationName: '硫唑嘌呤',
						dosage: '50',
						unit: 'mg',
						frequency: '每日2次，早晚餐后',
						startDate: '2024-02-15'
					},
					{
						id: 3,
						patientId: 3,
						patientName: '王五',
						gender: '男',
						age: 52,
						diseaseType: 'MG',
						medicationName: '泼尼松',
						dosage: '30',
						unit: 'mg',
						frequency: '每日1次，晨起服用',
						startDate: '2024-03-10'
					}
				]
				this.patientCount = 3
			}
		},
		formatDate(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		formatDisplayDate(date) {
			const today = new Date()
			const d = new Date(date)
			const isToday = d.toDateString() === today.toDateString()
			const isYesterday = new Date(today.setDate(today.getDate() - 1)).toDateString() === d.toDateString()

			const month = d.getMonth() + 1
			const day = d.getDate()
			const weekDays = ['日', '一', '二', '三', '四', '五', '六']
			const weekDay = weekDays[d.getDay()]

			if (isToday) return `今天 ${month}月${day}日`
			if (isYesterday) return `昨天 ${month}月${day}日`
			return `${month}月${day}日 周${weekDay}`
		},
		prevDay() {
			const d = new Date(this.currentDate)
			d.setDate(d.getDate() - 1)
			this.currentDate = d
			this.loadData()
		},
		nextDay() {
			const d = new Date(this.currentDate)
			d.setDate(d.getDate() + 1)
			this.currentDate = d
			this.loadData()
		},
		goToday() {
			this.currentDate = new Date()
			this.loadData()
		},
		showDatePicker() {
			uni.showActionSheet({
				itemList: ['今天', '昨天', '前7天'],
				success: (res) => {
					const today = new Date()
					if (res.tapIndex === 0) {
						this.currentDate = today
					} else if (res.tapIndex === 1) {
						const d = new Date()
						d.setDate(d.getDate() - 1)
						this.currentDate = d
					} else if (res.tapIndex === 2) {
						const d = new Date()
						d.setDate(d.getDate() - 7)
						this.currentDate = d
					}
					this.loadData()
				}
			})
		},
		goPatientDetail(item) {
			uni.navigateTo({ url: '/pages/doctor/patient-info/patient-info?id=' + item.patientId })
		},
		navTo(url) {
			uni.navigateTo({ url })
		}
	}
}
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding: 24rpx;
	padding-bottom: 120rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

/* 日期栏 */
.date-bar {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 24rpx;
}

.date-btn {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: $app-bg;
	border-radius: 50%;
}

.date-btn .app-icon {
	font-size: 28rpx;
	color: $app-text-secondary;
}

.date-info {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
}

.date-text {
	font-size: 32rpx;
	font-weight: 500;
	color: $app-text;
}

.today-btn {
	padding: 12rpx 24rpx;
	background: rgba(99, 102, 241, 0.1);
	border-radius: 20rpx;
	font-size: 26rpx;
	color: #6366F1;
}

/* 统计卡片 */
.stats-card {
	display: flex;
	align-items: center;
	justify-content: space-around;
	margin-bottom: 24rpx;
}

.stats-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stats-num {
	font-size: 48rpx;
	font-weight: bold;
	color: #6366F1;
}

.stats-label {
	font-size: 26rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
}

.stats-divider {
	width: 1rpx;
	height: 60rpx;
	background: $app-border;
}

/* 用药列表 */
.med-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.med-item {
	padding: 0;
	overflow: hidden;
}

.med-header {
	display: flex;
	align-items: center;
	padding: 24rpx 28rpx;
	border-bottom: 1rpx solid $app-border;
}

.patient-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	margin-right: 20rpx;
}

.patient-info {
	flex: 1;
}

.patient-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.patient-name {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
}

.patient-meta {
	font-size: 24rpx;
	color: $app-text-muted;
}

.patient-disease {
	font-size: 22rpx;
	color: #6366F1;
	background: rgba(99, 102, 241, 0.1);
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	margin-top: 8rpx;
	display: inline-block;
}

.med-content {
	padding: 20rpx 28rpx;
}

.med-row {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;
}

.med-icon-wrap {
	width: 48rpx;
	height: 48rpx;
	border-radius: 12rpx;
	background: rgba(99, 102, 241, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
}

.med-icon-wrap .app-icon {
	font-size: 24rpx;
	color: #6366F1;
}

.med-detail {
	flex: 1;
}

.med-name {
	font-size: 28rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
}

.med-dosage {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
}

.med-freq, .med-duration {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 24rpx;
	color: $app-text-secondary;
	margin-top: 8rpx;
}

.med-freq .app-icon, .med-duration .app-icon {
	color: $app-text-muted !important;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
}

.empty-state .app-icon {
	font-size: 80rpx !important;
	color: #D1D5DB !important;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: $app-text-muted;
}

/* 添加按钮 */
.add-btn {
	position: fixed;
	right: 40rpx;
	bottom: 140rpx;
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.4);
}

.add-btn .app-icon {
	font-size: 48rpx !important;
	color: #fff !important;
}
</style>