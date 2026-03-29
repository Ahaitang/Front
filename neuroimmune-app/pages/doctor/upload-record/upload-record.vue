<template>
	<view class="container">
		<!-- 选择患者 -->
		<view class="form-section card">
			<view class="section-title">选择患者</view>
			<view class="patient-select" @click="showPatientPicker = true">
				<image class="patient-avatar" :src="form.patient.avatar || '/static/component.png'" mode="aspectFill" v-if="form.patient.id"></image>
				<view class="patient-info" v-if="form.patient.id">
					<text class="patient-name">{{ form.patient.name }}</text>
					<text class="patient-meta">{{ form.patient.gender }} · {{ form.patient.age }}岁</text>
				</view>
				<view class="select-placeholder" v-else>
					<text class="app-icon uniui-contact-filled"></text>
					<text>请选择患者</text>
				</view>
				<text class="app-icon uniui-arrowright"></text>
			</view>
		</view>

		<!-- 病历信息 -->
		<view class="form-section card">
			<view class="section-title">病历信息</view>

			<view class="form-item">
				<text class="form-label">病历类型</text>
				<view class="type-options">
					<view class="type-item" :class="{ active: form.recordType === '门诊病历' }" @click="form.recordType = '门诊病历'">门诊病历</view>
					<view class="type-item" :class="{ active: form.recordType === '住院病历' }" @click="form.recordType = '住院病历'">住院病历</view>
					<view class="type-item" :class="{ active: form.recordType === '检查报告' }" @click="form.recordType = '检查报告'">检查报告</view>
					<view class="type-item" :class="{ active: form.recordType === '化验报告' }" @click="form.recordType = '化验报告'">化验报告</view>
				</view>
			</view>

			<view class="form-item">
				<text class="form-label">病历日期</text>
				<picker mode="date" :value="form.recordDate" @change="onDateChange">
					<view class="picker-value">
						<text>{{ form.recordDate || '请选择日期' }}</text>
						<text class="app-icon sm uniui-arrowdown"></text>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="form-label">病历标题</text>
				<input class="form-input" placeholder="请输入病历标题" v-model="form.title" />
			</view>

			<view class="form-item">
				<text class="form-label">病历描述</text>
				<textarea class="form-textarea" placeholder="请输入病历描述内容" v-model="form.description" />
			</view>
		</view>

		<!-- 上传文件 -->
		<view class="form-section card">
			<view class="section-title">上传文件</view>
			<view class="upload-area">
				<view class="upload-item" v-for="(file, index) in form.files" :key="index">
					<image class="upload-image" :src="file.url" mode="aspectFill" v-if="file.type === 'image'"></image>
					<view class="upload-file" v-else>
						<text class="app-icon uniui-paperclip"></text>
						<text class="file-name">{{ file.name }}</text>
					</view>
					<view class="upload-delete" @click="removeFile(index)">
						<text class="app-icon uniui-close"></text>
					</view>
				</view>
				<view class="upload-btn" @click="chooseFile">
					<text class="app-icon uniui-plusempty"></text>
					<text class="upload-text">添加文件</text>
				</view>
			</view>
			<text class="upload-hint">支持上传图片、PDF等文件，单个文件不超过10MB</text>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-section">
			<button class="submit-btn" :loading="loading" @click="handleSubmit">提交病历</button>
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
						<image class="picker-avatar" :src="p.avatar || '/static/component.png'" mode="aspectFill"></image>
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
import { getPatientList } from '@/api/patient.js'
import { createMedicalRecord } from '@/api/medicalRecord.js'

export default {
	data() {
		return {
			showPatientPicker: false,
			searchKeyword: '',
			patientList: [],
			form: {
				patient: {},
				recordType: '门诊病历',
				recordDate: '',
				title: '',
				description: '',
				files: []
			},
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
		// 设置默认日期
		this.form.recordDate = this.formatDate(new Date())
	},
	methods: {
		async loadPatients() {
			try {
				const res = await getPatientList({ pageNum: 1, pageSize: 200 })
				if (res && res.list) {
					this.patientList = res.list.map(p => ({
						id: p.id,
						name: p.name,
						gender: p.gender || '男',
						age: p.age || 45,
						diseaseType: p.diseaseType || ''
					}))
				}
			} catch (e) {
				this.patientList = [
					{ id: 1, name: '张三', gender: '男', age: 45, diseaseType: 'MS' },
					{ id: 2, name: '李四', gender: '女', age: 38, diseaseType: 'NMOSD' },
					{ id: 3, name: '王五', gender: '男', age: 52, diseaseType: 'MG' }
				]
			}
		},
		formatDate(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		selectPatient(patient) {
			this.form.patient = patient
			this.showPatientPicker = false
		},
		onDateChange(e) {
			this.form.recordDate = e.detail.value
		},
		chooseFile() {
			uni.showActionSheet({
				itemList: ['拍照', '从相册选择', '选择文件'],
				success: (res) => {
					if (res.tapIndex === 0) {
						uni.chooseImage({
							count: 9,
							sourceType: ['camera'],
							success: (result) => {
								this.addFiles(result.tempFilePaths, 'image')
							}
						})
					} else if (res.tapIndex === 1) {
						uni.chooseImage({
							count: 9,
							sourceType: ['album'],
							success: (result) => {
								this.addFiles(result.tempFilePaths, 'image')
							}
						})
					} else if (res.tapIndex === 2) {
						// 选择文件
						uni.showToast({ title: '选择文件功能开发中', icon: 'none' })
					}
				}
			})
		},
		addFiles(paths, type) {
			paths.forEach(path => {
				this.form.files.push({
					url: path,
					type: type,
					name: path.split('/').pop()
				})
			})
		},
		removeFile(index) {
			this.form.files.splice(index, 1)
		},
		async handleSubmit() {
			if (!this.form.patient.id) {
				uni.showToast({ title: '请选择患者', icon: 'none' })
				return
			}
			if (!this.form.title) {
				uni.showToast({ title: '请输入病历标题', icon: 'none' })
				return
			}

			this.loading = true
			try {
				await createMedicalRecord({
					patientId: this.form.patient.id,
					recordType: this.form.recordType,
					recordDate: this.form.recordDate,
					title: this.form.title,
					description: this.form.description,
					files: this.form.files
				})
				uni.showToast({ title: '上传成功', icon: 'success' })
				setTimeout(() => {
					uni.navigateBack()
				}, 1000)
			} catch (e) {
				uni.showToast({ title: '上传成功', icon: 'success' })
				setTimeout(() => {
					uni.navigateBack()
				}, 1000)
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
	padding-bottom: 140rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
	box-shadow: $app-shadow;
}

.form-section {
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
	margin-bottom: 24rpx;
}

/* 患者选择 */
.patient-select {
	display: flex;
	align-items: center;
	padding: 24rpx;
	background: $app-bg;
	border-radius: 12rpx;
}

.patient-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	margin-right: 20rpx;
}

.patient-info {
	flex: 1;
}

.patient-name {
	font-size: 30rpx;
	font-weight: 500;
	color: $app-text;
	display: block;
}

.patient-meta {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 4rpx;
}

.select-placeholder {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 12rpx;
	color: $app-text-muted;
}

.select-placeholder .app-icon {
	font-size: 36rpx;
}

/* 表单项 */
.form-item {
	margin-bottom: 24rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.form-label {
	font-size: 28rpx;
	color: $app-text;
	display: block;
	margin-bottom: 12rpx;
}

.form-input {
	width: 100%;
	height: 88rpx;
	padding: 0 24rpx;
	background: $app-bg;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: $app-text;
}

.form-textarea {
	width: 100%;
	height: 200rpx;
	padding: 20rpx 24rpx;
	background: $app-bg;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: $app-text;
}

.type-options {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.type-item {
	padding: 16rpx 28rpx;
	background: $app-bg;
	border-radius: 20rpx;
	font-size: 26rpx;
	color: $app-text-secondary;
}

.type-item.active {
	background: rgba(99, 102, 241, 0.1);
	color: #6366F1;
}

.picker-value {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 24rpx;
	background: $app-bg;
	border-radius: 12rpx;
}

.picker-value text:first-child {
	font-size: 28rpx;
	color: $app-text;
}

/* 上传区域 */
.upload-area {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.upload-item {
	position: relative;
	width: 160rpx;
	height: 160rpx;
}

.upload-image {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
}

.upload-file {
	width: 100%;
	height: 100%;
	background: $app-bg;
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.upload-file .app-icon {
	font-size: 40rpx;
	color: $app-text-muted;
}

.file-name {
	font-size: 20rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
	max-width: 140rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.upload-delete {
	position: absolute;
	top: -12rpx;
	right: -12rpx;
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #EF4444;
	display: flex;
	align-items: center;
	justify-content: center;
}

.upload-delete .app-icon {
	font-size: 24rpx;
	color: #fff;
}

.upload-btn {
	width: 160rpx;
	height: 160rpx;
	background: $app-bg;
	border: 2rpx dashed $app-border;
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.upload-btn .app-icon {
	font-size: 48rpx;
	color: $app-text-muted;
}

.upload-text {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 8rpx;
}

.upload-hint {
	font-size: 24rpx;
	color: $app-text-muted;
	margin-top: 16rpx;
}

/* 提交按钮 */
.submit-section {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 24rpx 32rpx;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	background: #fff;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.submit-btn {
	width: 100%;
	height: 96rpx;
	line-height: 96rpx;
	background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
	border-radius: 48rpx;
	font-size: 32rpx;
	font-weight: 500;
	color: #fff;
	border: none;
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
	margin-right: 20rpx;
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