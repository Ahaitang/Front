<template>
  <div class="questionnaire-config-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>问卷配置管理</span>
          <el-button type="primary" @click="handleAddItem">
            <el-icon><Plus /></el-icon>
            新增项目
          </el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
        <el-tab-pane label="全部" name="all"></el-tab-pane>
        <el-tab-pane label="眼肌类" name="eyes"></el-tab-pane>
        <el-tab-pane label="球部肌类" name="bulbar"></el-tab-pane>
        <el-tab-pane label="呼吸类" name="respiratory"></el-tab-pane>
        <el-tab-pane label="肢体肌类" name="limbs"></el-tab-pane>
      </el-tabs>
      
      <el-table :data="filteredItems" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="name" label="项目名称" min-width="200" />
        <el-table-column prop="key" label="键名" min-width="150" />
        <el-table-column prop="category" label="分类" min-width="120">
          <template #default="{ row }">
            <el-tag>{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="displayOrder" label="显示顺序" min-width="100" />
        <el-table-column label="选项数量" min-width="100">
          <template #default="{ row }">
            {{ row.options?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="项目键名" prop="key">
          <el-input v-model="formData.key" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" style="width: 100%">
            <el-option label="眼肌类" value="eyes" />
            <el-option label="球部肌类" value="bulbar" />
            <el-option label="呼吸类" value="respiratory" />
            <el-option label="肢体肌类" value="limbs" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示顺序" prop="displayOrder">
          <el-input-number v-model="formData.displayOrder" :min="0" />
        </el-form-item>
        
        <el-divider>选项配置</el-divider>
        
        <el-form-item label="选项列表" prop="options">
          <div v-for="(option, index) in formData.options" :key="index" class="option-item" style="margin-bottom: 10px; padding: 10px; border: 1px solid #e4e7ed; border-radius: 4px;">
            <el-row :gutter="10">
              <el-col :span="5">
                <el-input v-model="option.label" placeholder="选项标签" />
              </el-col>
              <el-col :span="5">
                <el-input v-model="option.value" placeholder="选项值" />
              </el-col>
              <el-col :span="3">
                <el-input-number v-model="option.score" :min="0" :max="10" placeholder="得分" style="width: 100%" />
              </el-col>
              <el-col :span="3">
                <el-input-number v-model="option.displayOrder" :min="0" placeholder="顺序" style="width: 100%" />
              </el-col>
              <el-col :span="4">
                <el-switch
                  v-model="option.allowCustomInput"
                  active-text="允许输入"
                  inactive-text="不允许"
                  :active-value="true"
                  :inactive-value="false"
                />
              </el-col>
              <el-col :span="4">
                <el-button type="danger" @click="removeOption(index)">删除</el-button>
              </el-col>
            </el-row>
          </div>
          <el-button type="primary" @click="addOption" style="margin-top: 10px">
            <el-icon><Plus /></el-icon>
            添加选项
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { questionnaireConfigApi } from '@/utils/api'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const itemList = ref<any[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增项目')
const formRef = ref<FormInstance>()
const isEdit = ref(false)
const activeCategory = ref('all')

const formData = reactive({
  id: undefined,
  name: '',
  key: '',
  category: 'eyes',
  displayOrder: 0,
  options: [] as any[]
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  key: [{ required: true, message: '请输入项目键名', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const filteredItems = computed(() => {
  if (activeCategory.value === 'all') {
    return itemList.value
  }
  return itemList.value.filter(item => item.category === activeCategory.value)
})

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    eyes: '眼肌类',
    bulbar: '球部肌类',
    respiratory: '呼吸类',
    limbs: '肢体肌类'
  }
  return labels[category] || category
}

const loadItems = async () => {
  loading.value = true
  try {
    itemList.value = await questionnaireConfigApi.getAllItems()
  } catch (error) {
    ElMessage.error('加载问卷配置失败')
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = () => {
  // 分类切换时，数据已通过 computed 自动过滤
}

const handleAddItem = () => {
  isEdit.value = false
  dialogTitle.value = '新增项目'
  Object.assign(formData, {
    id: undefined,
    name: '',
    key: '',
    category: 'eyes',
    displayOrder: 0,
    options: []
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑项目'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    key: row.key,
    category: row.category,
    displayOrder: row.displayOrder,
    options: row.options ? [...row.options] : []
  })
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该项目吗？删除后该项目的所有选项也会被删除。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await questionnaireConfigApi.deleteItem(row.id)
    ElMessage.success('删除成功')
    loadItems()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const addOption = () => {
  formData.options.push({
    label: '',
    value: '',
    score: 0,
    displayOrder: formData.options.length,
    allowCustomInput: false
  })
}

const removeOption = (index: number) => {
  formData.options.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 验证选项
      if (formData.options.length === 0) {
        ElMessage.warning('请至少添加一个选项')
        return
      }
      
      for (let i = 0; i < formData.options.length; i++) {
        const option = formData.options[i]
        if (!option.label || !option.value) {
          ElMessage.warning(`请填写第 ${i + 1} 个选项的标签和值`)
          return
        }
      }
      
      try {
        await questionnaireConfigApi.saveOrUpdateItem(formData)
        ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
        dialogVisible.value = false
        loadItems()
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败' : '新增失败')
      }
    }
  })
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.questionnaire-config-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-item {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.el-card) {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(30, 136, 229, 0.08);
  border: 1px solid rgba(227, 242, 253, 0.5);
}
</style>
