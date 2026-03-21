<template>
	<view class="container">
		<!-- 添加按钮 -->
		<view class="add-bar">
			<view class="add-btn" @click="navTo('/pages/patient/add-visit/add-visit')">
				<text class="app-icon uniui-plus"></text>
				<text>添加就诊记录</text>
			</view>
		</view>

		<!-- 筛选标签 -->
		<view class="filter-tabs">
			<view class="filter-tab" :class="{ active: currentType === '' }" @click="currentType = ''">全部</view>
			<view class="filter-tab" :class="{ active: currentType === '门诊病历' }" @click="currentType = '门诊病历'">门诊</view>
			<view class="filter-tab" :class="{ active: currentType === '住院病历' }" @click="currentType = '住院病历'">住院</view>
			<view class="filter-tab" :class="{ active: currentType === '外院病历' }" @click="currentType = '外院病历'">外院</view>
		</view>

		<!-- 就诊列表 -->
		<view class="empty card" v-if="filteredList.length === 0">
			<text class="empty-tip">暂无就诊记录</text>
			<text class="empty-desc">点击上方按钮添加就诊记录</text>
		</view>
		<view class="card item" v-for="(item, i) in filteredList" :key="i" @click="viewDetail(item)">
			<view class="item-head">
				<view class="item-type" :class="getTypeClass(item.type)">{{ item.type }}</view>
				<text class="date">{{ item.date }}</text>
			</view>
			<view class="item-body">
				<text class="label">医院：</text><text class="value">{{ item.hospital }}</text>
			</view>
			<view class="item-body">
				<text class="label">科室：</text><text class="value">{{ item.department }}</text>
			</view>
			<view class="item-body">
				<text class="label">诊断：</text><text class="value highlight">{{ item.diagnosis }}</text>
			</view>
			<view class="item-body" v-if="item.doctorName">
				<text class="label">医生：</text><text class="value">{{ item.doctorName }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getMedicalRecordList } from '@/api/medicalRecord.js'

export default {
	data() {
		return {
			list: [],
			currentType: ''
		}
	},
	computed: {
		filteredList() {
			if (!this.currentType) return this.list
			return this.list.filter(item => item.type === this.currentType)
		}
	},
	onShow() {
		this.loadData()
	},
	methods: {
		async loadData() {
			try {
				const res = await getMedicalRecordList({ pageNum: 1, pageSize: 100 })
				if (res && res.list) {
					this.list = res.list.map(r => ({
						id: r.id,
						type: r.type || '门诊病历',
						date: this.formatDateStr(r.date),
						hospital: r.hospital || '',
						department: r.department || '',
						doctorName: r.doctorName || '',
						diagnosis: r.diagnosis || '',
						content: r.content || ''
					}))
				}
			} catch (e) {
				console.error('加载就诊记录失败:', e)
				// 使用模拟数据
				this.list = [
					{ id: 1, type: '门诊病历', date: '2024-08-09', hospital: 'XX医院', department: '神经内科', diagnosis: '神经免疫相关随访', doctorName: '张哲瀚' },
					{ id: 2, type: '门诊病历', date: '2024-05-15', hospital: 'XX医院', department: '神经内科', diagnosis: '多发性硬化初诊', doctorName: '张哲瀚' }
				]
			}
		},
		formatDateStr(date) {
			if (!date) return ''
			return date.split('T')[0].split(' ')[0]
		},
		getTypeClass(type) {
			const map = {
				'门诊病历': 'type-outpatient',
				'住院病历': 'type-inpatient',
				'外院病历': 'type-external'
			}
			return map[type] || 'type-outpatient'
		},
		navTo(url) {
			uni.navigateTo({ url })
		},
		viewDetail(item) {
			uni.showToast({ title: item.diagnosis, icon: 'none' })
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
	padding-bottom: 60rpx;
}

.add-bar {
	margin-bottom: 24rpx;
}

.add-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	padding: 24rpx;
	background: $app-primary;
	border-radius: $app-radius;
	color: #fff;
	font-size: 30rpx;
	font-weight: 500;
}

.add-btn .app-icon {
	font-size: 36rpx;
}

.filter-tabs {
	display: flex;
	gap: 16rpx;
	margin-bottom: 24rpx;
	padding: 0 8rpx;
}

.filter-tab {
	padding: 12rpx 24rpx;
	background: $app-card-bg;
	border-radius: 32rpx;
	font-size: 26rpx;
	color: $app-text-secondary;
}

.filter-tab.active {
	background: $app-primary;
	color: #fff;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	margin-bottom: 24rpx;
	box-shadow: $app-shadow;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	display: block;
	text-align: center;
}

.empty-desc {
	font-size: 24rpx;
	color: $app-text-muted;
	display: block;
	text-align: center;
	margin-top: 8rpx;
}

.item-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.item-type {
	font-size: 24rpx;
	padding: 6rpx 16rpx;
	border-radius: 8rpx;
}

.item-type.type-outpatient {
	background: #DBEAFE;
	color: #3B82F6;
}

.item-type.type-inpatient {
	background: #FEE2E2;
	color: #EF4444;
}

.item-type.type-external {
	background: #FEF3C7;
	color: #F59E0B;
}

.date {
	font-size: 26rpx;
	color: $app-text-muted;
}

.item-body {
	font-size: 28rpx;
	color: $app-text-secondary;
	margin-bottom: 8rpx;
	display: flex;
}

.item-body .label {
	color: $app-text-muted;
	min-width: 100rpx;
}

.item-body .value {
	color: $app-text;
	flex: 1;
}

.item-body .highlight {
	color: $app-primary;
	font-weight: 500;
}
</style>