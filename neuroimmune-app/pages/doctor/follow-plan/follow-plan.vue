<template>
	<view class="container">
		<view class="search-bar card">
			<input class="search-input" type="text" placeholder="搜索患者/随访计划" v-model="keyword" />
		</view>
		<view class="section card">
			<view class="section-title">待随访</view>
			<text class="empty-tip" v-if="!pendingList.length">暂无待随访</text>
			<view class="follow-item" v-for="(item, i) in pendingList" :key="i" @click="goPatient(item.patientId)">
				<view class="item-head">
					<text class="patient-name">{{ item.patientName }}</text>
					<text class="date">{{ item.date }}</text>
				</view>
				<view class="item-body">
					<text class="label">随访项目：</text><text class="value">{{ item.project }}</text>
				</view>
				<view class="item-actions">
					<button class="btn-mini primary" @click.stop="goPatient(item.patientId)">去随访</button>
					<button class="btn-mini" @click.stop="callPatient(item.phone)">电话</button>
				</view>
			</view>
		</view>
		<view class="section card">
			<view class="section-title">已随访</view>
			<text class="empty-tip" v-if="!completedList.length">暂无记录</text>
			<view class="follow-item" v-for="(item, i) in completedList" :key="i">
				<view class="item-head">
					<text class="patient-name">{{ item.patientName }}</text>
					<text class="date">{{ item.date }}</text>
				</view>
				<view class="item-body">
					<text class="label">随访项目：</text><text class="value">{{ item.project }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getFollowUpList } from '@/api/followup.js'

export default {
	data() {
		return {
			keyword: '',
			pendingList: [],
			completedList: []
		};
	},
	onShow() {
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				const res = await getFollowUpList({ pageNum: 1, pageSize: 100 });
				if (res && res.list) {
					this.pendingList = res.list
						.filter(f => f.status === 'pending' || f.status === '待随访')
						.map(f => ({
							id: f.id,
							patientId: f.patientId,
							patientName: f.patientName || '患者',
							date: f.followDate || f.date,
							project: f.project || f.content || '随访',
							phone: f.patientPhone || ''
						}));
					this.completedList = res.list
						.filter(f => f.status === 'completed' || f.status === '已完成')
						.map(f => ({
							id: f.id,
							patientName: f.patientName || '患者',
							date: f.followDate || f.date,
							project: f.project || f.content || '随访'
						}));
				}
			} catch (e) {
				console.error('加载随访列表失败:', e);
				// 使用模拟数据
				this.pendingList = [
					{ patientId: '1', patientName: '刘博超', date: '2025-02-28', project: '神经功能评估', phone: '183440293123' },
					{ patientId: '2', patientName: '张哲瀚', date: '2025-02-27', project: '复诊', phone: '' }
				];
				this.completedList = [
					{ patientName: '刘博超', date: '2025-02-20', project: '神经功能评估' }
				];
			}
		},
		goPatient(id) {
			uni.navigateTo({ url: '/pages/doctor/patient-info/patient-info?id=' + (id || '1') });
		},
		callPatient(phone) {
			if (phone) uni.makePhoneCall({ phoneNumber: phone });
			else uni.showToast({ title: '暂无电话', icon: 'none' });
		}
	}
};
</script>

<style lang="scss" scoped>
.container { min-height: 100vh; background: #F5F5F5; padding: 24rpx 24rpx 60rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 24rpx; }
.search-input { font-size: 28rpx; color: #333; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.empty-tip { font-size: 26rpx; color: #999; display: block; padding: 20rpx 0; }
.follow-item { background: #f8f8f8; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.item-head { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.patient-name { font-size: 30rpx; font-weight: bold; color: #333; }
.date { font-size: 26rpx; color: #999; }
.item-body { font-size: 28rpx; color: #666; margin-bottom: 12rpx; }
.item-body .label { margin-right: 8rpx; }
.item-actions { display: flex; gap: 16rpx; }
.btn-mini { font-size: 24rpx; padding: 10rpx 24rpx; border-radius: 8rpx; background: #f0f0f0; }
.btn-mini.primary { background: #007AFF; color: #fff; }
</style>