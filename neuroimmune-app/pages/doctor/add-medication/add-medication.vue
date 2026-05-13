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
				<text class="label">药品名称</text>
				<input class="input" type="text" placeholder="请输入药品名称" v-model="form.medicationName" />
			</view>

			<view class="form-item">
				<text class="label">剂量</text>
				<view class="dose-row">
					<input class="input dose-input" type="text" placeholder="如：100" v-model="form.dosage" />
					<picker :value="unitIndex" :range="unitOptions" @change="onUnitChange">
						<view class="picker-wrap small">
							<text class="picker-text">{{ unitOptions[unitIndex] }}</text>
							<text class="app-icon uniui-arrowdown"></text>
						</view>
					</picker>
				</view>
			</view>

			<view class="form-item">
				<text class="label">用药频率</text>
				<picker :value="freqIndex" :range="freqOptions" @change="onFreqChange">
					<view class="picker-wrap">
						<text class="picker-text">{{ freqOptions[freqIndex] }}</text>
						<text class="app-icon uniui-arrowdown"></text>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="label">用药途径</text>
				<picker :value="routeIndex" :range="routeOptions" @change="onRouteChange">
					<view class="picker-wrap">
						<text class="picker-text">{{ routeOptions[routeIndex] }}</text>
						<text class="app-icon uniui-arrowdown"></text>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="label">服用时间段</text>
				<view class="duration-options">
					<view class="duration-option" :class="{ active: form.duration === d }" v-for="(d, i) in durationOptions" :key="i" @click="form.duration = d">{{ d }}</view>
				</view>
				<input class="input" type="text" placeholder="或自定义输入，如：1个月" v-model="form.duration" style="margin-top: 16rpx;" />
			</view>

			<view class="form-item">
				<text class="label">开始时间</text>
				<uni-datetime-picker type="datetime" v-model="form.date" :placeholder="'请选择开始时间'" />
			</view>

			<view class="form-item">
				<text class="label">备注</text>
				<textarea class="textarea" placeholder="注意事项等（选填）" v-model="form.notes" />
			</view>

			<button class="btn primary" @click="submit" :loading="loading">保存用药建议</button>
		</view>
	</view>
</template>

<script>
import { createMedication } from '@/api/medication.js'
import { getDoctorPatientDetails } from '@/api/relation.js'

export default {
	data() {
		return {
			form: {
				patientId: '',
				patientName: '',
				medicationName: '',
				dosage: '',
				unit: 'mg',
				frequency: '每日一次',
				route: '口服',
				duration: '1个月',
				date: '',
				notes: ''
			},
			patients: [],
			loading: false,
			unitIndex: 0,
			unitOptions: ['mg', 'g', 'ml', '片', '粒', '袋'],
			freqIndex: 0,
			freqOptions: ['每日一次', '每日两次', '每日三次', '隔日一次', '每周一次'],
			routeIndex: 0,
			routeOptions: ['口服', '静脉注射', '肌肉注射', '皮下注射', '外用'],
			durationOptions: ['7天', '14天', '1个月', '3个月', '6个月']
		};
	},
	onLoad(op) {
		if (op.patientId) {
			this.form.patientId = op.patientId;
			this.form.patientName = op.patientName || '已选患者';
		}
		this.loadPatients();
		// 默认今天
		const today = new Date();
		this.form.date = this.formatDateTime(today);
	},
	methods: {
		formatDateTime(date) {
			const y = date.getFullYear();
			const m = String(date.getMonth() + 1).padStart(2, '0');
			const d = String(date.getDate()).padStart(2, '0');
			const h = String(date.getHours()).padStart(2, '0');
			const min = String(date.getMinutes()).padStart(2, '0');
			const s = String(date.getSeconds()).padStart(2, '0');
			return `${y}-${m}-${d} ${h}:${min}:${s}`;
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
		onUnitChange(e) {
			this.unitIndex = e.detail.value;
			this.form.unit = this.unitOptions[this.unitIndex];
		},
		onFreqChange(e) {
			this.freqIndex = e.detail.value;
			this.form.frequency = this.freqOptions[this.freqIndex];
		},
		onRouteChange(e) {
			this.routeIndex = e.detail.value;
			this.form.route = this.routeOptions[this.routeIndex];
		},
		async submit() {
			if (!this.form.patientId) {
				uni.showToast({ title: '请选择患者', icon: 'none' });
				return;
			}
			if (!this.form.medicationName.trim()) {
				uni.showToast({ title: '请输入药品名称', icon: 'none' });
				return;
			}

			this.loading = true;
			const userInfo = uni.getStorageSync('userInfo') || {};

			try {
				await createMedication({
					patientId: this.form.patientId,
					patientName: this.form.patientName,
					doctorId: userInfo.id,
					doctorName: userInfo.name,
					medicationName: this.form.medicationName,
					dosage: this.form.dosage,
					unit: this.form.unit,
					frequency: this.form.frequency,
					route: this.form.route,
					duration: this.form.duration,
					date: this.form.date,
					notes: this.form.notes
				});
				uni.showToast({ title: '保存成功', icon: 'success' });
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
	box-shadow: $app-shadow;
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
	font-size: 28rpx;
	height: 80rpx;
	background: $app-bg;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	padding: 0 24rpx;
	width: calc(100% - 52rpx);
	color: $app-text;
	box-sizing: border-box;
}

.textarea {
	font-size: 28rpx;
	min-height: 120rpx;
	background: $app-bg;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	padding: 20rpx 24rpx;
	width: calc(100% - 52rpx);
	color: $app-text;
	box-sizing: border-box;
}

.picker-wrap {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 80rpx;
	background: $app-bg;
	border: 2rpx solid $app-border;
	border-radius: 12rpx;
	padding: 0 24rpx;
}

.picker-wrap.small {
	width: 160rpx;
	height: 80rpx;
}

.picker-text {
	font-size: 28rpx;
	color: $app-text;
}

.picker-text.placeholder {
	color: $app-text-muted;
}

.picker-wrap .app-icon {
	font-size: 28rpx;
	color: $app-text-muted;
}

.dose-row {
	display: flex;
	gap: 16rpx;
}

.dose-input {
	flex: 1;
}

.duration-options {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.duration-option {
	font-size: 26rpx;
	color: $app-text-secondary;
	padding: 12rpx 24rpx;
	border: 2rpx solid $app-border;
	border-radius: 8rpx;
}

.duration-option.active {
	border-color: $app-primary;
	background: $app-primary-bg;
	color: $app-primary;
}

.btn {
	margin-top: 40rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 12rpx;
	font-size: 32rpx;
	border: none;
}

.btn.primary {
	background: $app-primary;
	color: #fff;
}
</style>