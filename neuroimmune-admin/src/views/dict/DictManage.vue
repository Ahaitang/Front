<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Plus, Delete, Edit, Search } from '@element-plus/icons-vue'
import {
  getCommonDictAll,
  saveCommonDict,
  deleteCommonDict,
  toggleCommonDictActive,
  DICT_TYPES,
  type CommonDict
} from '@/api'

// Dictionary type labels
const DICT_TYPE_LABELS: Record<string, string> = {
  'department': '科室',
  'title': '职称',
  'recordType': '病历类型',
  'followUpType': '随访类型',
  'gender': '性别',
  'status': '状态',
  'frequency': '用药频率',
  'route': '用药途径',
  'medication': '药品名称',
  'medicationUnit': '用药单位',
  'disease': '疾病类型',
  'role': '系统角色'
}

// All dictionary types to display
const DICT_TYPE_LIST = [
  DICT_TYPES.DEPARTMENT,
  DICT_TYPES.TITLE,
  DICT_TYPES.RECORD_TYPE,
  DICT_TYPES.FOLLOW_UP_TYPE,
  DICT_TYPES.GENDER,
  DICT_TYPES.STATUS,
  DICT_TYPES.FREQUENCY,
  DICT_TYPES.ROUTE,
  DICT_TYPES.MEDICATION,
  DICT_TYPES.MEDICATION_UNIT,
  DICT_TYPES.DISEASE,
  DICT_TYPES.ROLE
]

// State
const loading = ref(false)
const selectedType = ref<string>('')
const allDictData = ref<Map<string, CommonDict[]>>(new Map())
const searchText = ref('')

// Dialog state
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const form = ref<Partial<CommonDict>>({})

// Computed
const currentList = computed(() => {
  if (!selectedType.value) return []
  const list = allDictData.value.get(selectedType.value) || []
  if (!searchText.value) return list
  const keyword = searchText.value.toLowerCase()
  return list.filter(item =>
    item.name?.toLowerCase().includes(keyword) ||
    item.code?.toLowerCase().includes(keyword) ||
    item.description?.toLowerCase().includes(keyword)
  )
})

const typeCountMap = computed(() => {
  const map: Record<string, number> = {}
  allDictData.value.forEach((list, type) => {
    map[type] = list.length
  })
  return map
})

// Load all dictionary data
const loadData = async () => {
  loading.value = true
  try {
    const allData = await getCommonDictAll() || []
    const grouped = new Map<string, CommonDict[]>()

    // Initialize all types with empty arrays
    DICT_TYPE_LIST.forEach(type => {
      grouped.set(type, [])
    })

    // Group by dictType
    allData.forEach(item => {
      const type = item.dictType
      if (grouped.has(type)) {
        grouped.get(type)!.push(item)
      } else {
        grouped.set(type, [item])
      }
    })

    // Sort each group by sortOrder
    grouped.forEach((list, type) => {
      grouped.set(type, list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))
    })

    allDictData.value = grouped

    // Set default selection if not set
    if (!selectedType.value && DICT_TYPE_LIST.length > 0) {
      selectedType.value = DICT_TYPE_LIST[0] || DICT_TYPES.DEPARTMENT
    }
  } catch (e) {
    console.error('加载数据失败:', e)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// Select dictionary type
const selectType = (type: string) => {
  selectedType.value = type
  searchText.value = ''
}

// Add new item
const addItem = () => {
  if (!selectedType.value) {
    ElMessage.warning('请先选择字典类型')
    return
  }
  form.value = {
    dictType: selectedType.value,
    name: '',
    code: '',
    description: '',
    sortOrder: 0,
    isActive: 1
  }
  dialogType.value = 'add'
  dialogVisible.value = true
}

// Edit item
const editItem = (row: CommonDict) => {
  form.value = { ...row }
  dialogType.value = 'edit'
  dialogVisible.value = true
}

// Delete item
const deleteItem = (row: CommonDict) => {
  ElMessageBox.confirm(`确定要删除 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteCommonDict(row.id!)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// Toggle active status
const toggleActive = async (row: CommonDict) => {
  try {
    const newActive = row.isActive === 1 ? 0 : 1
    await toggleCommonDictActive(row.id!, newActive === 1)
    ElMessage.success(newActive === 1 ? '已启用' : '已禁用')
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// Save item
const saveItem = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入名称')
    return
  }
  try {
    await saveCommonDict(form.value)
    ElMessage.success(dialogType.value === 'add' ? '添加成功' : '保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// Get type label
const getTypeLabel = (type: string) => {
  return DICT_TYPE_LABELS[type] || type
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">
        <el-icon><Setting /></el-icon>
        字典管理
      </div>
    </div>

    <div class="content-card dict-container">
      <!-- Left side: Dictionary type navigation -->
      <div class="dict-nav">
        <div class="nav-title">字典类型</div>
        <div class="nav-list">
          <div
            v-for="type in DICT_TYPE_LIST"
            :key="type"
            :class="['nav-item', { active: selectedType === type }]"
            @click="selectType(type)"
          >
            <span class="nav-label">{{ getTypeLabel(type) }}</span>
            <span class="nav-count">{{ typeCountMap[type] || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Right side: Dictionary items table -->
      <div class="dict-content" v-loading="loading">
        <div class="content-header">
          <div class="header-left">
            <span class="content-title">{{ getTypeLabel(selectedType) }}</span>
            <el-input
              v-model="searchText"
              placeholder="搜索名称/编码/描述"
              :prefix-icon="Search"
              clearable
              style="width: 220px"
            />
          </div>
          <el-button type="primary" @click="addItem">
            <el-icon><Plus /></el-icon> 新增字典项
          </el-button>
        </div>

        <el-table :data="currentList" stripe style="width: 100%">
          <el-table-column prop="code" label="编码" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.code" type="info" effect="plain" size="small">{{ row.code }}</el-tag>
              <span v-else class="text-secondary">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="description" label="描述" min-width="160">
            <template #default="{ row }">
              <span>{{ row.description || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
          <el-table-column prop="isActive" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.isActive === 1"
                size="small"
                @change="toggleActive(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="editItem(row)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button type="danger" link size="small" @click="deleteItem(row)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="!loading && currentList.length === 0" class="empty-tip">
          <span v-if="searchText">未找到匹配的字典项</span>
          <span v-else>暂无数据，点击"新增字典项"添加</span>
        </div>
      </div>
    </div>

    <!-- Edit dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增字典项' : '编辑字典项'"
      width="480px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="字典类型">
          <el-input :value="getTypeLabel(form.dictType || '')" disabled />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="form.code" placeholder="如：QD、PO（可选）" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="描述说明（可选）"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.isActive" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.dict-container {
  display: flex;
  min-height: calc(100vh - 180px);
}

.dict-nav {
  width: 200px;
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .nav-title {
    padding: 16px;
    font-weight: 600;
    font-size: 14px;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-light);
  }

  .nav-list {
    flex: 1;
    overflow-y: auto;
  }

  .nav-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &:hover {
      background: var(--el-fill-color-light);
    }

    &.active {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 500;

      .nav-count {
        background: var(--el-color-primary);
        color: #fff;
      }
    }
  }

  .nav-label {
    font-size: 14px;
  }

  .nav-count {
    font-size: 12px;
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.dict-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-light);

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .content-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

.empty-tip {
  padding: 40px 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.text-secondary {
  color: var(--el-text-color-secondary);
}
</style>