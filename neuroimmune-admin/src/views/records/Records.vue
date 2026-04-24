<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Picture, Folder, DocumentCopy } from '@element-plus/icons-vue'
import { getRecordList, saveRecord, cancelRecord, getPatientList, uploadFile, ocrParseMedical, getCommonDictByType, DICT_TYPES } from '@/api'
import { exportToExcel } from '@/utils/export'
import type { MedicalRecord, Patient, CommonDict } from '@/api'

const searchForm = ref({
  keyword: '',
  type: '',
  startDate: '',
  endDate: '',
  dateRange: [] as string[]
})

const tableData = ref<MedicalRecord[]>([])
const patients = ref<Patient[]>([])
const recordTypeOptions = ref<CommonDict[]>([])
const loading = ref(false)
const total = ref(0)
const pagination = ref({
  pageNum: 1,
  pageSize: 10
})

const dialogVisible = ref(false)
const dialogType = ref<'view' | 'add' | 'edit'>('view')
const currentRecord = ref<Partial<MedicalRecord>>({})
const saveLoading = ref(false)

// 图片相关
const imageList = ref<string[]>([])
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')
const ocrLoading = ref(false)

// 加载字典
const loadDicts = async () => {
  try {
    recordTypeOptions.value = await getCommonDictByType(DICT_TYPES.RECORD_TYPE)
  } catch (e) {
    console.error('加载字典失败:', e)
  }
}

// 状态相关
const getStatusType = (status: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '进行中', 1: '已完成', 2: '已取消' }
  return map[status] || '进行中'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      ...pagination.value,
      keyword: searchForm.value.keyword || '',
      type: searchForm.value.type || '',
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

// 加载患者列表
const loadPatients = async () => {
  try {
    const res = await getPatientList({ pageNum: 1, pageSize: 1000 })
    patients.value = res?.list || []
  } catch (e) {
    console.error('加载患者列表失败:', e)
  }
}

onMounted(() => {
  loadDicts()
  loadData()
  loadPatients()
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
  // 加载已有图片
  if (row.attachments) {
    imageList.value = row.attachments.split(',').filter((url: string) => url)
  } else {
    imageList.value = []
  }
  dialogType.value = 'view'
  dialogVisible.value = true
}

const addRecord = () => {
  currentRecord.value = {
    type: '门诊病历',
    date: new Date().toISOString().split('T')[0]
  }
  imageList.value = []
  dialogType.value = 'add'
  dialogVisible.value = true
}

const editRecord = (row: MedicalRecord) => {
  currentRecord.value = { ...row }
  // 加载已有图片
  if (row.attachments) {
    imageList.value = row.attachments.split(',').filter((url: string) => url)
  } else {
    imageList.value = []
  }
  dialogType.value = 'edit'
  dialogVisible.value = true
}

const cancelRecordRecord = (row: MedicalRecord) => {
  ElMessageBox.confirm('确定要取消该病历记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelRecord(row.id)
      ElMessage.success('已取消')
      loadData()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

const saveRecordSubmit = async () => {
  if (!currentRecord.value.patientId) {
    ElMessage.warning('请选择患者')
    return
  }
  if (!currentRecord.value.diagnosis) {
    ElMessage.warning('请输入诊断结果')
    return
  }
  // 保存图片URL列表
  currentRecord.value.attachments = imageList.value.join(',')

  saveLoading.value = true
  try {
    await saveRecord(currentRecord.value)
    ElMessage.success(dialogType.value === 'add' ? '添加成功' : '保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 选择患者
const handlePatientSelect = (patientId: number) => {
  const patient = patients.value.find(p => p.id === patientId)
  if (patient && currentRecord.value) {
    currentRecord.value.patientId = patientId
    currentRecord.value.patientName = patient.name
  }
}

// 图片上传
const handleImageUpload = async (options: any) => {
  const { file } = options
  try {
    ElMessage.info('正在上传图片...')
    const res = await uploadFile(file)
    if (res && res.url) {
      imageList.value.push(res.url)
      ElMessage.success('上传成功')
    }
  } catch (e) {
    ElMessage.error('上传失败')
  }
}

// 删除图片
const removeImage = (index: number) => {
  imageList.value.splice(index, 1)
}

// 预览图片
const previewImage = (url: string) => {
  previewImageUrl.value = url
  imagePreviewVisible.value = true
}

// OCR识别
const handleOcrParse = async () => {
  if (imageList.value.length === 0) {
    ElMessage.warning('请先上传图片')
    return
  }

  ocrLoading.value = true
  try {
    const res = await ocrParseMedical(imageList.value)
    if (res && res.success && res.content) {
      // 将识别内容覆盖病历内容
      currentRecord.value.content = res.content
      ElMessage.success('识别成功')
    } else {
      ElMessage.warning(res.errorMsg || '识别失败，请手动输入')
    }
  } catch (e) {
    ElMessage.error('识别失败')
  } finally {
    ocrLoading.value = false
  }
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
    '病历类型': item.type,
    '诊断结果': item.diagnosis,
    '医院': item.hospital || '-',
    '科室': item.department || '-',
    '医生': item.doctorName || '-',
    '就诊日期': item.date,
    '状态': getStatusText(item.status),
    '病历内容': item.content || '-',
    '创建时间': formatDate(item.createTime)
  }))
  exportToExcel(exportData, '病历记录')
}

// 判断是否有图片
const hasImages = computed(() => imageList.value.length > 0)
</script>

<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon><Folder /></el-icon>
        病历管理
      </div>
    </div>

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
            <el-option
              v-for="t in recordTypeOptions"
              :key="t.id"
              :label="t.name"
              :value="t.name"
            />
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
          <el-button type="success" @click="addRecord">新增病历</el-button>
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
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="light">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="diagnosis" label="诊断" min-width="140" show-overflow-tooltip />
        <el-table-column prop="hospital" label="医院" min-width="120" />
        <el-table-column prop="department" label="科室" min-width="100" />
        <el-table-column prop="doctorName" label="医生" min-width="100" />
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.attachments" type="success" size="small" effect="light">
              <el-icon><Picture /></el-icon>
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small" effect="light">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            <span class="text-secondary">{{ formatDate(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewRecord(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="editRecord(row)">编辑</el-button>
            <el-button v-if="row.status === 0" type="warning" link size="small" @click="cancelRecordRecord(row)">取消</el-button>
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

    <!-- 详情/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'view' ? '病历详情' : dialogType === 'add' ? '新增病历' : '编辑病历'"
      width="750px"
    >
      <template v-if="currentRecord">
        <el-form :model="currentRecord" label-width="100px" :disabled="dialogType === 'view'">
          <el-row :gutter="20" v-if="dialogType !== 'view'">
            <el-col :span="12">
              <el-form-item label="患者" required>
                <el-select
                  v-model="currentRecord.patientId"
                  placeholder="选择患者"
                  style="width: 100%"
                  filterable
                  @change="handlePatientSelect"
                >
                  <el-option
                    v-for="p in patients"
                    :key="p.id"
                    :label="`${p.name} (${p.phone})`"
                    :value="p.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="病历类型">
                <el-select v-model="currentRecord.type" style="width: 100%">
                  <el-option
                    v-for="t in recordTypeOptions"
                    :key="t.id"
                    :label="t.name"
                    :value="t.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12" v-if="dialogType === 'view'">
              <el-form-item label="患者">{{ currentRecord.patientName }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="就诊日期">
                <el-date-picker
                  v-model="currentRecord.date"
                  type="date"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="dialogType === 'view'">
              <el-form-item label="类型">
                <el-tag size="small">{{ currentRecord.type }}</el-tag>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="医院">
                <el-input v-model="currentRecord.hospital" placeholder="请输入医院名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="科室">
                <el-input v-model="currentRecord.department" placeholder="请输入科室" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="医生姓名">
                <el-input v-model="currentRecord.doctorName" placeholder="请输入医生姓名" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="诊断结果" required>
            <el-input v-model="currentRecord.diagnosis" placeholder="请输入诊断结果" />
          </el-form-item>

          <!-- 图片上传区域 -->
          <el-form-item label="病历图片">
            <div class="image-upload-area">
              <!-- 已上传的图片列表 -->
              <div class="image-list">
                <div
                  v-for="(url, index) in imageList"
                  :key="index"
                  class="image-item"
                >
                  <el-image
                    :src="url"
                    fit="cover"
                    class="image-thumb"
                    @click="previewImage(url)"
                  />
                  <div v-if="dialogType !== 'view'" class="image-actions">
                    <el-button
                      type="danger"
                      :icon="Delete"
                      circle
                      size="small"
                      @click="removeImage(index)"
                    />
                  </div>
                </div>
              </div>
              <!-- 上传按钮 -->
              <el-upload
                v-if="dialogType !== 'view'"
                :show-file-list="false"
                :http-request="handleImageUpload"
                accept="image/*"
              >
                <el-button type="primary" plain :icon="Plus">上传图片</el-button>
              </el-upload>
              <!-- OCR识别按钮 -->
              <el-button
                v-if="dialogType !== 'view' && hasImages"
                type="success"
                plain
                :loading="ocrLoading"
                @click="handleOcrParse"
                style="margin-left: 10px"
              >
                {{ ocrLoading ? '识别中...' : 'OCR识别' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="病历内容">
            <el-input v-model="currentRecord.content" type="textarea" :rows="4" placeholder="请输入病历内容，或上传图片后点击OCR识别" />
          </el-form-item>
          <el-form-item label="创建时间" v-if="currentRecord.createTime">
            <el-input :model-value="formatDate(currentRecord.createTime)" disabled />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogType !== 'view'" type="primary" :loading="saveLoading" @click="saveRecordSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-dialog v-model="imagePreviewVisible" title="图片预览" width="700px">
      <el-image :src="previewImageUrl" fit="contain" style="width: 100%" />
    </el-dialog>
  </div>
</template>