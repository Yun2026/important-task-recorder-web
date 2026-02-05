<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Task } from '@/types'
import { 
  SettingIcon, 
  CloseIcon, 
  MenuIcon,
  SearchIcon,
  TimeIcon
} from 'tdesign-icons-vue-next'

interface Props {
  visible: boolean
  task: Task | null
  tasks: Task[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'taskChange', taskId: string | null): void
  (e: 'complete', taskId: string): void
}>()

// 计时器状态
const timerMode = ref<'countdown' | 'countup'>('countdown')
const timerHours = ref(0)
const timerMinutes = ref(25)
const totalSeconds = ref(0)
const elapsedSeconds = ref(0)
const isRunning = ref(false)
const isPaused = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null

// 每个事务的计时状态独立存储
interface TaskTimerState {
  elapsedSeconds: number
  isPaused: boolean
  totalSeconds: number
}

// 事务计时状态Map
const taskTimerStates = ref<Map<string, TaskTimerState>>(new Map())

// 保存当前事务的计时状态
const saveCurrentTaskTimerState = () => {
  if (!currentTask.value) return
  const state: TaskTimerState = {
    elapsedSeconds: elapsedSeconds.value,
    isPaused: isPaused.value,
    totalSeconds: totalSeconds.value
  }
  taskTimerStates.value.set(currentTask.value.id, state)
}

// 加载指定事务的计时状态
const loadTaskTimerState = (taskId: string | null) => {
  if (!taskId) {
    // 自由专注模式，使用默认值
    initTimer()
    isPaused.value = false
    isRunning.value = false
    return
  }
  
  const state = taskTimerStates.value.get(taskId)
  if (state) {
    // 恢复之前保存的状态
    elapsedSeconds.value = state.elapsedSeconds
    isPaused.value = state.isPaused
    totalSeconds.value = state.totalSeconds
    isRunning.value = false
  } else {
    // 新事务，使用默认初始状态
    initTimer()
    isPaused.value = false
    isRunning.value = false
  }
}

// 配色设置
const bgColor = ref('#1a1a2e')
const textColor = ref('#ffffff')
const progressColor = ref('#0052D9')

// 设置面板显示状态
const showSettings = ref(false)

// 事务选择弹窗状态
const showTaskSelector = ref(false)
const taskSearchKey = ref('')

// 计时结束弹窗状态
const showTimeUpModal = ref(false)

// 完成确认弹窗状态
const showCompleteConfirmModal = ref(false)
const wasRunningBeforeConfirm = ref(false)

// 未完成事务列表
const unfinishedTasks = computed(() => {
  return props.tasks.filter(t => t.status === 'unfinished')
})

// 过滤后的事务列表
const filteredTasks = computed(() => {
  if (!taskSearchKey.value) return unfinishedTasks.value
  const key = taskSearchKey.value.toLowerCase()
  return unfinishedTasks.value.filter(t => 
    t.title.toLowerCase().includes(key) || 
    t.subTitle?.toLowerCase().includes(key)
  )
})

// 当前专注的事务
const currentTask = computed(() => {
  return props.task
})

// 进度百分比
const progressPercent = computed(() => {
  if (totalSeconds.value === 0) return 0
  
  if (timerMode.value === 'countdown') {
    // 倒计时：从100%递减到0%，基于剩余时间
    const remaining = Math.max(0, totalSeconds.value - elapsedSeconds.value)
    return (remaining / totalSeconds.value) * 100
  } else {
    // 正计时：从0%递增，可以超过100%
    return (elapsedSeconds.value / totalSeconds.value) * 100
  }
})

// 格式化时间显示
const formattedTime = computed(() => {
  const remaining = timerMode.value === 'countdown' 
    ? Math.max(0, totalSeconds.value - elapsedSeconds.value)
    : elapsedSeconds.value
  
  const hours = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 是否全屏
const isFullscreen = ref(false)

// 是否移动端
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

// 从localStorage加载设置
const loadSettings = () => {
  const savedSettings = localStorage.getItem('VUE_TASK_FOCUS_SETTINGS')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    timerMode.value = settings.timerMode || 'countdown'
    timerHours.value = settings.timerHours || 0
    timerMinutes.value = settings.timerMinutes || 25
    bgColor.value = settings.bgColor || '#1a1a2e'
    textColor.value = settings.textColor || '#ffffff'
    progressColor.value = settings.progressColor || '#0052D9'
  }
}

// 保存设置到localStorage
const saveSettings = () => {
  const settings = {
    timerMode: timerMode.value,
    timerHours: timerHours.value,
    timerMinutes: timerMinutes.value,
    bgColor: bgColor.value,
    textColor: textColor.value,
    progressColor: progressColor.value
  }
  localStorage.setItem('VUE_TASK_FOCUS_SETTINGS', JSON.stringify(settings))
}

// 初始化计时器
const initTimer = () => {
  totalSeconds.value = timerHours.value * 3600 + timerMinutes.value * 60
  elapsedSeconds.value = 0
}

// 进入全屏
const enterFullscreen = async () => {
  try {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      await elem.requestFullscreen()
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen()
    } else if ((elem as any).msRequestFullscreen) {
      await (elem as any).msRequestFullscreen()
    }
    isFullscreen.value = true
  } catch (err) {
    console.log('无法进入全屏:', err)
  }
}

// 监听全屏变化
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
})

// 开始计时
const startTimer = async () => {
  if (!isRunning.value) {
    isRunning.value = true
    isPaused.value = false
    
    // 自动触发全屏
    if (!isFullscreen.value) {
      await enterFullscreen()
    }
    
    timerInterval = setInterval(() => {
      elapsedSeconds.value++
      
      // 倒计时结束
      if (timerMode.value === 'countdown' && elapsedSeconds.value >= totalSeconds.value) {
        pauseTimer()
        showTimeUpNotification()
      }
    }, 1000)
  }
}

// 暂停计时
const pauseTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  isRunning.value = false
  isPaused.value = true
}

// 重置计时
const resetTimer = () => {
  pauseTimer()
  elapsedSeconds.value = 0
  isPaused.value = false
}

// 时间到提示
const showTimeUpNotification = () => {
  // 显示自定义弹窗，保留全屏状态
  showTimeUpModal.value = true
}

// 关闭计时结束弹窗
const closeTimeUpModal = () => {
  showTimeUpModal.value = false
}

// 切换计时模式
const switchMode = (mode: 'countdown' | 'countup') => {
  timerMode.value = mode
  resetTimer()
  saveSettings()
}

// 验证时长设置（最小1分钟）
const validateDuration = () => {
  // 确保分钟在1-59范围内
  if (timerMinutes.value < 1) {
    timerMinutes.value = 1
  } else if (timerMinutes.value > 59) {
    timerMinutes.value = 59
  }
  // 确保小时在0-23范围内
  if (timerHours.value < 0) {
    timerHours.value = 0
  } else if (timerHours.value > 23) {
    timerHours.value = 23
  }
}

// 应用设置
const applySettings = () => {
  // 最终验证确保至少1分钟
  if (timerHours.value === 0 && timerMinutes.value < 1) {
    timerMinutes.value = 1
  }
  initTimer()
  saveSettings()
  showSettings.value = false
  resetTimer()
}

// 切换事务
const switchTask = (taskId: string | null) => {
  // 保存当前事务的计时状态
  if (currentTask.value) {
    saveCurrentTaskTimerState()
  }
  
  // 停止当前计时
  pauseTimer()
  
  // 加载新事务的计时状态（如果是null则使用默认值）
  loadTaskTimerState(taskId)
  
  emit('taskChange', taskId)
  showTaskSelector.value = false
}

// 完成任务 - 显示确认弹窗
const completeTask = () => {
  if (currentTask.value) {
    // 记录当前计时状态
    wasRunningBeforeConfirm.value = isRunning.value
    // 立即停止计时
    pauseTimer()
    // 显示确认弹窗
    showCompleteConfirmModal.value = true
  }
}

// 确认完成事务
const confirmCompleteTask = () => {
  if (currentTask.value) {
    // 确保计时已停止
    pauseTimer()

    // 保存已完成事务的计时状态（永久保留，供查看历史数据）
    saveCurrentTaskTimerState()

    emit('complete', currentTask.value.id)

    // 等待父组件更新tasks后，新事务会自动切换
    // 由于watch会监听props.task变化，新事务会自动加载默认计时状态
  }
  showCompleteConfirmModal.value = false
}

// 取消完成事务
const cancelCompleteTask = () => {
  showCompleteConfirmModal.value = false
  // 如果之前在运行，恢复计时状态（保持暂停）
  // 不自动恢复计时，让用户自己点击继续
}

// 关闭专注模式
const closeFocusMode = () => {
  pauseTimer()
  // 退出全屏
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
  emit('close')
}

// 监听visible变化
watch(() => props.visible, (visible) => {
  if (visible) {
    loadSettings()
    // 初始化时加载当前任务的计时状态
    const taskId = props.task?.id || null
    loadTaskTimerState(taskId)
  } else {
    pauseTimer()
  }
})

// 监听task变化，自动加载对应事务的计时状态
watch(() => props.task?.id, (newTaskId, oldTaskId) => {
  // 如果是新的事务ID
  if (newTaskId !== oldTaskId) {
    // 保存旧事务的计时状态（如果有）
    if (oldTaskId) {
      const state: TaskTimerState = {
        elapsedSeconds: elapsedSeconds.value,
        isPaused: isPaused.value,
        totalSeconds: totalSeconds.value
      }
      taskTimerStates.value.set(oldTaskId, state)
    }
    
    // 加载新事务的计时状态
    loadTaskTimerState(newTaskId || null)
  }
})

onMounted(() => {
  loadSettings()
  initTimer()
})

onUnmounted(() => {
  pauseTimer()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="focus-fade">
      <div 
        v-if="visible" 
        class="focus-mode-mask"
        :style="{ backgroundColor: bgColor, color: textColor }"
      >
        <!-- 顶部工具栏 -->
        <div class="focus-toolbar">
          <!-- 左上角：事务选择和自由专注按钮 -->
          <div class="toolbar-left">
            <button class="toolbar-btn menu-btn" @click="showTaskSelector = true">
              <MenuIcon class="toolbar-icon" />
              <span class="toolbar-text">事务专注</span>
            </button>
            <button class="toolbar-btn free-btn" @click="switchTask(null)">
              <TimeIcon class="toolbar-icon" />
              <span class="toolbar-text">自由专注</span>
            </button>
          </div>

          <!-- 右上角：设置和退出 -->
          <div class="toolbar-right">
            <button class="toolbar-btn icon-only" @click="showSettings = true" title="设置">
              <SettingIcon class="toolbar-icon" />
            </button>
            <button class="toolbar-btn icon-only" @click="closeFocusMode" title="退出">
              <CloseIcon class="toolbar-icon" />
            </button>
          </div>
        </div>

        <!-- 全屏提示（仅PC端显示） -->
        <div v-if="isFullscreen && !isMobile" class="fullscreen-hint">
          按 ESC 键退出全屏 / 专注
        </div>

        <!-- 主内容区 -->
        <div class="focus-content">
          <!-- 当前任务信息 -->
          <div class="task-info">
            <h2 v-if="currentTask" class="task-title">{{ currentTask.title }}</h2>
            <h2 v-else class="task-title">自由专注模式</h2>
            <p v-if="currentTask?.subTitle" class="task-subtitle">{{ currentTask.subTitle }}</p>
          </div>

          <!-- 计时器显示 -->
          <div class="timer-display">
            <div class="time-text" :style="{ color: textColor }">{{ formattedTime }}</div>
            <div class="timer-mode-badge" :style="{ backgroundColor: progressColor }">
              {{ timerMode === 'countdown' ? '倒计时' : '正计时' }}
            </div>
          </div>

          <!-- 动态进度条 -->
          <div class="progress-wrapper">
            <div class="progress-track">
              <div 
                class="progress-fill" 
                :class="{ 'running': isRunning }"
                :style="{ 
                  width: `${Math.min(progressPercent, 100)}%`,
                  backgroundColor: progressColor,
                  boxShadow: `0 0 10px ${progressColor}, 0 0 20px ${progressColor}40`
                }"
              ></div>
            </div>
            <div class="progress-info">
              <span class="progress-text" :style="{ color: textColor }">
                {{ Math.round(progressPercent) }}%
              </span>
            </div>
          </div>

          <!-- 控制按钮 -->
          <div class="timer-controls">
            <button 
              v-if="!isRunning" 
              class="control-btn primary"
              :style="{ backgroundColor: progressColor }"
              @click="startTimer"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
              {{ isPaused ? '继续' : '开始' }}
            </button>
            <button 
              v-else 
              class="control-btn secondary"
              @click="pauseTimer"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
              </svg>
              暂停
            </button>
            <button class="control-btn secondary" @click="resetTimer">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="currentColor"/>
              </svg>
              重置
            </button>
            <button 
              v-if="currentTask" 
              class="control-btn success"
              @click="completeTask"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
              </svg>
              完成
            </button>
          </div>
        </div>

        <!-- 事务选择弹窗 - 移动端居中，PC端左侧滑入 -->
        <Transition :name="isMobile ? 'modal-fade' : 'selector-slide'">
          <div v-if="showTaskSelector" class="task-selector-panel" :class="{ 'mobile-center': isMobile }" @click.self="showTaskSelector = false">
            <div class="task-selector-content" :class="{ 'mobile-popup': isMobile }">
              <div class="task-selector-header">
                <h3>选择事务</h3>
                <button class="close-btn" @click="showTaskSelector = false">
                  <CloseIcon />
                </button>
              </div>
              
              <div class="task-selector-body">
                <!-- 搜索框 -->
                <div class="search-box">
                  <SearchIcon class="search-icon" />
                  <input 
                    v-model="taskSearchKey"
                    type="text"
                    placeholder="搜索事务..."
                    class="search-input"
                  />
                </div>
                
                <!-- 事务列表 -->
                <div class="task-list-container">
                  <div v-if="filteredTasks.length > 0" class="task-list">
                    <button
                      v-for="task in filteredTasks"
                      :key="task.id"
                      class="task-item"
                      :class="{ active: currentTask?.id === task.id }"
                      @click="switchTask(task.id)"
                    >
                      <span class="task-dot" :class="task.priority"></span>
                      <span class="task-name">{{ task.title }}</span>
                    </button>
                  </div>
                  <div v-else class="empty-tasks">
                    暂无事务
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 设置面板 -->
        <Transition name="settings-slide">
          <div v-if="showSettings" class="settings-panel" @click.self="showSettings = false">
            <div class="settings-content">
              <div class="settings-header">
                <h3>专注设置</h3>
                <button class="close-btn" @click="showSettings = false">
                  <CloseIcon />
                </button>
              </div>

              <div class="settings-body">
                <!-- 计时模式 -->
                <div class="setting-item">
                  <label class="setting-label">计时模式</label>
                  <div class="mode-switch">
                    <button
                      :class="['mode-btn', { active: timerMode === 'countdown' }]"
                      @click="switchMode('countdown')"
                    >
                      倒计时
                    </button>
                    <button
                      :class="['mode-btn', { active: timerMode === 'countup' }]"
                      @click="switchMode('countup')"
                    >
                      正计时
                    </button>
                  </div>
                </div>

                <!-- 时长设置 -->
                <div class="setting-item">
                  <label class="setting-label">计时时长（最小1分钟）</label>
                  <div class="duration-inputs">
                    <div class="duration-input-group">
                      <input
                        v-model.number="timerHours"
                        type="number"
                        min="0"
                        max="23"
                        class="duration-input"
                        @change="validateDuration"
                      />
                      <span class="duration-unit">小时</span>
                    </div>
                    <div class="duration-input-group">
                      <input
                        v-model.number="timerMinutes"
                        type="number"
                        min="1"
                        max="59"
                        class="duration-input"
                        @change="validateDuration"
                      />
                      <span class="duration-unit">分钟</span>
                    </div>
                  </div>
                </div>

                <!-- 背景颜色 -->
                <div class="setting-item">
                  <label class="setting-label">背景颜色</label>
                  <div class="color-picker-wrapper">
                    <input
                      v-model="bgColor"
                      type="color"
                      class="color-picker"
                    />
                    <span class="color-value">{{ bgColor }}</span>
                  </div>
                </div>

                <!-- 文字颜色 -->
                <div class="setting-item">
                  <label class="setting-label">文字颜色</label>
                  <div class="color-picker-wrapper">
                    <input
                      v-model="textColor"
                      type="color"
                      class="color-picker"
                    />
                    <span class="color-value">{{ textColor }}</span>
                  </div>
                </div>

                <!-- 进度条颜色 -->
                <div class="setting-item">
                  <label class="setting-label">进度条颜色</label>
                  <div class="color-picker-wrapper">
                    <input
                      v-model="progressColor"
                      type="color"
                      class="color-picker"
                    />
                    <span class="color-value">{{ progressColor }}</span>
                  </div>
                </div>
              </div>

              <div class="settings-footer">
                <button class="btn-apply" @click="applySettings">应用设置</button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 计时结束弹窗 -->
        <Transition name="modal-fade">
          <div v-if="showTimeUpModal" class="timeup-modal-mask" @click.self="closeTimeUpModal">
            <div class="timeup-modal-content">
              <div class="timeup-icon">⏰</div>
              <h3 class="timeup-title">计时结束</h3>
              <p class="timeup-message">专注时间已结束</p>
              <button class="timeup-btn" @click="closeTimeUpModal">确认</button>
            </div>
          </div>
        </Transition>

        <!-- 完成确认弹窗 -->
        <Transition name="modal-fade">
          <div v-if="showCompleteConfirmModal" class="confirm-modal-mask">
            <div class="confirm-modal-content">
              <div class="confirm-icon">✓</div>
              <h3 class="confirm-title">确认完成</h3>
              <p class="confirm-message">你是否完成本次该事务专注？</p>
              <div class="confirm-actions">
                <button class="confirm-btn cancel" @click="cancelCompleteTask">取消</button>
                <button class="confirm-btn confirm" @click="confirmCompleteTask">确定</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.focus-mode-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

/* 顶部工具栏 */
.focus-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.toolbar-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toolbar-btn:active {
  transform: scale(0.95) translateY(0);
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.toolbar-btn:active::before {
  width: 100px;
  height: 100px;
}

.toolbar-btn.active-mode {
  background: rgba(0, 82, 217, 0.3);
  border-color: rgba(0, 82, 217, 0.6);
  box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.3);
}

.toolbar-btn.icon-only {
  padding: 10px;
  border-radius: 50%;
}

.menu-btn {
  font-weight: 500;
}

.toolbar-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 全屏提示 */
.fullscreen-hint {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  opacity: 0.6;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  pointer-events: none;
}

/* 主内容区 */
.focus-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 32px;
  overflow-y: auto;
}

/* 任务信息 */
.task-info {
  text-align: center;
  max-width: 600px;
}

.task-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.task-subtitle {
  font-size: 16px;
  opacity: 0.8;
  margin: 0;
  line-height: 1.5;
}

/* 计时器显示 */
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.time-text {
  font-size: 160px;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  line-height: 1;
  letter-spacing: -4px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.timer-mode-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: white;
}

/* 动态进度条 */
.progress-wrapper {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.progress-track {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-track::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  animation: shimmer 2s infinite;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width;
  position: relative;
}

.progress-fill.running::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4));
  border-radius: 0 6px 6px 0;
  animation: pulse 1s ease-in-out infinite;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
  font-family: 'JetBrains Mono', monospace;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 控制按钮 */
.timer-controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn svg {
  width: 20px;
  height: 20px;
}

.control-btn.primary {
  color: white;
}

.control-btn.primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.control-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.control-btn.success {
  background: #52c41a;
  color: white;
}

.control-btn.success:hover {
  background: #389e0d;
}

/* 事务选择弹窗 - PC端左侧滑入 */
.task-selector-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2100;
}

.task-selector-panel.mobile-center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.task-selector-content {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 20%;
  min-width: 280px;
  max-width: 400px;
  background: white;
  border-radius: 0 16px 16px 0;
  display: flex;
  flex-direction: column;
  color: #333;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
}

.task-selector-content.mobile-popup {
  position: relative;
  width: 90%;
  max-width: 360px;
  height: auto;
  max-height: 80vh;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.task-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.task-selector-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.task-selector-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 不选择事务选项 */
.no-task-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 15px;
  color: #333;
  text-align: left;
}

.no-task-option:hover {
  background: #e8e8e8;
  border-color: #0052D9;
}

.no-task-option.active {
  background: #e6f0ff;
  border-color: #0052D9;
}

.no-task-icon {
  font-size: 24px;
  color: #0052D9;
}

/* 搜索框 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  font-size: 18px;
  color: #999;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 42px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #0052D9;
  outline: none;
}

/* 事务列表容器 */
.task-list-container {
  max-height: 300px;
  overflow-y: auto;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.task-item:hover {
  background: #e8e8e8;
  border-color: #0052D9;
}

.task-item.active {
  background: #e6f0ff;
  border-color: #0052D9;
}

.task-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-dot.high {
  background: #f5222d;
}

.task-dot.mid {
  background: #faad14;
}

.task-dot.low {
  background: #52c41a;
}

.task-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-tasks {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

/* 设置面板 */
.settings-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  padding: 20px;
}

.settings-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  overflow-y: auto;
  color: #333;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 18px;
}

.close-btn:hover {
  background: #e8e8e8;
}

.settings-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

/* 模式切换 */
.mode-switch {
  display: flex;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn.active {
  background: #0052D9;
  color: white;
  border-color: #0052D9;
}

/* 时长输入 */
.duration-inputs {
  display: flex;
  gap: 16px;
}

.duration-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-input {
  width: 70px;
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
}

.duration-input:focus {
  border-color: #0052D9;
  outline: none;
}

.duration-unit {
  font-size: 14px;
  color: #666;
}

/* 颜色选择器 */
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker {
  width: 50px;
  height: 40px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
}

.color-value {
  font-size: 14px;
  color: #666;
  font-family: monospace;
}

/* 设置面板底部 */
.settings-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #e8e8e8;
}

.btn-apply {
  width: 100%;
  padding: 12px 24px;
  background: #0052D9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-apply:hover {
  background: #003bb5;
}

/* 动画 */
.focus-fade-enter-active,
.focus-fade-leave-active {
  transition: opacity 0.3s ease;
}

.focus-fade-enter-from,
.focus-fade-leave-to {
  opacity: 0;
}

.settings-slide-enter-active,
.settings-slide-leave-active {
  transition: all 0.3s ease;
}

.settings-slide-enter-from,
.settings-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.selector-slide-enter-active,
.selector-slide-leave-active {
  transition: all 0.3s ease;
}

.selector-slide-enter-from .task-selector-content,
.selector-slide-leave-to .task-selector-content {
  transform: translateX(-100%);
}

.selector-slide-enter-active .task-selector-content,
.selector-slide-leave-active .task-selector-content {
  transition: transform 0.3s ease;
}

.selector-slide-enter-from,
.selector-slide-leave-to {
  opacity: 0;
}

/* 计时结束弹窗 */
.timeup-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
}

.timeup-modal-content {
  background: white;
  border-radius: 16px;
  padding: 40px 48px;
  text-align: center;
  color: #333;
  min-width: 320px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.timeup-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.timeup-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #1a1a2e;
}

.timeup-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px 0;
}

.timeup-btn {
  padding: 12px 32px;
  background: #0052D9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.timeup-btn:hover {
  background: #003bb5;
}

/* 弹窗动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 完成确认弹窗 */
.confirm-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
}

.confirm-modal-content {
  background: white;
  border-radius: 16px;
  padding: 40px 48px;
  text-align: center;
  color: #333;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.confirm-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #52c41a, #389e0d);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 32px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
}

.confirm-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #1a1a2e;
}

.confirm-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 28px 0;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.confirm-btn.cancel {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.confirm-btn.cancel:hover {
  background: #e8e8e8;
  border-color: #bfbfbf;
}

.confirm-btn.confirm {
  background: #52c41a;
  color: white;
}

.confirm-btn.confirm:hover {
  background: #389e0d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.confirm-btn:active {
  transform: translateY(0);
}

/* 响应式适配 */
@media (max-width: 768px) {
  /* 竖屏样式 */
  .time-text {
    font-size: 64px;
  }

  .task-title {
    font-size: 22px;
  }

  .timer-controls {
    gap: 12px;
  }

  .control-btn {
    padding: 10px 18px;
    font-size: 14px;
  }

  .focus-toolbar {
    padding: 12px 16px;
  }

  .toolbar-btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .toolbar-btn.icon-only {
    padding: 8px;
  }

  .toolbar-icon {
    font-size: 18px;
  }

  /* 移动端始终显示按钮文字 */
  .toolbar-text {
    display: inline;
  }
}

@media (max-width: 480px) {
  .time-text {
    font-size: 48px;
  }

  .duration-inputs {
    flex-direction: column;
    gap: 12px;
  }

  .mode-switch {
    flex-direction: column;
  }
}
</style>
