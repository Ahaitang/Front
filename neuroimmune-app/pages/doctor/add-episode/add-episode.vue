<template>
	<view class="container">
		<!-- 选择患者 -->
		<view class="form-card card">
			<view class="form-item">
				<text class="form-label">选择患者 <text class="required">*</text></text>
				<view class="patient-select" @click="showPatientPicker = true">
					<view class="select-content" v-if="selectedPatient">
						<view class="avatar-wrap"><text class="avatar-text">{{ selectedPatient.name.charAt(0) }}</text></view>
						<view class="patient-info">
							<text class="patient-name">{{ selectedPatient.name }}</text>
							<text class="patient-meta">{{ selectedPatient.gender }} · {{ selectedPatient.age }}岁 · {{ selectedPatient.diseaseType }}</text>
						</view>
					</view>
					<view class="select-placeholder" v-else>
						<text class="app-icon uniui-contact-filled"></text>
						<text>请选择患者</text>
					</view>
					<text class="app-icon uniui-arrowright"></text>
				</view>
			</view>

			<view class="form-item">
				<text class="form-label">发作日期 <text class="required">*</text></text>
				<picker mode="date" :value="form.episodeDate" @change="onDateChange">
					<view class="picker-input">
						<text class="picker-value">{{ form.episodeDate || '请选择日期' }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="form-label">主诉 <text class="required">*</text></text>
				<textarea class="form-textarea" v-model="form.chiefComplaint" placeholder="请描述主要症状和不适，如：右侧肢体无力3天" />
			</view>

			<view class="form-item">
				<text class="form-label">症状表现</text>
				<textarea class="form-textarea" v-model="form.symptoms" placeholder="视力模糊、肢体麻木、行走困难等" />
			</view>

			<view class="form-item">
				<text class="form-label">病情变化过程</text>
				<textarea class="form-textarea" v-model="form.diseaseProgress" placeholder="描述病情发展过程" />
			</view>

			<view class="form-item">
				<text class="form-label">诊治经过</text>
				<textarea class="form-textarea" v-model="form.treatmentProcess" placeholder="就诊和治疗过程，用药情况等" />
			</view>

			<view class="form-item">
				<text class="form-label">诊断结果</text>
				<textarea class="form-textarea" v-model="form.diagnosis" placeholder="医生的诊断结果" />
			</view>

			<view class="form-item">
				<text class="form-label">就诊医院</text>
				<input class="form-input" v-model="form.hospital" placeholder="请输入医院名称" />
			</view>

			<view class="form-item">
				<text class="form-label">科室</text>
				<input class="form-input" v-model="form.department" placeholder="请输入科室" />
			</view>

			<view class="form-item">
				<text class="form-label">备注</text>
				<textarea class="form-textarea" v-model="form.notes" placeholder="其他需要记录的信息" />
			</view>

			<!-- 图片上传区域 -->
			<view class="form-item">
				<text class="form-label">病历图片</text>
				<text class="form-tip">上传图片将自动创建病历记录并关联本次发作</text>
				<view class="upload-area" @click="chooseImage">
					<text class="app-icon uniui-cloud-upload-filled"></text>
					<text class="upload-text">点击上传图片</text>
				</view>
				<view class="image-list" v-if="uploadImages.length">
					<view class="image-item" v-for="(img, i) in uploadImages" :key="i">
						<image class="preview-img" :src="img" mode="aspectFill" @click="previewImage(img)" />
						<view class="del-btn" @click="delImage(i)">×</view>
					</view>
				</view>
			</view>

			<!-- OCR识别按钮 -->
			<view class="ocr-section" v-if="uploadImages.length">
				<view class="ocr-buttons">
					<button class="ocr-btn" @click="recognizeImage('general')" :loading="ocrLoading">通用识别</button>
					<button class="ocr-btn primary" @click="recognizeImage('medical')" :loading="ocrLoading">医疗报告识别</button>
				</view>
				<view class="ocr-result" v-if="ocrResult">
					<text class="result-label">识别结果：</text>
					<text class="result-content">{{ ocrResult }}</text>
					<text class="use-btn" @click="useOcrResult">使用识别结果</text>
				</view>
			</view>
		</view>

		<view class="submit-bar">
			<button class="submit-btn" @click="submit" :loading="loading">保存发作记录</button>
		</view>

		<!-- 患者选择弹窗 -->
		<view class="picker-mask" v-if="showPatientPicker" @click="showPatientPicker = false">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-title">选择患者</text>
					<view class="search-bar">
						<text class="app-icon uniui-search"></text>
						<input class="search-input" placeholder="搜索患者姓名" v-model="searchKeyword" />
					</view>
				</view>
				<scroll-view class="picker-list" scroll-y>
					<view class="picker-item" v-for="(p, i) in filteredPatients" :key="i" @click="selectPatient(p)">
						<view class="picker-avatar-wrap"><text class="picker-avatar-text">{{ p.name.charAt(0) }}</text></view>
						<view class="picker-info">
							<text class="picker-name">{{ p.name }}</text>
							<text class="picker-meta">{{ p.gender }} · {{ p.age }}岁 · {{ p.diseaseType || '' }}</text>
						</view>
						<view class="picker-check" v-if="selectedPatient && selectedPatient.id === p.id">
							<text class="app-icon uniui-checkmarkempty"></text>
						</view>
					</view>
				</scroll-view>
				<view class="picker-footer">
					<text class="picker-cancel" @click="showPatientPicker = false">取消</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getDoctorPatientDetails } from '@/api/relation.js'
import { createEpisode } from '@/api/episode.js'
import { createMedicalRecord } from '@/api/medicalRecord.js'
import { uploadFile } from '@/api/request.js'
import { recognizeGeneral, recognizeMedicalReport } from '@/api/ocr.js'

export default {
	data() {
		return {
			showPatientPicker: false,
			searchKeyword: '',
			patientList: [],
			selectedPatient: null,
			form: {
				episodeDate: '',
				chiefComplaint: '',
				symptoms: '',
				diseaseProgress: '',
				treatmentProcess: '',
				diagnosis: '',
				hospital: '',
				department: '',
				notes: ''
			},
			uploadImages: [],
			ocrLoading: false,
			ocrResult: '',
			loading: false
		}
	},
	computed: {
		filteredPatients() {
			const k = this.searchKeyword.trim().toLowerCase()
			if (!k) return this.patientList
			return this.patientList.filter(p => (p.name || '').toLowerCase().includes(k))
		}
	},
	onLoad() {
		this.loadPatients()
		const today = new Date()
		this.form.episodeDate = this.formatDate(today)
	},
	methods: {
		formatDate(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		formatDateTime(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			const h = String(date.getHours()).padStart(2, '0')
			const min = String(date.getMinutes()).padStart(2, '0')
			const s = String(date.getSeconds()).padStart(2, '0')
			return `${y}-${m}-${d} ${h}:${min}:${s}`
		},
		async loadPatients() {
			const userInfo = uni.getStorageSync('userInfo') || {}
			try {
				const patients = await getDoctorPatientDetails(userInfo.id)
				if (patients && patients.length) {
					this.patientList = patients.map(p => ({
						id: p.patientId,
						name: p.patientName,
						gender: p.gender === 'male' ? '男' : (p.gender === 'female' ? '女' : p.gender),
						age: p.age,
						phone: p.phone,
						diseaseType: p.diseaseType || ''
					}))
				}
			} catch (e) {
				console.error('加载患者列表失败:', e)
			}
		},
		selectPatient(patient) {
			this.selectedPatient = patient
			this.showPatientPicker = false
		},
		onDateChange(e) {
			this.form.episodeDate = e.detail.value
		},
		chooseImage() {
			uni.chooseImage({
				count: 9 - this.uploadImages.length,
				success: (res) => {
					this.uploadImages = [...this.uploadImages, ...res.tempFilePaths]
				}
			})
		},
		delImage(i) {
			this.uploadImages.splice(i, 1)
			this.ocrResult = ''
		},
		previewImage(current) {
			uni.previewImage({ current, urls: this.uploadImages })
		},
		async recognizeImage(type) {
			if (!this.uploadImages.length || this.ocrLoading) return

			this.ocrLoading = true
			this.ocrResult = ''

			try {
				let ocrRes
				if (type === 'medical') {
					ocrRes = await recognizeMedicalReport(this.uploadImages[0])
				} else {
					ocrRes = await recognizeGeneral(this.uploadImages[0])
				}

				if (ocrRes && ocrRes.content) {
					this.ocrResult = ocrRes.content
				} else if (ocrRes && ocrRes.parsed) {
					this.ocrResult = ocrRes.parsed.diagnosis || ocrRes.parsed.items || ''
				}

				if (this.ocrResult) {
					uni.showToast({ title: '识别成功', icon: 'success' })
				} else {
					uni.showToast({ title: '未识别到内容', icon: 'none' })
				}
			} catch (e) {
				console.error('OCR识别失败:', e)
				uni.showToast({ title: '识别失败', icon: 'none' })
			} finally {
				this.ocrLoading = false
			}
		},
		useOcrResult() {
			if (this.ocrResult) {
				this.form.diagnosis = this.ocrResult
				uni.showToast({ title: '已填充诊断结果', icon: 'success' })
			}
		},
		async submit() {
			if (!this.selectedPatient) {
				uni.showToast({ title: '请选择患者', icon: 'none' })
				return
			}
			if (!this.form.chiefComplaint.trim()) {
				uni.showToast({ title: '请填写主诉', icon: 'none' })
				return
			}

			this.loading = true
			uni.showLoading({ title: '保存中...' })

			try {
				const episodeData = {
					...this.form,
					episodeDate: this.form.episodeDate,
					patientId: this.selectedPatient.id,
					patientName: this.selectedPatient.name
				}
				const episodeId = await createEpisode(episodeData)

				if (this.uploadImages.length > 0 && episodeId) {
					const urls = []
					for (const path of this.uploadImages) {
						const res = await uploadFile(path)
						if (res && res.url) urls.push(res.url)
					}

					await createMedicalRecord({
						patientId: this.selectedPatient.id,
						patientName: this.selectedPatient.name,
						type: '门诊病历',
						date: this.formatDateTime(new Date()),
						diagnosis: this.form.diagnosis || '',
						content: this.form.chiefComplaint || '',
						attachments: urls.join(','),
						hospital: this.form.hospital || '',
						department: this.form.department || '',
						relatedEpisodeId: episodeId
					})
				}

				uni.hideLoading()
				uni.showToast({ title: '保存成功', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 1000)
			} catch (e) {
				uni.hideLoading()
				console.error('保存失败:', e)
				uni.showToast({ title: '保存失败', icon: 'none' })
			} finally {
				this.loading = false
			}
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
	padding-bottom: 160rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

.form-card { margin-bottom: 24rpx; }
.form-item { margin-bottom: 32rpx; }
.form-item:last-child { margin-bottom: 0; }

.form-label {
	display: block;
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	margin-bottom: 16rpx;
}

.form-tip {
	display: block;
	font-size: 24rpx;
	color: $app-primary;
	margin-bottom: 16rpx;
}

.required { color: #EF4444; }

.form-input {
	width: 100%;
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: $app-text;
	box-sizing: border-box;
}

.form-textarea {
	width: 100%;
	min-height: 160rpx;
	padding: 20rpx 24rpx;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: $app-text;
	box-sizing: border-box;
}

.picker-input {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
}

.picker-value { font-size: 28rpx; color: $app-text; }
.picker-input .app-icon { font-size: 28rpx; color: $app-text-muted; }

/* 患者选择 */
.patient-select {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 24rpx;
	background: $app-bg;
	border-radius: 12rpx;
}

.select-content {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.avatar-wrap {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-text { font-size: 24rpx; font-weight: bold; color: #fff; }

.patient-info { flex: 1; }
.patient-name { font-size: 28rpx; font-weight: 500; color: $app-text; display: block; }
.patient-meta { font-size: 24rpx; color: $app-text-muted; margin-top: 4rpx; }

.select-placeholder {
	display: flex;
	align-items: center;
	gap: 12rpx;
	color: $app-text-muted;
}

.select-placeholder .app-icon { font-size: 32rpx; }

/* 图片上传 */
.upload-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 48rpx;
	background: $app-hover-bg;
	border-radius: 12rpx;
	border: 2rpx dashed $app-border;
}

.upload-area .app-icon { font-size: 64rpx; color: $app-primary; margin-bottom: 16rpx; }
.upload-text { font-size: 28rpx; color: $app-text-muted; }

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 24rpx;
}

.image-item { position: relative; width: 160rpx; height: 160rpx; }
.preview-img { width: 100%; height: 100%; border-radius: 12rpx; }
.del-btn {
	position: absolute;
	top: -12rpx; right: -12rpx;
	width: 40rpx; height: 40rpx;
	background: $app-error;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	line-height: 1;
}

/* OCR区域 */
.ocr-section { margin-top: 24rpx; }
.ocr-buttons { display: flex; gap: 16rpx; }
.ocr-btn {
	flex: 1;
	height: 72rpx;
	line-height: 72rpx;
	border-radius: 12rpx;
	font-size: 26rpx;
	background: $app-bg;
	color: $app-text;
	border: none;
}
.ocr-btn.primary { background: $app-primary; color: #fff; }

.ocr-result {
	margin-top: 16rpx;
	padding: 16rpx;
	background: $app-bg;
	border-radius: 12rpx;
}
.result-label { font-size: 24rpx; color: $app-text-muted; display: block; }
.result-content { font-size: 26rpx; color: $app-text; margin-top: 8rpx; display: block; line-height: 1.5; }
.use-btn { font-size: 24rpx; color: $app-primary; margin-top: 12rpx; display: block; }

/* 提交 */
.submit-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 24rpx;
	background: $app-card-bg;
	box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.05);
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	background: $app-primary;
	color: #fff;
	font-size: 32rpx;
	font-weight: 500;
	border-radius: 12rpx;
	border: none;
}

/* 患者选择弹窗 */
.picker-mask {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
}

.picker-content {
	width: 100%;
	background: #fff;
	border-radius: 24rpx 24rpx 0 0;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
}

.picker-header { padding: 32rpx; border-bottom: 1rpx solid $app-border; }
.picker-title { font-size: 32rpx; font-weight: 500; color: $app-text; display: block; margin-bottom: 20rpx; }
.search-bar {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 16rpx 20rpx;
	background: $app-bg;
	border-radius: 12rpx;
}
.search-bar .app-icon { color: $app-text-muted; }
.search-input { flex: 1; font-size: 28rpx; color: $app-text; }

.picker-list { flex: 1; max-height: 60vh; }
.picker-item {
	display: flex;
	align-items: center;
	padding: 24rpx 32rpx;
	border-bottom: 1rpx solid $app-border;
}
.picker-avatar-wrap {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
}
.picker-avatar-text { font-size: 24rpx; font-weight: bold; color: #fff; }
.picker-info { flex: 1; }
.picker-name { font-size: 30rpx; font-weight: 500; color: $app-text; display: block; }
.picker-meta { font-size: 24rpx; color: $app-text-muted; margin-top: 4rpx; }
.picker-check {
	width: 40rpx; height: 40rpx;
	border-radius: 50%;
	background: $app-primary;
	display: flex;
	align-items: center;
	justify-content: center;
}
.picker-check .app-icon { font-size: 24rpx; color: #fff; }

.picker-footer { padding: 24rpx 32rpx; border-top: 1rpx solid $app-border; }
.picker-cancel { text-align: center; font-size: 30rpx; color: $app-text-secondary; }
</style>