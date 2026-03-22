<template>
	<view class="container">
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
			<view class="external-item" v-for="(item, i) in externalRecords" :key="i" @click="showExternalDetail(item)">
				<view class="external-head">
					<text class="external-date">{{ item.date }}</text>
					<text class="external-hospital" v-if="item.hospital">{{ item.hospital }}</text>
				</view>
				<text class="external-content">{{ item.content || item.notes || '无内容' }}</text>
				<view class="external-images" v-if="item.attachments">
					<image v-for="(img, idx) in item.attachments.split(',')" :key="idx" :src="img" mode="aspectFill" class="thumb-img" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getPatientById } from '@/api/patient.js'
import { getMedicalRecordList } from '@/api/medicalRecord.js'
import { getMedicationList } from '@/api/medication.js'

export default {
	data() {
		return {
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
				const recordRes = await getMedicalRecordList({ pageNum: 1, pageSize: 10 });
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
				const medRes = await getMedicationList({ pageNum: 1, pageSize: 10 });
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
				const extRes = await getMedicalRecordList({ pageNum: 1, pageSize: 20, type: '外院病历' });
				if (extRes && extRes.list) {
					this.externalRecords = extRes.list.map(r => ({
						id: r.id,
						date: r.date ? r.date.split('T')[0] : '',
						hospital: r.hospital || '',
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
			uni.showModal({
				title: '外院病历详情',
				content: item.content || item.notes || '暂无内容',
				showCancel: false
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.container { min-height: 100vh; background: #F5F5F5; padding: 24rpx 24rpx 60rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 24rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.info-row { display: flex; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.info-row .label { font-size: 28rpx; color: #666; width: 180rpx; }
.info-row .value { font-size: 28rpx; color: #333; flex: 1; text-align: right; }
.info-block { padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.info-block .label { font-size: 28rpx; color: #666; display: block; }
.info-block .value.block { font-size: 28rpx; color: #333; margin-top: 8rpx; line-height: 1.5; }
.empty-tip { font-size: 28rpx; color: #999; }
.exam-item { background: #f8f8f8; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.exam-head { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.exam-title { font-size: 30rpx; font-weight: bold; color: #333; }
.exam-date { font-size: 24rpx; color: #999; }
.exam-desc { font-size: 26rpx; color: #666; }
.med-item { background: #f8f8f8; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.med-head { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.med-name { font-size: 30rpx; font-weight: bold; color: #333; }
.med-date { font-size: 24rpx; color: #999; }
.med-body { font-size: 26rpx; color: #666; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.add-btn { font-size: 26rpx; color: #0D9488; }
.external-item { background: #f8f8f8; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.external-head { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.external-date { font-size: 26rpx; color: #999; }
.external-hospital { font-size: 26rpx; color: #0D9488; }
.external-content { font-size: 28rpx; color: #333; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.external-images { display: flex; gap: 12rpx; margin-top: 12rpx; flex-wrap: wrap; }
.thumb-img { width: 100rpx; height: 100rpx; border-radius: 8rpx; }
</style>