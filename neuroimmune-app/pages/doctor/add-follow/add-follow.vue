<template>
	<view class="container">
		<view class="card">
			<view class="form-item">
				<text class="label">患者</text>
				<view class="picker-wrap" @click="selectPatient">
					<text class="picker-text" :class="{ placeholder: !form.patientName }">
						{{ form.patientName || '请选择患者' }}
					</text>
					<text class="app-icon uniui-arrowright"></text>
				</view>
			</view>
			<view class="form-item">
				<text class="label">随访时间</text>
				<uni-datetime-picker type="datetime" v-model="form.date" :placeholder="'请选择随访时间'" />
			</view>
			<view class="form-item">
				<text class="label">随访/检查项目</text>
				<input class="input" type="text" placeholder="如：神经功能评估、MRI检查" v-model="form.project" />
			</view>

			<!-- 详细信息 -->
			<view class="section-title">详细信息</view>

			<view class="form-item">
				<text class="label">门诊时间</text>
				<picker mode="multiSelector" :range="dateTimeRange" @change="onOutpatientTimeChange" @columnchange="onColumnChange">
					<view class="picker-wrap">
						<text class="picker-text" :class="{ placeholder: !form.outpatientTime }">
							{{ form.outpatientTime || '请选择门诊时间' }}
						</text>
						<text class="app-icon uniui-calendar"></text>
					</view>
				</picker>
			</view>
			<view class="form-item">
				<text class="label">住院时间</text>
				<picker mode="date" @change="onHospitalizationChange">
					<view class="picker-wrap">
						<text class="picker-text" :class="{ placeholder: !form.hospitalizationTime }">
							{{ form.hospitalizationTime || '请选择住院时间' }}
						</text>
						<text class="app-icon uniui-calendar"></text>
					</view>
				</picker>
			</view>
			<view class="form-item">
				<text class="label">检查项目</text>
				<textarea class="textarea" placeholder="请输入检查项目，如：血常规、MRI、脑脊液检查等" v-model="form.examinationItems" />
			</view>
			<view class="form-item">
				<text class="label">医院</text>
				<input class="input" type="text" placeholder="请输入医院名称" v-model="form.hospital" />
			</view>
			<view class="form-item">
				<text class="label">科室</text>
				<input class="input" type="text" placeholder="请输入科室名称" v-model="form.department" />
			</view>
			<view class="form-item">
				<text class="label">备注</text>
				<textarea class="textarea" placeholder="选填" v-model="form.notes" />
			</view>

			<button class="btn primary" @click="submit" :loading="loading">保存</button>
		</view>
	</view>
</template>

<script>
import { createFollowUp } from '@/api/followup.js'
import { getDoctorPatientDetails } from '@/api/relation.js'

export default {
	data() {
		return {
			form: {
				patientId: '',
				patientName: '',
				date: '',
				project: '',
				outpatientTime: '',
				hospitalizationTime: '',
				examinationItems: '',
				hospital: '',
				department: '',
				notes: ''
			},
			patients: [],
			loading: false,
			dateTimeRange: [[], [], []]
		};
	},
	onLoad(op) {
		if (op.patientId) {
			this.form.patientId = op.patientId;
			this.form.patientName = op.patientName || '已选患者';
		}
		// 初始化默认随访时间为当前时间
		this.form.date = this.formatDateTime(new Date());
		this.initDateTimeRange();
		this.loadPatients();
	},
	methods: {
		formatDateTime(date) {
			const y = date.getFullYear();
			const m = String(date.getMonth() + 1).padStart(2, '0');
			const d = String(date.getDate()).padStart(2, '0');
			const h = String(date.getHours()).padStart(2, '0');
			const min = String(date.getMinutes()).padStart(2, '0');
			return `${y}-${m}-${d} ${h}:${min}:00`;
		},
		initDateTimeRange() {
			// 初始化日期时间选择器范围
			const hours = [];
			for (let i = 8; i <= 18; i++) {
				hours.push(i + '时');
			}
			const minutes = [];
			for (let i = 0; i < 60; i += 15) {
				minutes.push(i.toString().padStart(2, '0') + '分');
			}
			this.dateTimeRange = [['上午', '下午'], hours, minutes];
		},
		async loadPatients() {
			const userInfo = uni.getStorageSync('userInfo') || {};
			if (!userInfo.id) return;
			try {
				const patients = await getDoctorPatientDetails(userInfo.id);
				if (patients && patients.length) {
					this.patients = patients;
				}
			} catch (e) {
				console.error('获取患者列表失败:', e);
			}
		},
		selectPatient() {
			if (this.patients.length === 0) {
				uni.showToast({ title: '暂无可选患者', icon: 'none' });
				return;
			}
			const items = this.patients.map(p => p.patientName);
			uni.showActionSheet({
				itemList: items,
				success: (res) => {
					const patient = this.patients[res.tapIndex];
					this.form.patientId = patient.patientId;
					this.form.patientName = patient.patientName;
				}
			});
		},
		onOutpatientTimeChange(e) {
			const val = e.detail.value;
			const period = this.dateTimeRange[0][val[0]];
			let hour = parseInt(this.dateTimeRange[1][val[1]]);
			if (period === '下午' && hour < 12) hour += 12;
			const minute = this.dateTimeRange[2][val[2]].replace('分', '');
			this.form.outpatientTime = `${this.form.date ? this.form.date.substring(0, 10) : ''} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
		},
		onColumnChange(e) {
			// 列变化处理
		},
		onHospitalizationChange(e) {
			this.form.hospitalizationTime = e.detail.value;
		},
		async submit() {
			if (!this.form.patientId) {
				uni.showToast({ title: '请选择患者', icon: 'none' });
				return;
			}
			if (!this.form.date) {
				uni.showToast({ title: '请选择随访时间', icon: 'none' });
				return;
			}
			if (!this.form.project) {
				uni.showToast({ title: '请输入随访项目', icon: 'none' });
				return;
			}

			this.loading = true;
			const userInfo = uni.getStorageSync('userInfo') || {};

			// 确保 date 格式为 YYYY-MM-DD HH:mm:ss
			let dateStr = this.form.date;
			if (dateStr && dateStr.length === 10) {
				dateStr = dateStr + ' 00:00:00';
			}

			try {
				await createFollowUp({
					patientId: this.form.patientId,
					patientName: this.form.patientName,
					doctorId: userInfo.id,
					doctorName: userInfo.name,
					date: dateStr,
					project: this.form.project,
					status: 0,
					outpatientTime: this.form.outpatientTime || null,
					hospitalizationTime: (this.form.hospitalizationTime && this.form.hospitalizationTime.length === 10 ? this.form.hospitalizationTime + ' 00:00:00' : this.form.hospitalizationTime) || null,
					examinationItems: this.form.examinationItems,
					hospital: this.form.hospital,
					department: this.form.department,
					notes: this.form.notes
				});
				uni.showToast({ title: '已保存', icon: 'success' });
				setTimeout(() => uni.navigateBack(), 800);
			} catch (e) {
				console.error('保存失败:', e);
				uni.showToast({ title: '保存失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/static/app-theme.scss';

.container {
	min-height: 100vh;
	background: $app-bg;
	padding: 24rpx;
}

.card {
	background: $app-card-bg;
	border-radius: $app-radius;
	padding: 28rpx;
}

.form-item {
	margin-bottom: 28rpx;
}

.label {
	font-size: 28rpx;
	color: $app-text;
	display: block;
	margin-bottom: 12rpx;
	font-weight: 500;
}

.input {
	font-size: 30rpx;
	height: 80rpx;
	background: $app-bg;
	border-radius: 12rpx;
	padding: 0 24rpx;
	width: calc(100% - 48rpx);
}

.textarea {
	font-size: 28rpx;
	min-height: 160rpx;
	background: $app-bg;
	border-radius: 12rpx;
	padding: 20rpx 24rpx;
	width: calc(100% - 48rpx);
}

.picker-wrap {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 80rpx;
	background: $app-bg;
	border-radius: 12rpx;
	padding: 0 24rpx;
}

.picker-text {
	font-size: 30rpx;
	color: $app-text;
}

.picker-text.placeholder {
	color: $app-text-muted;
}

.picker-wrap .app-icon {
	font-size: 32rpx;
	color: $app-text-muted;
}

.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: $app-text;
	margin: 32rpx 0 20rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid $app-border;
}

.btn {
	margin-top: 40rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 12rpx;
	font-size: 32rpx;
}

.btn.primary {
	background: $app-primary;
	color: #fff;
}
</style>