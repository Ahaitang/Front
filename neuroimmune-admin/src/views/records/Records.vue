<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRecordList, deleteRecord as deleteRecordApi } from '@/api'
import type { MedicalRecord } from '@/api'

const searchForm = ref({
  keyword: '',
  type: '',
  startDate: '',
  endDate: '',
  dateRange: [] as string[]
})

const tableData = ref<MedicalRecord[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = ref({
  pageNum: 1,
  pageSize: 10
})

const dialogVisible = ref(false)
const currentRecord = ref<MedicalRecord | null>(null)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      ...pagination.value,
      keyword: searchForm.value.keyword,
      type: searchForm.value.type,
      startDate: searchForm.value.dateRange?.[0] || '',
      endDate: searchForm.value.dateRange?.[1] || ''
    }
    const res = await getRecordList(params)
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
  loadData()
})

const handleSearch = () => {
  pagination.value.pageNum = 1
  loadData()
}

const handleReset = () => {
  searchForm.value = {
    keyword: '',
    type: '',
    startDate: '',
    endDate: '',
    dateRange: []
  }
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

const viewRecord = (row: MedicalRecord) => {
  currentRecord.value = { ...row }
  dialogVisible.value = true
}

const deleteRecord = (row: MedicalRecord) => {
  ElMessageBox.confirm('确定要删除该病历记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRecordApi(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const formatDate = (date: string) => {
  return date || '-'
}
</script>

<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="患者/诊断/医院"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" clearable placeholder="全部" style="width: 120px">
            <el-option label="门诊病历" value="门诊病历" />
            <el-option label="住院病历" value="住院病历" />
            <el-option label="外院病历" value="外院病历" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 240px"
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
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="patientName" label="患者" min-width="100" />
        <el-table-column prop="type" label="类型" min-width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="diagnosis" label="诊断" min-width="140" />
        <el-table-column prop="hospital" label="医院" min-width="120" />
        <el-table-column prop="department" label="科室" min-width="100" />
        <el-table-column prop="doctorName" label="医生" min-width="100" />
        <el-table-column prop="date" label="日期" min-width="120" />
        <el-table-column prop="createTime" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewRecord(row)">查看</el-button>
            <el-button type="danger" link @click="deleteRecord(row)">删除</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog v-model="dialogVisible" title="病历详情" width="600px">
      <template v-if="currentRecord">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ currentRecord.id }}</el-descriptions-item>
          <el-descriptions-item label="患者">{{ currentRecord.patientName }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag size="small">{{ currentRecord.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="诊断">{{ currentRecord.diagnosis }}</el-descriptions-item>
          <el-descriptions-item label="医院">{{ currentRecord.hospital }}</el-descriptions-item>
          <el-descriptions-item label="科室">{{ currentRecord.department }}</el-descriptions-item>
          <el-descriptions-item label="医生">{{ currentRecord.doctorName }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ currentRecord.date }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentRecord.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="病历内容" :span="2">
            <div style="white-space: pre-wrap">{{ currentRecord.content }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>