<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { updateDoctorProfile, updateDoctorPassword, updateAdminPassword } from '@/api'

// 用户信息
const userInfo = ref<any>({})
const userRole = ref('')
const userId = ref<number>(0)

// 表单
const profileForm = ref({
  name: '',
  phone: '',
  title: '',
  department: '',
  hospital: ''
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const profileLoading = ref(false)
const passwordLoading = ref(false)

// 是否是医生角色
const isDoctor = computed(() => userRole.value === 'doctor')

// 加载用户信息
const loadUserInfo = () => {
  const userStr = localStorage.getItem('admin_user')
  const role = localStorage.getItem('admin_role')
  if (userStr) {
    userInfo.value = JSON.parse(userStr)
    userId.value = userInfo.value.id
    profileForm.value = {
      name: userInfo.value.name || '',
      phone: userInfo.value.phone || '',
      title: userInfo.value.title || '',
      department: userInfo.value.department || '',
      hospital: userInfo.value.hospital || ''
    }
  }
  userRole.value = role || 'admin'
}

// 保存个人信息
const saveProfile = async () => {
  if (!profileForm.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!profileForm.value.phone) {
    ElMessage.warning('请输入手机号')
    return
  }

  profileLoading.value = true
  try {
    if (isDoctor.value) {
      await updateDoctorProfile(userId.value, {
        name: profileForm.value.name,
        phone: profileForm.value.phone,
        title: profileForm.value.title,
        department: profileForm.value.department,
        hospital: profileForm.value.hospital
      })
    }
    // 更新本地存储
    userInfo.value = { ...userInfo.value, ...profileForm.value }
    localStorage.setItem('admin_user', JSON.stringify(userInfo.value))
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    profileLoading.value = false
  }
}

// 修改密码
const changePassword = async () => {
  if (!passwordForm.value.oldPassword) {
    ElMessage.warning('请输入原密码')
    return
  }
  if (!passwordForm.value.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.warning('新密码长度不能少于6位')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  passwordLoading.value = true
  try {
    if (isDoctor.value) {
      await updateDoctorPassword(userId.value, passwordForm.value.newPassword)
    } else {
      await updateAdminPassword(userId.value, passwordForm.value.newPassword)
    }
    ElMessage.success('密码修改成功')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e) {
    ElMessage.error('密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<template>
  <div class="page-container">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :span="12">
        <div class="content-card">
          <div class="card-title">个人信息</div>
          <el-form :model="profileForm" label-width="100px">
            <el-form-item label="姓名" required>
              <el-input v-model="profileForm.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="手机号" required>
              <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <template v-if="isDoctor">
              <el-form-item label="职称">
                <el-select v-model="profileForm.title" style="width: 100%">
                  <el-option label="主任医师" value="主任医师" />
                  <el-option label="副主任医师" value="副主任医师" />
                  <el-option label="主治医师" value="主治医师" />
                  <el-option label="住院医师" value="住院医师" />
                  <el-option label="规培医师" value="规培医师" />
                </el-select>
              </el-form-item>
              <el-form-item label="科室">
                <el-input v-model="profileForm.department" placeholder="请输入科室" />
              </el-form-item>
              <el-form-item label="医院">
                <el-input v-model="profileForm.hospital" placeholder="请输入医院" />
              </el-form-item>
            </template>
            <el-form-item>
              <el-button type="primary" :loading="profileLoading" @click="saveProfile">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 修改密码卡片 -->
      <el-col :span="12">
        <div class="content-card">
          <div class="card-title">修改密码</div>
          <el-form :model="passwordForm" label-width="100px">
            <el-form-item label="原密码">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入原密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" required>
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码（至少6位）"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" required>
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="passwordLoading" @click="changePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #0891B2;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}
</style>