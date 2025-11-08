<template>
  <div id="home">
      <main>
        <!-- WebSocket断开提示 -->
        <div v-if="wsDisconnected" class="ws-disconnect-alert">
          <span class="alert-icon">⚠️</span>
          <span class="alert-text">WebSocket连接已断开（断开时间: {{ wsDisconnectTime }}），请刷新页面重新连接</span>
        </div>
        
        <div class="action-buttons">
          <button @click="addRows(10)" class="btn-add">新增对冲10列</button>
          <button @click="addRows(1)" class="btn-add">新增对冲1列</button>
          <button @click="refreshData" class="btn-refresh">刷新数据</button>
          <label class="switch-label">
            <input type="checkbox" v-model="smallEndAlertEnabled" @change="saveAlertSettings" />
            <span class="switch-text">单次完成提醒</span>
          </label>
          <label class="switch-label">
            <input type="checkbox" v-model="allEndAlertEnabled" @change="saveAlertSettings" />
            <span class="switch-text">全部完成提醒</span>
          </label>
          <div class="filter-container">
            <label class="filter-label">筛选ID:</label>
            <input 
              type="text" 
              v-model="filterInput" 
              placeholder="如: 1 或 1,2 或 1-4"
              class="filter-input"
              @input="saveFilterInput"
            />
          </div>
          <div class="auto-refresh-container">
            <label class="auto-refresh-label">
              <input type="checkbox" v-model="autoRefreshEnabled" @change="toggleAutoRefresh" />
              <span class="auto-refresh-text">自动更新</span>
            </label>
            <input 
              type="number" 
              v-model.number="autoRefreshInterval" 
              placeholder="60"
              min="5"
              class="auto-refresh-input"
              @change="saveAutoRefreshSettings"
            />
            <span class="auto-refresh-unit">秒</span>
          </div>
          <!-- <button @click="viewAllLogs" class="btn-all-log">查看所有日志</button> -->
        </div>

      <div class="table-container">
        <table class="hedge-table">
          <thead>
            <tr>
              <th class="col-narrow">ID</th>
              <th>运行状态</th>
              <th class="col-narrow">挂单账户币种配置</th>
              <th class="col-narrow">开仓总金额</th>
              <th class="col-narrow">当前已开</th>
              <th class="col-single-open">单次开仓数量</th>
              <th class="col-narrow">挂单账户单次数量</th>
              <th>挂单账户开仓类型</th>
              <th class="col-narrow">挂单账户预测仓位倍数</th>
              <th class="col-narrow">挂单账户预测净仓位倍数</th>
              <th class="col-narrow">挂单账户仓位配置</th>
              <th class="col-narrow">吃单账户预测仓位倍数</th>
              <th class="col-narrow">吃单账户预测净仓位倍数</th>
              <th>模式</th>
              <th class="col-narrow">深度挂单量最大值</th>
              <th class="col-narrow">挂单后多少时间再去吃单（ms）</th>
              <th class="col-narrow">1分钟最大波动(%)</th>
              <th class="col-narrow">盘口深度未改变时间（秒）</th>
              <th class="col-narrow">挂单深度变动最大</th>
              <th class="col-narrow">差额暂停</th>
              <th class="col-narrow">下单间隔</th>
              <th class="col-narrow">帐号筛选模式</th>
              <th class="col-narrow">账户ip最大延时</th>
              <th>校验规则</th>
            </tr>
          </thead>
          <tbody>
            <!-- 总计行 -->
            <tr v-if="filteredHedgeList.length > 0" class="total-row">
              <td class="col-id total-label">总计</td>
              <td class="col-status"></td>
              <td class="col-narrow"></td>
              <td class="col-narrow"></td>
              <td class="col-current-amt total-value">{{ filteredTotalCurrentAmt.toFixed(2) }}</td>
              <td colspan="19"></td>
            </tr>
            <tr v-for="(item, index) in filteredHedgeList" :key="item.id || `new-${index}`" :class="{ 'row-running': item.status === 0 }">
              <td class="col-id">
                <input type="text" v-model="item.id" disabled class="input-id" />
              </td>
              <td class="col-status">
                <div class="status-column">
                  <label class="status-switch">
                    <input type="checkbox" :checked="item.status === 0" @change="changeStatus(item)" :disabled="!item.id" />
                    <span class="slider" :class="{ running: item.status === 0, paused: item.status === 1 }"></span>
                    <span class="status-text">{{ item.status === 0 ? '运行中' : '暂停' }}</span>
                  </label>
                  <div class="action-buttons-vertical">
                    <button @click="saveHedge(item)" class="btn-save-small">保存</button>
                    <button @click="viewLog(item.id)" class="btn-log-small" :disabled="!item.id">日志</button>
                  </div>
                </div>
              </td>
              <td class="col-narrow td-with-msg" :class="{ 'has-msg': item.statusMsg, 'has-deal': item.dealInfoDisplay }">
                <div class="td-content">
                  <div v-if="item.statusMsg" class="status-msg-top">{{ item.statusMsg }}</div>
                  <input type="text" v-model="item.slaveCurrencyConfig" placeholder="sol,+" />
                  <div v-if="item.dealInfoDisplay" class="deal-info-bottom">{{ item.dealInfoDisplay }}</div>
                </div>
              </td>
              <td class="col-narrow td-center" :class="{ 'has-msg': item.statusMsg, 'has-deal': item.dealInfoDisplay }">
                <div class="td-content">
                  <input type="number" v-model="item.totalAmt" placeholder="300000" />
                </div>
              </td>
              <td class="col-narrow col-current-amt">
                <div class="current-amt-container">
                  <input type="number" v-model="item.currentAmt" placeholder="0" />
                  <button @click="cleanCurrentOpen(item)" class="btn-clean" :disabled="!item.id">清零</button>
                </div>
              </td>
              <td class="col-single-open">
                <input type="text" v-model="item.singleOpenAmtConfig" placeholder="100000,400000" />
              </td>
              <td class="col-narrow">
                <input type="text" v-model="item.slaveAccAmtConfig" placeholder="5,15" />
              </td>
              <td>
                <select v-model="item.slaveOpenType" class="select-type">
                  <option :value="null">请选择</option>
                  <option :value="1">1-开仓</option>
                  <option :value="2">2-只平</option>
                  <option :value="3">3-完全平仓</option>
                </select>
              </td>
              <td class="col-narrow">
                <input type="text" v-model="item.slavePredictPositionMulti" placeholder="-7,5" />
              </td>
              <td class="col-narrow">
                <input type="text" v-model="item.slavePredictNetPositionMulti" placeholder="-7,5" />
              </td>
              <td class="col-narrow">
                <input type="text" v-model="item.slavePosConfig" placeholder="sol,0,0" />
              </td>
              <td class="col-narrow">
                <input type="text" v-model="item.masterPredictPositionMulti" placeholder="-7,5" />
              </td>
              <td class="col-narrow">
                <input type="text" v-model="item.masterPredictNetPositionMulti" placeholder="-7,5" />
              </td>
              <td class="col-mode">
                <select v-model="item.openModel" @change="handleOpenModelChange(item)" class="select-type">
                  <option :value="null">请选择</option>
                  <option :value="1">1</option>
                  <option :value="2">2</option>
                </select>
              </td>
              <td class="col-narrow">
                <input type="number" v-model="item.openModel2MaxUAmt" placeholder="仅模式2需要" :disabled="item.openModel !== 2" />
              </td>
              <td class="col-narrow">
                <input type="number" v-model="item.openModel2Interval" placeholder="仅模式2需要" :disabled="item.openModel !== 2" />
              </td>
              <td class="col-narrow">
                <input type="number" v-model="item.waveMax" placeholder="0" />
              </td>
              <td class="col-narrow">
                <input type="number" v-model="item.depthNotChangeLast" placeholder="0" />
              </td>
              <td class="col-narrow">
                <input type="number" v-model="item.depthAmtMaxChange" placeholder="挂单深度变动最大" />
              </td>
              <td class="col-narrow">
                <input type="text" v-model="item.posWarn" placeholder="差额暂停" />
              </td>
              <td class="col-narrow">
                <input type="text" v-model="item.dealInterval" placeholder="下单间隔" />
              </td>
              <td class="col-narrow">
                <select v-model="item.filterType" class="select-type">
                  <option :value="null">请选择</option>
                  <option :value="1">1-从大到小</option>
                  <option :value="2">2-从小到大</option>
                  <option :value="3">3-随机</option>
                </select>
              </td>
              <td class="col-narrow">
                <input type="number" v-model="item.maxDelay" placeholder="账户ip最大延时" />
              </td>
              <td>
                <div class="validation-config">
                  <div class="validation-item">
                    <label>
                      <input type="checkbox" v-model="item.hasCurrentCurrencyPos" />
                      该币种有仓位
                    </label>
                  </div>
                  <div class="validation-item">
                    <label>
                      <input type="checkbox" v-model="item.needJudgePredictPosMulti" />
                      预测仓位倍数
                    </label>
                    <div v-if="item.needJudgePredictPosMulti" class="validation-detail">
                      <select v-model="item.judgePredictPosMultiType" class="select-mini">
                        <option :value="1">≤</option>
                        <option :value="2">≥</option>
                      </select>
                      <input type="number" v-model="item.judgePredictPosMultiVal" placeholder="倍数" class="input-mini" />
                    </div>
                  </div>
                  <div class="validation-item">
                    <label>
                      <input type="checkbox" v-model="item.needJudgePredictNetPosMulti" />
                      预测净仓位倍数
                    </label>
                    <div v-if="item.needJudgePredictNetPosMulti" class="validation-detail">
                      <select v-model="item.judgePredictNetPosMultiType" class="select-mini">
                        <option :value="1">≤</option>
                        <option :value="2">≥</option>
                      </select>
                      <input type="number" v-model="item.judgePredictNetPosMultiVal" placeholder="倍数" class="input-mini" />
                    </div>
                  </div>
                  <!-- <div class="validation-item">
                    <label>
                      <input type="checkbox" v-model="item.onlyClosePosition" />
                      只平仓
                    </label>
                  </div> -->
                  <div class="validation-item">
                    <label>
                      <input type="checkbox" v-model="item.needJudgeLastNotDealTime" />
                      最近未交易时间
                    </label>
                    <div v-if="item.needJudgeLastNotDealTime" class="validation-detail">
                      <input type="number" v-model="item.lastNoDealTimeVal" placeholder="分钟" class="input-mini" />
                      <span class="unit-text">分钟</span>
                    </div>
                  </div>
                  <!-- <div class="validation-item">
                    <label>
                      <input type="checkbox" v-model="item.onlyOpenPosition" />
                      只开仓
                    </label>
                  </div> -->
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="hedgeList.length === 0" class="empty-state">
          暂无数据，点击上方按钮新增对冲数据
        </div>
        <div v-else-if="filteredHedgeList.length === 0" class="empty-state">
          没有符合筛选条件的数据
        </div>
      </div>

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>

      <!-- 自动化操作流程表 -->
      <div class="automation-section">
        <h2 class="section-title">自动化操作流程</h2>
        
        <div class="automation-buttons">
          <button @click="addAutomationRows(1)" class="btn-add-auto">添加1行</button>
          <button @click="addAutomationRows(5)" class="btn-add-auto">添加5行</button>
          <button @click="addAutomationRows(10)" class="btn-add-auto">添加10行</button>
        </div>

        <div class="automation-table-container">
          <table class="automation-table">
            <thead>
              <tr>
                <th class="col-checkbox">勾选</th>
                <th class="col-sequence">序号</th>
                <th class="col-auto-input">等多久后操作(分钟)</th>
                <th class="col-auto-input">ID</th>
                <th class="col-auto-input">开启后多久关闭(分钟)</th>
                <th class="col-auto-input">关闭后多久执行下一个(分钟)</th>
                <th class="col-auto-input">平仓的ID</th>
                <th class="col-auto-input">结束后跳转序号</th>
                <th class="col-auto-status">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in automationList" :key="index">
                <td class="col-checkbox">
                  <input type="checkbox" v-model="item.checked" :disabled="item.running" />
                </td>
                <td class="col-sequence">
                  <span class="sequence-number">{{ index + 1 }}</span>
                </td>
                <td>
                  <input type="number" v-model.number="item.waitMinutes" placeholder="等待分钟" min="0" :disabled="item.running" />
                </td>
                <td>
                  <input type="number" v-model.number="item.hedgeId" placeholder="ID" min="1" :disabled="item.running" />
                </td>
                <td>
                  <input type="number" v-model.number="item.openDuration" placeholder="开启时长" min="0" :disabled="item.running" />
                </td>
                <td>
                  <input type="number" v-model.number="item.waitAfterClose" placeholder="等待分钟" min="0" :disabled="item.running" />
                </td>
                <td>
                  <input type="number" v-model.number="item.closeHedgeId" placeholder="平仓ID" min="1" :disabled="item.running" />
                </td>
                <td>
                  <input type="number" v-model.number="item.jumpToSequence" placeholder="跳转序号" min="1" :disabled="item.running" />
                </td>
                <td class="col-auto-status">
                  <span :class="['status-badge', item.statusClass]">{{ item.statusText }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="automationList.length === 0" class="empty-state">
            暂无数据，点击上方按钮添加自动化流程
          </div>
        </div>

          <div class="automation-action-buttons">
            <button @click="toggleSelectAll" class="btn-select-all">{{ selectAllButtonText }}</button>
            <button @click="runAutomation" class="btn-run-auto">运行</button>
            <button @click="exportAutomation" class="btn-export-auto">导出</button>
            <div class="import-group">
              <input 
                type="text" 
                v-model="importText" 
                placeholder="粘贴导入的配置字符串"
                class="import-input"
              />
              <button @click="importAutomation" class="btn-import-auto">导入</button>
            </div>
            <button @click="deleteAutomation" class="btn-delete-auto">删除</button>
          </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const API_BASE = 'https://sg.bicoin.com.cn/99k/v2'
const WS_BASE = 'wss://sg.bicoin.com.cn/99k/v2'
const hedgeList = ref([])
const message = ref('')
const messageType = ref('success')
let ws = null
let heartbeatTimer = null // 心跳检测定时器

/**
 * 解析筛选输入，返回符合条件的ID数组
 * @param {String} input - 筛选输入（如：1 或 1,2 或 1-4）
 * @returns {Array} ID数组
 */
const parseFilterInput = (input) => {
  if (!input || !input.trim()) {
    return []
  }
  
  const ids = new Set()
  const parts = input.split(',').map(p => p.trim()).filter(p => p)
  
  parts.forEach(part => {
    if (part.includes('-')) {
      // 处理范围：如 1-4
      const [start, end] = part.split('-').map(s => parseInt(s.trim()))
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          ids.add(i)
        }
      }
    } else {
      // 处理单个数字
      const num = parseInt(part)
      if (!isNaN(num)) {
        ids.add(num)
      }
    }
  })
  
  return Array.from(ids)
}

/**
 * 过滤后的对冲列表
 */
const filteredHedgeList = computed(() => {
  const filterIds = parseFilterInput(filterInput.value)
  
  if (filterIds.length === 0) {
    return hedgeList.value
  }
  
  return hedgeList.value.filter(item => {
    return item.id && filterIds.includes(parseInt(item.id))
  })
})

/**
 * 计算"当前已开"的总和（所有数据）
 */
const totalCurrentAmt = computed(() => {
  return hedgeList.value.reduce((sum, item) => {
    const amt = parseFloat(item.currentAmt) || 0
    return sum + amt
  }, 0)
})

/**
 * 计算"当前已开"的总和（筛选后的数据）
 */
const filteredTotalCurrentAmt = computed(() => {
  return filteredHedgeList.value.reduce((sum, item) => {
    const amt = parseFloat(item.currentAmt) || 0
    return sum + amt
  }, 0)
})

// 音频提醒开关状态
const smallEndAlertEnabled = ref(false)
const allEndAlertEnabled = ref(false)

// 筛选条件
const filterInput = ref('')

// 自动刷新设置
const autoRefreshEnabled = ref(false)
const autoRefreshInterval = ref(60) // 默认60秒
let autoRefreshTimer = null

// 自动化操作流程
const automationList = ref([])
const runningAutomations = new Map() // 存储运行中的自动化任务
const importText = ref('') // 导入文本框

// 音频播放相关
let smallEndAudio = null
let allEndAudio = null
let smallEndTimer = null
let allEndTimer = null
let wsDisconnectTimer = null

// WebSocket断开提示
const wsDisconnected = ref(false)
const wsDisconnectTime = ref(null)

// 记录已播放的ALL_FINISH的finishTime
const lastPlayedFinishTime = ref(null)

// 音频上下文是否已激活
let audioContextActivated = false

/**
 * 生成唯一的WebSocket类型标识
 * @returns {String} 唯一标识字符串
 */
const generateUniqueType = () => {
  return `browser_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * 获取或创建WebSocket唯一标识
 * 优先从localStorage读取，不存在则生成新的并存储
 * @returns {String} 唯一标识字符串
 */
const getOrCreateWSId = () => {
  const storageKey = 'ws_unique_id'
  let wsId = localStorage.getItem(storageKey)
  
  if (!wsId) {
    // 本地没有，生成新的并存储
    wsId = generateUniqueType()
    localStorage.setItem(storageKey, wsId)
    console.log('生成新的WebSocket ID:', wsId)
  } else {
    console.log('使用本地存储的WebSocket ID:', wsId)
  }
  
  return wsId
}

/**
 * 格式化交易信息显示
 * @param {Object} dealInfo - 交易信息对象 {lastUAmount, time}
 * @returns {String} 格式化后的显示文本
 */
const formatDealInfo = (dealInfo) => {
  if (!dealInfo || !dealInfo.time) {
    return ''
  }
  
  const formattedTime = formatTimestamp(dealInfo.time)
  const amount = dealInfo.lastUAmount || 0
  return `${formattedTime} 成交量:${amount}`
}

/**
 * 获取对冲配置列表
 */
const fetchHedgeList = async () => {
  try {
    const response = await fetch(`${API_BASE}/hedge/list`)
    const result = await response.json()
    if (result.data && result.data.list) {
      // 将后端返回的0/1转换为Boolean值
      hedgeList.value = result.data.list.map(item => ({
        ...item,
        status: item.status !== undefined ? item.status : 0, // 默认运行中
        hasCurrentCurrencyPos: item.hasCurrentCurrencyPos === 1,
        needJudgePredictPosMulti: item.needJudgePredictPosMulti === 1,
        needJudgePredictNetPosMulti: item.needJudgePredictNetPosMulti === 1,
        needJudgeLastNotDealTime: item.needJudgeLastNotDealTime === 1,
        statusMsg: '', // WebSocket推送的状态消息
        dealInfoDisplay: formatDealInfo(item.dealInfo) // 格式化交易信息显示
      }))
    }
  } catch (error) {
    showMessage('获取数据失败: ' + error.message, 'error')
  }
}

/**
 * 启动心跳检测
 */
const startHeartbeat = () => {
  stopHeartbeat() // 先停止之前的定时器
  heartbeatTimer = setTimeout(() => {
    console.warn('20秒内未收到WebSocket消息，判定为连接断开')
    // 显示断开提示
    wsDisconnected.value = true
    wsDisconnectTime.value = new Date().toLocaleString()
    showMessage('WebSocket连接已断开，请刷新页面重新连接', 'error')
    
    // 关闭当前连接
    if (ws) {
      ws.close()
    }
  }, 30000) // 20秒
}

/**
 * 重置心跳检测定时器
 */
const resetHeartbeat = () => {
  startHeartbeat()
}

/**
 * 停止心跳检测
 */
const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer)
    heartbeatTimer = null
  }
}

/**
 * 建立WebSocket连接
 */
const connectWebSocket = () => {
  try {
    const uniqueType = getOrCreateWSId()
    const wsUrl = `${WS_BASE}/hedge/${uniqueType}`
    
    ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket连接已建立')
      
      // 连接成功，清除断开定时器和提示
      if (wsDisconnectTimer) {
        clearTimeout(wsDisconnectTimer)
        wsDisconnectTimer = null
      }
      
      // 清除断开提示
      wsDisconnected.value = false
      wsDisconnectTime.value = null
      
      // 启动心跳检测
      startHeartbeat()
    }
    
    ws.onmessage = (event) => {
      try {
        // 收到消息，重置心跳检测
        resetHeartbeat()
        
        const wsData = JSON.parse(event.data)
        handleWebSocketMessage(wsData)
      } catch (error) {
        console.error('WebSocket消息解析失败:', error)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
    }
    
    ws.onclose = () => {
      console.log('WebSocket连接已关闭')
      
      // 停止心跳检测
      stopHeartbeat()
      
      // 清除3分钟定时器（如果有）
      if (wsDisconnectTimer) {
        clearTimeout(wsDisconnectTimer)
        wsDisconnectTimer = null
      }
      
      // 3秒后尝试重连
      setTimeout(() => {
        if (ws && ws.readyState === WebSocket.CLOSED) {
          console.log('尝试重新连接WebSocket')
          connectWebSocket()
        }
      }, 3000)
    }
  } catch (error) {
    console.error('WebSocket连接失败:', error)
  }
}

/**
 * 格式化时间戳为 月-日 时:分:秒.毫秒
 * @param {Number} timestamp - 时间戳
 * @returns {String} 格式化后的时间字符串
 */
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
  return `${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

/**
 * 创建带旋律的循环提示音
 * @param {Number} duration - 持续时间（毫秒）
 * @param {Array} melody - 旋律数组，每个元素是 {freq: 频率, duration: 持续时间(ms)}
 * @returns {Object} 包含播放和停止方法的对象
 */
const createMelodyAlertSound = (duration, melody) => {
  let audioContext = null
  let oscillator = null
  let gainNode = null
  let isPlaying = false
  let melodyTimer = null
  let stopTimer = null
  
  const playMelodyLoop = () => {
    if (!isPlaying) return
    
    let currentTime = audioContext.currentTime
    let totalMelodyDuration = 0
    
    // 计算整个旋律的总时长
    melody.forEach(note => {
      totalMelodyDuration += note.duration
    })
    
    // 播放旋律，处理音量来实现静音效果
    melody.forEach(note => {
      // 如果频率为0，表示静音，将音量设为0
      if (note.freq === 0) {
        gainNode.gain.setValueAtTime(0, currentTime)
      } else {
        gainNode.gain.setValueAtTime(0.3, currentTime)
        oscillator.frequency.setValueAtTime(note.freq, currentTime)
      }
      currentTime += note.duration / 1000
    })
    
    // 在旋律结束后重新开始循环
    melodyTimer = setTimeout(() => {
      if (isPlaying) {
        playMelodyLoop()
      }
    }, totalMelodyDuration)
  }
  
  const play = () => {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      oscillator = audioContext.createOscillator()
      gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // 设置提示音参数
      oscillator.type = 'sine'
      // 设置初始频率（使用旋律的第一个音符）
      const firstNote = melody.find(note => note.freq > 0)
      if (firstNote) {
        oscillator.frequency.setValueAtTime(firstNote.freq, audioContext.currentTime)
      }
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime) // 音量30%
      
      oscillator.start()
      isPlaying = true
      
      // 开始播放旋律循环
      playMelodyLoop()
      
      // 持续播放指定时间后停止
      stopTimer = setTimeout(() => {
        stop()
      }, duration)
    } catch (error) {
      console.error('音频播放失败:', error)
    }
  }
  
  const stop = () => {
    try {
      isPlaying = false
      
      if (melodyTimer) {
        clearTimeout(melodyTimer)
        melodyTimer = null
      }
      
      if (stopTimer) {
        clearTimeout(stopTimer)
        stopTimer = null
      }
      
      if (oscillator) {
        try {
          oscillator.stop()
        } catch (e) {
          // oscillator可能已经停止，忽略错误
        }
        try {
          oscillator.disconnect()
        } catch (e) {
          // 忽略断开连接错误
        }
        oscillator = null
      }
      if (gainNode) {
        try {
          gainNode.disconnect()
        } catch (e) {
          // 忽略断开连接错误
        }
        gainNode = null
      }
      if (audioContext) {
        try {
          audioContext.close()
        } catch (e) {
          // 忽略关闭错误
        }
        audioContext = null
      }
    } catch (error) {
      console.error('音频停止失败:', error)
    }
  }
  
  return { play, stop }
}

// 定义两种不同的旋律
// 旋律1: 单次完成提醒(SINGLE_FINISH) - 轻快的双音提示
const smallEndMelody = [
  { freq: 800, duration: 200 },
  { freq: 1000, duration: 200 },
  { freq: 0, duration: 400 }  // 静音间隔
]

// 旋律2: 全部完成提醒(ALL_FINISH) - 三连音上升
const allEndMelody = [
  { freq: 600, duration: 150 },
  { freq: 800, duration: 150 },
  { freq: 1000, duration: 150 },
  { freq: 0, duration: 350 }  // 静音间隔
]

/**
 * 播放单次完成提醒音（10秒）- 轻快的双音提示
 * 对应SINGLE_FINISH消息
 */
const playSmallEndAlert = () => {
  console.log('playSmallEndAlert被调用，开关状态:', smallEndAlertEnabled.value)
  
  if (!smallEndAlertEnabled.value) {
    console.warn('单次完成提醒开关未开启，跳过播放')
    return
  }
  
  // 停止之前的播放
  if (smallEndAudio) {
    console.log('停止之前的单次完成提醒音')
    smallEndAudio.stop()
  }
  if (smallEndTimer) {
    clearTimeout(smallEndTimer)
  }
  
  console.log('开始播放单次完成提醒音（10秒）- 轻快双音')
  try {
    smallEndAudio = createMelodyAlertSound(10000, smallEndMelody)
    smallEndAudio.play()
    console.log('单次完成提醒音播放成功')
  } catch (error) {
    console.error('单次完成提醒音播放失败:', error)
  }
}

/**
 * 播放全部完成提醒音（5分钟）- 三连音上升
 * 对应ALL_FINISH消息
 */
const playAllEndAlert = () => {
  if (!allEndAlertEnabled.value) return
  
  // 停止之前的播放
  if (allEndAudio) {
    allEndAudio.stop()
  }
  if (allEndTimer) {
    clearTimeout(allEndTimer)
  }
  
  console.log('播放全部完成提醒音（5分钟）- 三连音上升')
  allEndAudio = createMelodyAlertSound(300000, allEndMelody)
  allEndAudio.play()
}

/**
 * 激活音频上下文
 * 浏览器要求用户交互后才能播放音频
 */
const activateAudioContext = async () => {
  if (audioContextActivated) return
  
  try {
    // 创建一个临时的AudioContext来激活
    const tempContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // 播放一个极短的静音来激活音频
    const tempOscillator = tempContext.createOscillator()
    const tempGain = tempContext.createGain()
    tempGain.gain.setValueAtTime(0, tempContext.currentTime) // 静音
    tempOscillator.connect(tempGain)
    tempGain.connect(tempContext.destination)
    tempOscillator.start()
    tempOscillator.stop(tempContext.currentTime + 0.01)
    
    // 等待一下然后关闭
    setTimeout(() => {
      tempContext.close()
    }, 100)
    
    audioContextActivated = true
    console.log('音频上下文已激活')
  } catch (error) {
    console.error('激活音频上下文失败:', error)
  }
}

/**
 * 保存提醒设置到localStorage
 */
const saveAlertSettings = () => {
  localStorage.setItem('smallEndAlertEnabled', smallEndAlertEnabled.value ? '1' : '0')
  localStorage.setItem('allEndAlertEnabled', allEndAlertEnabled.value ? '1' : '0')
  
  // 用户勾选时激活音频上下文
  if (smallEndAlertEnabled.value || allEndAlertEnabled.value) {
    activateAudioContext()
  }
}

/**
 * 从localStorage加载提醒设置
 */
const loadAlertSettings = () => {
  const smallEnabled = localStorage.getItem('smallEndAlertEnabled')
  const allEnabled = localStorage.getItem('allEndAlertEnabled')
  
  smallEndAlertEnabled.value = smallEnabled === '1'
  allEndAlertEnabled.value = allEnabled === '1'
  
  // 加载上次播放的finishTime
  const savedFinishTime = localStorage.getItem('lastPlayedFinishTime')
  if (savedFinishTime) {
    lastPlayedFinishTime.value = parseInt(savedFinishTime)
    console.log('加载上次播放的finishTime:', lastPlayedFinishTime.value)
  }
  
  // 如果有提醒开关被启用，提示用户需要点击页面来激活音频
  if (smallEndAlertEnabled.value || allEndAlertEnabled.value) {
    setTimeout(() => {
      showMessage('提醒功能已启用，请点击页面任意位置激活音频', 'info')
    }, 500)
  }
}

/**
 * 保存筛选条件到localStorage
 */
const saveFilterInput = () => {
  localStorage.setItem('hedgeFilterInput', filterInput.value)
}

/**
 * 从localStorage加载筛选条件
 */
const loadFilterInput = () => {
  const savedFilter = localStorage.getItem('hedgeFilterInput')
  if (savedFilter) {
    filterInput.value = savedFilter
  }
}

/**
 * 启动自动刷新定时器
 */
const startAutoRefresh = () => {
  // 清除已有的定时器
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  
  if (autoRefreshEnabled.value && autoRefreshInterval.value > 0) {
    console.log(`启动自动刷新，间隔: ${autoRefreshInterval.value}秒`)
    autoRefreshTimer = setInterval(() => {
      console.log('自动刷新列表数据')
      fetchHedgeList()
    }, autoRefreshInterval.value * 1000)
  }
}

/**
 * 停止自动刷新定时器
 */
const stopAutoRefresh = () => {
  if (autoRefreshTimer) {
    console.log('停止自动刷新')
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

/**
 * 切换自动刷新状态
 */
const toggleAutoRefresh = () => {
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
  saveAutoRefreshSettings()
}

/**
 * 保存自动刷新设置到localStorage
 */
const saveAutoRefreshSettings = () => {
  localStorage.setItem('autoRefreshEnabled', autoRefreshEnabled.value ? '1' : '0')
  localStorage.setItem('autoRefreshInterval', autoRefreshInterval.value.toString())
  
  // 如果已启用，重新启动定时器（间隔时间可能变化了）
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  }
}

/**
 * 从localStorage加载自动刷新设置
 */
const loadAutoRefreshSettings = () => {
  const enabled = localStorage.getItem('autoRefreshEnabled')
  const interval = localStorage.getItem('autoRefreshInterval')
  
  if (enabled === '1') {
    autoRefreshEnabled.value = true
  }
  
  if (interval) {
    const intervalNum = parseInt(interval)
    if (!isNaN(intervalNum) && intervalNum > 0) {
      autoRefreshInterval.value = intervalNum
    }
  }
  
  // 如果启用了自动刷新，启动定时器
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  }
}

/**
 * 处理WebSocket推送的消息
 * @param {Object} wsData - WebSocket消息数据
 */
const handleWebSocketMessage = (wsData) => {
  // 处理HEDGE_STATUS类型消息
  if (wsData.type === 'HEDGE_STATUS' && wsData.data) {
    const { hedgeId, msg, time } = wsData.data
    
    // 查找对应的hedgeId
    const targetItem = hedgeList.value.find(item => item.id === hedgeId)
    
    if (targetItem) {
      // 格式化时间并拼接到msg前面
      const formattedTime = time ? formatTimestamp(time) : ''
      const displayMsg = formattedTime ? `${formattedTime} ${msg}` : msg
      
      // 将消息放到statusMsg字段中，一直显示不清除
      targetItem.statusMsg = displayMsg
    }
  }
  
  // 处理SINGLE_FINISH类型消息 - 播放10秒提示音
  if (wsData.type === 'SINGLE_FINISH') {
    console.log('收到SINGLE_FINISH消息，准备播放10秒提示音')
    playSmallEndAlert()
  }
  
  // 处理ALL_FINISH类型消息 - 播放5分钟提示音
  if (wsData.type === 'ALL_FINISH' && wsData.data) {
    const { finishTime } = wsData.data
    
    console.log('收到ALL_FINISH消息，finishTime:', finishTime)
    
    // 检查是否是新的finishTime
    if (finishTime && finishTime !== lastPlayedFinishTime.value) {
      console.log('新的finishTime，播放提示音')
      lastPlayedFinishTime.value = finishTime
      // 保存到localStorage
      localStorage.setItem('lastPlayedFinishTime', finishTime.toString())
      console.log('已保存finishTime到localStorage:', finishTime)
      playAllEndAlert()
    } else {
      console.log('相同的finishTime，跳过播放')
    }
  }
}

/**
 * 关闭WebSocket连接
 */
const closeWebSocket = () => {
  stopHeartbeat() // 停止心跳检测
  if (ws) {
    ws.close()
    ws = null
  }
}

/**
 * 修改运行状态
 * @param {Object} item - 对冲配置项
 */
const changeStatus = async (item) => {
  if (!item.id) {
    showMessage('请先保存配置后再修改状态', 'error')
    return
  }
  
  try {
    // 切换状态：0 -> 1 或 1 -> 0
    const newStatus = item.status === 0 ? 1 : 0
    
    const response = await fetch(`${API_BASE}/hedge/changeStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: item.id,
        status: newStatus
      })
    })
    
    const result = await response.json()
    if (result.code === 0 || result.success) {
      item.status = newStatus
      showMessage(newStatus === 0 ? '已切换为运行中' : '已切换为暂停', 'success')
    } else {
      showMessage('状态修改失败: ' + (result.message || '未知错误'), 'error')
    }
  } catch (error) {
    showMessage('状态修改失败: ' + error.message, 'error')
  }
}

/**
 * 保存或更新对冲配置
 * @param {Object} item - 对冲配置项
 */
const saveHedge = async (item) => {
  try {
    const payload = {
      slaveCurrencyConfig: item.slaveCurrencyConfig,
      totalAmt: item.totalAmt,
      currentAmt: item.currentAmt,
      singleOpenAmtConfig: item.singleOpenAmtConfig,
      slaveAccAmtConfig: item.slaveAccAmtConfig,
      slaveOpenType: item.slaveOpenType,
      slavePredictPositionMulti: item.slavePredictPositionMulti,
      slavePredictNetPositionMulti: item.slavePredictNetPositionMulti,
      slavePosConfig: item.slavePosConfig,
      masterNumberConfig: item.masterNumberConfig,
      masterPredictPositionMulti: item.masterPredictPositionMulti,
      masterPredictNetPositionMulti: item.masterPredictNetPositionMulti,
      // 新增字段
      openModel: item.openModel,
      openModel2MaxUAmt: item.openModel2MaxUAmt,
      openModel2Interval: item.openModel2Interval,
      waveMax: item.waveMax,
      depthNotChangeLast: item.depthNotChangeLast,
      depthAmtMaxChange: item.depthAmtMaxChange,
      // 新增参数字段
      posWarn: item.posWarn,
      dealInterval: item.dealInterval,
      filterType: item.filterType,
      maxDelay: item.maxDelay,
      // 校验规则字段 (0-false, 1-true)
      hasCurrentCurrencyPos: item.hasCurrentCurrencyPos ? 1 : 0,
      needJudgePredictPosMulti: item.needJudgePredictPosMulti ? 1 : 0,
      judgePredictPosMultiType: item.judgePredictPosMultiType || 1,
      judgePredictPosMultiVal: item.judgePredictPosMultiVal,
      needJudgePredictNetPosMulti: item.needJudgePredictNetPosMulti ? 1 : 0,
      judgePredictNetPosMultiType: item.judgePredictNetPosMultiType || 1,
      judgePredictNetPosMultiVal: item.judgePredictNetPosMultiVal,
      needJudgeLastNotDealTime: item.needJudgeLastNotDealTime ? 1 : 0,
      lastNoDealTimeVal: item.lastNoDealTimeVal
    }

    // 如果有id则是更新，否则是新增
    if (item.id) {
      payload.id = item.id
    }

    const response = await fetch(`${API_BASE}/hedge/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    showMessage(item.id ? '更新成功' : '新增成功', 'success')
    
    // 刷新列表
    // await fetchHedgeList()
  } catch (error) {
    showMessage('保存失败: ' + error.message, 'error')
  }
}

/**
 * 新增对冲配置行
 * @param {Number} count - 新增的行数
 */
const addRows = (count) => {
  for (let i = 0; i < count; i++) {
    hedgeList.value.push({
      id: null,
      status: 0, // 默认运行中
      slaveCurrencyConfig: '',
      totalAmt: '',
      currentAmt: '',
      singleOpenAmtConfig: '',
      slaveAccAmtConfig: '',
      slaveOpenType: null,
      slavePredictPositionMulti: '',
      slavePredictNetPositionMulti: '',
      slavePosConfig: '',
      masterNumberConfig: '',
      masterPredictPositionMulti: '',
      masterPredictNetPositionMulti: '',
      // 新增字段初始化
      openModel: null,
      openModel2MaxUAmt: '',
      openModel2Interval: '',
      waveMax: '',
      depthNotChangeLast: '',
      depthAmtMaxChange: '',
      // 新增参数字段初始化
      posWarn: '',
      dealInterval: '',
      filterType: null,
      maxDelay: '',
      // 校验规则字段初始化
      hasCurrentCurrencyPos: false,
      needJudgePredictPosMulti: false,
      judgePredictPosMultiType: 1,
      judgePredictPosMultiVal: null,
      needJudgePredictNetPosMulti: false,
      judgePredictNetPosMultiType: 1,
      judgePredictNetPosMultiVal: null,
      needJudgeLastNotDealTime: false,
      lastNoDealTimeVal: null,
      statusMsg: '', // WebSocket推送的状态消息
      dealInfoDisplay: '' // 交易信息显示
    })
  }
  showMessage(`已添加 ${count} 行新数据`, 'success')
}

/**
 * 清零当前已开金额
 * @param {Object} item - 对冲配置项
 */
const cleanCurrentOpen = async (item) => {
  if (!item.id) {
    showMessage('请先保存数据后再清零', 'error')
    return
  }
  
  try {
    const response = await fetch(`${API_BASE}/hedge/cleanCurrentOpen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: item.id })
    })
    
    if (!response.ok) {
      throw new Error('清零请求失败')
    }
    
    showMessage('清零成功', 'success')
    
    // 重新获取列表信息
    await fetchHedgeList()
  } catch (error) {
    showMessage('清零失败: ' + error.message, 'error')
    console.error('清零失败:', error)
  }
}

/**
 * 处理模式变化
 * @param {Object} item - 对冲配置项
 */
const handleOpenModelChange = (item) => {
  // 当选择模式1时，清空模式2相关的字段（因为模式1不需要这些值）
  if (item.openModel === 1) {
    item.openModel2MaxUAmt = ''
    item.openModel2Interval = ''
  }
}

/**
 * 显示提示消息
 * @param {String} msg - 消息内容
 * @param {String} type - 消息类型 (success/error)
 */
const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

/**
 * 手动刷新数据
 */
const refreshData = () => {
  // 用户点击时激活音频上下文
  if (smallEndAlertEnabled.value || allEndAlertEnabled.value) {
    activateAudioContext()
  }
  
  fetchHedgeList()
  showMessage('数据已刷新', 'success')
}

/**
 * 查看指定对冲配置的日志
 * @param {Number} hedgeId - 对冲配置ID
 */
const viewLog = (hedgeId) => {
  if (hedgeId) {
    window.open(`/asterHedge2/#/log?hedgeId=${hedgeId}`, '_blank')
  }
}

/**
 * 查看所有日志
 */
const viewAllLogs = () => {
  window.open(`/asterHedge2/#/log`, '_blank')
}

/**
 * 全局点击事件处理函数，用于激活音频上下文
 */
const handleGlobalClick = () => {
  if (smallEndAlertEnabled.value || allEndAlertEnabled.value) {
    activateAudioContext()
    // 激活后移除监听器
    if (audioContextActivated) {
      document.removeEventListener('click', handleGlobalClick)
    }
  }
}

/**
 * 保存自动化流程数据到localStorage
 */
const saveAutomationToLocal = () => {
  try {
    // 保存时排除运行状态相关的字段
    const dataToSave = automationList.value.map(item => ({
      checked: false, // 重置勾选状态
      waitMinutes: item.waitMinutes,
      hedgeId: item.hedgeId,
      openDuration: item.openDuration,
      waitAfterClose: item.waitAfterClose,
      closeHedgeId: item.closeHedgeId,
      jumpToSequence: item.jumpToSequence,
      running: false, // 重置运行状态
      statusText: '未启动',
      statusClass: 'status-waiting'
    }))
    localStorage.setItem('automationFlowList', JSON.stringify(dataToSave))
    console.log('自动化流程数据已保存到本地')
  } catch (error) {
    console.error('保存自动化流程数据失败:', error)
  }
}

/**
 * 从localStorage加载自动化流程数据
 */
const loadAutomationFromLocal = () => {
  try {
    const savedData = localStorage.getItem('automationFlowList')
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      automationList.value = parsedData
      console.log('已加载自动化流程数据:', parsedData.length, '行')
    }
  } catch (error) {
    console.error('加载自动化流程数据失败:', error)
  }
}

/**
 * 添加自动化流程行
 * @param {Number} count - 添加的行数
 */
const addAutomationRows = (count) => {
  for (let i = 0; i < count; i++) {
    automationList.value.push({
      checked: false,
      waitMinutes: null,
      hedgeId: null,
      openDuration: null,
      waitAfterClose: null,
      closeHedgeId: null,
      jumpToSequence: null,
      running: false,
      statusText: '未启动',
      statusClass: 'status-waiting'
    })
  }
  saveAutomationToLocal() // 保存到本地
  showMessage(`已添加 ${count} 行自动化流程`, 'success')
}

/**
 * 删除选中的自动化流程
 */
const deleteAutomation = () => {
  const checkedItems = automationList.value.filter(item => item.checked && !item.running)
  
  if (checkedItems.length === 0) {
    showMessage('请勾选要删除的行（运行中的不能删除）', 'error')
    return
  }
  
  automationList.value = automationList.value.filter(item => !item.checked || item.running)
  saveAutomationToLocal() // 保存到本地
  showMessage(`已删除 ${checkedItems.length} 行`, 'success')
}

/**
 * 全选按钮文本（根据当前状态动态显示）
 */
const selectAllButtonText = computed(() => {
  // 筛选出可以操作的项（非运行中的项）
  const operableItems = automationList.value.filter(item => !item.running)
  
  if (operableItems.length === 0) {
    return '全选'
  }
  
  // 检查是否所有可操作项都已勾选
  const allChecked = operableItems.every(item => item.checked)
  
  return allChecked ? '全不选' : '全选'
})

/**
 * 全选/全不选切换
 */
const toggleSelectAll = () => {
  // 筛选出可以操作的项（非运行中的项）
  const operableItems = automationList.value.filter(item => !item.running)
  
  if (operableItems.length === 0) {
    showMessage('没有可操作的项', 'error')
    return
  }
  
  // 检查是否所有可操作项都已勾选
  const allChecked = operableItems.every(item => item.checked)
  
  // 如果全部勾选则全不选，否则全选
  operableItems.forEach(item => {
    item.checked = !allChecked
  })
  
  const action = allChecked ? '全不选' : '全选'
  showMessage(`已${action} ${operableItems.length} 项`, 'success')
}

/**
 * 导出选中的自动化流程
 */
const exportAutomation = async () => {
  const checkedItems = automationList.value.filter(item => item.checked && !item.running)
  
  if (checkedItems.length === 0) {
    showMessage('请勾选要导出的流程', 'error')
    return
  }
  
  try {
    // 提取需要导出的配置数据，同时记录原始序号
    const exportData = checkedItems.map((item, index) => {
      // 找到该item在automationList中的原始位置
      const originalIndex = automationList.value.indexOf(item)
      return {
        s: originalIndex + 1,       // 原始序号（用于导入时重新映射）
        w: item.waitMinutes,        // 等待时间
        i: item.hedgeId,            // ID
        d: item.openDuration,       // 持续时间
        a: item.waitAfterClose,     // 后续等待
        c: item.closeHedgeId,       // 平仓ID
        j: item.jumpToSequence      // 跳转序号
      }
    })
    
    // 直接使用JSON字符串（简化键名以缩短长度）
    const jsonStr = JSON.stringify(exportData)
    
    // 复制到剪贴板
    await navigator.clipboard.writeText(jsonStr)
    
    showMessage(`已导出 ${checkedItems.length} 个流程配置到剪贴板`, 'success')
  } catch (error) {
    console.error('导出失败:', error)
    showMessage('导出失败，请检查浏览器权限', 'error')
  }
}

/**
 * 导入自动化流程（覆盖原有数据）
 */
const importAutomation = () => {
  if (!importText.value || !importText.value.trim()) {
    showMessage('请输入要导入的配置字符串', 'error')
    return
  }
  
  try {
    // 直接解析JSON字符串
    const importData = JSON.parse(importText.value.trim())
    
    if (!Array.isArray(importData) || importData.length === 0) {
      showMessage('导入的数据格式不正确', 'error')
      return
    }
    
    // 验证数据格式（支持简化键名）
    // w 和 a 可以为 null（表示不填写），但 i、d、c 必须有值
    for (const item of importData) {
      if (!item.i || !item.d || !item.c) {
        showMessage('导入的数据格式不完整（缺少必填字段：ID、开启时长或平仓ID）', 'error')
        return
      }
      // w 和 a 可以为 null，不需要验证
    }
    
    // 建立序号映射：旧序号 → 新序号
    const sequenceMap = new Map()
    importData.forEach((item, index) => {
      if (item.s) {
        // 如果有原始序号，建立映射关系
        sequenceMap.set(item.s, index + 1)
      }
    })
    
    // 清空原有数据并导入新数据（覆盖模式）
    automationList.value = importData.map((item, index) => {
      let newJumpToSequence = null
      
      // 如果有跳转序号且有序号映射，则重新映射
      if (item.j && sequenceMap.size > 0) {
        // 尝试从映射中找到新序号
        newJumpToSequence = sequenceMap.get(item.j) || item.j
        // 如果映射后的序号超出范围，设为null
        if (newJumpToSequence > importData.length) {
          console.warn(`跳转序号 ${item.j} 在导入的数据中不存在，已清除`)
          newJumpToSequence = null
        }
      } else if (item.j) {
        // 没有序号映射，直接使用原跳转序号
        newJumpToSequence = item.j
      }
      
      return {
        checked: false,
        waitMinutes: item.w !== undefined ? item.w : null,
        hedgeId: item.i,
        openDuration: item.d,
        waitAfterClose: item.a !== undefined ? item.a : null,
        closeHedgeId: item.c,
        jumpToSequence: newJumpToSequence,
        running: false,
        statusText: '未启动',
        statusClass: 'status-waiting'
      }
    })
    
    saveAutomationToLocal() // 保存到本地
    importText.value = '' // 清空输入框
    showMessage(`成功导入 ${importData.length} 个流程配置（已覆盖原有数据）`, 'success')
  } catch (error) {
    console.error('导入失败:', error)
    showMessage('导入失败，配置字符串格式不正确', 'error')
  }
}

/**
 * 运行自动化流程
 */
const runAutomation = async () => {
  const checkedItems = automationList.value.filter(item => item.checked && !item.running)
  
  if (checkedItems.length === 0) {
    showMessage('请勾选要运行的流程', 'error')
    return
  }
  
  // 过滤掉没有填写等待时间的项目（null、undefined、空字符串都算未填写）
  const validItems = checkedItems.filter(item => {
    return item.waitMinutes !== null && 
           item.waitMinutes !== undefined && 
           item.waitMinutes !== '' &&
           !isNaN(item.waitMinutes)
  })
  
  if (validItems.length === 0) {
    showMessage('所有勾选的流程都没有填写"等多久后操作"，无法运行', 'error')
    return
  }
  
  // 验证输入
  for (const item of validItems) {
    if (!item.hedgeId || !item.openDuration || item.waitMinutes === null || 
        item.waitAfterClose === null || !item.closeHedgeId) {
      showMessage('请完整填写所有必填字段', 'error')
      return
    }
  }
  
  const skippedCount = checkedItems.length - validItems.length
  if (skippedCount > 0) {
    showMessage(`开始运行 ${validItems.length} 个自动化流程（跳过 ${skippedCount} 个未填写等待时间的）`, 'success')
  } else {
    showMessage(`开始运行 ${validItems.length} 个自动化流程`, 'success')
  }
  
  // 为每个勾选的项目启动自动化流程
  for (const item of validItems) {
    runSingleAutomation(item, false)
  }
}

/**
 * 运行单个自动化流程
 * @param {Object} item - 自动化流程项
 * @param {Boolean} skipWait - 是否跳过第一步等待（用于跳转）
 */
const runSingleAutomation = async (item, skipWait = false) => {
  item.running = true
  item.statusClass = 'status-waiting'
  
  const automationId = Date.now() + Math.random()
  
  try {
    // 步骤1：等待指定时间（如果skipWait为true则跳过）
    if (!skipWait) {
      const startWaitTime = Date.now()
      const waitDuration = item.waitMinutes * 60 * 1000
      
      // 显示等待倒计时
      const waitCountdown = setInterval(() => {
        if (!item.running) {
          clearInterval(waitCountdown)
          return
        }
        const elapsed = Date.now() - startWaitTime
        const remaining = Math.max(0, Math.ceil((waitDuration - elapsed) / 60000))
        item.statusText = `[步骤1/5] 初始等待中，剩余 ${remaining} 分钟`
      }, 1000)
      
      await sleep(waitDuration)
      clearInterval(waitCountdown)
      
      if (!item.running) return // 如果已取消，退出
    }
    
    // 步骤2：开启对应ID的运行状态
    item.statusText = `[步骤2/5] 正在开启 ID ${item.hedgeId} 的运行状态...`
    item.statusClass = 'status-running'
    
    const success = await changeHedgeStatus(item.hedgeId, 0) // 0表示运行中
    if (!success) {
      item.statusText = '[失败] 开启ID失败'
      item.statusClass = 'status-error'
      item.running = false
      return
    }
    
    item.statusText = `[步骤2/5] ID ${item.hedgeId} 已开启运行`
    await sleep(2000) // 显示2秒
    
    // 步骤3：监控运行状态
    const startTime = Date.now()
    const maxDuration = item.openDuration * 60 * 1000
    
    item.statusText = `[步骤3/5] 监控 ID ${item.hedgeId} 运行状态...`
    item.statusClass = 'status-monitoring'
    
    // 执行步骤4和步骤5的函数（提取出来避免重复代码）
    const executeStep4And5 = async () => {
      // 步骤4：等待关闭后的时间
      item.statusClass = 'status-waiting'
      const waitAfterStartTime = Date.now()
      const waitAfterDuration = item.waitAfterClose * 60 * 1000
      
      // 显示等待倒计时
      const waitAfterCountdown = setInterval(() => {
        if (!item.running) {
          clearInterval(waitAfterCountdown)
          return
        }
        const elapsed = Date.now() - waitAfterStartTime
        const remaining = Math.max(0, Math.ceil((waitAfterDuration - elapsed) / 60000))
        item.statusText = `[步骤4/5] 等待执行平仓，剩余 ${remaining} 分钟`
      }, 1000)
      
      await sleep(waitAfterDuration)
      clearInterval(waitAfterCountdown)
      
      if (!item.running) return
      
      // 步骤5：开启平仓ID
      item.statusText = `[步骤5/5] 正在开启平仓 ID ${item.closeHedgeId}...`
      item.statusClass = 'status-running'
      
      const closeSuccess = await changeHedgeStatus(item.closeHedgeId, 0)
      if (!closeSuccess) {
        item.statusText = '[失败] 开启平仓ID失败'
        item.statusClass = 'status-error'
        item.running = false
        return
      }
      
      item.statusText = `[步骤5/5] 平仓 ID ${item.closeHedgeId} 已开启`
      await sleep(2000) // 显示2秒
      
      // 检查是否有跳转序号
      if (item.jumpToSequence && item.jumpToSequence > 0) {
        const targetIndex = item.jumpToSequence - 1 // 序号从1开始，索引从0开始
        if (targetIndex >= 0 && targetIndex < automationList.value.length) {
          const targetItem = automationList.value[targetIndex]
          item.statusText = `✓ 流程完成，准备跳转到序号 ${item.jumpToSequence}`
          item.statusClass = 'status-completed'
          item.running = false
          item.checked = false
          
          showMessage(`自动化流程完成：ID ${item.hedgeId} → ${item.closeHedgeId}，即将跳转到序号 ${item.jumpToSequence}`, 'success')
          
          // 等待1秒后跳转执行
          await sleep(1000)
          
          // 跳转执行，跳过第一步等待
          runSingleAutomation(targetItem, true)
        } else {
          item.statusText = `✓ 流程完成（跳转序号 ${item.jumpToSequence} 无效）`
          item.statusClass = 'status-completed'
          item.running = false
          item.checked = false
          showMessage(`自动化流程完成：ID ${item.hedgeId} → ${item.closeHedgeId}（跳转序号无效）`, 'success')
        }
      } else {
        item.statusText = `✓ 流程完成: ${item.hedgeId} → ${item.closeHedgeId}`
        item.statusClass = 'status-completed'
        item.running = false
        item.checked = false
        showMessage(`自动化流程完成：ID ${item.hedgeId} → ${item.closeHedgeId}`, 'success')
      }
    }
    
    const monitorInterval = setInterval(async () => {
      if (!item.running) {
        clearInterval(monitorInterval)
        return
      }
      
      const elapsed = Date.now() - startTime
      const remainingMinutes = Math.ceil((maxDuration - elapsed) / 60000)
      const elapsedMinutes = Math.floor(elapsed / 60000)
      
      // 检查策略是否还在运行
      const hedgeItem = hedgeList.value.find(h => h.id === item.hedgeId)
      
      // 如果策略已经自动停止，立即进入步骤4
      if (hedgeItem && hedgeItem.status !== 0) {
        item.statusText = `[步骤3/5] ID ${item.hedgeId} 已自动停止（运行了 ${elapsedMinutes} 分钟）`
        await sleep(2000) // 显示2秒
        
        clearInterval(monitorInterval)
        
        // 立即进入步骤4和步骤5
        await executeStep4And5()
        return
      }
      
      // 更新监控状态
      item.statusText = `[步骤3/5] 监控中 ID ${item.hedgeId}，已运行 ${elapsedMinutes} 分钟，剩余 ${remainingMinutes} 分钟`
      
      // 检查是否达到最大运行时间
      if (elapsed >= maxDuration) {
        // 时间到了，需要手动关闭策略
        item.statusText = `[步骤3/5] 时间到，正在关闭 ID ${item.hedgeId}...`
        await changeHedgeStatus(item.hedgeId, 1) // 1表示暂停
        item.statusText = `[步骤3/5] ID ${item.hedgeId} 已手动关闭（运行了 ${elapsedMinutes} 分钟）`
        await sleep(2000) // 显示2秒
        
        clearInterval(monitorInterval)
        
        // 进入步骤4和步骤5
        await executeStep4And5()
      }
    }, 10000) // 每10秒检测一次
    
    runningAutomations.set(automationId, monitorInterval)
    
  } catch (error) {
    console.error('自动化流程执行失败:', error)
    item.statusText = `✗ 执行失败: ${error.message}`
    item.statusClass = 'status-error'
    item.running = false
    showMessage(`自动化流程执行失败: ${error.message}`, 'error')
  }
}

/**
 * 修改对冲配置的运行状态
 * @param {Number} hedgeId - 对冲配置ID
 * @param {Number} status - 状态 (0-运行中, 1-暂停)
 * @returns {Boolean} 是否成功
 */
const changeHedgeStatus = async (hedgeId, status) => {
  try {
    const response = await fetch(`${API_BASE}/hedge/changeStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: hedgeId,
        status: status
      })
    })
    
    const result = await response.json()
    if (result.code === 0 || result.success) {
      // 更新本地状态
      const hedgeItem = hedgeList.value.find(h => h.id === hedgeId)
      if (hedgeItem) {
        hedgeItem.status = status
      }
      return true
    } else {
      console.error('状态修改失败:', result.message)
      return false
    }
  } catch (error) {
    console.error('状态修改请求失败:', error)
    return false
  }
}

/**
 * 睡眠函数
 * @param {Number} ms - 毫秒数
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 监听自动化流程数据变化并保存（防抖处理，避免频繁保存）
let saveTimeout = null
watch(
  () => automationList.value.map(item => ({
    waitMinutes: item.waitMinutes,
    hedgeId: item.hedgeId,
    openDuration: item.openDuration,
    waitAfterClose: item.waitAfterClose,
    closeHedgeId: item.closeHedgeId,
    jumpToSequence: item.jumpToSequence
  })),
  () => {
    // 防抖：500ms内如果有新的变化就重置定时器
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      saveAutomationToLocal()
    }, 500)
  },
  { deep: true }
)

// 组件挂载时加载数据并建立WebSocket连接
onMounted(() => {
  fetchHedgeList()
  connectWebSocket()
  loadAlertSettings() // 加载提醒设置
  loadFilterInput() // 加载筛选条件
  loadAutoRefreshSettings() // 加载自动刷新设置
  loadAutomationFromLocal() // 加载自动化流程数据
  
  // 添加全局点击监听器用于激活音频上下文
  document.addEventListener('click', handleGlobalClick)
})

// 组件卸载时关闭WebSocket连接和清理音频资源
onUnmounted(() => {
  closeWebSocket()
  
  // 移除全局点击监听器
  document.removeEventListener('click', handleGlobalClick)
  
  // 停止自动刷新定时器
  stopAutoRefresh()
  
  // 停止心跳检测
  stopHeartbeat()
  
  // 清理保存定时器
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  // 清理音频资源
  if (smallEndAudio) {
    smallEndAudio.stop()
  }
  if (allEndAudio) {
    allEndAudio.stop()
  }
  if (smallEndTimer) {
    clearTimeout(smallEndTimer)
  }
  if (allEndTimer) {
    clearTimeout(allEndTimer)
  }
  if (wsDisconnectTimer) {
    clearTimeout(wsDisconnectTimer)
  }
})
</script>

<style scoped>
main {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

/* WebSocket断开提示样式 */
.ws-disconnect-alert {
  background-color: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
  animation: alertPulse 2s ease-in-out infinite;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-text {
  font-size: 1rem;
  font-weight: 600;
  flex: 1;
}

@keyframes alertPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-add {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-add:hover {
  background-color: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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

/* 提醒开关样式 */
.switch-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.switch-label:hover {
  background-color: #e9ecef;
}

.switch-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #28a745;
}

.switch-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
}

/* 筛选功能样式 */
.filter-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  transition: all 0.3s;
}

.filter-container:hover {
  background-color: #e9ecef;
}

.filter-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
}

.filter-input {
  width: 180px;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.filter-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-input::placeholder {
  color: #adb5bd;
  font-size: 0.85rem;
}

/* 自动刷新功能样式 */
.auto-refresh-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  transition: all 0.3s;
}

.auto-refresh-container:hover {
  background-color: #e9ecef;
}

.auto-refresh-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  user-select: none;
}

.auto-refresh-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #28a745;
}

.auto-refresh-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
}

.auto-refresh-input {
  width: 80px;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.3s;
  text-align: center;
}

.auto-refresh-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.auto-refresh-unit {
  font-size: 0.9rem;
  color: #6c757d;
  white-space: nowrap;
}

.btn-all-log {
  background-color: #fd7e14;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-all-log:hover {
  background-color: #e8590c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(253, 126, 20, 0.4);
}

.table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.hedge-table {
  width: auto;
  border-collapse: collapse;
  min-width: auto;
}

.hedge-table thead {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: #f8f9fa;
}

.hedge-table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  padding: 1rem 0.5rem;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  font-size: 0.9rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hedge-table th.col-narrow {
  white-space: normal;
  word-wrap: break-word;
  max-width: 100px;
  min-width: 80px;
}

.hedge-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.hedge-table td.col-narrow {
  width: 100px;
  max-width: 100px;
}

.hedge-table td.col-narrow input {
  width: 90px;
  min-width: 90px;
  max-width: 90px;
}

/* ID列样式 - 宽度减半 */
.hedge-table td.col-id {
  width: 50px;
  max-width: 50px;
  padding: 0.75rem 0.25rem;
}

.hedge-table td.col-id input {
  width: 45px;
  min-width: 45px;
  max-width: 45px;
  font-size: 0.85rem;
  padding: 0.4rem 0.2rem;
}

/* 运行状态列样式 - 包含开关和按钮 */
.hedge-table td.col-status {
  width: 120px;
  max-width: 120px;
  padding: 0.5rem 0.3rem;
}

.status-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.action-buttons-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
}

.btn-save-small,
.btn-log-small {
  width: 100%;
  padding: 0.4rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
  white-space: nowrap;
}

.btn-save-small {
  background-color: #28a745;
  color: white;
}

.btn-save-small:hover {
  background-color: #218838;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
}

.btn-log-small {
  background-color: #ffc107;
  color: #000;
}

.btn-log-small:hover:not(:disabled) {
  background-color: #e0a800;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 193, 7, 0.3);
}

.btn-log-small:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 当前已开列样式 - 包含输入框和清零按钮 */
.hedge-table td.col-current-amt {
  padding: 0.75rem 0.5rem;
  position: relative;
  min-height: 80px;
}

.current-amt-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.current-amt-container input {
  min-width: 90px;
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
}

.current-amt-container .btn-clean {
  position: absolute;
  top: calc(50% + 22px);
  left: 0;
  right: 0;
}

.btn-clean {
  width: 100%;
  padding: 0.3rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
  background-color: #dc3545;
  color: white;
  white-space: nowrap;
}

.btn-clean:hover:not(:disabled) {
  background-color: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(220, 53, 69, 0.3);
}

.btn-clean:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 模式列样式 - 设置最小宽度 */
.hedge-table td.col-mode {
  min-width: 100px;
  width: 100px;
}

/* 单次开仓数量列样式 - 设置最小宽度 */
.hedge-table th.col-single-open,
.hedge-table td.col-single-open {
  min-width: 160px;
}

.hedge-table tbody tr {
  position: relative;
}

.hedge-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* 运行中状态的行背景 */
.hedge-table tbody tr.row-running {
  background-color: #d4edda;
}

.hedge-table tbody tr.row-running:hover {
  background-color: #c3e6cb;
}

/* 总计行样式 */
.hedge-table tbody .total-row {
  background-color: #e3f2fd;
  font-weight: 600;
  border-top: 2px solid #2196f3;
  border-bottom: 3px solid #2196f3;
  position: sticky;
  top: 52px;
  z-index: 98;
}

.hedge-table tbody .total-row:hover {
  background-color: #e3f2fd !important;
}

.hedge-table tbody .total-row td {
  padding: 0.75rem 0.5rem;
}

.hedge-table tbody .total-row .total-label {
  text-align: center;
  color: #1976d2;
  font-size: 1rem;
  font-weight: 700;
}

.hedge-table tbody .total-row .total-value {
  text-align: center;
  color: #0d47a1;
  font-size: 1rem;
  font-weight: 700;
  background-color: #bbdefb;
}

.hedge-table input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.3s;
}

/* 挂单账户币种配置和开仓总金额列的输入框居中 */
.hedge-table .td-with-msg input,
.hedge-table .td-center input {
  text-align: center !important;
}

.hedge-table input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.hedge-table input[type="number"] {
  min-width: 120px;
}

.hedge-table input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.6;
  color: #6c757d;
}

.hedge-table .select-type {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.hedge-table .select-type:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-id {
  background-color: #e9ecef;
  cursor: not-allowed;
}


.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-size: 1.1rem;
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

/* 校验规则样式 */
.validation-config {
  min-width: 280px;
  padding: 0.5rem;
}

.validation-item {
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.validation-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #495057;
  font-weight: 500;
}

.validation-item input[type="checkbox"] {
  width: auto;
  margin-right: 0.4rem;
  cursor: pointer;
}

.validation-detail {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.3rem;
  margin-left: 1.3rem;
}

.select-mini {
  width: 60px;
  padding: 0.3rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.select-mini:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.input-mini {
  width: 80px !important;
  min-width: 80px !important;
  padding: 0.3rem !important;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: border-color 0.3s;
}

.input-mini:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.unit-text {
  color: #6c757d;
  font-size: 0.8rem;
  white-space: nowrap;
}

/* 运行状态开关样式 */
.status-switch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  position: relative;
  user-select: none;
}

.status-switch input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.status-switch .slider {
  position: relative;
  display: inline-block;
  width: 45px;
  height: 22px;
  background-color: #dc3545;
  border-radius: 22px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-switch .slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-switch input[type="checkbox"]:checked + .slider {
  background-color: #28a745;
}

.status-switch input[type="checkbox"]:checked + .slider::before {
  transform: translateX(23px);
}

.status-switch input[type="checkbox"]:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-switch .slider.running {
  background-color: #28a745;
}

.status-switch .slider.paused {
  background-color: #dc3545;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.status-switch:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.6;
}

/* WebSocket状态消息样式 - 显示在输入框上方 */
.td-with-msg {
  position: relative;
  vertical-align: middle;
}

.td-center {
  vertical-align: middle;
}

.td-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
}

.td-content input {
  width: 100%;
}

.status-msg-top {
  position: absolute;
  bottom: calc(100% + 0.3rem);
  left: 50%;
  transform: translateX(-25%);
  padding: 0.4rem 0.6rem;
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  font-size: 0.85rem;
  line-height: 1.3;
  white-space: nowrap;
  z-index: 10;
  animation: fadeIn 0.3s ease-in;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

/* 交易信息显示 - 显示在输入框下方，居中横跨两列 */
.deal-info-bottom {
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 50%;
  transform: translateX(-25%);
  padding: 0.4rem 0.6rem;
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
  border-radius: 4px;
  font-size: 0.85rem;
  line-height: 1.3;
  white-space: nowrap;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-in;
  z-index: 10;
  min-width: 200px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 自动化操作流程样式 */
.automation-section {
  max-width: 100%;
  margin: 3rem auto 0;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #495057;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 3px solid #667eea;
}

.automation-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-add-auto {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-add-auto:hover {
  background-color: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.automation-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
}

.automation-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1300px;
}

.automation-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f8f9fa;
}

.automation-table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  padding: 1rem 0.75rem;
  text-align: center;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  font-size: 0.9rem;
}

.automation-table th.col-checkbox {
  width: 60px;
}

.automation-table th.col-sequence {
  width: 60px;
}

.automation-table th.col-auto-input {
  width: 150px;
}

.automation-table th.col-auto-status {
  width: 320px;
  min-width: 320px;
}

.automation-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  text-align: center;
}

.automation-table td.col-auto-status {
  text-align: left;
}

.automation-table td.col-sequence {
  text-align: center;
}

.sequence-number {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background-color: #667eea;
  color: white;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
}

.automation-table tbody tr:hover {
  background-color: #f8f9fa;
}

.automation-table input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.automation-table input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.3s;
  text-align: center;
}

.automation-table input[type="number"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.automation-table input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.6;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 0.9rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: normal;
  word-break: break-word;
  max-width: 300px;
  line-height: 1.5;
}

.status-waiting {
  background-color: #ffc107;
  color: #000;
}

.status-running {
  background-color: #28a745;
  color: white;
}

.status-monitoring {
  background-color: #17a2b8;
  color: white;
}

.status-completed {
  background-color: #6c757d;
  color: white;
}

.status-error {
  background-color: #dc3545;
  color: white;
}

.automation-action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.btn-select-all {
  background-color: #6f42c1;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-select-all:hover {
  background-color: #5a32a3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(111, 66, 193, 0.4);
}

.btn-run-auto {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-run-auto:hover {
  background-color: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.btn-export-auto {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-export-auto:hover {
  background-color: #138496;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
}

.import-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.import-input {
  width: 300px;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.import-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.import-input::placeholder {
  color: #adb5bd;
  font-size: 0.85rem;
}

.btn-import-auto {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-import-auto:hover {
  background-color: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-delete-auto {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-delete-auto:hover {
  background-color: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}
</style>

