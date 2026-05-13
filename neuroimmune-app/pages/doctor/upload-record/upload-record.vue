<template>
	<view class="container">
		<view class="card">
			<view class="tips">
				<text>为患者上传病历资料，便于全面了解病情进展。</text>
			</view>

			<!-- 选择患者 -->
			<view class="section">
				<text class="section-title">选择患者 <text class="required">*</text></text>
				<view class="patient-select" @click="showPatientPicker = true">
					<view class="patient-info" v-if="form.patientId">
						<text class="patient-name">{{ form.patientName }}</text>
						<text class="patient-meta">{{ form.patientGender }} · {{ form.patientAge }}岁</text>
					</view>
					<view class="select-placeholder" v-else>
						<text class="app-icon uniui-contact-filled"></text>
						<text>请选择患者</text>
					</view>
					<text class="app-icon uniui-arrowright"></text>
				</view>
			</view>

			<!-- 病历类型 -->
			<view class="section">
				<text class="section-title">病历类型 <text class="required">*</text></text>
				<picker :value="typeIndex" :range="typeOptions" range-key="label" @change="onTypeChange">
					<view class="picker-input">
						<text class="picker-value">{{ typeOptions[typeIndex].label }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
			</view>

			<!-- 就诊日期 -->
			<view class="section">
				<text class="section-title">就诊时间 <text class="required">*</text></text>
				<uni-datetime-picker type="datetime" v-model="form.date" :placeholder="'请选择就诊时间'" />
			</view>

			<!-- 医院 -->
			<view class="section" v-if="isExternal">
				<text class="section-title">就诊医院</text>
				<input class="input" v-model="form.hospital" placeholder="请输入医院名称" />
			</view>

			<!-- 科室 -->
			<view class="section">
				<text class="section-title">科室</text>
				<input class="input" v-model="form.department" placeholder="请输入科室" />
			</view>

			<!-- 医生姓名 -->
			<view class="section">
				<text class="section-title">医生姓名</text>
				<input class="input" v-model="form.doctorName" placeholder="请输入医生姓名" />
			</view>

			<!-- 诊断结果 -->
			<view class="section">
				<text class="section-title">诊断结果</text>
				<textarea class="textarea" v-model="form.diagnosis" placeholder="请输入诊断结果" />
			</view>

			<!-- 图片上传区域 -->
			<view class="section">
				<text class="section-title">上传图片</text>
				<view class="upload-area" @click="chooseImage">
					<text class="upload-icon">+</text>
					<text class="upload-text">点击上传图片</text>
				</view>
				<view class="image-list" v-if="images.length">
					<view class="image-item" v-for="(img, i) in images" :key="i">
						<image class="preview-img" :src="img" mode="aspectFill" />
						<view class="del-btn" @click="delImage(i)">×</view>
					</view>
				</view>
			</view>

			<!-- 资料内容 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">资料内容</text>
					<text class="section-tip" v-if="images.length" @click="parseImages">解析图片</text>
				</view>
				<textarea
					class="textarea"
					v-model="form.content"
					placeholder="请输入或粘贴就诊资料内容，也可上传图片后点击【解析图片】自动识别"
					:maxlength="2000"
				/>
				<text class="char-count">{{ form.content.length }}/2000</text>
			</view>

			<!-- 备注 -->
			<view class="section">
				<text class="section-title">备注（选填）</text>
				<input class="input" v-model="form.remark" placeholder="其他需要说明的信息" />
			</view>

			<button class="btn primary" :loading="loading" @click="submit">提交病历</button>
		</view>

		<!-- 患者选择弹窗 -->
		<view class="picker-mask" v-if="showPatientPicker" @click="showPatientPicker = false">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-title">选择患者</text>
					<view class="search-bar">
						<text class="app-icon sm uniui-search"></text>
						<input class="search-input" placeholder="搜索患者姓名" v-model="searchKeyword" />
					</view>
				</view>
				<scroll-view class="picker-list" scroll-y>
					<view class="picker-item" v-for="(p, i) in filteredPatients" :key="i" @click="selectPatient(p)">
						<view class="picker-avatar">
							<text class="avatar-text">{{ p.name.charAt(0) }}</text>
						</view>
						<view class="picker-info">
							<text class="picker-name">{{ p.name }}</text>
							<text class="picker-meta">{{ p.gender }} · {{ p.age }}岁 · {{ p.diseaseType || '' }}</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
import { getMyPatients } from '@/api/patient.js'
import { createMedicalRecord } from '@/api/medicalRecord.js'
import { parseMedicalRecord } from '@/api/ocr.js'
import { uploadFile } from '@/api/request.js'

export default {
	data() {
		return {
			showPatientPicker: false,
			searchKeyword: '',
			patientList: [],
			images: [],
			typeIndex: 0,
			typeOptions: [
				{ label: '门诊病历', value: '门诊病历' },
				{ label: '住院病历', value: '住院病历' },
				{ label: '检查报告', value: '检查报告' },
				{ label: '化验报告', value: '化验报告' },
				{ label: '外院病历', value: '外院病历' }
			],
			form: {
				patientId: null,
				patientName: '',
				patientGender: '',
				patientAge: '',
				date: '',
				hospital: '',
				department: '',
				doctorName: '',
				diagnosis: '',
				content: '',
				remark: ''
			},
			loading: false
		}
	},
	computed: {
		isExternal() {
			return this.typeOptions[this.typeIndex].value === '外院病历'
		},
		filteredPatients() {
			const k = this.searchKeyword.trim().toLowerCase()
			if (!k) return this.patientList
			return this.patientList.filter(p => (p.name || '').toLowerCase().includes(k))
		}
	},
	onLoad(options) {
		this.loadPatients()
		// 设置默认日期
		const today = new Date()
		this.form.date = this.formatDateTime(today)
		// 如果传入了 patientId，自动选中
		if (options.patientId) {
			this.form.patientId = parseInt(options.patientId)
			this.form.patientName = options.patientName || ''
		}
	},
	methods: {
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
			try {
				const res = await getMyPatients({ pageNum: 1, pageSize: 200 })
				if (res && res.list) {
					this.patientList = res.list.map(p => ({
						id: p.id,
						name: p.name || '患者',
						gender: p.gender === 'male' ? '男' : (p.gender === 'female' ? '女' : p.gender || '未知'),
						age: p.age || '-',
						diseaseType: p.diseaseTypes?.[0] || ''
					}))
					// 如果已有patientId，填充信息
					if (this.form.patientId) {
						const patient = this.patientList.find(p => p.id === this.form.patientId)
						if (patient) {
							this.form.patientName = patient.name
							this.form.patientGender = patient.gender
							this.form.patientAge = patient.age
						}
					}
				}
			} catch (e) {
				console.error('加载患者列表失败:', e)
			}
		},
		selectPatient(patient) {
			this.form.patientId = patient.id
			this.form.patientName = patient.name
			this.form.patientGender = patient.gender
			this.form.patientAge = patient.age
			this.showPatientPicker = false
		},
		onTypeChange(e) {
			this.typeIndex = e.detail.value
		},
		chooseImage() {
			uni.chooseImage({
				count: 9 - this.images.length,
				success: (res) => {
					this.images = [...this.images, ...res.tempFilePaths]
				}
			})
		},
		delImage(i) {
			this.images.splice(i, 1)
		},
		async parseImages() {
			if (!this.images.length) {
				uni.showToast({ title: '请先上传图片', icon: 'none' })
				return
			}

			uni.showLoading({ title: '上传并解析中...' })
			try {
				// 上传图片获取真实URL
				const urls = []
				for (const path of this.images) {
					try {
						const res = await uploadFile(path)
						if (res && res.url) {
							urls.push(res.url)
							// 更新显示为真实URL
							const idx = this.images.indexOf(path)
							if (idx >= 0) {
								this.images[idx] = res.url
							}
						}
					} catch (e) {
						console.error('上传失败:', e)
					}
				}

				// OCR识别
				if (urls.length > 0) {
					const res = await parseMedicalRecord(urls)
					if (res && res.content) {
						this.form.content = res.content
						uni.showToast({ title: '解析成功', icon: 'success' })
					} else if (res && !res.success) {
						uni.showToast({ title: res.errorMsg || '识别失败', icon: 'none' })
					}
				}
			} catch (e) {
				console.error('解析失败:', e)
				uni.showToast({ title: '解析失败，请手动输入', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		},
		async uploadImages() {
			const urls = []
			for (const path of this.images) {
				// 如果已经是URL则直接使用
				if (path.startsWith('http')) {
					urls.push(path)
					continue
				}
				try {
					const res = await uploadFile(path)
					if (res && res.url) {
						urls.push(res.url)
					}
				} catch (e) {
					console.error('上传失败:', e)
				}
			}
			return urls
		},
		async submit() {
			if (!this.form.patientId) {
				uni.showToast({ title: '请选择患者', icon: 'none' })
				return
			}
			if (!this.form.date) {
				uni.showToast({ title: '请选择就诊日期', icon: 'none' })
				return
			}
			if (!this.form.content.trim() && !this.images.length && !this.form.diagnosis) {
				uni.showToast({ title: '请填写诊断或上传资料', icon: 'none' })
				return
			}

			this.loading = true
			try {
				let attachments = []
				if (this.images.length) {
					uni.showLoading({ title: '上传图片中...' })
					attachments = await this.uploadImages()
					uni.hideLoading()
				}

				const doctorInfo = uni.getStorageSync('userInfo') || {}
				const data = {
					patientId: this.form.patientId,
					patientName: this.form.patientName,
					type: this.typeOptions[this.typeIndex].value,
					date: this.form.date,
					hospital: this.form.hospital,
					department: this.form.department,
					doctorName: this.form.doctorName,
					diagnosis: this.form.diagnosis,
					content: this.form.content,
					attachments: attachments.join(','),
					notes: this.form.remark,
					doctorId: doctorInfo.id
				}

				await createMedicalRecord(data)
				uni.showToast({ title: '提交成功', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 800)
			} catch (e) {
				console.error('提交失败:', e)
				uni.showToast({ title: '提交失败', icon: 'none' })
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
	padding-bottom: 60rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

.tips {
	font-size: 28rpx;
	color: $app-text-muted;
	margin-bottom: 32rpx;
	line-height: 1.5;
}

.section {
	margin-bottom: 28rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.section-title {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	margin-bottom: 12rpx;
	display: block;
}

.section-header .section-title {
	margin-bottom: 0;
}

.section-tip {
	font-size: 26rpx;
	color: $app-primary;
}

.required {
	color: #EF4444;
}

/* 患者选择 */
.patient-select {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid $app-border;
	border-radius: $app-radius;
	background: $app-bg;
}

.patient-info {
	flex: 1;
}

.patient-name {
	font-size: 28rpx;
	font-weight: 500;
	color: $app-text;
}

.patient-meta {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-left: 12rpx;
}

.select-placeholder {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 12rpx;
	color: $app-text-muted;
}

.select-placeholder .app-icon {
	font-size: 32rpx;
}

.patient-select .app-icon {
	font-size: 28rpx;
	color: $app-text-muted;
}

.picker-input {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid $app-border;
	border-radius: $app-radius;
	background: $app-bg;
}

.picker-value {
	font-size: 28rpx;
	color: $app-text;
}

.picker-input .app-icon {
	font-size: 28rpx;
	color: $app-text-muted;
}

.input {
	width: 100%;
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid $app-border;
	border-radius: $app-radius;
	font-size: 28rpx;
	color: $app-text;
	background: $app-bg;
	box-sizing: border-box;
}

.textarea {
	width: 100%;
	min-height: 160rpx;
	padding: 20rpx;
	border: 2rpx solid $app-border;
	border-radius: $app-radius;
	font-size: 28rpx;
	color: $app-text;
	background: $app-bg;
	box-sizing: border-box;
}

.char-count {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
}

.upload-area {
	border: 2rpx dashed $app-border;
	border-radius: $app-radius;
	padding: 48rpx;
	text-align: center;
}

.upload-icon {
	font-size: 64rpx;
	color: $app-text-muted;
	display: block;
}

.upload-text {
	font-size: 28rpx;
	color: $app-text-muted;
	margin-top: 12rpx;
	display: block;
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 20rpx;
}

.image-item {
	position: relative;
	width: 160rpx;
	height: 160rpx;
}

.preview-img {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
}

.del-btn {
	position: absolute;
	top: -12rpx;
	right: -12rpx;
	width: 40rpx;
	height: 40rpx;
	background: #EF4444;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	line-height: 1;
}

.btn {
	margin-top: 32rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: $app-radius;
	font-size: 32rpx;
	font-weight: 500;
}

.btn.primary {
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	color: #fff;
}

/* 患者选择弹窗 */
.picker-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
}

.picker-content {
	width: 100%;
	background: #fff;
	border-radius: 24rpx 24rpx 0 0;
	max-height: 70vh;
	display: flex;
	flex-direction: column;
}

.picker-header {
	padding: 32rpx;
	border-bottom: 1rpx solid $app-border;
}

.picker-title {
	font-size: 32rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
	margin-bottom: 20rpx;
}

.search-bar {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 16rpx 20rpx;
	background: $app-bg;
	border-radius: 12rpx;
}

.search-bar .app-icon {
	color: $app-text-muted;
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: $app-text;
}

.picker-list {
	flex: 1;
	max-height: 50vh;
}

.picker-item {
	display: flex;
	align-items: center;
	padding: 24rpx 32rpx;
	border-bottom: 1rpx solid $app-border;
}

.picker-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.avatar-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
}

.picker-info {
	flex: 1;
}

.picker-name {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
}

.picker-meta {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
}
</style>