<template>
	<view class="container">
		<view class="card">
			<view class="tips">
				<text>{{ tipsText }}</text>
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

			<!-- 料内容 -->
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

			<button class="btn primary" :loading="loading" @click="submit">{{ isEdit ? '保存修改' : '提交' }}</button>
		</view>
	</view>
</template>

<script>
import { createMedicalRecord, getMedicalRecordById, updateMedicalRecord } from '@/api/medicalRecord.js'
import { parseMedicalRecord } from '@/api/ocr.js'
import { uploadFile } from '@/api/request.js'

export default {
	data() {
		return {
			recordId: null,
			isEdit: false,
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
		},
		tipsText() {
			if (this.isEdit) {
				return this.isExternal ? '修改外院病历信息' : '修改本院病历信息'
			}
			return '上传您的就诊资料，便于主治医生全面了解您的病情。'
		}
	},
	onLoad(options) {
		if (options.id) {
			this.recordId = options.id
			this.isEdit = true
			this.loadRecord()
		} else {
			const today = new Date()
			this.form.date = this.formatDateTime(today)
		}
		// 如果传入了 type 参数，设置类型
		if (options.type) {
			const idx = this.typeOptions.findIndex(t => t.value === options.type)
			if (idx >= 0) this.typeIndex = idx
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
		onTypeChange(e) {
			this.typeIndex = e.detail.value
		},
		async loadRecord() {
			try {
				uni.showLoading({ title: '加载中...' })
				const res = await getMedicalRecordById(this.recordId)
				if (res) {
					this.form.date = res.date || ''
					this.form.hospital = res.hospital || ''
					this.form.department = res.department || ''
					this.form.doctorName = res.doctorName || ''
					this.form.diagnosis = res.diagnosis || ''
					this.form.content = res.content || ''
					this.form.remark = res.notes || ''
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
				// 先上传图片获取真实URL
				const urls = []
				for (const path of this.images) {
					if (this.existingAttachments.includes(path)) {
						// 已上传过的图片直接使用
						urls.push(path)
					} else {
						// 上传临时图片到服务器
						const res = await uploadFile(path)
						if (res && res.url) {
							urls.push(res.url)
							// 更新images显示为真实URL
							const idx = this.images.indexOf(path)
							if (idx >= 0) {
								this.images[idx] = res.url
								// 同步更新existingAttachments避免重复上传
								this.existingAttachments.push(res.url)
							}
						}
					}
				}

				// 用真实URL调用OCR识别
				if (urls.length > 0) {
					const res = await parseMedicalRecord(urls)
					if (res && res.content) {
						// 直接覆盖，不追加
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

				const userInfo = uni.getStorageSync('userInfo') || {}
				const data = {
					patientId: userInfo.id,
					patientName: userInfo.name,
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