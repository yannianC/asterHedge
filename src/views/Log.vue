<template>
  <div id="log">
    <main>
      <div class="header">
        <h1>对冲日志</h1>
        <div class="header-actions">
          <button @click="refreshData" class="btn-refresh">刷新</button>
          <button @click="goBack" class="btn-back">返回主页</button>
        </div>
      </div>

      <div class="table-container">
        <table class="log-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in logList" :key="index">
              <td>{{ formatTime(item.t) }}</td>
              <td>{{ item.m }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="logList.length === 0" class="empty-state">
          暂无日志数据
        </div>
      </div>

      <div class="pagination" >
        <button @click="goToPage(1)" :disabled="page === 1" class="btn-page">首页</button>
        <button @click="goToPage(page - 1)" :disabled="page === 1" class="btn-page">上一页</button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
        <button @click="goToPage(page + 1)" :disabled="page >= totalPages" class="btn-page">下一页</button>
        <button @click="goToPage(totalPages)" :disabled="page === totalPages" class="btn-page">末页</button>
        <div class="page-jump">
          <span>跳转到</span>
          <input 
            type="number" 
            v-model.number="jumpPage" 
            @keyup.enter="jumpToPage"
            min="1" 
            :max="totalPages" 
            class="jump-input"
          />
          <span>页</span>
          <button @click="jumpToPage" class="btn-jump">跳转</button>
        </div>
        <button @click="manualRefresh" class="btn-refresh-page">刷新</button>
        <div class="auto-refresh">
          <span>自动刷新间隔(s)</span>
          <input 
            type="number" 
            v-model.number="autoRefreshInterval" 
            @change="updateAutoRefresh"
            min="1" 
            class="interval-input"
          />
        </div>
      </div>

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const API_BASE = 'https://sg.bicoin.com.cn/99k/v2'
const logList = ref([])
const message = ref('')
const messageType = ref('success')
const page = ref(1)
const size = ref(500)
const total = ref(0)
const totalPages = ref(0)
const hedgeId = ref(null)
const jumpPage = ref(1)
const autoRefreshInterval = ref(60) // 默认60秒
let refreshTimer = null

// 获取日志列表
const fetchLogList = async () => {
  try {
    let url = `${API_BASE}/hedge/logList?page=${page.value}&size=${size.value}`
    if (hedgeId.value) {
      url += `&hedgeId=${hedgeId.value}`
    }
    
    const response = await fetch(url)
    const result = await response.json()
    
    if (result.code === '0' && result.data) {
      logList.value = result.data.list || []
      total.value = result.data.total || 0
      totalPages.value = result.data.totalPages || 0
    }
  } catch (error) {
    showMessage('获取日志失败: ' + error.message, 'error')
  }
}

/**
 * 格式化时间，精确到毫秒
 * @param {Number} timestamp - 时间戳
 * @returns {String} 格式化后的时间字符串 YYYY-MM-DD HH:mm:ss.SSS
 */
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

// 显示消息
const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// 手动刷新数据（原有的刷新按钮）
const refreshData = () => {
  fetchLogList()
  showMessage('数据已刷新', 'success')
}

/**
 * 手动刷新按钮（分页器中的刷新按钮）
 * 刷新当前页数据，如果不在最后一页则跳转到最后一页
 */
const manualRefresh = async () => {
  try {
    // 先获取最新的数据以确定总页数
    let url = `${API_BASE}/hedge/logList?page=1&size=${size.value}`
    if (hedgeId.value) {
      url += `&hedgeId=${hedgeId.value}`
    }
    
    const response = await fetch(url)
    const result = await response.json()
    
    if (result.code === '0' && result.data) {
      const newTotalPages = result.data.totalPages || 0
      
      // 如果当前不在最后一页，跳转到最后一页
      if (page.value < newTotalPages) {
        page.value = newTotalPages
      }
      
      // 刷新当前页数据
      await fetchLogList()
      showMessage('数据已刷新', 'success')
    }
  } catch (error) {
    showMessage('刷新失败: ' + error.message, 'error')
  }
}

/**
 * 自动刷新数据
 * 检查是否在最后一页，如果不在则自动跳转到最后一页
 */
const autoRefresh = async () => {
  try {
    // 先获取最新的数据以确定总页数
    let url = `${API_BASE}/hedge/logList?page=1&size=${size.value}`
    if (hedgeId.value) {
      url += `&hedgeId=${hedgeId.value}`
    }
    
    const response = await fetch(url)
    const result = await response.json()
    
    if (result.code === '0' && result.data) {
      const newTotalPages = result.data.totalPages || 0
      
      // 如果当前不在最后一页，自动跳转到最后一页
      if (page.value < newTotalPages) {
        page.value = newTotalPages
      }
      
      // 刷新当前页数据
      await fetchLogList()
    }
  } catch (error) {
    console.error('自动刷新失败:', error)
  }
}

/**
 * 启动定时器
 */
const startAutoRefresh = () => {
  // 清除旧的定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  // 如果间隔大于0，启动新的定时器
  if (autoRefreshInterval.value > 0) {
    refreshTimer = setInterval(() => {
      autoRefresh()
    }, autoRefreshInterval.value * 1000)
  }
}

/**
 * 更新自动刷新间隔
 */
const updateAutoRefresh = () => {
  startAutoRefresh()
  showMessage(`自动刷新间隔已设置为 ${autoRefreshInterval.value} 秒`, 'success')
}

// 跳转到指定页
const goToPage = (pageNum) => {
  if (pageNum >= 1 && pageNum <= totalPages.value) {
    page.value = pageNum
    fetchLogList()
  }
}

// 输入框跳转
const jumpToPage = () => {
  if (jumpPage.value >= 1 && jumpPage.value <= totalPages.value) {
    goToPage(jumpPage.value)
  } else {
    showMessage(`请输入 1 到 ${totalPages.value} 之间的页码`, 'error')
  }
}

// 返回主页
const goBack = () => {
  router.push('/')
}

// 组件挂载时
onMounted(() => {
  // 从URL参数获取hedgeId
  if (route.query.hedgeId) {
    hedgeId.value = route.query.hedgeId
  }
  fetchLogList()
  // 启动自动刷新
  startAutoRefresh()
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #dee2e6;
}

.header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-refresh {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-refresh:hover {
  background-color: #138496;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
}

.btn-back {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-back:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
}

.table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
}

.log-table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  font-size: 1rem;
}

.log-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.log-table tbody tr:hover {
  background-color: #f8f9fa;
}

.log-table td:first-child {
  white-space: nowrap;
  color: #6c757d;
  font-weight: 500;
  width: 220px;
}

.log-table td:last-child {
  color: #2c3e50;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-size: 1.1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.btn-page {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-page:hover:not(:disabled) {
  background-color: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-page:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-info {
  color: #495057;
  font-weight: 500;
  padding: 0 1rem;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.page-jump span {
  color: #495057;
  font-weight: 500;
}

.jump-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

.jump-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-jump {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-jump:hover {
  background-color: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-refresh-page {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
  margin-left: 1rem;
}

.btn-refresh-page:hover {
  background-color: #218838;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.auto-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid #dee2e6;
}

.auto-refresh span {
  color: #495057;
  font-weight: 500;
  white-space: nowrap;
}

.interval-input {
  width: 70px;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

.interval-input:focus {
  outline: none;
  border-color: #28a745;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
}

.message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  animation: slideIn 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>

