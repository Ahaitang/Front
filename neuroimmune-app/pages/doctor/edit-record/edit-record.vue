<template>
	<view class="container">
		<view class="card">
			<view class="tips">
				<text>{{ isEdit ? '编辑病历信息' : '添加病历记录' }}</text>
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
				<text class="section-title">就诊日期 <text class="required">*</text></text>
				<picker mode="date" :value="form.date" @change="onDateChange">
					<view class="picker-input">
						<text class="picker-value">{{ form.date || '请选择日期' }}</text>
						<text class="app-icon uniui-arrowright"></text>
					</view>
				</picker>
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
				<text class="section-title">资料内容</text>
				<textarea
					class="textarea"
					v-model="form.content"
					placeholder="请输入病历内容"
					:maxlength="2000"
				/>
				<text class="char-count">{{ form.content.length }}/2000</text>
			</view>

			<!-- 备注 -->
			<view class="section">
				<text class="section-title">备注（选填）</text>
				<input class="input" v-model="form.remark" placeholder="其他需要说明的信息" />
			</view>

			<button class="btn primary" :loading="loading" @click="submit">{{ isEdit ? '保存修改' : '提交' }}</button>
		</view>
	</view>
</template>

<script>
import { getMedicalRecordById, createMedicalRecord, updateMedicalRecord } from '@/api/medicalRecord.js'
import { uploadFile } from '@/api/request.js'

export default {
	data() {
		return {
			recordId: null,
			isEdit: false,
			patientId: '',
			patientName: '',
			images: [],
			existingAttachments: [],
			typeIndex: 0,
			typeOptions: [
				{ label: '外院病历', value: '外院病历' },
				{ label: '门诊病历', value: '门诊病历' },
				{ label: '住院病历', value: '住院病历' }
			],
			form: {
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
		}
	},
	onLoad(options) {
		if (options.id) {
			this.recordId = options.id
			this.isEdit = true
			this.loadRecord()
		} else {
			const today = new Date()
			this.form.date = this.formatDate(today)
		}
		if (options.patientId) {
			this.patientId = options.patientId
		}
		if (options.patientName) {
			this.patientName = decodeURIComponent(options.patientName)
		}
		if (options.type) {
			const idx = this.typeOptions.findIndex(t => t.value === options.type)
			if (idx >= 0) this.typeIndex = idx
		}
	},
	methods: {
		formatDate(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		onTypeChange(e) {
			this.typeIndex = e.detail.value
		},
		async loadRecord() {
			try {
				uni.showLoading({ title: '加载中...' })
				const res = await getMedicalRecordById(this.recordId)
				if (res) {
					this.form.date = res.date ? (typeof res.date === 'string' ? res.date.split('T')[0] : res.date) : ''
					this.form.hospital = res.hospital || ''
					this.form.department = res.department || ''
					this.form.doctorName = res.doctorName || ''
					this.form.diagnosis = res.diagnosis || ''
					this.form.content = res.content || ''
					this.form.remark = res.notes || ''
					this.patientId = res.patientId || this.patientId
					this.patientName = res.patientName || this.patientName
					// 设置类型
					const idx = this.typeOptions.findIndex(t => t.value === res.type)
					if (idx >= 0) this.typeIndex = idx
					// 已有图片
					if (res.attachments) {
						this.existingAttachments = res.attachments.split(',').filter(url => url)
						this.images = [...this.existingAttachments]
					}
				}
				uni.hideLoading()
			} catch (e) {
				uni.hideLoading()
				uni.showToast({ title: '加载失败', icon: 'none' })
			}
		},
		onDateChange(e) {
			this.form.date = e.detail.value
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
		async uploadImages() {
			const urls = []
			for (const path of this.images) {
				if (this.existingAttachments.includes(path)) {
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

				const data = {
					patientId: this.patientId,
					patientName: this.patientName,
					type: this.typeOptions[this.typeIndex].value,
					date: this.form.date,
					hospital: this.form.hospital,
					department: this.form.department,
					doctorName: this.form.doctorName,
					diagnosis: this.form.diagnosis,
					content: this.form.content,
					attachments: attachments.join(','),
					notes: this.form.remark
				}

				if (this.isEdit) {
					await updateMedicalRecord(this.recordId, data)
					uni.showToast({ title: '修改成功', icon: 'success' })
				} else {
					await createMedicalRecord(data)
					uni.showToast({ title: '提交成功', icon: 'success' })
				}
				setTimeout(() => uni.navigateBack(), 800)
			} catch (e) {
				console.error('提交失败:', e)
				uni.showToast({ title: this.isEdit ? '修改失败' : '提交失败', icon: 'none' })
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

.section-title {
	font-size: 28rpx;
	color: $app-text;
	font-weight: 500;
	margin-bottom: 12rpx;
	display: block;
}

.required {
	color: #EF4444;
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
	background: $app-primary;
	color: #fff;
}
</style>