<template>
	<view class="container">
		<view class="user-card card">
			<image class="avatar" :src="patient.avatar || '/static/component.png'" mode="aspectFill"></image>
			<view class="meta">
				<text class="name">{{ patient.name }}</text>
				<text class="age-gender">{{ patient.gender }}</text>
				<text class="disease-tag" v-if="diseaseTypeLabel">{{ diseaseTypeLabel }}</text>
			</view>
			<view class="contact-btns">
				<view class="icon-btn" @click="callPhone"><text class="app-icon uniui-phone"></text></view>
			</view>
		</view>
		<view class="stats-card card">
			<view class="stat-item">
				<text class="stat-value">{{ patient.followUpCount || 0 }}</text>
				<text class="stat-label">随访次数</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ patient.medicationCount || 0 }}</text>
				<text class="stat-label">用药记录</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ patient.recordCount || 0 }}</text>
				<text class="stat-label">病历记录</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ patient.episodeCount || 0 }}</text>
				<text class="stat-label">发作记录</text>
			</view>
		</view>
		<view class="quick-actions card">
			<view class="quick-row">
				<view class="quick-btn" @click="navTo('/pages/doctor/add-follow/add-follow?patientId=' + patientId + '&patientName=' + encodeURIComponent(patient.name))">
					<text class="app-icon uniui-list"></text>
					<text>创建随访</text>
				</view>
				<view class="quick-btn" @click="navTo('/pages/doctor/add-medication/add-medication?patientId=' + patientId + '&patientName=' + encodeURIComponent(patient.name))">
					<text class="app-icon uniui-compose"></text>
					<text>添加用药</text>
				</view>
				<view class="quick-btn" @click="navTo('/pages/doctor/upload-record/upload-record?patientId=' + patientId + '&patientName=' + encodeURIComponent(patient.name))">
					<text class="app-icon uniui-folder-add-filled"></text>
					<text>新增病历</text>
				</view>
				<view class="quick-btn" @click="navTo('/pages/doctor/add-episode/add-episode?patientId=' + patientId + '&patientName=' + encodeURIComponent(patient.name))">
					<text class="app-icon uniui-fire-filled"></text>
					<text>新增发作</text>
				</view>
			</view>
		</view>
		<view class="tabs-card card">
			<view class="tabs-header">
				<view class="tab" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基本信息</view>
				<view class="tab" :class="{ active: activeTab === 'records' }" @click="activeTab = 'records'">病历记录</view>
				<view class="tab" :class="{ active: activeTab === 'follow' }" @click="activeTab = 'follow'">随访记录</view>
				<view class="tab" :class="{ active: activeTab === 'medication' }" @click="activeTab = 'medication'">用药记录</view>
				<view class="tab" :class="{ active: activeTab === 'episode' }" @click="activeTab = 'episode'">发作记录</view>
			</view>
			<view class="tabs-content">
					<view v-show="activeTab === 'basic'" class="tab-panel">
						<view class="row"><text class="label">姓名</text><text class="value">{{ patient.name }}</text></view>
						<view class="row"><text class="label">性别</text><text class="value">{{ patient.gender }}</text></view>
						<view class="row"><text class="label">出生日期</text><text class="value">{{ patient.birthday }}</text></view>
						<view class="row"><text class="label">手机号码</text><text class="value">{{ patient.phone }}</text></view>
						<view class="row"><text class="label">身份证号</text><text class="value">{{ patient.idCard }}</text></view>
						<view class="row disease-section">
								<text class="label">疾病分类（可多选）</text>
								<view class="disease-checkboxes">
									<view class="disease-item" v-for="d in diseaseOptions" :key="d.value" @click="toggleDisease(d.value)">
										<view class="checkbox" :class="{ checked: patient.diseaseTypes.includes(d.value) }">
											<text class="app-icon uniui-checkmarkempty" v-if="patient.diseaseTypes.includes(d.value)"></text>
										</view>
										<text class="disease-label">{{ d.label }}</text>
									</view>
								</view>
							</view>
					</view>
				<view v-show="activeTab === 'records'" class="tab-panel">
					<view class="records-section">
						<view class="section-header-row">
							<text class="section-label">本院病历</text>
							<text class="add-link" @click="addRecord('门诊病历')">+添加</text>
						</view>
						<text class="empty-tip" v-if="!hospitalRecords.length">暂无本院病历</text>
						<view class="record-item" v-for="(item, i) in hospitalRecords" :key="'h'+i">
							<view class="item-header">
								<view class="item-left">
									<text class="record-type-tag">{{ item.type || '门诊病历' }}</text>
									<text class="item-date">{{ item.date }}</text>
								</view>
								<view class="item-actions">
									<text class="action-btn edit" @click="editRecord(item)">编辑</text>
									<text class="action-btn delete" @click="deleteRecord(item)">删除</text>
								</view>
							</view>
							<view class="record-body" @click="showRecordDetail(item)">
								<text class="item-desc" v-if="item.diagnosis">诊断：{{ item.diagnosis }}</text>
								<text class="item-content">{{ item.content || '无内容' }}</text>
							</view>
						</view>
					</view>
					<view class="records-section">
						<view class="section-header-row">
							<text class="section-label">外院病历</text>
							<text class="add-link" @click="addRecord('外院病历')">+添加</text>
						</view>
						<text class="empty-tip" v-if="!externalRecords.length">暂无外院病历</text>
						<view class="record-item" v-for="(item, i) in externalRecords" :key="'e'+i">
							<view class="item-header">
								<text class="item-date">{{ item.date }}</text>
								<text class="item-hospital" v-if="item.hospital">{{ item.hospital }}</text>
								<view class="item-actions">
									<text class="action-btn edit" @click="editRecord(item)">编辑</text>
									<text class="action-btn delete" @click="deleteRecord(item)">删除</text>
								</view>
							</view>
							<view class="record-body" @click="showRecordDetail(item)">
								<text class="item-desc" v-if="item.diagnosis">诊断：{{ item.diagnosis }}</text>
								<text class="item-content">{{ item.content || '无内容' }}</text>
								<view class="record-images" v-if="item.attachments">
									<image v-for="(img, idx) in item.attachments.split(',').slice(0,3)" :key="idx" :src="img" mode="aspectFill" class="thumb-img" @click.stop="previewImage(img, item.attachments)" />
								</view>
							</view>
						</view>
					</view>
				</view>
				<view v-show="activeTab === 'follow'" class="tab-panel">
					<text class="empty-tip" v-if="!followList.length">暂无随访记录</text>
					<view class="list-item clickable" v-for="(item, i) in followList" :key="i" @click="showFollowUpDetail(item)">
						<view class="item-header">
							<text class="item-title">{{ item.title }}</text>
							<text class="item-status" :class="item.status">{{ item.statusText }}</text>
						</view>
						<text class="item-date">{{ item.date }}</text>
						<view class="item-actions" @click.stop>
							<text class="action-text" @click.stop="copyFollowToVisit(item)">复制为就诊记录</text>
						</view>
					</view>
				</view>
				<view v-show="activeTab === 'medication'" class="tab-panel">
					<text class="empty-tip" v-if="!medicationList.length">暂无用药记录</text>
					<view class="list-item clickable" v-for="(item, i) in medicationList" :key="i" @click="showMedicationDetail(item)">
						<text class="item-title">{{ item.name }}</text>
						<text class="item-desc">{{ item.dosage }} {{ item.frequency }}</text>
						<text class="item-date">{{ item.date }}</text>
					</view>
				</view>
				<view v-show="activeTab === 'episode'" class="tab-panel">
					<text class="empty-tip" v-if="!episodeList.length">暂无发作记录</text>
					<view class="episode-item" v-for="(item, i) in episodeList" :key="i" @click="showEpisodeDetail(item)">
						<view class="episode-header">
							<view class="episode-icon">
								<text class="app-icon uniui-fire-filled"></text>
							</view>
							<view class="episode-info">
								<text class="episode-title">{{ item.symptomType || '疾病发作' }}</text>
								<text class="episode-date">{{ item.date }}</text>
							</view>
							<text class="episode-severity" :class="item.severityClass">{{ item.severityText }}</text>
						</view>
						<view class="episode-body">
							<text class="episode-desc" v-if="item.symptoms">症状：{{ item.symptoms }}</text>
							<text class="episode-desc" v-if="item.duration">持续时间：{{ item.duration }}</text>
							<text class="episode-desc" v-if="item.treatment">处理措施：{{ item.treatment }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 随访详情弹窗 -->
		<uni-popup ref="followUpPopup" type="bottom" :safe-area="true">
			<view class="detail-popup">
				<view class="popup-header">
					<text class="popup-title">随访详情</text>
					<text class="popup-close" @click="closeFollowUpPopup">×</text>
				</view>
				<view class="popup-body" v-if="selectedFollowUp">
					<view class="detail-card">
						<view class="detail-row">
							<text class="detail-label">随访项目</text>
							<text class="detail-value">{{ selectedFollowUp.title }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">随访日期</text>
							<text class="detail-value">{{ selectedFollowUp.date || '未记录' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">随访状态</text>
							<text class="detail-value" :class="selectedFollowUp.status">{{ selectedFollowUp.statusText }}</text>
						</view>
						<view class="detail-row" v-if="selectedFollowUp.content">
							<text class="detail-label">随访内容</text>
							<text class="detail-value notes">{{ selectedFollowUp.content }}</text>
						</view>
					</view>
				</view>
			</view>
		</uni-popup>

		<!-- 用药详情弹窗 -->
		<uni-popup ref="medicationPopup" type="bottom" :safe-area="true">
			<view class="detail-popup">
				<view class="popup-header">
					<text class="popup-title">用药详情</text>
					<text class="popup-close" @click="closeMedicationPopup">×</text>
				</view>
				<view class="popup-body" v-if="selectedMedication">
					<view class="detail-card">
						<view class="detail-row">
							<text class="detail-label">药品名称</text>
							<text class="detail-value">{{ selectedMedication.name }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">剂量</text>
							<text class="detail-value">{{ selectedMedication.dosage }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">用药频率</text>
							<text class="detail-value">{{ selectedMedication.frequency || '未记录' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">开药日期</text>
							<text class="detail-value">{{ selectedMedication.date || '未记录' }}</text>
						</view>
					</view>
				</view>
			</view>
		</uni-popup>

		<view class="actions">
			<button class="btn" @click="callPhone">打电话</button>
			<button class="btn primary" @click="fillVisit">填写就诊信息</button>
		</view>
	</view>
</template>

<script>
import { getPatientById, updatePatient } from '@/api/patient.js'
import { getFollowUpList } from '@/api/followup.js'
import { getMedicationList } from '@/api/medication.js'
import { createMedicalRecord, getMedicalRecordList, updateMedicalRecord, deleteMedicalRecord } from '@/api/medicalRecord.js'
import { getEpisodesByPatient } from '@/api/episode.js'

export default {
	data() {
		return {
			activeTab: 'basic',
			patientId: '',
			diseaseOptions: [
					{ label: 'MS（多发性硬化）', value: 'MS' },
					{ label: 'NMOSD（视神经脊髓炎）', value: 'NMOSD' },
					{ label: 'MG（重症肌无力）', value: 'MG' },
					{ label: 'MOGAD（MOG抗体病）', value: 'MOGAD' },
					{ label: '自身免疫性脑炎', value: 'AUTO_ENCEPHALITIS' },
					{ label: 'GBS（格林-巴利综合征）', value: 'GBS' },
					{ label: 'CIDP（慢性炎性脱髓鞘性多发性神经病）', value: 'CIDP' },
					{ label: '其它疾病', value: 'OTHER' }
				],
			patient: {
				name: '',
				gender: '',
				birthday: '',
				phone: '',
				idCard: '',
				diseaseTypes: [],
				followUpCount: 0,
				medicationCount: 0,
				recordCount: 0,
				episodeCount: 0
			},
			followList: [],
			medicationList: [],
			hospitalRecords: [],
			externalRecords: [],
			episodeList: [],
				// 详情弹窗相关
				selectedFollowUp: null,
				selectedMedication: null,
				followUpPopupVisible: false,
				medicationPopupVisible: false
		};
	},

	onLoad(op) {
		if (op.id) this.patientId = op.id;
		else this.patientId = '1';
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				const res = await getPatientById(this.patientId);
				if (res) {
					this.patient = {
						name: res.name || '患者',
						gender: res.gender === 'male' ? '男' : (res.gender === 'female' ? '女' : res.gender || '未知'),
						birthday: res.birthday || '',
						phone: res.phone || '',
						idCard: res.idCard || '',
						diseaseTypes: res.diseaseTypes || [],
						followUpCount: 0,
						medicationCount: 0,
						recordCount: 0,
						episodeCount: 0
					};
				}
			} catch (e) {
				console.error('加载患者信息失败:', e);
			}

			// 加载随访记录
			try {
				const followRes = await getFollowUpList({ pageNum: 1, pageSize: 100, patientId: this.patientId });
				if (followRes && followRes.list) {
					this.followList = followRes.list.map(f => ({
						id: f.id,
						title: f.project || '随访',
						date: f.date,
						content: f.content,
						status: f.status === 1 ? 'completed' : 'pending',
						statusText: f.status === 1 ? '已完成' : '待随访'
					}));
					this.patient.followUpCount = followRes.total || this.followList.length;
				}
			} catch (e) {
				console.error('加载随访记录失败:', e);
			}

			// 加载用药记录
			try {
				const medRes = await getMedicationList({ pageNum: 1, pageSize: 100, patientId: this.patientId });
				if (medRes && medRes.list) {
					this.medicationList = medRes.list.map(m => ({
						name: m.medicationName,
						dosage: m.dosage + (m.unit || ''),
						frequency: m.frequency,
						date: m.date
					}));
					this.patient.medicationCount = medRes.total || this.medicationList.length;
				}
			} catch (e) {
				console.error('加载用药记录失败:', e);
			}

			// 加载病历记录
			try {
				const recordRes = await getMedicalRecordList({ pageNum: 1, pageSize: 100, patientId: this.patientId });
				if (recordRes && recordRes.list) {
					const allRecords = recordRes.list.map(r => ({
						id: r.id,
						date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : r.date) : '',
						type: r.type || '',
						hospital: r.hospital || '',
						department: r.department || '',
						doctorName: r.doctorName || '',
						diagnosis: r.diagnosis || '',
						content: r.content || '',
						attachments: r.attachments || ''
					}));
					this.externalRecords = allRecords.filter(r => r.type === '外院病历');
					this.hospitalRecords = allRecords.filter(r => r.type !== '外院病历');
					this.patient.recordCount = recordRes.total || allRecords.length;
				}
			} catch (e) {
				console.error('加载病历记录失败:', e);
			}

			// 加载发作记录
			try {
				const episodeRes = await getEpisodesByPatient(this.patientId);
				if (episodeRes && episodeRes.length) {
					this.episodeList = episodeRes.map(e => ({
						id: e.id,
						date: e.episodeDate ? (typeof e.episodeDate === 'string' ? e.episodeDate.split('T')[0] : e.episodeDate) : '',
						symptomType: e.symptomType || '疾病发作',
						symptoms: e.symptoms || '',
						duration: e.duration || '',
						treatment: e.treatment || '',
						severity: e.severity || 'moderate',
						severityText: this.getSeverityText(e.severity),
						severityClass: this.getSeverityClass(e.severity)
					}));
					this.patient.episodeCount = episodeRes.length;
				}
			} catch (e) {
				console.error('加载发作记录失败:', e);
			}
		},
		getSeverityText(severity) {
			const map = {
				'mild': '轻度',
				'moderate': '中度',
				'severe': '重度',
				'critical': '严重'
			};
			return map[severity] || '中度';
		},
		getSeverityClass(severity) {
			const map = {
				'mild': 'mild',
				'moderate': 'moderate',
				'severe': 'severe',
				'critical': 'critical'
			};
			return map[severity] || 'moderate';
		},
		showEpisodeDetail(item) {
			let content = `发作日期：${item.date || '未知'}\n`
			content += `发作类型：${item.symptomType || '疾病发作'}\n`
			content += `严重程度：${item.severityText}\n`
			if (item.symptoms) content += `症状描述：${item.symptoms}\n`
			if (item.duration) content += `持续时间：${item.duration}\n`
			if (item.treatment) content += `处理措施：${item.treatment}\n`

			uni.showModal({
				title: '发作记录详情',
				content: content,
				confirmText: '复制',
				success: (res) => {
					if (res.confirm) {
						uni.setClipboardData({
							data: content,
							success: () => {
								uni.showToast({ title: '已复制', icon: 'success' });
							}
						});
					}
				}
			});
		},
		callPhone() {
			if (this.patient.phone) {
				uni.makePhoneCall({ phoneNumber: this.patient.phone });
			} else {
				uni.showToast({ title: '暂无电话', icon: 'none' });
			}
		},
		fillVisit() {
			uni.navigateTo({
				url: '/pages/doctor/add-follow/add-follow?patientId=' + this.patientId + '&patientName=' + encodeURIComponent(this.patient.name)
			});
		},
		navTo(url) {
			uni.navigateTo({ url });
		},
		// 复制基本信息
		copyBasicInfo() {
			const info = `患者：${this.patient.name}
	性别：${this.patient.gender}
	年龄：${this.patient.age}岁
	电话：${this.patient.phone}
	疾病分类：${(this.patient.diseaseTypes || []).join('、') || '未分类'}
	身份证号：${this.patient.idCard || '未填写'}
	居住地：${this.patient.address || '未填写'}`;

			uni.setClipboardData({
				data: info,
				success: () => {
					uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
				}
			});
		},
		// 复制随访记录为就诊记录
		copyFollowToVisit(item) {
			uni.showModal({
				title: '确认复制',
				content: '将此随访记录复制为新病历记录？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await createMedicalRecord({
								patientId: this.patientId,
								patientName: this.patient.name,
								type: '门诊病历',
								diagnosis: item.title,
								content: item.content || '',
								date: item.date
							});
							uni.showToast({ title: '已复制为病历', icon: 'success' });
							this.loadData();
						} catch (e) {
							console.error('复制失败:', e);
							uni.showToast({ title: '复制失败', icon: 'none' });
						}
					}
				}
			});
		},
		// 查看病历详情
		showRecordDetail(item) {
			let content = `就诊日期：${item.date || '未知'}\n`
			if (item.type) content += `类型：${item.type}\n`
			if (item.hospital) content += `医院：${item.hospital}\n`
			if (item.department) content += `科室：${item.department}\n`
			if (item.doctorName) content += `医生：${item.doctorName}\n`
			if (item.diagnosis) content += `诊断：${item.diagnosis}\n`
			content += `\n${item.content || '暂无内容'}`

			uni.showModal({
				title: '病历详情',
				content: content,
				confirmText: '复制',
				success: (res) => {
					if (res.confirm) {
						uni.setClipboardData({
							data: content,
							success: () => {
								uni.showToast({ title: '已复制', icon: 'success' });
							}
						});
					}
				}
			});
		},
		// 预览图片
		previewImage(current, attachments) {
			const urls = attachments.split(',').filter(url => url)
			uni.previewImage({
				current: current,
				urls: urls
			})
		},
		// 疾病分类变更
		async toggleDisease(value) {
			const index = this.patient.diseaseTypes.indexOf(value);
			if (index > -1) {
				this.patient.diseaseTypes.splice(index, 1);
			} else {
				this.patient.diseaseTypes.push(value);
			}
			try {
				await updatePatient(this.patientId, { diseaseTypes: this.patient.diseaseTypes });
				uni.showToast({ title: '已更新', icon: 'success' });
			} catch (err) {
				console.error('更新疾病分类失败:', err);
				uni.showToast({ title: '更新失败', icon: 'none' });
			}
		},
		// 添加病历
		addRecord(type) {
			uni.navigateTo({
				url: '/pages/doctor/edit-record/edit-record?patientId=' + this.patientId + '&patientName=' + encodeURIComponent(this.patient.name) + '&type=' + type
			})
		},
		// 编辑病历
		editRecord(item) {
			uni.navigateTo({
				url: '/pages/doctor/edit-record/edit-record?id=' + item.id + '&patientId=' + this.patientId + '&patientName=' + encodeURIComponent(this.patient.name)
			})
		},
		// 删除病历
		deleteRecord(item) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条病历记录吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await deleteMedicalRecord(item.id)
							uni.showToast({ title: '删除成功', icon: 'success' })
							this.loadData()
						} catch (e) {
							console.error('删除失败:', e)
							uni.showToast({ title: '删除失败', icon: 'none' })
						}
					}
				}
			})
		},
		// 随访详情弹窗
		showFollowUpDetail(item) {
			this.selectedFollowUp = item
			this.$refs.followUpPopup.open()
		},
		closeFollowUpPopup() {
			this.$refs.followUpPopup.close()
		},
		// 用药详情弹窗
		showMedicationDetail(item) {
			this.selectedMedication = item
			this.$refs.medicationPopup.open()
		},
		closeMedicationPopup() {
			this.$refs.medicationPopup.close()
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding: 24rpx 24rpx 160rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	margin-bottom: 24rpx;
	box-shadow: $app-shadow;
}

.user-card {
	display: flex;
	align-items: center;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	margin-right: 24rpx;
}

.meta {
	flex: 1;
}

.name {
	font-size: 34rpx;
	font-weight: bold;
	color: $app-text;
	display: block;
}

.age-gender {
	font-size: 28rpx;
	color: $app-text-secondary;
	display: block;
	margin-top: 8rpx;
}

.disease-tag {
	display: inline-block;
	font-size: 24rpx;
	color: $app-primary;
	background: $app-primary-bg;
	padding: 6rpx 16rpx;
	border-radius: 16rpx;
	margin-top: 8rpx;
}

.contact-btns {
	display: flex;
	gap: 16rpx;
}

.icon-btn {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: $app-primary-bg;
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon-btn .app-icon {
	font-size: 36rpx;
	color: $app-primary;
}

.stats-card {
	display: flex;
	justify-content: space-around;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-value {
	font-size: 36rpx;
	font-weight: bold;
	color: $app-text;
}

.stat-label {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
}

.quick-actions {
	padding: 20rpx 0;
}

.quick-row {
	display: flex;
	justify-content: space-between;
	gap: 12rpx;
}

.quick-btn {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16rpx 8rpx;
	background: #fff;
	border-radius: 12rpx;
	transition: all 0.2s;
}

.quick-btn:active {
	transform: scale(0.95);
	background: #f5f5f5;
}

.quick-btn .app-icon {
	font-size: 36rpx;
	margin-bottom: 8rpx;
	color: $app-primary;
}

.quick-btn text:last-child {
	font-size: 22rpx;
	color: $app-text;
}

.tabs-header {
	display: flex;
	border-bottom: 1rpx solid $app-border;
	margin-bottom: 20rpx;
}

.tab {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	font-size: 24rpx;
	color: $app-text-muted;
}

.tab.active {
	color: $app-primary;
	font-weight: bold;
	border-bottom: 4rpx solid $app-primary;
}

.tab-panel .row {
	display: flex;
	justify-content: space-between;
	padding: 20rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.tab-panel .label {
	font-size: 28rpx;
	color: $app-text-muted;
}

.tab-panel .value {
	font-size: 28rpx;
	color: $app-text;
}

.tab-panel .value.highlight {
	color: $app-primary;
	font-weight: 500;
}

.copy-btn-row {
	margin-top: 24rpx;
}

.copy-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	background: $app-primary-bg;
	color: $app-primary;
	font-size: 28rpx;
	padding: 20rpx 0;
	border-radius: 12rpx;
	border: none;
}

.copy-btn .app-icon {
	font-size: 32rpx;
}

.empty-tip {
	font-size: 28rpx;
	color: $app-text-muted;
	display: block;
	padding: 40rpx 0;
	text-align: center;
}

.list-item {
	padding: 20rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.item-title {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
}

.item-desc {
	font-size: 26rpx;
	color: $app-text-secondary;
	display: block;
	margin-top: 6rpx;
}

.item-date {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 6rpx;
	display: block;
}

.item-status {
	font-size: 24rpx;
	padding: 4rpx 16rpx;
	border-radius: 16rpx;
}

.item-status.completed {
	background: #D1FAE5;
	color: #10B981;
}

.item-status.pending {
	background: #FEF3C7;
	color: #F59E0B;
}

.item-actions {
	margin-top: 12rpx;
}

.action-text {
	font-size: 24rpx;
	color: $app-primary;
}

/* 病历记录样式 */
.records-section {
	margin-bottom: 24rpx;
}

.section-label {
	font-size: 28rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
	margin-bottom: 16rpx;
	padding-bottom: 12rpx;
	border-bottom: 1rpx solid $app-border;
}

.record-item {
	padding: 16rpx 0;
	border-bottom: 1rpx solid $app-border;
}

.item-left {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.record-type-tag {
	font-size: 22rpx;
	color: #fff;
	background: $app-primary;
	padding: 4rpx 12rpx;
	border-radius: 6rpx;
}

.item-hospital {
	font-size: 24rpx;
	color: $app-primary;
}

.item-content {
	font-size: 26rpx;
	color: $app-text-secondary;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	margin-top: 8rpx;
}

.record-images {
	display: flex;
	gap: 12rpx;
	margin-top: 12rpx;
}

.thumb-img {
	width: 80rpx;
	height: 80rpx;
	border-radius: 8rpx;
}

.actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	padding: 24rpx;
	background: $app-card-bg;
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}

.btn {
	flex: 1;
	margin: 0 12rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 12rpx;
	font-size: 30rpx;
	background: $app-bg;
	color: $app-text;
	border: none;
}

.btn.primary {
	background: $app-primary;
	color: #fff;
}

/* 疾病多选样式 */
	.disease-section {
		margin-bottom: 32rpx;
	}
	.disease-checkboxes {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		margin-top: 12rpx;
	}
	.disease-item {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 16rpx 20rpx;
		background: $app-bg;
		border-radius: $app-radius-sm;
	}
	.checkbox {
		width: 40rpx;
		height: 40rpx;
		border: 2rpx solid $app-border;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $app-card-bg;
	}
	.checkbox.checked {
		background: $app-primary;
		border-color: $app-primary;
	}
	.checkbox.checked .app-icon {
		color: #fff;
		font-size: 24rpx;
	}
	.disease-label {
		font-size: 28rpx;
		color: $app-text;
	}

.section-header-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
	padding-bottom: 12rpx;
	border-bottom: 1rpx solid $app-border;
}

.add-link {
	font-size: 26rpx;
	color: $app-primary;
}

.record-item .item-actions {
	display: flex;
	gap: 16rpx;
	margin-top: 0;
}

.action-btn {
	font-size: 24rpx;
	padding: 4rpx 16rpx;
	border-radius: 6rpx;
}

.action-btn.edit {
	color: $app-primary;
	background: rgba($app-primary, 0.1);
}

.action-btn.delete {
	color: #EF4444;
	background: rgba(#EF4444, 0.1);
}

.record-body {
	margin-top: 8rpx;
}

/* 发作记录样式 */
.episode-item {
	padding: 20rpx;
	background: $app-hover-bg;
	border-radius: $app-radius-sm;
	margin-bottom: 16rpx;
	transition: $app-transition;
}

.episode-item:active {
	background: #EBEDEF;
}

.episode-header {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.episode-icon {
	width: 48rpx;
	height: 48rpx;
	border-radius: 12rpx;
	background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
	display: flex;
	align-items: center;
	justify-content: center;
}

.episode-icon .app-icon {
	font-size: 24rpx !important;
	color: #fff !important;
}

.episode-info {
	flex: 1;
}

.episode-title {
	font-size: 28rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
}

.episode-date {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
	display: block;
}

.episode-severity {
	font-size: 22rpx;
	padding: 6rpx 14rpx;
	border-radius: 12rpx;
	font-weight: 500;
}

.episode-severity.mild {
	background: #D1FAE5;
	color: #10B981;
}

.episode-severity.moderate {
	background: #FEF3C7;
	color: #F59E0B;
}

.episode-severity.severe {
	background: #FEE2E2;
	color: #EF4444;
}

.episode-severity.critical {
	background: #FECACA;
	color: #DC2626;
}

.episode-body {
	margin-top: 12rpx;
}

.episode-desc {
	font-size: 24rpx;
	color: $app-text-secondary;
	display: block;
	margin-top: 6rpx;
	line-height: 1.4;
}

/* 点击提示样式 */
.list-item.clickable {
	cursor: pointer;
}

.list-item.clickable:active {
	background: $app-hover-bg;
}

/* 详情弹窗样式 */
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
	border-bottom: 1rpx solid $app-border;
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
	border-bottom: 1rpx solid $app-border;
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

.detail-value.completed {
	color: $app-success;
}

.detail-value.pending {
	color: $app-warning;
}

.detail-value.notes {
	text-align: left;
	word-break: break-all;
}
</style>