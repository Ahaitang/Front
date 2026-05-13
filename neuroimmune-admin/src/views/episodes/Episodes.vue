<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, DocumentCopy } from '@element-plus/icons-vue'
import { getEpisodeList, deleteEpisode, getPatientList, getRecordList } from '@/api'
import { exportToExcel } from '@/utils/export'
import type { DiseaseEpisode, Patient, MedicalRecord } from '@/api'

const searchForm = ref({
  keyword: '',
  patientId: ''
})

const tableData = ref<DiseaseEpisode[]>([])
const patients = ref<Patient[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = ref({
  pageNum: 1,
  pageSize: 10
})

// 发作详情对话框
const detailVisible = ref(false)
const currentEpisode = ref<DiseaseEpisode | null>(null)
const relatedRecords = ref<MedicalRecord[]>([])
const recordsLoading = ref(false)

// 病历详情对话框
const recordDetailVisible = ref(false)
const currentRecord = ref<MedicalRecord | null>(null)
const recordImages = ref<string[]>([])
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

// 加载患者列表
const loadPatients = async () => {
  try {
    const res = await getPatientList({ pageNum: 1, pageSize: 1000 })
    patients.value = res?.list || []
  } catch (e) {
    console.error('加载患者列表失败:', e)
  }
}

// 加载发作记录列表
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      ...pagination.value,
      keyword: searchForm.value.keyword || '',
      patientId: searchForm.value.patientId ? Number(searchForm.value.patientId) : undefined
    }
    const res = await getEpisodeList(params)
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
  loadPatients()
  loadData()
})

const handleSearch = () => {
  pagination.value.pageNum = 1
  loadData()
}

const handleReset = () => {
  searchForm.value = {
    keyword: '',
    patientId: ''
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

// 查看发作详情和关联病历
const viewEpisode = async (row: DiseaseEpisode) => {
  currentEpisode.value = row
  detailVisible.value = true

  // 加载关联病历
  recordsLoading.value = true
  try {
    const res = await getRecordList({
      pageNum: 1,
      pageSize: 100,
      patientId: row.patientId
    })
    relatedRecords.value = res?.list || []
  } catch (e) {
    console.error('加载关联病历失败:', e)
    relatedRecords.value = []
  } finally {
    recordsLoading.value = false
  }
}

// 删除发作记录
const deleteEpisodeRecord = (row: DiseaseEpisode) => {
  ElMessageBox.confirm(`确定要删除患者"${row.patientName}"的第${row.episodeNumber}次发作记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteEpisode(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 查看病历详情
const viewRecord = (record: MedicalRecord) => {
  currentRecord.value = record
  // 解析图片列表
  if (record.attachments) {
    recordImages.value = record.attachments.split(',').filter(url => url)
  } else {
    recordImages.value = []
  }
  recordDetailVisible.value = true
}

const formatDate = (date: string) => {
  return date || '-'
}

// 导出数据
const handleExport = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const exportData = tableData.value.map(item => ({
    '患者姓名': item.patientName,
    '发作次数': `第${item.episodeNumber}次`,
    '发作时间': formatDate(item.episodeDate),
    '主诉': item.chiefComplaint || '-',
    '症状': item.symptoms || '-',
    '诊断': item.diagnosis || '-',
    '医院': item.hospital || '-',
    '科室': item.department || '-',
    '备注': item.notes || '-',
    '创建时间': formatDate(item.createTime)
  }))
  exportToExcel(exportData, '发作记录')
}
</script>

<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon><Warning /></el-icon>
        发作记录管理
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="患者/主诉/诊断"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="患者">
          <el-select v-model="searchForm.patientId" clearable placeholder="全部" filterable style="width: 180px">
            <el-option
              v-for="p in patients"
              :key="p.id"
              :label="`${p.name} (${p.phone})`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="info" @click="handleExport">
            <el-icon><DocumentCopy /></el-icon>
            导出数据
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="content-card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="patientName" label="患者" min-width="100" />
        <el-table-column label="发作次数" width="100">
          <template #default="{ row }">
            <el-tag type="warning" size="small" effect="light">第{{ row.episodeNumber }}次</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="episodeDate" label="发作时间" width="160">
          <template #default="{ row }">
            <span>{{ formatDate(row.episodeDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="chiefComplaint" label="主诉" min-width="150" show-overflow-tooltip />
        <el-table-column prop="symptoms" label="症状" min-width="150" show-overflow-tooltip />
        <el-table-column prop="diagnosis" label="诊断" min-width="150" show-overflow-tooltip />
        <el-table-column prop="hospital" label="医院" min-width="120" />
        <el-table-column prop="department" label="科室" min-width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            <span class="text-secondary">{{ formatDate(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewEpisode(row)">详情</el-button>
            <el-button type="danger" link size="small" @click="deleteEpisodeRecord(row)">删除</el-button>
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

    <!-- 发作详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="发作记录详情"
      width="800px"
    >
      <template v-if="currentEpisode">
        <!-- 发作记录信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="患者姓名">{{ currentEpisode.patientName }}</el-descriptions-item>
          <el-descriptions-item label="发作次数">
            <el-tag type="warning" size="small">第{{ currentEpisode.episodeNumber }}次</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发作时间">{{ formatDate(currentEpisode.episodeDate) }}</el-descriptions-item>
          <el-descriptions-item label="就诊医院">{{ currentEpisode.hospital || '-' }}</el-descriptions-item>
          <el-descriptions-item label="科室">{{ currentEpisode.department || '-' }}</el-descriptions-item>
          <el-descriptions-item label="主诉">{{ currentEpisode.chiefComplaint || '-' }}</el-descriptions-item>
          <el-descriptions-item label="症状" :span="2">{{ currentEpisode.symptoms || '-' }}</el-descriptions-item>
          <el-descriptions-item label="病情变化" :span="2">{{ currentEpisode.diseaseProgress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="诊治经过" :span="2">{{ currentEpisode.treatmentProcess || '-' }}</el-descriptions-item>
          <el-descriptions-item label="诊断结果" :span="2">{{ currentEpisode.diagnosis || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentEpisode.notes || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 关联病历 -->
        <div class="related-records-section">
          <div class="section-header">
            <el-icon><DocumentCopy /></el-icon>
            <span>关联病历记录</span>
            <el-tag size="small" effect="plain">{{ relatedRecords.length }}条</el-tag>
          </div>

          <el-table
            v-if="relatedRecords.length > 0"
            :data="relatedRecords"
            stripe
            size="small"
            v-loading="recordsLoading"
            max-height="300"
          >
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="light">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" width="110" />
            <el-table-column prop="hospital" label="医院" min-width="120" />
            <el-table-column prop="diagnosis" label="诊断" min-width="150" show-overflow-tooltip />
            <el-table-column prop="content" label="内容" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewRecord(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="暂无关联病历记录" :image-size="80" />
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 病历详情对话框 -->
    <el-dialog
      v-model="recordDetailVisible"
      title="病历详情"
      width="700px"
    >
      <template v-if="currentRecord">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="患者">{{ currentRecord.patientName }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag size="small">{{ currentRecord.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="就诊日期">{{ currentRecord.date }}</el-descriptions-item>
          <el-descriptions-item label="医院">{{ currentRecord.hospital || '-' }}</el-descriptions-item>
          <el-descriptions-item label="科室">{{ currentRecord.department || '-' }}</el-descriptions-item>
          <el-descriptions-item label="医生">{{ currentRecord.doctorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="诊断结果" :span="2">{{ currentRecord.diagnosis || '-' }}</el-descriptions-item>
          <el-descriptions-item label="病历内容" :span="2">
            <div class="record-content">{{ currentRecord.content || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="病历图片" :span="2">
            <div v-if="recordImages.length" class="image-gallery">
              <el-image
                v-for="(url, idx) in recordImages"
                :key="idx"
                :src="url"
                :preview-src-list="recordImages"
                fit="cover"
                class="gallery-image"
              />
            </div>
            <span v-else class="text-muted">无图片</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentRecord.status === 1 ? 'success' : currentRecord.status === 2 ? 'info' : 'warning'" size="small">
              {{ currentRecord.status === 1 ? '已完成' : currentRecord.status === 2 ? '已取消' : '进行中' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentRecord.createTime) }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="recordDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.related-records-section {
  margin-top: 24px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }
}

.record-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.image-gallery {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .gallery-image {
    width: 100px;
    height: 100px;
    border-radius: 4px;
    cursor: pointer;
  }
}
</style>