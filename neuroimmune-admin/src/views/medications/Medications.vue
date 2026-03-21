<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMedicationList } from '@/api'
import type { Medication } from '@/api'

const searchForm = ref({
  keyword: '',
  startDate: '',
  endDate: '',
  dateRange: [] as string[]
})

const tableData = ref<Medication[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = ref({
  pageNum: 1,
  pageSize: 10
})

const dialogVisible = ref(false)
const currentMedication = ref<Medication | null>(null)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      ...pagination.value,
      keyword: searchForm.value.keyword,
      startDate: searchForm.value.dateRange?.[0] || '',
      endDate: searchForm.value.dateRange?.[1] || ''
    }
    const res = await getMedicationList(params)
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

const viewMedication = (row: Medication) => {
  currentMedication.value = { ...row }
  dialogVisible.value = true
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
            placeholder="患者/药品/医生"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
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
        <el-table-column prop="medicationName" label="药品名称" min-width="140" />
        <el-table-column label="剂量" min-width="100">
          <template #default="{ row }">
            {{ row.dosage }}{{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="frequency" label="频率" min-width="100" />
        <el-table-column prop="route" label="途径" min-width="80" />
        <el-table-column prop="duration" label="疗程" min-width="80">
          <template #default="{ row }">
            {{ row.duration || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="doctorName" label="开药医生" min-width="100" />
        <el-table-column prop="date" label="开药日期" min-width="120" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewMedication(row)">详情</el-button>
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
    <el-dialog v-model="dialogVisible" title="用药详情" width="500px">
      <template v-if="currentMedication">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ currentMedication.id }}</el-descriptions-item>
          <el-descriptions-item label="患者">{{ currentMedication.patientName }}</el-descriptions-item>
          <el-descriptions-item label="药品名称">{{ currentMedication.medicationName }}</el-descriptions-item>
          <el-descriptions-item label="剂量">{{ currentMedication.dosage }}{{ currentMedication.unit }}</el-descriptions-item>
          <el-descriptions-item label="频率">{{ currentMedication.frequency }}</el-descriptions-item>
          <el-descriptions-item label="用药途径">{{ currentMedication.route }}</el-descriptions-item>
          <el-descriptions-item label="疗程">{{ currentMedication.duration || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开药医生">{{ currentMedication.doctorName }}</el-descriptions-item>
          <el-descriptions-item label="开药日期">{{ currentMedication.date }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentMedication.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentMedication.notes || '-' }}</el-descriptions-item>
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