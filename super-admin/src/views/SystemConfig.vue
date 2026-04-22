<template>
  <div class="system-config">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Token配置" name="token">
        <el-card>
          <el-form label-width="180px">
            <el-form-item label="QMG系统Token有效期">
              <el-input-number v-model="configs.qmg_token_hours" :min="1" :max="168" />
              <span class="unit">小时</span>
            </el-form-item>
            <el-form-item label="神经免疫系统Token有效期">
              <el-input-number v-model="configs.neuro_token_hours" :min="1" :max="168" />
              <span class="unit">小时</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveTokenConfig">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="封禁配置" name="ban">
        <el-card>
          <el-form label-width="180px">
            <el-form-item label="默认封禁时长">
              <el-input-number v-model="configs.default_ban_hours" :min="1" :max="72" />
              <span class="unit">小时</span>
            </el-form-item>
            <el-form-item label="最大封禁时长">
              <el-input-number v-model="configs.max_ban_hours" :min="1" :max="168" />
              <span class="unit">小时</span>
            </el-form-item>
            <el-form-item label="踢下线确认开关">
              <el-switch v-model="configs.kick_confirm_enabled" active-value="true" inactive-value="false" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBanConfig">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 所有配置列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>所有配置项</span>
      </template>
      <el-table :data="allConfigs" stripe>
        <el-table-column prop="configKey" label="配置键" width="200" />
        <el-table-column prop="configValue" label="配置值" width="150" />
        <el-table-column prop="description" label="说明" min-width="200" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.updateTime) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { configApi } from '@/utils/api'
import { formatDateTime } from '@/utils/export'

interface SystemConfigEntry {
  id: number
  configKey: string
  configValue: string
  description: string
  createTime: string
  updateTime: string | null
}

const activeTab = ref('token')
const allConfigs = ref<SystemConfigEntry[]>([])
const configs = reactive({
  qmg_token_hours: 24,
  neuro_token_hours: 24,
  default_ban_hours: 24,
  max_ban_hours: 72,
  kick_confirm_enabled: 'true'
})

onMounted(() => {
  loadConfigs()
})

const loadConfigs = async () => {
  const res = await configApi.list()
  if (res.code === 200) {
    allConfigs.value = res.data
    // 同步到 reactive 对象
    for (const config of allConfigs.value) {
      if (config.configKey in configs) {
        (configs as any)[config.configKey] = config.configValue
      }
    }
  }
}

const saveTokenConfig = async () => {
  try {
    await configApi.update({ key: 'qmg_token_hours', value: configs.qmg_token_hours.toString() })
    await configApi.update({ key: 'neuro_token_hours', value: configs.neuro_token_hours.toString() })
    ElMessage.success('Token配置已保存')
    loadConfigs()
  } catch {
    ElMessage.error('保存失败')
  }
}

const saveBanConfig = async () => {
  try {
    await configApi.update({ key: 'default_ban_hours', value: configs.default_ban_hours.toString() })
    await configApi.update({ key: 'max_ban_hours', value: configs.max_ban_hours.toString() })
    await configApi.update({ key: 'kick_confirm_enabled', value: configs.kick_confirm_enabled })
    ElMessage.success('封禁配置已保存')
    loadConfigs()
  } catch {
    ElMessage.error('保存失败')
  }
}
</script>

<style scoped>
.unit {
  margin-left: 8px;
  color: #909399;
}
</style>