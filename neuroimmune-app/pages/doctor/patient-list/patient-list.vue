<template>
		<view class="container">
			<!-- 搜索栏 -->
			<view class="search-bar">
				<text class="app-icon uniui-search"></text>
				<input class="search-input" type="text" placeholder="搜索患者姓名或疾病类型" v-model="keyword" />
				<text class="search-btn">搜索</text>
				<view class="add-btn" @click="navTo('/pages/doctor/add-patient/add-patient')">
					<text class="app-icon uniui-plus-filled"></text>
				</view>
			</view>

			<!-- 状态Tab -->
			<view class="status-tabs">
				<view class="tab" :class="{ active: statusTab === 'confirmed' }" @click="switchTab('confirmed')">
					已绑定
					<text class="count" v-if="confirmedCount > 0">{{ confirmedCount }}</text>
				</view>
				<view class="tab" :class="{ active: statusTab === 'pending' }" @click="switchTab('pending')">
					待确认
					<text class="count pending" v-if="pendingCount > 0">{{ pendingCount }}</text>
				</view>
				<view class="tab" :class="{ active: statusTab === 'rejected' }" @click="switchTab('rejected')">
					已拒绝
					<text class="count" v-if="rejectedCount > 0">{{ rejectedCount }}</text>
				</view>
			</view>

			<!-- 疾病类型筛选（展开面板） -->
			<view class="disease-filter" v-if="statusTab === 'confirmed' && diseaseDictList.length > 0">
				<view class="filter-trigger" @click="showFilterPanel = !showFilterPanel">
					<text class="trigger-text">筛选疾病类型</text>
					<text class="app-icon" :class="showFilterPanel ? 'uniui-up' : 'uniui-down'"></text>
					<text class="selected-count" v-if="selectedDiseaseTypes.length > 0">
						已选 {{ selectedDiseaseTypes.length }} 项
					</text>
				</view>

				<view class="filter-panel" v-if="showFilterPanel">
					<view class="checkbox-list">
						<view class="checkbox-item" v-for="item in diseaseDictList" :key="item.code"
							@click="toggleDiseaseType(item.code)">
							<view class="checkbox-box" :class="{ checked: selectedDiseaseTypes.includes(item.code) }">
								<text class="app-icon uniui-checkmarkempty" v-if="selectedDiseaseTypes.includes(item.code)"></text>
							</view>
							<text class="checkbox-label">{{ item.name }}</text>
						</view>
					</view>

					<view class="filter-actions">
						<view class="action-btn text" @click="selectAllDiseaseTypes">全选</view>
						<view class="action-btn text" @click="clearDiseaseTypes">清空</view>
						<view class="action-btn primary" @click="applyDiseaseFilter">应用筛选</view>
					</view>
				</view>
			</view>

			<!-- 统计信息 -->
			<view class="stats-row">
				<text class="stats-text">共 {{ filteredList.length }} 位患者</text>
			</view>

			<!-- 患者列表 -->
			<view class="patient-list">
				<view class="patient-card" v-for="(item, i) in filteredList" :key="i" @click="statusTab === 'confirmed' ? goPatientDetail(item.id) : null">
					<view class="card-header">
						<view class="avatar-wrap">
							<text class="avatar-text">{{ item.name.charAt(0) }}</text>
						</view>
						<view class="patient-meta">
							<text class="patient-name">{{ item.name }}</text>
							<view class="disease-tags">
								<text class="disease-tag" v-for="(tag, idx) in item.diseaseLabels" :key="idx">{{ tag }}</text>
							</view>
						</view>
						<view class="patient-basic">
							<text class="basic-text">{{ item.gender }} | {{ item.age }}岁</text>
						</view>
					</view>
					<view class="card-body" v-if="statusTab === 'confirmed'">
						<view class="info-row">
							<view class="info-item">
								<text class="app-icon uniui-calendar-filled"></text>
								<text class="info-label">随访</text>
								<text class="info-value">{{ item.followUpCount }}次</text>
							</view>
							<view class="info-item">
								<text class="app-icon uniui-compose"></text>
								<text class="info-label">用药</text>
								<text class="info-value">{{ item.medicationCount }}条</text>
							</view>
							<view class="info-item">
								<text class="app-icon uniui-folder-add-filled"></text>
								<text class="info-label">病历</text>
								<text class="info-value">{{ item.recordCount }}份</text>
							</view>
							<view class="info-item">
								<text class="app-icon uniui-pulse"></text>
								<text class="info-label">发作</text>
								<text class="info-value">{{ item.episodeCount }}次</text>
							</view>
						</view>
					</view>
					<!-- 待确认状态显示操作按钮 -->
					<view class="card-footer pending-actions" v-if="statusTab === 'pending'">
						<view class="action-btn confirm" @click.stop="handleConfirm(item.relationId)">
							<text class="app-icon uniui-checkmarkempty"></text>
							<text>确认</text>
						</view>
						<view class="action-btn reject" @click.stop="handleReject(item.relationId)">
							<text class="app-icon uniui-closeempty"></text>
							<text>拒绝</text>
						</view>
					</view>
					<!-- 已绑定状态显示原有操作 -->
					<view class="card-footer" v-if="statusTab === 'confirmed'">
						<view class="action-btn primary" @click.stop="navTo('/pages/doctor/add-follow/add-follow?patientId=' + item.id + '&patientName=' + encodeURIComponent(item.name))">
							<text class="app-icon uniui-plus-filled"></text>
							<text>随访</text>
						</view>
						<view class="action-btn" @click.stop="callPatient(item.phone)">
							<text class="app-icon uniui-phone"></text>
							<text>电话</text>
						</view>
					</view>
					<!-- 已拒绝状态不显示操作按钮 -->
				</view>

				<!-- 空状态 -->
				<view class="empty-state" v-if="!filteredList.length">
					<text class="app-icon empty-icon uniui-contact-filled"></text>
					<text class="empty-text">{{ emptyText }}</text>
				</view>
			</view>
		</view>
	</template>

	<script>
	import { getMyPatients } from '@/api/patient.js'
	import { getFollowUpList } from '@/api/followup.js'
	import { getMedicationList } from '@/api/medication.js'
	import { getMedicalRecordList } from '@/api/medicalRecord.js'
	import { getEpisodesByPatient } from '@/api/episode.js'
	import { getPendingPatients, getRejectedPatients, confirmRelation, rejectRelation } from '@/api/auth.js'
	import { getDictByType } from '@/api/dict.js'

	export default {
		data() {
			return {
				keyword: '',
				filterType: 'all',  // 保留用于兼容，但不再使用
				showMoreTypes: false,  // 保留用于兼容，但不再使用
				statusTab: 'confirmed',
				patientList: [],
				pendingList: [],
				rejectedList: [],
				// 新增字段
				diseaseDictList: [],      // 疾病类型字典列表
				selectedDiseaseTypes: [], // 已选中的疾病类型code数组
				showFilterPanel: false,   // 展开面板显示状态
			}
		},
		computed: {
			confirmedCount() {
				return this.patientList.length
			},
			pendingCount() {
				return this.pendingList.length
			},
			rejectedCount() {
				return this.rejectedList.length
			},
			filteredList() {
				let list = []
				if (this.statusTab === 'pending') {
					list = this.pendingList
				} else if (this.statusTab === 'rejected') {
					list = this.rejectedList
				} else {
					list = this.patientList
				}

				// 仅保留关键词筛选（疾病类型筛选已由后端处理）
				if (this.keyword) {
					const k = this.keyword.toLowerCase()
					list = list.filter(item =>
						item.name.toLowerCase().includes(k) ||
						(item.diseaseLabels && item.diseaseLabels.some(label => label.toLowerCase().includes(k)))
					)
				}

				return list
			},
			emptyText() {
				if (this.statusTab === 'pending') {
					return '暂无待确认患者'
				} else if (this.statusTab === 'rejected') {
					return '暂无已拒绝患者'
				} else {
					return '暂无患者记录'
				}
			}
		},
		onShow() {
			this.loadDiseaseDict()
			this.loadData()
			this.loadPendingPatients()
		},
		methods: {
			async switchTab(tab) {
				this.statusTab = tab
				this.filterType = 'all'
				this.showMoreTypes = false
				this.showFilterPanel = false
				if (tab === 'pending') {
					await this.loadPendingPatients()
				} else if (tab === 'rejected') {
					await this.loadRejectedPatients()
				}
			},

			// 加载疾病类型字典
			async loadDiseaseDict() {
				try {
					const res = await getDictByType('disease')
					this.diseaseDictList = (res || []).filter(d => d.isActive === 1)
				} catch (e) {
					console.error('加载疾病类型字典失败:', e)
					this.diseaseDictList = []
				}
			},

			// 切换疾病类型选中状态
			toggleDiseaseType(code) {
				const idx = this.selectedDiseaseTypes.indexOf(code)
				if (idx > -1) {
					this.selectedDiseaseTypes.splice(idx, 1)
				} else {
					this.selectedDiseaseTypes.push(code)
				}
			},

			// 全选疾病类型
			selectAllDiseaseTypes() {
				this.selectedDiseaseTypes = this.diseaseDictList.map(d => d.code)
			},

			// 清空疾病类型选择
			clearDiseaseTypes() {
				this.selectedDiseaseTypes = []
			},

			// 应用疾病类型筛选
			async applyDiseaseFilter() {
				this.showFilterPanel = false
				await this.loadData()
			},

			async loadPendingPatients() {
				const userInfo = uni.getStorageSync('userInfo')
				const doctorId = userInfo?.id
				if (!doctorId) return

				try {
					const res = await getPendingPatients(doctorId)
					this.pendingList = (res || []).map(p => ({
						relationId: p.relationId,
						id: p.patientId,
						name: p.name || '患者',
						gender: p.gender === 'male' ? '男' : (p.gender === 'female' ? '女' : p.gender || '未知'),
						age: p.age || '-',
						phone: p.phone || '',
						requestTime: p.requestTime,
						diseaseLabels: ['新注册'],
						diseaseTypes: []
					}))
				} catch (e) {
					console.error('加载待确认患者失败:', e)
				}
			},

			async loadRejectedPatients() {
				const userInfo = uni.getStorageSync('userInfo')
				const doctorId = userInfo?.id
				if (!doctorId) return

				try {
					const res = await getRejectedPatients(doctorId)
					this.rejectedList = (res || []).map(p => ({
						relationId: p.relationId,
						id: p.patientId,
						name: p.name || '患者',
						gender: p.gender === 'male' ? '男' : (p.gender === 'female' ? '女' : p.gender || '未知'),
						age: p.age || '-',
						phone: p.phone || '',
						diseaseLabels: ['已拒绝'],
						diseaseTypes: []
					}))
				} catch (e) {
					console.error('加载已拒绝患者失败:', e)
				}
			},

			async handleConfirm(relationId) {
				try {
					await confirmRelation(relationId)
					uni.showToast({ title: '已确认绑定', icon: 'success' })
					await this.loadPendingPatients()
					await this.loadData()
				} catch (e) {
					uni.showToast({ title: '确认失败', icon: 'none' })
				}
			},

			async handleReject(relationId) {
				uni.showModal({
					title: '确认拒绝',
					content: '拒绝后患者将无法登录，确定拒绝？',
					success: async (res) => {
						if (res.confirm) {
							try {
								await rejectRelation(relationId)
								uni.showToast({ title: '已拒绝', icon: 'none' })
								await this.loadPendingPatients()
								await this.loadRejectedPatients()
							} catch (e) {
								uni.showToast({ title: '拒绝失败', icon: 'none' })
							}
						}
					}
				})
			},

			async loadData() {
				try {
					const params = { pageNum: 1, pageSize: 100 }
					// 如果有选中的疾病类型，传递给后端
					if (this.selectedDiseaseTypes.length > 0) {
						params.diseaseTypes = this.selectedDiseaseTypes
					}
					const res = await getMyPatients(params)
					if (res && res.list) {
						this.patientList = res.list.map(p => ({
							id: p.id,
							name: p.name || '患者',
							gender: p.gender === 'male' ? '男' : (p.gender === 'female' ? '女' : p.gender || '未知'),
							age: p.age || '-',
							phone: p.phone || '',
							diseaseTypes: p.diseaseTypes || [],
							diseaseLabels: this.getDiseaseLabels(p.diseaseTypes),
							followUpCount: 0,
							medicationCount: 0,
							recordCount: 0,
							episodeCount: 0
						}))

						// 加载每个患者的统计数据
						for (let patient of this.patientList) {
							await this.loadPatientStats(patient)
						}
					}
				} catch (e) {
					console.error('加载患者列表失败:', e)
				}
			},
			async loadPatientStats(patient) {
				try {
					// 随访数量
					const followRes = await getFollowUpList({ pageNum: 1, pageSize: 1, patientId: patient.id })
					patient.followUpCount = followRes?.total || 0

					// 用药数量
					const medRes = await getMedicationList({ pageNum: 1, pageSize: 1, patientId: patient.id })
					patient.medicationCount = medRes?.total || 0

					// 病历数量
					const recordRes = await getMedicalRecordList({ pageNum: 1, pageSize: 1, patientId: patient.id })
					patient.recordCount = recordRes?.total || 0

					// 发作记录
					try {
						const episodeRes = await getEpisodesByPatient(patient.id)
						patient.episodeCount = episodeRes?.length || 0
					} catch (e) {
						patient.episodeCount = 0
					}
				} catch (e) {
					console.error('加载患者统计失败:', e)
				}
			},
			getDiseaseLabels(types) {
				if (!types || !types.length) return ['未分类']
				const labelMap = {
					'MS': 'MS',
					'NMOSD': 'NMOSD',
					'MG': 'MG',
					'MOGAD': 'MOGAD',
					'AUTO_ENCEPHALITIS': '自免脑',
					'GBS': 'GBS',
					'CIDP': 'CIDP',
					'OTHER': '其他'
				}
				return types.map(t => labelMap[t] || t).slice(0, 2)
			},
			goPatientDetail(id) {
				uni.navigateTo({ url: '/pages/doctor/patient-info/patient-info?id=' + id })
			},
			callPatient(phone) {
				if (phone) {
					uni.makePhoneCall({ phoneNumber: phone })
				} else {
					uni.showToast({ title: '暂无电话', icon: 'none' })
				}
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
		padding: 24rpx 24rpx 60rpx;
	}

	/* 搜索栏 */
	.search-bar {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 20rpx 24rpx;
		background: $app-card-bg;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		box-shadow: $app-shadow;
	}

	.search-bar .app-icon {
		font-size: 32rpx;
		color: $app-text-muted;
	}

	.search-input {
		flex: 1;
		font-size: 28rpx;
		color: $app-text;
	}

	.search-btn {
		font-size: 28rpx;
		color: $app-primary;
		padding: 0 16rpx;
	}

	.add-btn {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $app-primary;
		border-radius: 50%;
	}

	.add-btn .app-icon {
		font-size: 32rpx;
		color: #fff;
	}

	/* 状态Tab */
	.status-tabs {
		display: flex;
		gap: 16rpx;
		margin-bottom: 20rpx;
		background: $app-card-bg;
		padding: 16rpx 24rpx;
		border-radius: 16rpx;
		box-shadow: $app-shadow;
	}

	.tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 16rpx 24rpx;
		background: $app-hover-bg;
		border-radius: $app-radius-sm;
		font-size: 28rpx;
		color: $app-text-secondary;
	}

	.tab.active {
		background: $app-primary;
		color: #fff;
	}

	.count {
		font-size: 24rpx;
		padding: 4rpx 12rpx;
		background: rgba(0,0,0,0.1);
		border-radius: 12rpx;
	}

	.count.pending {
		background: $app-warning;
		color: #fff;
	}

	/* 疾病类型筛选展开面板 */
	.disease-filter {
		margin-bottom: 16rpx;
	}

	.filter-trigger {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 16rpx 24rpx;
		background: $app-card-bg;
		border-radius: 16rpx;
		box-shadow: $app-shadow;
	}

	.trigger-text {
		font-size: 28rpx;
		color: $app-text-secondary;
	}

	.filter-trigger .app-icon {
		font-size: 24rpx;
		color: $app-text-muted;
	}

	.selected-count {
		font-size: 24rpx;
		color: $app-primary;
		padding: 4rpx 12rpx;
		background: rgba(99, 102, 241, 0.1);
		border-radius: 12rpx;
	}

	.filter-panel {
		margin-top: 12rpx;
		padding: 20rpx;
		background: $app-card-bg;
		border-radius: 16rpx;
		box-shadow: $app-shadow;
	}

	.checkbox-list {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-bottom: 20rpx;
	}

	.checkbox-item {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 12rpx 16rpx;
		background: $app-hover-bg;
		border-radius: 12rpx;
	}

	.checkbox-box {
		width: 32rpx;
		height: 32rpx;
		border: 2rpx solid $app-border;
		border-radius: 6rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.checkbox-box.checked {
		background: $app-primary;
		border-color: $app-primary;
	}

	.checkbox-box .app-icon {
		font-size: 20rpx;
		color: #fff;
	}

	.checkbox-label {
		font-size: 26rpx;
		color: $app-text;
	}

	.filter-actions {
		display: flex;
		gap: 12rpx;
		justify-content: flex-end;
	}

	.filter-actions .action-btn {
		padding: 12rpx 20rpx;
		border-radius: 12rpx;
		font-size: 26rpx;
	}

	.filter-actions .action-btn.text {
		background: $app-hover-bg;
		color: $app-text-secondary;
	}

	.filter-actions .action-btn.primary {
		background: $app-primary;
		color: #fff;
	}

	.stats-row {
		margin-bottom: 16rpx;
		padding: 0 8rpx;
	}

	.stats-text {
		font-size: 26rpx;
		color: $app-text-muted;
	}

	/* 患者卡片 */
	.patient-card {
		background: $app-card-bg;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		box-shadow: $app-shadow;
	}

	.card-header {
		display: flex;
		align-items: center;
		padding: 24rpx;
		border-bottom: 1rpx solid $app-border;
	}

	.avatar-wrap {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
	}

	.avatar-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #fff;
	}

	.patient-meta {
		flex: 1;
	}

	.patient-name {
		font-size: 32rpx;
		font-weight: bold;
		color: $app-text;
		display: block;
	}

	.disease-tags {
		display: flex;
		gap: 8rpx;
		margin-top: 8rpx;
	}

	.disease-tag {
		font-size: 22rpx;
		color: #6366F1;
		background: rgba(99, 102, 241, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
	}

	.patient-basic {
		text-align: right;
	}

	.basic-text {
		font-size: 26rpx;
		color: $app-text-muted;
	}

	.card-body {
		padding: 20rpx 24rpx;
	}

	.info-row {
		display: flex;
		justify-content: space-around;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.info-item .app-icon {
		font-size: 24rpx;
		color: $app-text-muted;
	}

	.info-label {
		font-size: 24rpx;
		color: $app-text-muted;
	}

	.info-value {
		font-size: 24rpx;
		color: $app-text;
		font-weight: 500;
	}

	.card-footer {
		display: flex;
		gap: 16rpx;
		padding: 16rpx 24rpx;
		background: $app-bg;
	}

	.action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 16rpx;
		border-radius: 12rpx;
		font-size: 26rpx;
		background: $app-hover-bg;
		color: $app-text-secondary;
	}

	.action-btn .app-icon {
		font-size: 28rpx;
	}

	.action-btn.primary {
		background: #6366F1;
		color: #fff;
	}

	/* 待确认操作按钮 */
	.pending-actions {
		display: flex;
		gap: 16rpx;
	}

	.action-btn.confirm {
		background: $app-success;
		color: #fff;
	}

	.action-btn.reject {
		background: $app-error;
		color: #fff;
	}

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80rpx 0;
	}

	.empty-icon {
		font-size: 120rpx !important;
		color: $app-text-muted;
		opacity: 0.3;
		margin-bottom: 24rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: $app-text-muted;
	}
	</style>