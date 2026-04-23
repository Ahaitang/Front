<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import {
  getAdminList,
  getDoctorRoles,
  updateDoctorRoles,
  updateDoctorPassword,
  getCommonDictByType,
  DICT_TYPES
} from '@/api'
import type { Doctor, CommonDict } from '@/api'

const searchForm = ref({
  keyword: ''
})

const tableData = ref<Doctor[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = ref({
  pageNum: 1,
  pageSize: 10
})

// 角色编辑对话框
const roleDialogVisible = ref(false)
const roleForm = ref({ id: 0, name: '', roles: [] as string[], level: undefined as number | undefined })
const roleLoading = ref(false)

// 修改密码对话框
const passwordDialogVisible = ref(false)
const passwordForm = ref({ id: 0, password: '', confirmPassword: '' })
const passwordLoading = ref(false)

// 角色选项
const roleOptions = ref<CommonDict[]>([])

// 加载字典
const loadDicts = async () => {
  try {
    roleOptions.value = await getCommonDictByType(DICT_TYPES.ROLE)
  } catch (e) {
    console.error('加载字典失败:', e)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...pagination.value,
      ...searchForm.value
    }
    const res = await getAdminList(params)
    if (res) {
      tableData.value = res.list || []
      total.value = res.total || 0
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDicts()
  loadData()
})

const handleSearch = () => {
  pagination.value.pageNum = 1
  loadData()
}

const handleReset = () => {
  searchForm.value.keyword = ''
  handleSearch()
}

const handlePageChange = (page: number) => {
  pagination.value.pageNum = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.pageNum = 1
  loadData()
}

// 打开角色编辑对话框
const openRoleDialog = async (row: Doctor) => {
  // 从后端获取角色列表
  try {
    const roles = await getDoctorRoles(row.id)
    roleForm.value = {
      id: row.id,
      name: row.name,
      roles: roles || [],
      level: row.level
    }
  } catch (e) {
    // 如果获取失败，使用本地数据
    roleForm.value = {
      id: row.id,
      name: row.name,
      roles: row.roles || (row.role ? row.role.split(',') : ['admin']),
      level: row.level
    }
  }
  roleDialogVisible.value = true
}

// 保存角色设置
const handleSaveRole = async () => {
  if (roleForm.value.roles.length === 0) {
    ElMessage.warning('请至少选择一个角色')
    return
  }
  roleLoading.value = true
  try {
    await updateDoctorRoles(roleForm.value.id, roleForm.value.roles, roleForm.value.level)
    ElMessage.success('角色设置成功')
    roleDialogVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '角色设置失败')
  } finally {
    roleLoading.value = false
  }
}

// 获取角色标签显示文本
const getRoleLabel = (roleCode: string) => {
  const role = roleOptions.value.find(r => r.code === roleCode)
  return role ? role.name : roleCode
}

// 获取角色的标签类型
const getRoleTagType = (roleCode: string) => {
  if (roleCode === 'admin') return 'danger'
  if (roleCode === 'doctor') return 'primary'
  return 'info'
}

// 打开修改密码对话框
const openPasswordDialog = (row: Doctor) => {
  passwordForm.value = { id: row.id, password: '', confirmPassword: '' }
  passwordDialogVisible.value = true
}

// 修改密码
const handleUpdatePassword = async () => {
  if (!passwordForm.value.password) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (passwordForm.value.password.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }
  if (passwordForm.value.password !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  passwordLoading.value = true
  try {
    await updateDoctorPassword(passwordForm.value.id, passwordForm.value.password)
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (e) {
    ElMessage.error('密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

// 移除管理员权限
const removeAdminRole = async (row: Doctor) => {
  // 获取当前角色列表
  let currentRoles: string[] = []
  try {
    currentRoles = await getDoctorRoles(row.id) || []
  } catch (e) {
    currentRoles = row.roles || (row.role ? row.role.split(',') : ['admin'])
  }

  // 移除admin角色，保留其他角色
  const newRoles = currentRoles.filter(r => r !== 'admin')
  if (newRoles.length === 0) {
    newRoles.push('doctor') // 确保至少有一个角色
  }

  ElMessageBox.confirm(`确定要移除 "${row.name}" 的管理员权限吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await updateDoctorRoles(row.id, newRoles, undefined)
      ElMessage.success('已移除管理员权限')
      loadData()
    } catch (e: any) {
      ElMessage.error(e.message || '操作失败')
    }
  }).catch(() => {})
}

// 格式化角色显示
const formatRole = (role: string | undefined) => {
  if (!role) return '管理员'
  if (role.includes('admin') && role.includes('doctor')) return '医生+管理员'
  if (role.includes('admin')) return '管理员'
  return '医生'
}

const formatDate = (date: string) => {
  return date || '-'
}
</script>

<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon><UserFilled /></el-icon>
        管理员管理
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名/手机号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="content-card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column label="管理员信息" min-width="140">
          <template #default="{ row }">
            <div class="info-cell">
              <span class="name">{{ row.name }}</span>
              <span class="meta">{{ row.department }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="职称" min-width="110">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" size="small">{{ row.title }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hospital" label="医院" min-width="140" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column label="角色" min-width="120">
          <template #default="{ row }">
            <template v-if="row.roles && row.roles.length > 0">
              <el-tag
                v-for="role in row.roles"
                :key="role"
                :type="getRoleTagType(role)"
                size="small"
                style="margin-right: 4px"
              >
                {{ getRoleLabel(role) }}
              </el-tag>
            </template>
            <template v-else-if="row.role">
              <el-tag type="danger" size="small">
                {{ formatRole(row.role) }}
              </el-tag>
            </template>
            <template v-else>
              <el-tag type="danger" size="small">管理员</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="等级" min-width="80">
          <template #default="{ row }">
            <el-tag v-if="row.level" type="warning" size="small">Lv.{{ row.level }}</el-tag>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            <span class="text-secondary">{{ formatDate(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openRoleDialog(row)">角色设置</el-button>
            <el-button type="warning" link size="small" @click="openPasswordDialog(row)">修改密码</el-button>
            <el-button type="danger" link size="small" @click="removeAdminRole(row)">移除权限</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 50]"
          :page-size="pagination.pageSize"
          :current-page="pagination.pageNum"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 角色编辑对话框 -->
    <el-dialog v-model="roleDialogVisible" title="角色设置" width="450px">
      <el-form label-width="80px">
        <el-form-item label="管理员">
          <el-input :model-value="roleForm.name" disabled />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="roleForm.roles" multiple style="width: 100%" placeholder="请选择角色">
            <el-option
              v-for="opt in roleOptions"
              :key="opt.id"
              :label="opt.name"
              :value="opt.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="管理等级" v-if="roleForm.roles?.includes('admin')">
          <el-input-number
            v-model="roleForm.level"
            :min="1"
            :max="10"
            placeholder="1为最高等级"
          />
          <div class="level-tip">数字越小等级越高，1为最高等级</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleLoading" @click="handleSaveRole">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form label-width="80px">
        <el-form-item label="新密码" required>
          <el-input
            v-model="passwordForm.password"
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
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleUpdatePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.level-tip {
  font-size: 12px;
  color: #6B7280;
  margin-top: 8px;
}
</style>