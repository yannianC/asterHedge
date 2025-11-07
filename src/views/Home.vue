<template>
  <div id="home">
      <main>
        <div class="action-buttons">
          <button @click="addRows(10)" class="btn-add">新增对冲10列</button>
          <button @click="addRows(1)" class="btn-add">新增对冲1列</button>
          <button @click="refreshData" class="btn-refresh">刷新数据</button>
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
              <th>单次开仓数量</th>
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
              <th class="col-narrow">最大延迟</th>
              <th>校验规则</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in hedgeList" :key="item.id || `new-${index}`">
              <td class="col-narrow">
                <input type="text" v-model="item.id" disabled class="input-id" />
              </td>
              <td>
                <label class="status-switch">
                  <input type="checkbox" :checked="item.status === 0" @change="changeStatus(item)" :disabled="!item.id" />
                  <span class="slider" :class="{ running: item.status === 0, paused: item.status === 1 }"></span>
                  <span class="status-text">{{ item.status === 0 ? '运行中' : '暂停' }}</span>
                </label>
              </td>
              <td class="col-narrow td-with-msg" :class="{ 'has-msg': item.statusMsg }">
                <div class="td-content">
                  <div v-if="item.statusMsg" class="status-msg-top">{{ item.statusMsg }}</div>
                  <input type="text" v-model="item.slaveCurrencyConfig" placeholder="sol,+" />
                </div>
              </td>
              <td class="col-narrow td-center" :class="{ 'has-msg': item.statusMsg }">
                <div class="td-content">
                  <input type="number" v-model="item.totalAmt" placeholder="300000" />
                </div>
              </td>
              <td class="col-narrow">
                <input type="number" v-model="item.currentAmt" placeholder="0" />
              </td>
              <td>
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
              <td>
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
                <input type="number" v-model="item.maxDelay" placeholder="最大延迟" />
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
              <td>
                <div class="action-group">
                  <button @click="saveHedge(item)" class="btn-save">保存</button>
                  <button @click="viewLog(item.id)" class="btn-log" :disabled="!item.id">日志</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="hedgeList.length === 0" class="empty-state">
          暂无数据，点击上方按钮新增对冲数据
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

const API_BASE = 'https://sg.bicoin.com.cn/99k/v2'
const WS_BASE = 'wss://sg.bicoin.com.cn/99k/v2'
const hedgeList = ref([])
const message = ref('')
const messageType = ref('success')
let ws = null

/**
 * 生成唯一的WebSocket类型标识
 * @returns {String} 唯一标识字符串
 */
const generateUniqueType = () => {
  return `browser_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
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
        statusMsg: '' // WebSocket推送的状态消息
      }))
    }
  } catch (error) {
    showMessage('获取数据失败: ' + error.message, 'error')
  }
}

/**
 * 建立WebSocket连接
 */
const connectWebSocket = () => {
  try {
    const uniqueType = generateUniqueType()
    const wsUrl = `${WS_BASE}/hedge/${uniqueType}`
    
    ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket连接已建立')
    }
    
    ws.onmessage = (event) => {
      try {
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
      // 可以在这里实现重连逻辑
      setTimeout(() => {
        if (ws && ws.readyState === WebSocket.CLOSED) {
          connectWebSocket()
        }
      }, 3000)
    }
  } catch (error) {
    console.error('WebSocket连接失败:', error)
  }
}

/**
 * 处理WebSocket推送的消息
 * @param {Object} wsData - WebSocket消息数据
 */
const handleWebSocketMessage = (wsData) => {
  if (wsData.type === 'HEDGE_STATUS' && wsData.data) {
    const { hedgeId, msg } = wsData.data
    
    // 查找对应的hedgeId
    const targetItem = hedgeList.value.find(item => item.id === hedgeId)
    
    if (targetItem) {
      // 将消息放到statusMsg字段中，一直显示不清除
      targetItem.statusMsg = msg
    }
  }
}

/**
 * 关闭WebSocket连接
 */
const closeWebSocket = () => {
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
    await fetchHedgeList()
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
      statusMsg: '' // WebSocket推送的状态消息
    })
  }
  showMessage(`已添加 ${count} 行新数据`, 'success')
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

// 组件挂载时加载数据并建立WebSocket连接
onMounted(() => {
  fetchHedgeList()
  connectWebSocket()
})

// 组件卸载时关闭WebSocket连接
onUnmounted(() => {
  closeWebSocket()
})
</script>

<style scoped>
main {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
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
}

.hedge-table {
  width: auto;
  border-collapse: collapse;
  min-width: auto;
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

.hedge-table tbody tr {
  position: relative;
}

.hedge-table tbody tr:hover {
  background-color: #f8f9fa;
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

.action-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
}

.btn-save {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
  white-space: nowrap;
}

.btn-save:hover {
  background-color: #218838;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.btn-log {
  background-color: #ffc107;
  color: #000;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
  white-space: nowrap;
}

.btn-log:hover:not(:disabled) {
  background-color: #e0a800;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.btn-log:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
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
  align-items: center;
  gap: 0.5rem;
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
  width: 50px;
  height: 24px;
  background-color: #dc3545;
  border-radius: 24px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-switch .slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
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
  transform: translateX(26px);
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
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 50px;
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
  padding: 0.3rem 0.5rem;
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  font-size: 0.75rem;
  line-height: 1.2;
  white-space: nowrap;
  z-index: 10;
  animation: fadeIn 0.3s ease-in;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-25%) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(-25%) translateY(0);
  }
}
</style>

