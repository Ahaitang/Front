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

		<view class="section card">
			<view class="section-title">基本信息</view>
			<view class="info-row"><text class="label">姓名</text><text class="value">{{ patient.name || '未填写' }}</text></view>
			<view class="info-row"><text class="label">性别</text><text class="value">{{ patient.gender || '未填写' }}</text></view>
			<view class="info-row"><text class="label">年龄</text><text class="value">{{ patient.age || '未填写' }}岁</text></view>
			<view class="info-row"><text class="label">出生日期</text><text class="value">{{ patient.birthday || '未填写' }}</text></view>
			<view class="info-row"><text class="label">身份证号</text><text class="value">{{ formatIdCard(patient.idCard) || '未填写' }}</text></view>
			<view class="info-row"><text class="label">手机号码</text><text class="value">{{ formatPhone(patient.phone) || '未填写' }}</text></view>
			<view class="info-row"><text class="label">紧急联系人</text><text class="value">{{ patient.emergencyContact || '未填写' }}</text></view>
		</view>
		<view class="section card">
			<view class="section-title">病历信息</view>
			<view class="info-row"><text class="label">主要诊断</text><text class="value">{{ record.diagnosis || '未填写' }}</text></view>
			<view class="info-row"><text class="label">初诊日期</text><text class="value">{{ record.firstDiagnosisDate || '未填写' }}</text></view>
			<view class="info-row"><text class="label">主治医生</text><text class="value">{{ record.doctorName || '未绑定' }}</text></view>
			<view class="info-row"><text class="label">科室</text><text class="value">{{ record.department || '未填写' }}</text></view>
			<view class="info-block">
				<text class="label">病史</text>
				<text class="value block">{{ record.medicalHistory || '未填写' }}</text>
			</view>
			<view class="info-block">
				<text class="label">过敏史</text>
				<text class="value block">{{ record.allergyHistory || '无' }}</text>
			</view>
		</view>
		<view class="section card">
			<view class="section-title">检查结果</view>
			<text class="empty-tip" v-if="!examinations.length">暂无检查结果</text>
			<view class="exam-item" v-for="(item, i) in examinations" :key="i">
				<view class="exam-head">
					<text class="exam-title">{{ item.title }}</text>
					<text class="exam-date">{{ item.date }}</text>
				</view>
				<text class="exam-desc">{{ item.description || '无描述' }}</text>
			</view>
		</view>
		<view class="section card">
			<view class="section-title">用药记录</view>
			<text class="empty-tip" v-if="!medications.length">暂无用药记录</text>
			<view class="med-item" v-for="(item, i) in medications" :key="i" @click="navTo('/pages/patient/medication-advice/medication-advice')">
				<view class="med-head">
					<text class="med-name">{{ item.medicineName }}</text>
					<text class="med-date">{{ item.startDate }}</text>
				</view>
				<view class="med-body">剂量：{{ item.dosage }}{{ item.unit }} 频率：{{ item.frequency }} 途径：{{ item.route }}</view>
			</view>
		</view>

		<!-- 本院病历 -->
		<view class="section card">
			<view class="section-header">
				<text class="section-title">本院病历</text>
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
				<view class="record-body" @click="showRecordDetail(item)">
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
				<text class="add-btn" @click="navTo('/pages/patient/upload-external/upload-external')">+上传</text>
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
				<view class="external-body" @click="showExternalDetail(item)">
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
	</view>
</template>

<script>
import { getPatientById } from '@/api/patient.js'
import { getMedicalRecordList, deleteMedicalRecord } from '@/api/medicalRecord.js'
import { getMedicationList } from '@/api/medication.js'

export default {
	data() {
		return {
			startDate: '',
			endDate: '',
			patient: {
				name: '',
				gender: '',
				age: '',
				birthday: '',
				idCard: '',
				phone: '',
				emergencyContact: ''
			},
			record: {
				diagnosis: '',
				firstDiagnosisDate: '',
				doctorName: '',
				department: '',
				medicalHistory: '',
				allergyHistory: ''
			},
			examinations: [],
			medications: [],
			hospitalRecords: [],
			externalRecords: []
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
			const u = uni.getStorageSync('userInfo') || {};
			// 尝试获取患者信息
			try {
				if (u.id) {
					const patientData = await getPatientById(u.id);
					if (patientData) {
						this.patient = {
							name: patientData.name || u.name || '',
							gender: patientData.gender || '',
							age: patientData.age || '',
							birthday: patientData.birthday || '',
							idCard: patientData.idCard || '',
							phone: patientData.phone || u.phone || '',
							emergencyContact: patientData.emergencyContact || ''
						};
					}
				}
			} catch (e) {
				// 使用本地存储的信息
				this.patient.name = u.name || '张哲瀚';
				this.patient.phone = u.phone || '';
			}

			// 尝试获取病历信息
			try {
				const params = { pageNum: 1, pageSize: 10 }
				if (this.startDate) params.startDate = this.startDate
				if (this.endDate) params.endDate = this.endDate
				const recordRes = await getMedicalRecordList(params);
				if (recordRes && recordRes.list && recordRes.list.length > 0) {
					const r = recordRes.list[0];
					this.record = {
						diagnosis: r.diagnosis || '',
						firstDiagnosisDate: r.date || '',
						doctorName: r.doctorName || '',
						department: r.department || '',
						medicalHistory: r.content || '',
						allergyHistory: ''
					};
				}
			} catch (e) {
				this.record = {
					diagnosis: '神经免疫相关疾病',
					firstDiagnosisDate: '2024-01-15',
					doctorName: '张哲瀚',
					department: '神经内科',
					medicalHistory: '既往病史描述',
					allergyHistory: '无'
				};
			}

			// 尝试获取用药记录
			try {
				const medParams = { pageNum: 1, pageSize: 10 }
				if (this.startDate) medParams.startDate = this.startDate
				if (this.endDate) medParams.endDate = this.endDate
				const medRes = await getMedicationList(medParams);
				if (medRes && medRes.list) {
					this.medications = medRes.list.map(m => ({
						medicineName: m.medicationName,
						startDate: m.date,
						dosage: m.dosage,
						unit: m.unit || '',
						frequency: m.frequency,
						route: m.route
					}));
				}
			} catch (e) {
				this.medications = [
					{ medicineName: '甲钴胺片', startDate: '2025-02-20', dosage: '0.5mg', unit: '/次', frequency: '一日三次', route: '口服' }
				];
			}

			// 获取外院病历和本院病历
			try {
				// 获取所有病历
				const allParams = { pageNum: 1, pageSize: 50 }
				if (this.startDate) allParams.startDate = this.startDate
				if (this.endDate) allParams.endDate = this.endDate
				const allRes = await getMedicalRecordList(allParams)

				if (allRes && allRes.list) {
					const allRecords = allRes.list.map(r => ({
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

					// 区分本院病历和外院病历
					this.externalRecords = allRecords.filter(r => r.type === '外院病历')
					this.hospitalRecords = allRecords.filter(r => r.type !== '外院病历')
				}
			} catch (e) {
				console.log('获取病历记录失败');
			}
		},
		formatIdCard(v) {
			if (!v) return '';
			return v.replace(/(^\d{6})\d*(\d{4})$/, '$1********$2');
		},
		formatPhone(v) {
			if (!v) return '';
			return v.replace(/(^\d{3})\d*(\d{4})$/, '$1****$2');
		},
		navTo(url) {
			uni.navigateTo({ url });
		},
		showExternalDetail(item) {
			let content = `就诊日期：${item.date || '未知'}\n`
			if (item.hospital) content += `医院：${item.hospital}\n`
			if (item.department) content += `科室：${item.department}\n`
			if (item.doctorName) content += `医生：${item.doctorName}\n`
			if (item.diagnosis) content += `诊断：${item.diagnosis}\n`
			content += `\n${item.content || item.notes || '暂无内容'}`

			uni.showModal({
				title: '外院病历详情',
				content: content,
				showCancel: false
			});
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
		showRecordDetail(item) {
			let content = `就诊日期：${item.date || '未知'}\n`
			content += `类型：${item.type || '门诊病历'}\n`
			if (item.department) content += `科室：${item.department}\n`
			if (item.doctorName) content += `医生：${item.doctorName}\n`
			if (item.diagnosis) content += `诊断：${item.diagnosis}\n`
			content += `\n${item.content || '暂无内容'}`

			uni.showModal({
				title: '本院病历详情',
				content: content,
				showCancel: false
			});
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

.info-row {
	display: flex;
	justify-content: space-between;
	padding: 18rpx 0;
	border-bottom: 1rpx solid $app-divider;
}

.info-row:last-child {
	border-bottom: none;
}

.info-row .label {
	font-size: 28rpx;
	color: $app-text-muted;
	width: 180rpx;
}

.info-row .value {
	font-size: 28rpx;
	color: $app-text;
	flex: 1;
	text-align: right;
	font-weight: 500;
}

.info-block {
	padding: 18rpx 0;
	border-bottom: 1rpx solid $app-divider;
}

.info-block:last-child {
	border-bottom: none;
}

.info-block .label {
	font-size: 28rpx;
	color: $app-text-muted;
	display: block;
}

.info-block .value.block {
	font-size: 28rpx;
	color: $app-text;
	margin-top: 10rpx;
	line-height: 1.6;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	text-align: center;
	padding: 32rpx 0;
}

.exam-item {
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	padding: $app-spacing-md;
	margin-bottom: $app-spacing-sm;
	transition: $app-transition;
}

.exam-item:active {
	background: #EBEDEF;
}

.exam-head {
	display: flex;
	justify-content: space-between;
	margin-bottom: 12rpx;
}

.exam-title {
	font-size: 32rpx;
	font-weight: 600;
	color: $app-text;
}

.exam-date {
	font-size: 24rpx;
	color: $app-text-muted;
}

.exam-desc {
	font-size: 26rpx;
	color: $app-text-secondary;
	line-height: 1.5;
}

.med-item {
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	padding: $app-spacing-md;
	margin-bottom: $app-spacing-sm;
	transition: $app-transition;
}

.med-item:active {
	background: #EBEDEF;
}

.med-head {
	display: flex;
	justify-content: space-between;
	margin-bottom: 10rpx;
}

.med-name {
	font-size: 32rpx;
	font-weight: 600;
	color: $app-text;
}

.med-date {
	font-size: 24rpx;
	color: $app-text-muted;
}

.med-body {
	font-size: 26rpx;
	color: $app-text-secondary;
	line-height: 1.5;
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
	background: rgba(13, 148, 136, 0.15);
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
</style>