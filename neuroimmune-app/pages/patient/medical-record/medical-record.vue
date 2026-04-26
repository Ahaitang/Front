<template>
	<view class="container">
		<!-- 时间筛选器 -->
		<view class="filter-bar card">
			<view class="filter-row">
				<text class="filter-label">时间范围</text>
				<picker mode="date" :value="startDate" @change="onStartDateChange">
					<view class="picker-btn">{{ startDate || '开始日期' }}</view>
				</picker>
				<text class="filter-sep">至</text>
				<picker mode="date" :value="endDate" @change="onEndDateChange">
					<view class="picker-btn">{{ endDate || '结束日期' }}</view>
				</picker>
			</view>
			<view class="filter-actions">
				<text class="filter-btn" @click="resetFilter">重置</text>
				<text class="filter-btn primary" @click="applyFilter">查询</text>
			</view>
		</view>

		<!-- 本院病历 -->
		<view class="section card">
			<view class="section-header">
				<text class="section-title">本院病历</text>
				<text class="add-btn" @click="navTo('/pages/patient/upload-external/upload-external')">+上传</text>
			</view>
			<text class="empty-tip" v-if="!hospitalRecords.length">暂无本院病历</text>
			<view class="record-item" v-for="(item, i) in hospitalRecords" :key="i">
				<view class="record-head">
					<view class="record-left">
						<text class="record-type">{{ item.type || '门诊病历' }}</text>
						<text class="record-date">{{ item.date }}</text>
					</view>
					<view class="record-actions">
						<text class="action-btn edit" @click="editHospitalRecord(item)">编辑</text>
						<text class="action-btn delete" @click="deleteHospitalRecord(item)">删除</text>
					</view>
				</view>
				<view class="record-body" @click="showRecordDetail(item, 'hospital')">
					<view class="record-info" v-if="item.department || item.doctorName">
						<text class="info-tag" v-if="item.department">{{ item.department }}</text>
						<text class="info-tag" v-if="item.doctorName">{{ item.doctorName }}</text>
					</view>
					<text class="record-diagnosis" v-if="item.diagnosis">诊断：{{ item.diagnosis }}</text>
					<text class="record-content">{{ item.content || '无内容' }}</text>
				</view>
			</view>
		</view>

		<!-- 外院病历 -->
		<view class="section card">
			<view class="section-header">
				<text class="section-title">外院病历</text>
				<text class="add-btn" @click="navTo('/pages/patient/upload-external/upload-external?type=外院病历')">+上传</text>
			</view>
			<text class="empty-tip" v-if="!externalRecords.length">暂无外院病历</text>
			<view class="external-item" v-for="(item, i) in externalRecords" :key="i">
				<view class="external-head">
					<text class="external-date">{{ item.date }}</text>
					<view class="external-actions">
						<text class="action-btn edit" @click="editExternal(item)">编辑</text>
						<text class="action-btn delete" @click="deleteExternal(item)">删除</text>
					</view>
				</view>
				<view class="external-body" @click="showRecordDetail(item, 'external')">
					<text class="external-hospital" v-if="item.hospital">{{ item.hospital }}</text>
					<view class="external-info" v-if="item.department || item.doctorName">
						<text class="info-tag" v-if="item.department">{{ item.department }}</text>
						<text class="info-tag" v-if="item.doctorName">{{ item.doctorName }}医生</text>
					</view>
					<text class="external-diagnosis" v-if="item.diagnosis">诊断：{{ item.diagnosis }}</text>
					<text class="external-content">{{ item.content || item.notes || '无内容' }}</text>
					<view class="external-images" v-if="item.attachments">
						<image v-for="(img, idx) in item.attachments.split(',')" :key="idx" :src="img" mode="aspectFill" class="thumb-img" @click.stop="previewImage(img, item.attachments)" />
					</view>
				</view>
			</view>
		</view>

		<!-- 详情弹窗 -->
		<uni-popup ref="detailPopup" type="bottom" :safe-area="true" background-color="transparent">
			<view class="detail-popup">
				<view class="popup-header">
					<text class="popup-title">{{ detailData.recordType === 'external' ? '外院病历详情' : '本院病历详情' }}</text>
					<view class="popup-close" @click="closeDetailPopup">
						<uni-icons type="close" size="24" color="#9CA3AF"></uni-icons>
					</view>
				</view>

				<view class="popup-body">
					<!-- 基本信息 -->
					<view class="detail-section">
						<view class="detail-row">
							<text class="detail-label">就诊日期</text>
							<text class="detail-value">{{ detailData.date || '未知' }}</text>
						</view>
						<view class="detail-row" v-if="detailData.recordType === 'hospital'">
							<text class="detail-label">病历类型</text>
							<text class="detail-value">{{ detailData.type || '门诊病历' }}</text>
						</view>
						<view class="detail-row" v-if="detailData.hospital">
							<text class="detail-label">就诊医院</text>
							<text class="detail-value highlight">{{ detailData.hospital }}</text>
						</view>
						<view class="detail-row" v-if="detailData.department">
							<text class="detail-label">科室</text>
							<text class="detail-value">{{ detailData.department }}</text>
						</view>
						<view class="detail-row" v-if="detailData.doctorName">
							<text class="detail-label">医生</text>
							<text class="detail-value">{{ detailData.doctorName }}</text>
						</view>
					</view>

					<!-- 诊断信息 -->
					<view class="detail-section" v-if="detailData.diagnosis">
						<view class="section-label">
							<uni-icons type="medal" size="18" color="#0891B2"></uni-icons>
							<text class="section-label-text">诊断结果</text>
						</view>
						<view class="diagnosis-box">
							<text class="diagnosis-text">{{ detailData.diagnosis }}</text>
						</view>
					</view>

					<!-- 病历内容 -->
					<view class="detail-section">
						<view class="section-label">
							<uni-icons type="list" size="18" color="#0891B2"></uni-icons>
							<text class="section-label-text">病历内容</text>
						</view>
						<view class="content-box">
							<text class="content-text">{{ detailData.content || detailData.notes || '暂无内容' }}</text>
						</view>
					</view>

					<!-- 附件图片 -->
					<view class="detail-section" v-if="detailData.attachments">
						<view class="section-label">
							<uni-icons type="image" size="18" color="#0891B2"></uni-icons>
							<text class="section-label-text">附件图片</text>
						</view>
						<view class="attachment-grid">
							<image
								v-for="(img, idx) in detailData.attachments.split(',')"
								:key="idx"
								:src="img"
								mode="aspectFill"
								class="attachment-img"
								@click="previewImage(img, detailData.attachments)"
							/>
						</view>
					</view>
				</view>

				<view class="popup-footer">
					<view class="footer-btn edit" @click="editFromPopup">
						<uni-icons type="compose" size="20" color="#0891B2"></uni-icons>
						<text class="footer-btn-text">编辑</text>
					</view>
					<view class="footer-btn delete" @click="deleteFromPopup">
						<uni-icons type="trash" size="20" color="#EF4444"></uni-icons>
						<text class="footer-btn-text delete-text">删除</text>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import { getMedicalRecordList, deleteMedicalRecord } from '@/api/medicalRecord.js'

export default {
	data() {
		return {
			startDate: '',
			endDate: '',
			hospitalRecords: [],
			externalRecords: [],
			detailData: {
				id: '',
				date: '',
				type: '',
				hospital: '',
				department: '',
				doctorName: '',
				diagnosis: '',
				content: '',
				notes: '',
				attachments: '',
				recordType: 'hospital' // hospital 或 external
			}
		};
	},
	onLoad() {
		this.loadData();
	},
	methods: {
		onStartDateChange(e) {
			this.startDate = e.detail.value
		},
		onEndDateChange(e) {
			this.endDate = e.detail.value
		},
		resetFilter() {
			this.startDate = ''
			this.endDate = ''
			this.loadData()
		},
		applyFilter() {
			this.loadData()
		},
		async loadData() {
			try {
				const params = { pageNum: 1, pageSize: 50 }
				if (this.startDate) params.startDate = this.startDate
				if (this.endDate) params.endDate = this.endDate
				const res = await getMedicalRecordList(params)

				if (res && res.list) {
					const allRecords = res.list.map(r => ({
						id: r.id,
						date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : r.date) : '',
						type: r.type || '',
						hospital: r.hospital || '',
						department: r.department || '',
						doctorName: r.doctorName || '',
						diagnosis: r.diagnosis || '',
						content: r.content || '',
						notes: r.notes || '',
						attachments: r.attachments || ''
					}))

					this.externalRecords = allRecords.filter(r => r.type === '外院病历')
					this.hospitalRecords = allRecords.filter(r => r.type !== '外院病历')
				}
			} catch (e) {
				console.log('获取病历记录失败');
			}
		},
		navTo(url) {
			uni.navigateTo({ url });
		},
		showRecordDetail(item, recordType) {
			this.detailData = {
				...item,
				recordType: recordType
			}
			this.$refs.detailPopup.open()
		},
		closeDetailPopup() {
			this.$refs.detailPopup.close()
		},
		editFromPopup() {
			this.closeDetailPopup()
			const url = '/pages/patient/upload-external/upload-external?id=' + this.detailData.id +
				(this.detailData.type ? '&type=' + this.detailData.type : '')
			uni.navigateTo({ url })
		},
		deleteFromPopup() {
			this.closeDetailPopup()
			const title = this.detailData.recordType === 'external' ? '外院病历' : '本院病历'
			uni.showModal({
				title: '确认删除',
				content: `确定要删除这条${title}吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							await deleteMedicalRecord(this.detailData.id)
							uni.showToast({ title: '删除成功', icon: 'success' })
							this.loadData()
						} catch (e) {
							uni.showToast({ title: '删除失败', icon: 'none' })
						}
					}
				}
			})
		},
		previewImage(current, attachments) {
			const urls = attachments.split(',').filter(url => url)
			uni.previewImage({
				current: current,
				urls: urls
			})
		},
		editExternal(item) {
			uni.navigateTo({
				url: '/pages/patient/upload-external/upload-external?id=' + item.id
			})
		},
		deleteExternal(item) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条外院病历吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await deleteMedicalRecord(item.id)
							uni.showToast({ title: '删除成功', icon: 'success' })
							this.loadData()
						} catch (e) {
							uni.showToast({ title: '删除失败', icon: 'none' })
						}
					}
				}
			})
		},
		editHospitalRecord(item) {
			uni.navigateTo({
				url: '/pages/patient/upload-external/upload-external?id=' + item.id + '&type=' + (item.type || '门诊病历')
			})
		},
		deleteHospitalRecord(item) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条本院病历吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await deleteMedicalRecord(item.id)
							uni.showToast({ title: '删除成功', icon: 'success' })
							this.loadData()
						} catch (e) {
							uni.showToast({ title: '删除失败', icon: 'none' })
						}
					}
				}
			})
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
	padding-bottom: 80rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: $app-spacing-md;
	margin-bottom: $app-spacing-md;
	box-shadow: $app-shadow;
}

.filter-bar {
	padding: $app-spacing-sm $app-spacing-md;
}

.filter-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: $app-spacing-sm;
}

.filter-label {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
}

.filter-sep {
	font-size: 28rpx;
	color: $app-text-muted;
	margin: 0 8rpx;
}

.picker-btn {
	font-size: 26rpx;
	color: $app-text;
	background: $app-hover-bg;
	padding: 14rpx 24rpx;
	border-radius: $app-radius-sm;
	min-width: 160rpx;
	text-align: center;
	transition: $app-transition;
}

.picker-btn:active {
	background: #EBEDEF;
}

.filter-actions {
	display: flex;
	justify-content: flex-end;
	gap: $app-spacing-md;
	margin-top: $app-spacing-md;
}

.filter-btn {
	font-size: 28rpx;
	color: $app-text-muted;
	padding: 8rpx 16rpx;
	transition: $app-transition;
}

.filter-btn:active {
	opacity: 0.7;
}

.filter-btn.primary {
	color: $app-primary;
	font-weight: 600;
}

.section-title {
	font-size: 34rpx;
	font-weight: 700;
	color: $app-text;
	margin-bottom: $app-spacing-md;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	text-align: center;
	padding: 32rpx 0;
}

/* 本院病历样式 */
.record-item {
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	padding: $app-spacing-md;
	margin-bottom: $app-spacing-sm;
	transition: $app-transition;
}

.record-item:active {
	background: #EBEDEF;
}

.record-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
}

.record-left {
	display: flex;
	align-items: center;
	gap: $app-spacing-sm;
}

.record-type {
	font-size: 24rpx;
	color: #fff;
	background: $app-primary;
	padding: 8rpx 18rpx;
	border-radius: 8rpx;
	font-weight: 500;
}

.record-date {
	font-size: 26rpx;
	color: $app-text-muted;
}

.record-actions {
	display: flex;
	gap: $app-spacing-md;
}

.record-body {
	margin-top: 10rpx;
}

.record-info {
	display: flex;
	gap: $app-spacing-sm;
	margin-bottom: 10rpx;
}

.record-diagnosis {
	font-size: 30rpx;
	color: $app-text;
	margin-bottom: 10rpx;
	font-weight: 500;
}

.record-content {
	font-size: 28rpx;
	color: $app-text-secondary;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $app-spacing-md;
}

.add-btn {
	font-size: 26rpx;
	color: $app-primary;
	font-weight: 500;
	padding: 8rpx 16rpx;
	background: $app-primary-bg;
	border-radius: 20rpx;
	transition: $app-transition;
}

.add-btn:active {
	background: rgba(8, 145, 178, 0.15);
}

.external-item {
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	padding: $app-spacing-md;
	margin-bottom: $app-spacing-sm;
	transition: $app-transition;
}

.external-item:active {
	background: #EBEDEF;
}

.external-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
}

.external-date {
	font-size: 26rpx;
	color: $app-text-muted;
}

.external-actions {
	display: flex;
	gap: $app-spacing-md;
}

.action-btn {
	font-size: 24rpx;
	padding: 8rpx 20rpx;
	border-radius: 8rpx;
	font-weight: 500;
	transition: $app-transition;
}

.action-btn:active {
	opacity: 0.8;
}

.action-btn.edit {
	color: $app-primary;
	background: $app-primary-bg;
}

.action-btn.delete {
	color: $app-error;
	background: $app-error-bg;
}

.external-body {
	margin-top: 10rpx;
}

.external-hospital {
	font-size: 28rpx;
	color: $app-primary;
	display: block;
	margin-bottom: 10rpx;
	font-weight: 500;
}

.external-info {
	display: flex;
	gap: $app-spacing-sm;
	margin-bottom: 10rpx;
}

.info-tag {
	font-size: 24rpx;
	color: $app-text-secondary;
	background: $app-primary-bg;
	padding: 6rpx 16rpx;
	border-radius: 8rpx;
}

.external-diagnosis {
	font-size: 30rpx;
	color: $app-text;
	margin-bottom: 10rpx;
	font-weight: 500;
}

.external-content {
	font-size: 28rpx;
	color: $app-text-secondary;
	line-height: 1.6;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.external-images {
	display: flex;
	gap: $app-spacing-sm;
	margin-top: $app-spacing-sm;
	flex-wrap: wrap;
}

.thumb-img {
	width: 120rpx;
	height: 120rpx;
	border-radius: $app-radius-sm;
	border: 2rpx solid $app-border;
}

/* 详情弹窗样式 */
.detail-popup {
	background: $app-card-bg;
	border-radius: 32rpx 32rpx 0 0;
	max-height: 80vh;
	overflow: hidden;
}

.popup-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32rpx;
	border-bottom: 1rpx solid $app-divider;
}

.popup-title {
	font-size: 36rpx;
	font-weight: 700;
	color: $app-text;
}

.popup-close {
	padding: 8rpx;
}

.popup-body {
	padding: 24rpx 32rpx;
	max-height: 60vh;
	overflow-y: auto;
}

.detail-section {
	margin-bottom: 24rpx;
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid $app-divider;
}

.detail-row:last-child {
	border-bottom: none;
}

.detail-label {
	font-size: 28rpx;
	color: $app-text-muted;
}

.detail-value {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
}

.detail-value.highlight {
	color: $app-primary;
}

.section-label {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.section-label-text {
	font-size: 30rpx;
	font-weight: 600;
	color: $app-text;
}

.diagnosis-box {
	background: $app-primary-bg;
	border-radius: $app-radius;
	padding: 20rpx;
	border-left: 6rpx solid $app-primary;
}

.diagnosis-text {
	font-size: 28rpx;
	color: $app-text;
	line-height: 1.6;
}

.content-box {
	background: $app-hover-bg;
	border-radius: $app-radius;
	padding: 20rpx;
}

.content-text {
	font-size: 28rpx;
	color: $app-text-secondary;
	line-height: 1.8;
}

.attachment-grid {
	display: flex;
	gap: 16rpx;
	flex-wrap: wrap;
}

.attachment-img {
	width: 180rpx;
	height: 180rpx;
	border-radius: $app-radius;
	border: 2rpx solid $app-border;
}

.popup-footer {
	display: flex;
	gap: 24rpx;
	padding: 24rpx 32rpx;
	border-top: 1rpx solid $app-divider;
	background: $app-card-bg;
}

.footer-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	padding: 24rpx;
	border-radius: $app-radius;
	background: $app-primary-bg;
	transition: $app-transition;
}

.footer-btn:active {
	opacity: 0.8;
}

.footer-btn-text {
	font-size: 30rpx;
	color: $app-primary;
	font-weight: 500;
}

.footer-btn.delete {
	background: $app-error-bg;
}

.footer-btn-text.delete-text {
	color: $app-error;
}
</style>