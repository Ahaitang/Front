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

			// 获取外院病历
			try {
				const extParams = { pageNum: 1, pageSize: 20, type: '外院病历' }
				if (this.startDate) extParams.startDate = this.startDate
				if (this.endDate) extParams.endDate = this.endDate
				const extRes = await getMedicalRecordList(extParams);
				if (extRes && extRes.list) {
					this.externalRecords = extRes.list.map(r => ({
						id: r.id,
						date: r.date ? r.date.split('T')[0] : '',
						hospital: r.hospital || '',
						department: r.department || '',
						doctorName: r.doctorName || '',
						diagnosis: r.diagnosis || '',
						content: r.content || '',
						notes: r.notes || '',
						attachments: r.attachments || ''
					}));
				}
			} catch (e) {
				console.log('暂无外院病历');
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
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container { min-height: 100vh; background: $app-bg; padding: 24rpx 24rpx 60rpx; }
.card { background: $app-card-bg; border-radius: $app-radius; padding: 28rpx; margin-bottom: 24rpx; box-shadow: $app-shadow; }

.filter-bar { padding: 20rpx 28rpx; }
.filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 16rpx; }
.filter-label { font-size: 28rpx; color: $app-text; }
.filter-sep { font-size: 28rpx; color: $app-text-muted; margin: 0 8rpx; }
.picker-btn { font-size: 26rpx; color: $app-text; background: $app-bg; padding: 12rpx 20rpx; border-radius: 8rpx; min-width: 140rpx; text-align: center; }
.filter-actions { display: flex; justify-content: flex-end; gap: 24rpx; margin-top: 20rpx; }
.filter-btn { font-size: 28rpx; color: $app-text-muted; }
.filter-btn.primary { color: $app-primary; font-weight: 500; }

.section-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.info-row { display: flex; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid $app-border; }
.info-row .label { font-size: 28rpx; color: $app-text-muted; width: 180rpx; }
.info-row .value { font-size: 28rpx; color: $app-text; flex: 1; text-align: right; }
.info-block { padding: 16rpx 0; border-bottom: 1rpx solid $app-border; }
.info-block .label { font-size: 28rpx; color: $app-text-muted; display: block; }
.info-block .value.block { font-size: 28rpx; color: $app-text; margin-top: 8rpx; line-height: 1.5; }
.empty-tip { font-size: 28rpx; color: $app-text-muted; }
.exam-item { background: $app-bg; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.exam-head { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.exam-title { font-size: 30rpx; font-weight: bold; color: $app-text; }
.exam-date { font-size: 24rpx; color: $app-text-muted; }
.exam-desc { font-size: 26rpx; color: $app-text-secondary; }
.med-item { background: $app-bg; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.med-head { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.med-name { font-size: 30rpx; font-weight: bold; color: $app-text; }
.med-date { font-size: 24rpx; color: $app-text-muted; }
.med-body { font-size: 26rpx; color: $app-text-secondary; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.add-btn { font-size: 26rpx; color: $app-primary; }
.external-item { background: $app-bg; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.external-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.external-date { font-size: 26rpx; color: $app-text-muted; }
.external-actions { display: flex; gap: 20rpx; }
.action-btn { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 6rpx; }
.action-btn.edit { color: $app-primary; background: rgba($app-primary, 0.1); }
.action-btn.delete { color: #EF4444; background: rgba(#EF4444, 0.1); }
.external-body { margin-top: 8rpx; }
.external-hospital { font-size: 26rpx; color: $app-primary; display: block; margin-bottom: 8rpx; }
.external-info { display: flex; gap: 12rpx; margin-bottom: 8rpx; }
.info-tag { font-size: 24rpx; color: $app-text-secondary; background: rgba($app-primary, 0.1); padding: 4rpx 12rpx; border-radius: 6rpx; }
.external-diagnosis { font-size: 28rpx; color: $app-text; margin-bottom: 8rpx; font-weight: 500; }
.external-content { font-size: 28rpx; color: $app-text-secondary; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.external-images { display: flex; gap: 12rpx; margin-top: 12rpx; flex-wrap: wrap; }
.thumb-img { width: 100rpx; height: 100rpx; border-radius: 8rpx; }
</style>