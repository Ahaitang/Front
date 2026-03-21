<template>
  <div class="questionnaires-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>问卷记录管理</span>
          <el-button type="primary" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </template>
      
      <div class="search-bar">
        <el-form :model="searchForm" class="search-form">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="患者姓名">
                <el-input
                  v-model="searchForm.patientName"
                  placeholder="请输入患者姓名"
                  clearable
                  class="search-input"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="开始日期">
                <el-date-picker
                  v-model="searchForm.startDate"
                  type="date"
                  placeholder="选择开始日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  class="search-input"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="结束日期">
                <el-date-picker
                  v-model="searchForm.endDate"
                  type="date"
                  placeholder="选择结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  class="search-input"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item class="search-actions">
                <el-button type="primary" @click="handleSearch" class="search-btn">
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button @click="handleReset" class="reset-btn">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      
      <el-table :data="recordList" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" min-width="80" />
        <el-table-column label="患者姓名" min-width="120">
          <template #default="{ row }">
            {{ row.patient?.name || row.patient_name || row.patientName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="住院号" min-width="120">
          <template #default="{ row }">
            {{ row.patient?.admissionNumber || row.admissionNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="assessmentDate" label="评估日期" min-width="120" />
        <el-table-column label="总分" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.score?.total || row.score?.totalScore || 0)">
              {{ row.score?.total || row.score?.totalScore || 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评估医生" min-width="120">
          <template #default="{ row }">
            {{ row.doctorName || row.doctor_name || row.doctorUsername || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看详情</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="问卷详情"
      width="800px"
    >
      <div v-if="currentRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="患者姓名">
            {{ currentRecord.patient?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="住院号">
            {{ currentRecord.patient?.admissionNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="评估日期">
            {{ currentRecord.assessmentDate }}
          </el-descriptions-item>
          <el-descriptions-item label="评估医生">
            {{ currentRecord.doctorUsername }}
          </el-descriptions-item>
          <el-descriptions-item label="总分" :span="2">
            <span style="font-size: 20px; font-weight: bold; color: #409EFF">
              {{ currentRecord.score?.total || currentRecord.score?.totalScore || 0 }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 显示各维度得分 -->
        <el-divider v-if="currentRecord.score?.categoryScores">各维度得分</el-divider>
        <el-row :gutter="20" v-if="currentRecord.score?.categoryScores">
          <el-col :span="6" v-for="(value, key) in currentRecord.score.categoryScores" :key="key">
            <el-card class="dimension-card" shadow="hover">
              <div class="dimension-name">{{ getDimensionName(String(key)) }}</div>
              <div class="dimension-value">{{ value }} 分</div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 显示选择项详情 -->
        <el-divider v-if="currentRecord.selections">选择详情</el-divider>
        <el-descriptions :column="2" border v-if="currentRecord.selections">
          <el-descriptions-item
            v-for="(value, key) in currentRecord.selections"
            :key="key"
            :label="getItemName(String(key))"
          >
            {{ formatSelectionValue(value, String(key)) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 用户自定义输入数据 -->
        <el-divider v-if="currentRecord.userInputData">用户自定义输入</el-divider>
        <el-card v-if="currentRecord.userInputData" shadow="never" style="margin-top: 10px;">
          <pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0; font-family: inherit;">{{ formatUserInputData(currentRecord.userInputData) }}</pre>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { questionnaireApi } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Search } from '@element-plus/icons-vue'
import { exportToExcel } from '@/utils/export'
import { parseQuestionnaireRecords, parseQuestionnaireRecord } from '@/utils/questionnaireParser'
import { getItemNameByKey, getCategoryNameByKey, getOptionLabelByValue } from '@/utils/qmgConstants'

const userStore = useUserStore()
const loading = ref(false)
const recordList = ref<any[]>([])
const detailVisible = ref(false)
const currentRecord = ref<any>(null)

const searchForm = reactive({
  patientName: '',
  startDate: '',
  endDate: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadRecords = async () => {
  loading.value = true
  try {
    const currentDoctorId = userStore.userInfo?.id
    const currentUserLevel = userStore.level
    
    const result = await questionnaireApi.searchRecordsByPatientNameAndDateRange(
      searchForm.patientName || undefined,
      searchForm.startDate || undefined,
      searchForm.endDate || undefined,
      pagination.page,
      pagination.pageSize,
      currentDoctorId,
      currentUserLevel
    )
    // 解析 JSON 字段（解析器会自动处理 patient 对象构建）
    recordList.value = parseQuestionnaireRecords(result.records || [])
    pagination.total = result.total
    pagination.total = result.total
  } catch (error) {
    console.error('加载问卷记录失败:', error)
    ElMessage.error('加载问卷记录失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadRecords()
}

const handleReset = () => {
  Object.assign(searchForm, {
    patientName: '',
    startDate: '',
    endDate: ''
  })
  pagination.page = 1
  loadRecords()
}

const handleView = (row: any) => {
  // 确保数据已解析
  currentRecord.value = parseQuestionnaireRecord(row)
  detailVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该问卷记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await questionnaireApi.deleteRecord(row.id)
    ElMessage.success('删除成功')
    loadRecords()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSizeChange = () => {
  loadRecords()
}

const handlePageChange = () => {
  loadRecords()
}

// 导出数据
const handleExport = async () => {
  try {
    // 导出当前搜索结果的所有数据
    // 如果数据量大，可以提示用户
    if (pagination.total > 1000) {
      const confirmed = await ElMessageBox.confirm(
        `当前搜索结果共有 ${pagination.total} 条记录，导出可能需要较长时间，是否继续？`,
        '提示',
        {
          confirmButtonText: '继续导出',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).catch(() => false)
      
      if (!confirmed) return
    }
    
    const currentDoctorId = userStore.userInfo?.id
    const currentUserLevel = userStore.level
    
    // 获取所有数据（不分页）
    const allRecords = await questionnaireApi.searchRecordsByPatientNameAndDateRange(
      searchForm.patientName || undefined,
      searchForm.startDate || undefined,
      searchForm.endDate || undefined,
      1,
      pagination.total || 10000, // 获取所有数据
      currentDoctorId,
      currentUserLevel
    )
    
    // 准备导出数据
    const exportData = allRecords.records.map((record: any) => {
      const row: any = {
        '记录ID': record.id,
        '患者姓名': record.patient?.name || '',
        '住院号': record.patient?.admissionNumber || '',
        '评估日期': record.assessmentDate || '',
        '评估医生': record.doctorUsername || '',
        '总分': record.score?.total || 0
      }
      
      // 添加各维度得分
      if (record.score?.categoryScores) {
        Object.keys(record.score.categoryScores).forEach(key => {
          row[getCategoryNameByKey(key)] = record.score.categoryScores[key]
        })
      }
      
      return row
    })
    
    // 生成文件名
    const fileName = `问卷记录_${searchForm.patientName || '全部'}_${searchForm.startDate || ''}_${searchForm.endDate || ''}_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // 导出
    exportToExcel(exportData, fileName, '问卷记录')
  } catch (error: any) {
    console.error('导出错误:', error)
    if (error !== 'cancel') {
      ElMessage.error('导出失败: ' + (error.message || '未知错误'))
    }
  }
}

// 获取维度名称（分类名称）
const getDimensionName = (key: string) => {
  return getCategoryNameByKey(key)
}

// 获取项目名称
const getItemName = (key: string) => {
  return getItemNameByKey(key)
}

// 格式化选择值（选项标签）
const formatSelectionValue = (value: any, itemKey?: string) => {
  if (value === null || value === undefined) return '-'
  
  // 如果有项目键名，使用映射获取选项标签
  if (itemKey) {
    return getOptionLabelByValue(itemKey, value)
  }
  
  // 否则使用默认格式化
  if (typeof value === 'object' && value !== null) {
    if ('range' in value) {
      return `${value.range}${value.value !== undefined ? ` (${value.value})` : ''}`
    }
    // 处理包含 customInput 的选项值
    if ('value' in value && 'customInput' in value) {
      const label = String(value.value)
      if (value.customInput && String(value.customInput).trim()) {
        return `${label}：${value.customInput}`
      }
      return label
    }
  }
  return String(value)
}

// 获取得分类型（用于标签颜色）
const getScoreType = (score: number) => {
  if (score >= 30) return 'danger'
  if (score >= 20) return 'warning'
  if (score >= 10) return 'info'
  return 'success'
}

// 格式化用户自定义输入数据
const formatUserInputData = (userInputData: any): string => {
  if (!userInputData) return ''
  
  try {
    // 如果是字符串，尝试解析为JSON
    if (typeof userInputData === 'string') {
      try {
        const parsed = JSON.parse(userInputData)
        // 如果是对象，格式化显示
        if (typeof parsed === 'object' && parsed !== null) {
          return JSON.stringify(parsed, null, 2)
        }
        return parsed
      } catch {
        // 如果不是JSON，直接返回字符串
        return userInputData
      }
    }
    
    // 如果是对象，格式化显示
    if (typeof userInputData === 'object' && userInputData !== null) {
      return JSON.stringify(userInputData, null, 2)
    }
    
    return String(userInputData)
  } catch (error) {
    return String(userInputData)
  }
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.questionnaires-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(30, 136, 229, 0.08);
  border: 1px solid rgba(30, 136, 229, 0.12);
}

.search-form {
  width: 100%;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-form-item__label) {
  color: #1976d2;
  font-weight: 600;
  font-size: 14px;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  background-color: #ffffff;
  border: 1px solid #e3f2fd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(30, 136, 229, 0.06);
  transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: #90caf9;
  box-shadow: 0 4px 8px rgba(30, 136, 229, 0.12);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.search-input :deep(.el-input__inner) {
  color: #1565c0;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: #90caf9;
}

.search-actions {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 100%;
}

.search-btn {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  transition: all 0.3s ease;
}

.search-btn:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
  transform: translateY(-1px);
}

.search-btn:active {
  transform: translateY(0);
}

.reset-btn {
  background-color: #ffffff;
  border: 1px solid #e3f2fd;
  color: #1976d2;
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background-color: #f0f7ff;
  border-color: #90caf9;
  color: #1565c0;
}

/* 日期选择器样式 */
.search-bar :deep(.el-date-editor) {
  width: 100%;
}

.search-bar :deep(.el-date-editor .el-input__wrapper) {
  background-color: #ffffff;
  border: 1px solid #e3f2fd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(30, 136, 229, 0.06);
  transition: all 0.3s ease;
}

.search-bar :deep(.el-date-editor .el-input__wrapper:hover) {
  border-color: #90caf9;
  box-shadow: 0 4px 8px rgba(30, 136, 229, 0.12);
}

.search-bar :deep(.el-date-editor.is-active .el-input__wrapper) {
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.record-detail {
  padding: 10px 0;
}

.dimension-card {
  text-align: center;
  margin-bottom: 10px;
}

.dimension-name {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.dimension-value {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

:deep(.el-card) {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(30, 136, 229, 0.08);
  border: 1px solid rgba(227, 242, 253, 0.5);
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  box-shadow: 0 6px 20px rgba(30, 136, 229, 0.15);
  transform: translateY(-2px);
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  border-bottom: 1px solid #e3f2fd;
  font-weight: 600;
  color: #1976d2;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
}

:deep(.el-table__body-wrapper) {
  width: 100%;
}

:deep(.el-table__header-wrapper) {
  width: 100%;
}
</style>
