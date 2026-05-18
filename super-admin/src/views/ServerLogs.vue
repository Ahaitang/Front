<template>
  <div class="server-logs">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-radio-group v-model="currentFile" @change="handleFileChange">
          <el-radio-button value="hospital-platform.log">主日志</el-radio-button>
          <el-radio-button value="hospital-platform-error.log">错误日志</el-radio-button>
          <el-radio-button value="hospital-platform-audit.log">审计日志</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-radio-group v-model="mode" @change="handleModeChange">
          <el-radio-button value="realtime">
            <span class="mode-dot" :class="{ active: mode === 'realtime' }"></span>
            实时
          </el-radio-button>
          <el-radio-button value="history">📄 历史</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 实时模式工具条 -->
    <div v-if="mode === 'realtime'" class="sub-toolbar">
      <div class="sub-toolbar-left">
        <el-button :type="isPaused ? 'success' : 'warning'" size="small" @click="togglePause">
          <el-icon><VideoPause v-if="!isPaused" /><VideoPlay v-else /></el-icon>
          {{ isPaused ? '恢复' : '暂停' }}
        </el-button>
        <el-button size="small" @click="clearLogs">
          <el-icon><Delete /></el-icon>
          清屏
        </el-button>
      </div>
      <div class="sub-toolbar-right">
        <span class="status-indicator" :class="connectionStatus">
          <span class="status-dot"></span>
          {{ statusText }}
        </span>
      </div>
    </div>

    <!-- 历史模式工具条 -->
    <div v-if="mode === 'history'" class="sub-toolbar">
      <div class="sub-toolbar-left">
        <el-input v-model="keyword" placeholder="搜索关键字..." size="small" clearable
          style="width: 220px" @keyup.enter="loadHistory" />
        <el-select v-model="level" size="small" style="width: 120px" @change="loadHistory">
          <el-option label="全部级别" value="ALL" />
          <el-option label="DEBUG" value="DEBUG" />
          <el-option label="INFO" value="INFO" />
          <el-option label="WARN" value="WARN" />
          <el-option label="ERROR" value="ERROR" />
        </el-select>
        <el-button size="small" type="primary" @click="loadHistory">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button size="small" @click="resetFilters">重置</el-button>
      </div>
      <div class="sub-toolbar-right">
        <el-button size="small" @click="downloadLog">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div class="log-viewer" ref="logViewerRef">
      <div class="log-content">
        <div v-for="(line, index) in displayLines" :key="index"
          class="log-line" :class="getLogLevel(line)">
          <span class="line-number">{{ getLineNumber(index) }}</span>
          <span class="line-text">{{ line }}</span>
        </div>
        <div v-if="displayLines.length === 0" class="log-empty">
          {{ mode === 'realtime' ? '等待日志输出...' : '暂无日志数据' }}
        </div>
      </div>
    </div>

    <!-- 历史模式分页 -->
    <div v-if="mode === 'history' && totalLines > 0" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalLines"
        :page-sizes="[100, 200, 500]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadHistory"
        @size-change="handlePageSizeChange"
      />
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <span>{{ currentFile }}</span>
      <span v-if="mode === 'realtime'">实时行数: {{ realtimeLines.length }}</span>
      <span v-else>共 {{ totalLines }} 行 | 第 {{ currentPage }} 页</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { logWs } from '@/utils/logWebSocket'
import { logApi } from '@/utils/api'

// 状态
const mode = ref<'realtime' | 'history'>('realtime')
const currentFile = ref('hospital-platform.log')
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')
const isPaused = ref(false)
const logViewerRef = ref<HTMLElement>()

// 实时模式
const realtimeLines = ref<string[]>([])
const MAX_REALTIME_LINES = 2000

// 历史模式
const historyLines = ref<string[]>([])
const keyword = ref('')
const level = ref('ALL')
const currentPage = ref(1)
const pageSize = ref(200)
const totalLines = ref(0)

const displayLines = computed(() => mode.value === 'realtime' ? realtimeLines.value : historyLines.value)

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connecting': return '连接中...'
    case 'connected': return '已连接'
    case 'disconnected': return '未连接'
  }
})

// 实时模式逻辑
function connectWebSocket() {
  const token = localStorage.getItem('super_admin_token')
  if (!token) return

  logWs.onStatus((status) => {
    connectionStatus.value = status
    if (status === 'connected') {
      logWs.send('start', currentFile.value)
    }
  })

  logWs.onMessage((data) => {
    if (data.type === 'log' && data.lines) {
      realtimeLines.value.push(...data.lines)
      // 限制最大行数
      if (realtimeLines.value.length > MAX_REALTIME_LINES) {
        realtimeLines.value = realtimeLines.value.slice(-MAX_REALTIME_LINES)
      }
      if (!isPaused.value) {
        scrollToBottom()
      }
    }
  })

  logWs.connect(token)
}

function disconnectWebSocket() {
  logWs.disconnect()
}

function togglePause() {
  isPaused.value = !isPaused.value
  logWs.send(isPaused.value ? 'pause' : 'resume')
  if (!isPaused.value) {
    scrollToBottom()
  }
}

function clearLogs() {
  realtimeLines.value = []
}

function scrollToBottom() {
  nextTick(() => {
    if (logViewerRef.value) {
      logViewerRef.value.scrollTop = logViewerRef.value.scrollHeight
    }
  })
}

// 历史模式逻辑
async function loadHistory() {
  try {
    const res: any = await logApi.readLog({
      filename: currentFile.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      level: level.value === 'ALL' ? undefined : level.value
    })
    if (res.code === 200 && res.data) {
      historyLines.value = res.data.lines || []
      totalLines.value = res.data.totalLines || 0
    }
  } catch {
    historyLines.value = []
  }
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  loadHistory()
}

function resetFilters() {
  keyword.value = ''
  level.value = 'ALL'
  currentPage.value = 1
  loadHistory()
}

function downloadLog() {
  const url = logApi.getDownloadUrl(currentFile.value)
  const token = localStorage.getItem('super_admin_token')
  // 通过隐藏 a 标签触发下载
  const link = document.createElement('a')
  link.href = url + '?token=' + token
  link.download = currentFile.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 文件切换
function handleFileChange(file: string) {
  if (mode.value === 'realtime') {
    realtimeLines.value = []
    logWs.send('switch', file)
  } else {
    currentPage.value = 1
    loadHistory()
  }
}

// 模式切换
function handleModeChange(newMode: string) {
  if (newMode === 'realtime') {
    connectWebSocket()
  } else {
    disconnectWebSocket()
    loadHistory()
  }
}

// 工具函数
function getLogLevel(line: string): string {
  if (line.includes(' ERROR ')) return 'level-error'
  if (line.includes(' WARN ') || line.includes(' WARN  ')) return 'level-warn'
  if (line.includes(' INFO ') || line.includes(' INFO  ')) return 'level-info'
  if (line.includes(' DEBUG ')) return 'level-debug'
  return ''
}

function getLineNumber(index: number): number {
  if (mode.value === 'history') {
    return (currentPage.value - 1) * pageSize.value + index + 1
  }
  return index + 1
}

// 生命周期
onMounted(() => {
  if (mode.value === 'realtime') {
    connectWebSocket()
  } else {
    loadHistory()
  }
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
.server-logs {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94A3B8;
  margin-right: 4px;
}

.mode-dot.active {
  background: #EF4444;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.sub-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
}

.sub-toolbar-left,
.sub-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748B;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94A3B8;
}

.status-indicator.connected .status-dot {
  background: #10B981;
}

.status-indicator.connecting .status-dot {
  background: #F59E0B;
  animation: pulse 1s infinite;
}

.status-indicator.disconnected .status-dot {
  background: #EF4444;
}

.log-viewer {
  flex: 1;
  overflow-y: auto;
  background: #1E293B;
  padding: 12px 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  min-height: 0;
}

.log-content {
  min-height: 100%;
}

.log-line {
  display: flex;
  padding: 0 16px;
  color: #E2E8F0;
}

.log-line:hover {
  background: rgba(255, 255, 255, 0.05);
}

.log-line.level-error {
  color: #EF4444;
}

.log-line.level-warn {
  color: #F59E0B;
}

.log-line.level-info {
  color: #22D3EE;
}

.log-line.level-debug {
  color: #94A3B8;
}

.line-number {
  display: inline-block;
  min-width: 50px;
  text-align: right;
  padding-right: 16px;
  color: #475569;
  user-select: none;
  flex-shrink: 0;
}

.line-text {
  white-space: pre-wrap;
  word-break: break-all;
}

.log-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #64748B;
  font-size: 14px;
}

.pagination {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #E2E8F0;
  display: flex;
  justify-content: center;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 6px 16px;
  background: #F1F5F9;
  border-top: 1px solid #E2E8F0;
  font-size: 12px;
  color: #64748B;
}
</style>
