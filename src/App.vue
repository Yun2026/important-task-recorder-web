<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TopBar from './components/TopBar.vue'
import DateTimeBar from './components/DateTimeBar.vue'
import WeatherCard from './components/WeatherCard.vue'
import TodayTasks from './components/TodayTasks.vue'
import StatsCard from './components/StatsCard.vue'
import TaskView from './components/TaskView.vue'
import TaskModal from './components/TaskModal.vue'
import EmptyState from './components/EmptyState.vue'
import RecycleBin from './components/RecycleBin.vue'
import AuthModal from './components/AuthModal.vue'
import HelpModal from './components/HelpModal.vue'
import FocusMode from './components/FocusMode.vue'
import { AlarmIcon } from 'tdesign-icons-vue-next'
import { Task, FilterCondition, ModalType, ViewType, SortType, TaskStatus, Priority, Category } from './types'
import { cloudStorage, setSyncStatusCallback, authApi } from './utils/cloudStorage'

const tasks = ref<Task[]>([])
const viewType = ref<ViewType>(ViewType.LIST)
const modalVisible = ref(false)
const modalType = ref<ModalType>(ModalType.CREATE)
const editTask = ref<Task>()
const recycleBinVisible = ref(false)

// ========== 用户登录状态管理 ==========
const isLoggedIn = ref(false)
const username = ref('')
const authModalVisible = ref(false)
const helpModalVisible = ref(false)

// 专注模式已移除
const focusMode = ref(false)
const focusedTaskId = ref<string | null>(null)
const focusVisible = ref(false)

// 顶部提示消息状态
const toastMessage = ref('')
const showToast = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

// 显示顶部提示（5秒后自动消失）
const showToastMessage = (message: string) => {
  // 清除之前的定时器
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastMessage.value = message
  showToast.value = true
  // 5秒后自动隐藏
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 5000)
}

// AuthModal 组件引用
const authModalRef = ref<InstanceType<typeof AuthModal> | null>(null)

// 确认弹窗状态
const confirmDialog = ref({
  visible: false,
  title: '',
  content: '',
  confirmText: '确认',
  cancelText: '',
  type: 'warning' as 'warning' | 'danger' | 'info',
  onConfirm: () => {},
  onCancel: () => {}
})

// 显示确认弹窗
const showConfirmDialog = (options: {
  title: string
  content: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
  onConfirm: () => void
}) => {
  confirmDialog.value = {
    visible: true,
    title: options.title,
    content: options.content,
    confirmText: options.confirmText || '确认',
    cancelText: options.cancelText === undefined ? '' : options.cancelText,
    type: options.type || 'warning',
    onConfirm: () => {
      confirmDialog.value.visible = false
      options.onConfirm()
    },
    onCancel: () => {
      confirmDialog.value.visible = false
    }
  }
}

// 从localStorage读取登录状态
const loadUserState = () => {
  const savedUser = localStorage.getItem('VUE_TASK_USER')
  if (savedUser) {
    const user = JSON.parse(savedUser)
    isLoggedIn.value = true
    username.value = user.username
  }
}

// 保存用户登录状态
const saveUserState = (user: { username: string; email?: string }) => {
  localStorage.setItem('VUE_TASK_USER', JSON.stringify(user))
  isLoggedIn.value = true
  username.value = user.username
}

// 退出登录
const logout = () => {
  localStorage.removeItem('VUE_TASK_USER')
  localStorage.removeItem('token')
  isLoggedIn.value = false
  username.value = ''
  // 清除登录/注册表单
  authModalRef.value?.clearForms()
  // 切换到本地匿名数据
  loadTasks()
}

// 后端API登录处理
const handleLogin = async (data: { email: string; password: string }) => {
  try {
    const response = await authApi.login({ email: data.email, password: data.password })
    if (response.success && 'data' in response && response.data) {
      const { token, userInfo } = response.data
      localStorage.setItem('token', token)
      saveUserState({ username: userInfo.nickname, email: userInfo.email })
      showToastMessage('登录成功')
      await loadTasks()
      // 登录成功后关闭弹窗
      authModalVisible.value = false
    } else {
      const errorMsg = (response as { msg?: string }).msg || '登录失败'
      showToastMessage(errorMsg)
    }
  } catch (error) {
    console.error('登录失败：', error)
    showToastMessage('登录失败，请重试')
  }
}

// 后端API注册处理
const handleRegister = async (data: { nickname: string; email: string; password: string; confirmPassword: string }) => {
  try {
    const response = await authApi.register({ 
      nickname: data.nickname, 
      email: data.email, 
      password: data.password,
      confirmPassword: data.confirmPassword 
    })
    if (response.success && 'data' in response && response.data) {
      const { token, userInfo } = response.data
      localStorage.setItem('token', token)
      saveUserState({ username: userInfo.nickname, email: userInfo.email })
      showToastMessage('注册成功，已自动登录')
      await loadTasks()
      authModalVisible.value = false
    } else {
      const errorMsg = (response as { msg?: string }).msg || '注册失败'
      showToastMessage(errorMsg)
    }
  } catch (error) {
    console.error('注册失败：', error)
    showToastMessage('注册失败，请重试')
  }
}

// 筛选条件
const filter = ref<FilterCondition>({
  priority: '',
  status: '',
  category: '',
  sort: SortType.CREATE_NEW,
  searchKey: ''
})

// 筛选框显示文本
const priorityDisplayText = computed(() => {
  if (!filter.value.priority) return '全部优先级'
  return filter.value.priority === 'high' ? '高优先级' : 
         filter.value.priority === 'mid' ? '中优先级' : '低优先级'
})

const statusDisplayText = computed(() => {
  if (!filter.value.status) return '全部状态'
  return filter.value.status === 'finished' ? '已完成状态' : '未完成状态'
})

const categoryDisplayText = computed(() => {
  if (!filter.value.category) return '全部分类'
  return filter.value.category === 'work' ? '工作分类' : '个人分类'
})

// 下拉菜单显示控制
const showPriorityDropdown = ref(false)
const showStatusDropdown = ref(false)
const showCategoryDropdown = ref(false)
const showSortDropdown = ref(false)

// 排序显示文本
const sortDisplayText = computed(() => {
  switch (filter.value.sort) {
    case 'createNew': return '最新创建'
    case 'createOld': return '最早创建'
    case 'deadlineNear': return '截止近→远'
    case 'deadlineFar': return '截止远→近'
    default: return '最新创建'
  }
})

// 排序选项
const sortOptions = [
  { value: 'createNew', label: '最新创建' },
  { value: 'createOld', label: '最早创建' },
  { value: 'deadlineNear', label: '截止日期近→远' },
  { value: 'deadlineFar', label: '截止日期远→近' }
]

// 选择排序
const selectSort = (value: string) => {
  filter.value.sort = value as SortType
  handleFilterChange(filter.value)
  closeAllDropdowns()
}

// 优先级选项
const priorityOptions = [
  { value: '', label: '全部', display: '全部优先级' },
  { value: Priority.HIGH, label: '高', display: '高优先级' },
  { value: Priority.MID, label: '中', display: '中优先级' },
  { value: Priority.LOW, label: '低', display: '低优先级' }
]

// 状态选项
const statusOptions = [
  { value: '', label: '全部', display: '全部状态' },
  { value: TaskStatus.FINISHED, label: '已完成', display: '已完成状态' },
  { value: TaskStatus.UNFINISHED, label: '未完成', display: '未完成状态' }
]

// 分类选项
const categoryOptions = [
  { value: '', label: '全部', display: '全部分类' },
  { value: Category.WORK, label: '工作', display: '工作分类' },
  { value: Category.PERSONAL, label: '个人', display: '个人分类' }
]

// 关闭所有下拉菜单
const closeAllDropdowns = () => {
  showPriorityDropdown.value = false
  showStatusDropdown.value = false
  showCategoryDropdown.value = false
  showSortDropdown.value = false
}

// 选择优先级
const selectPriority = (value: string) => {
  filter.value.priority = value as Priority | ''
  handleFilterChange(filter.value)
  closeAllDropdowns()
}

// 选择状态
const selectStatus = (value: string) => {
  filter.value.status = value as TaskStatus | ''
  handleFilterChange(filter.value)
  closeAllDropdowns()
}

// 选择分类
const selectCategory = (value: string) => {
  filter.value.category = value as Category | ''
  handleFilterChange(filter.value)
  closeAllDropdowns()
}

// 回收站开关状态 - 默认开启（如果用户未设置过）
const getRecycleBinDefault = () => {
  const saved = localStorage.getItem('VUE_TASK_RECYCLE_BIN_ENABLED')
  // 如果用户从未设置过（null），默认开启
  // 如果用户设置过，使用用户的设置
  return saved === null ? true : saved === 'true'
}
const recycleBinEnabled = ref(getRecycleBinDefault())

// 切换下拉菜单 - 打开一个时关闭其他
const togglePriorityDropdown = () => {
  const willShow = !showPriorityDropdown.value
  closeAllDropdowns()
  showPriorityDropdown.value = willShow
}

const toggleStatusDropdown = () => {
  const willShow = !showStatusDropdown.value
  closeAllDropdowns()
  showStatusDropdown.value = willShow
}

const toggleCategoryDropdown = () => {
  const willShow = !showCategoryDropdown.value
  closeAllDropdowns()
  showCategoryDropdown.value = willShow
}

const toggleSortDropdown = () => {
  const willShow = !showSortDropdown.value
  closeAllDropdowns()
  showSortDropdown.value = willShow
}

const filteredTasks = computed(() => {
  let result = tasks.value

  if (filter.value.priority) {
    result = result.filter(t => t.priority === filter.value.priority)
  }

  if (filter.value.status) {
    result = result.filter(t => t.status === filter.value.status)
  }

  if (filter.value.category) {
    result = result.filter(t => t.category === filter.value.category)
  }

  if (filter.value.searchKey) {
    const key = filter.value.searchKey.toLowerCase()
    result = result.filter(t =>
      t.title.toLowerCase().includes(key) ||
      t.subTitle.toLowerCase().includes(key) ||
      t.tags.some(tag => tag.toLowerCase().includes(key))
    )
  }

  switch (filter.value.sort) {
    case SortType.CREATE_NEW:
      result.sort((a, b) => b.createTime.localeCompare(a.createTime))
      break
    case SortType.CREATE_OLD:
      result.sort((a, b) => a.createTime.localeCompare(b.createTime))
      break
    case SortType.DEADLINE_NEAR:
      result.sort((a, b) => a.deadline.localeCompare(b.deadline))
      break
    case SortType.DEADLINE_FAR:
      result.sort((a, b) => b.deadline.localeCompare(a.deadline))
      break
  }

  return result
})

const handleFilterChange = (newFilter: FilterCondition) => {
  filter.value = { ...filter.value, ...newFilter }
}

const handleOpenCreateModal = () => {
  // 未登录时提示先登录
  if (!isLoggedIn.value) {
    showConfirmDialog({
      title: '请先登录',
      content: '创建事务需要登录账号，是否立即登录？',
      confirmText: '去登录',
      cancelText: '取消',
      type: 'info',
      onConfirm: () => {
        authModalVisible.value = true
      }
    })
    return
  }
  modalType.value = ModalType.CREATE
  editTask.value = undefined
  modalVisible.value = true
}

const handleOpenEditModal = (task: Task) => {
  modalType.value = ModalType.EDIT
  // 深拷贝任务对象，避免引用问题
  editTask.value = JSON.parse(JSON.stringify(task))
  modalVisible.value = true
}

const handleCloseModal = () => {
  modalVisible.value = false
}

const handleSaveTask = async (task: Task) => {
  if (modalType.value === ModalType.CREATE) {
    await cloudStorage.addTask(task)
  } else {
    await cloudStorage.updateTask(task)
  }
  await loadTasks()
  modalVisible.value = false
}

const handleToggleStatus = async (id: string) => {
  await cloudStorage.toggleTaskStatus(id)
  await loadTasks()
}

const handleRefresh = () => {
  // 触发统计更新
  loadTasks()
}

const handleDeleteTask = async (id: string) => {
  if (recycleBinEnabled.value) {
    // 回收站开启：移到回收站
    await cloudStorage.deleteTask(id)
  } else {
    // 回收站关闭：直接永久删除
    await cloudStorage.permanentDeleteTask(id)
  }
  await loadTasks()
}

// 切换回收站开关
const toggleRecycleBin = (enabled: boolean) => {
  recycleBinEnabled.value = enabled
  localStorage.setItem('VUE_TASK_RECYCLE_BIN_ENABLED', String(enabled))
}

const handleShowRecycleBin = () => {
  recycleBinVisible.value = true
}

const handleCloseRecycleBin = () => {
  recycleBinVisible.value = false
}

const handleRestoreTask = () => {
  loadTasks()
}

const handleExport = (type: 'xlsx' | 'csv') => {
  // 事务列表导出 - 导出整个事务表
  const dataToExport = tasks.value
  
  if (dataToExport.length === 0) {
    alert('暂无数据可导出')
    return
  }
  
  exportToCSV(dataToExport, `事务记录_${new Date().toLocaleDateString('zh-CN')}`, type)
}

// 导出今天的事务
const handleExportToday = (type: 'xlsx' | 'csv') => {
  const today = new Date().toISOString().split('T')[0]
  const todayTasksList = tasks.value.filter(task => task.startDate === today)
  
  if (todayTasksList.length === 0) {
    alert('今天暂无事务可导出')
    return
  }
  
  exportToCSV(todayTasksList, `今天的事务_${new Date().toLocaleDateString('zh-CN')}`, type)
}

// 通用导出CSV方法
const exportToCSV = (dataToExport: Task[], fileName: string, type: 'xlsx' | 'csv') => {
  // 构建 CSV 内容
  const headers = ['标题', '副标题', '优先级', '分类', '开始日期', '截止时间', '标签', '状态', '创建时间']
  const rows = dataToExport.map(task => [
    task.title,
    task.subTitle,
    task.priority === 'high' ? '高' : task.priority === 'mid' ? '中' : '低',
    task.category === 'work' ? '工作' : '个人',
    task.startDate,
    task.deadline,
    task.tags.join('、'),
    task.status === 'finished' ? '已完成' : '未完成',
    task.createTime
  ])
  
  // 添加 BOM 以支持中文
  const BOM = '\uFEFF'
  const csvContent = BOM + [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = `${fileName}.${type}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

  // 进入专注模式 - 无论是否有事务都可进入
const handleEnterFocusMode = () => {
  // 直接进入专注模式，不强制选择事务
  enterFocusMode(null)
}

// 进入专注模式
const enterFocusMode = (taskId: string | null) => {
  focusedTaskId.value = taskId
  focusMode.value = true
  focusVisible.value = true
}

// 退出专注模式
const exitFocusMode = () => {
  focusMode.value = false
  focusVisible.value = false
  focusedTaskId.value = null
}

// 专注模式下切换任务
const handleFocusTaskChange = (taskId: string | null) => {
  focusedTaskId.value = taskId
}

// 专注模式下完成任务
const handleFocusComplete = async (taskId: string) => {
  await cloudStorage.toggleTaskStatus(taskId)
  await loadTasks()
  // 完成后自动切换到下一个未完成事务
  const unfinishedTasks = tasks.value.filter(t => t.status === TaskStatus.UNFINISHED)
  if (unfinishedTasks.length > 0) {
    focusedTaskId.value = unfinishedTasks[0].id
  } else {
    exitFocusMode()
    showToastMessage('所有事务已完成！')
  }
}

  // 清除已完成事务
  const handleClearCompleted = async () => {
    const completedTasks = tasks.value.filter(t => t.status === TaskStatus.FINISHED)
    if (completedTasks.length === 0) {
      showToastMessage('没有已完成的事务')
      return
    }
    
    showConfirmDialog({
      title: '清除已完成事务',
      content: `确定要清除 ${completedTasks.length} 个已完成的事务吗？`,
      type: 'warning',
      confirmText: '清除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          for (const task of completedTasks) {
            await cloudStorage.deleteTask(task.id)
          }
          await loadTasks()
          showToastMessage('已完成事务已清除')
        } catch (error) {
          console.error('清除失败：', error)
          showToastMessage('清除失败，请重试')
        }
      }
    })
  }

// 加载任务 - 从本地存储获取
const loadTasks = async () => {
  tasks.value = await cloudStorage.getTasks()
}

// 组件挂载时初始化
onMounted(() => {
  loadUserState()
  loadTasks()
  setSyncStatusCallback((_status, message) => {
    if (message) {
      showToastMessage(message)
    }
  })
})
</script>

<template>
  <div class="app">
    <TopBar
      :is-logged-in="isLoggedIn"
      :username="username"
      :toast-message="toastMessage"
      :show-toast="showToast"
      @login="authModalVisible = true"
      @logout="logout"
    />
    
    <!-- 日期时间显示栏 -->
    <DateTimeBar @show-help="helpModalVisible = true" />

    <div class="main-layout">
      <!-- 左侧列 -->
      <div class="left-column">
        <!-- 天气组件（可选，获取失败不显示） -->
        <WeatherCard :tasks="tasks" />
        
        <!-- 今日事务 - 固定高度，独立滚动 -->
        <TodayTasks 
          :tasks="tasks"
          class="today-tasks-fixed"
          @edit="handleOpenEditModal"
          @toggle="handleToggleStatus"
          @exportToday="handleExportToday"
        />
      </div>

      <!-- 右侧列 -->
      <div class="right-column">
        <StatsCard :tasks="tasks" />
        
        <!-- 事务列表区域 - 固定高度，独立滚动 -->
        <div class="task-section-fixed">
          <!-- 第一行：事务列表标题 -->
          <div class="section-header">
            <h2 class="section-title">事务列表</h2>
            <div class="header-actions">
              <button class="focus-mode-btn" @click="handleEnterFocusMode">
                <AlarmIcon class="btn-icon-svg" />
                专注模式
              </button>
              <button class="clear-completed-btn" @click="handleClearCompleted">
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 16h4v2h-4v-2zm0-8h7v2h-7V8zm0 4h6v2h-6v-2zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM13 5h-2V3h-2v2H6v2h12V5h-5z" fill="currentColor"/>
                </svg>
                清除已完成
              </button>
              <button class="export-btn" @click="handleExport('xlsx')">
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                </svg>
                导出
              </button>
              <div class="view-toggle">
                <button
                  :class="['toggle-btn', { active: viewType === ViewType.LIST }]"
                  @click="viewType = ViewType.LIST"
                  title="列表视图"
                >
                  <svg class="toggle-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7z" fill="currentColor"/>
                  </svg>
                </button>
                <button
                  :class="['toggle-btn', { active: viewType === ViewType.GRID }]"
                  @click="viewType = ViewType.GRID"
                  title="网格视图"
                >
                  <svg class="toggle-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H-4V5h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 第二行：搜索 + 筛选栏（整合后的 FilterPanel） -->
          <div class="filter-row">
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 11.99 14z" fill="currentColor"/>
              </svg>
              <input
                type="text"
                placeholder="搜索事务..."
                v-model="filter.searchKey"
                @input="handleFilterChange(filter)"
                class="search-input"
              />
            </div>
            <div class="filter-group">
              <!-- 优先级自定义下拉框 -->
              <div class="custom-select">
                <div class="select-trigger" @click.stop="togglePriorityDropdown">
                  <span class="select-text">{{ priorityDisplayText }}</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div v-if="showPriorityDropdown" class="select-dropdown">
                  <div
                    v-for="option in priorityOptions"
                    :key="option.value"
                    class="select-option"
                    :class="{ active: filter.priority === option.value }"
                    @click="selectPriority(option.value)"
                  >
                    {{ option.label }}
                  </div>
                </div>
              </div>

              <!-- 状态自定义下拉框 -->
              <div class="custom-select">
                <div class="select-trigger" @click.stop="toggleStatusDropdown">
                  <span class="select-text">{{ statusDisplayText }}</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div v-if="showStatusDropdown" class="select-dropdown">
                  <div
                    v-for="option in statusOptions"
                    :key="option.value"
                    class="select-option"
                    :class="{ active: filter.status === option.value }"
                    @click="selectStatus(option.value)"
                  >
                    {{ option.label }}
                  </div>
                </div>
              </div>

              <!-- 分类自定义下拉框 -->
              <div class="custom-select">
                <div class="select-trigger" @click.stop="toggleCategoryDropdown">
                  <span class="select-text">{{ categoryDisplayText }}</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div v-if="showCategoryDropdown" class="select-dropdown">
                  <div
                    v-for="option in categoryOptions"
                    :key="option.value"
                    class="select-option"
                    :class="{ active: filter.category === option.value }"
                    @click="selectCategory(option.value)"
                  >
                    {{ option.label }}
                  </div>
                </div>
              </div>

              <!-- 排序自定义下拉框 -->
              <div class="custom-select">
                <div class="select-trigger" @click.stop="toggleSortDropdown">
                  <span class="select-text">{{ sortDisplayText }}</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div v-if="showSortDropdown" class="select-dropdown">
                  <div
                    v-for="option in sortOptions"
                    :key="option.value"
                    class="select-option"
                    :class="{ active: filter.sort === option.value }"
                    @click="selectSort(option.value)"
                  >
                    {{ option.label }}
                  </div>
                </div>
              </div>
              <button class="btn-recycle" @click="handleShowRecycleBin">
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                </svg>
                <span>回收站</span>
              </button>


            </div>
          </div>

          <!-- 事务列表内容区 - 独立滚动 -->
          <div class="task-list-scrollable">
            <TaskView
              :tasks="filteredTasks"
              :view-type="viewType"
              :search-key="filter.searchKey"
              :recycle-bin-enabled="recycleBinEnabled"
              
              @toggle-status="handleToggleStatus"
              @edit="handleOpenEditModal"
              @delete="handleDeleteTask"
              @refresh="handleRefresh"
            />
            <EmptyState 
              v-if="filteredTasks.length === 0" 
              :visible="true"
              :total-tasks="tasks.length"
              :filter="filter"
            />
          </div>
        </div>
      </div>
    </div>

    <button class="fab-btn" @click="handleOpenCreateModal">+</button>

    <TaskModal
      :visible="modalVisible"
      :type="modalType"
      :edit-task="editTask"
      @close="handleCloseModal"
      @save="handleSaveTask"
    />

    <RecycleBin
      v-model:visible="recycleBinVisible"
      :enabled="recycleBinEnabled"
      @close="handleCloseRecycleBin"
      @restore="handleRestoreTask"
      @toggle="toggleRecycleBin"
    />

    <!-- 登录/注册模态框 -->
    <AuthModal
      ref="authModalRef"
      :visible="authModalVisible"
      @close="authModalVisible = false"
      @login="(data) => handleLogin(data)"
      @register="(data) => handleRegister(data)"
    />

    <!-- 网站说明书模态框 -->
    <HelpModal
      :visible="helpModalVisible"
      @close="helpModalVisible = false"
    />

    <!-- 专注模式 -->
    <FocusMode
      :visible="focusVisible"
      :task="tasks.find(t => t.id === focusedTaskId) || null"
      :tasks="tasks"
      @close="exitFocusMode"
      @taskChange="handleFocusTaskChange"
      @complete="handleFocusComplete"
    />

    <!-- 通用确认弹窗 -->
    <Teleport to="body">
      <Transition name="dialog-fade" mode="out-in">
        <div v-if="confirmDialog.visible" :key="confirmDialog.title + confirmDialog.content" class="dialog-mask" @click.self="confirmDialog.onCancel">
          <div class="dialog-content">
            <div class="dialog-header">
              <div class="dialog-icon" :class="confirmDialog.type">
                <span v-if="confirmDialog.type === 'warning'">⚠️</span>
                <span v-else-if="confirmDialog.type === 'danger'">🗑️</span>
                <span v-else>ℹ️</span>
              </div>
              <h3 class="dialog-title">{{ confirmDialog.title }}</h3>
            </div>
            
            <div class="dialog-body">
              <p class="dialog-message">{{ confirmDialog.content }}</p>
            </div>
            
            <div class="dialog-footer">
              <button v-if="confirmDialog.cancelText && confirmDialog.cancelText !== ''" class="btn-cancel" @click="confirmDialog.onCancel">
                {{ confirmDialog.cancelText }}
              </button>
              <button 
                class="btn-confirm" 
                :class="confirmDialog.type"
                @click="confirmDialog.onConfirm"
              >
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 版权信息 -->
    <footer class="app-footer">
      <div class="footer-content">
        <p class="copyright">© 2026 重要事务记录本 All Rights Reserved</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 页面整体 */
.app {
  min-height: 100vh;
  background-color: var(--bg-gray);
  display: flex;
  flex-direction: column;
  /* 为固定导航栏留出空间 */
  padding-top: 80px;
}

/* 版权信息 - 固定在页面底部 */
.app-footer {
  margin-top: auto;
  padding: 20px;
  background-color: var(--bg-gray);
  border-top: 1px solid var(--border);
  text-align: center;
}

.footer-content {
  max-width: 1920px;
  margin: 0 auto;
}

.copyright {
  font-size: 13px;
  color: var(--text-placeholder);
  margin: 0;
}

.main-layout {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 24px;
  padding: 12px;
  flex: 1;
  min-height: calc(100vh - 80px - 60px); /* 减去顶部导航和版权区域高度 */
  overflow: hidden;
  box-sizing: border-box;
  align-items: stretch;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  height: 100%;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  height: 100%;
}

/* 今天的事务固定高度，独立滚动 */
.today-tasks-fixed {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 事务列表区域 - 固定高度 */
.task-section-fixed {
  background-color: white;
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background-color: var(--bg-gray);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn:hover {
  background-color: var(--border);
}

/* 一键清除已完成按钮 - 与最近删除不同的绿色样式 */
.clear-completed-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
}

.clear-completed-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
}

/* 专注模式按钮 - 蓝色渐变样式 */
.focus-mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #0052D9 0%, #003bb5 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 82, 217, 0.3);
}

.focus-mode-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.4);
}

.view-toggle {
  display: flex;
  gap: 4px;
  background-color: var(--bg-gray);
  padding: 4px;
  border-radius: var(--radius-md);
}

.toggle-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background-color: transparent;
  color: var(--text-placeholder);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background-color: var(--primary);
  color: white;
}

.toggle-btn:hover:not(.active) {
  background-color: white;
}

.toggle-icon {
  font-size: 14px;
}

/* 筛选行 - 整合后的 FilterPanel */
.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  width: 100%;
}

.search-box {
  position: relative;
  flex: 1.5;
  min-width: 180px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-placeholder);
}

.search-input {
  width: 100%;
  padding: 9px 14px 9px 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-main);
  background-color: var(--bg-gray);
  transition: all 0.3s ease;
}

.search-input:focus {
  background-color: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(18, 183, 245, 0.1);
  outline: none;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 3;
  justify-content: flex-end;
}

.filter-group select {
  height: 36px;
  padding: 0 28px 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-main);
  background-color: var(--bg-gray);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  min-width: 110px;
  text-align: center;
  text-align-last: center;
  flex: 1;
  max-width: 140px;
}

.filter-group select:hover {
  border-color: var(--primary);
  background-color: white;
}

.filter-group select:focus {
  border-color: var(--primary);
  outline: none;
}

/* 自定义下拉框样式 - 带光效动画 */
.custom-select {
  position: relative;
  flex: 1;
  min-width: 110px;
  max-width: 140px;
}

.select-trigger {
  height: 36px;
  padding: 0 28px 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-main);
  background-color: var(--bg-gray);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 蓝色斜杆光效动画 - 5cm宽约189px */
.select-trigger::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -189px;
  width: 189px;
  height: 200%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 82, 217, 0.15) 30%,
    rgba(0, 82, 217, 0.35) 50%,
    rgba(0, 82, 217, 0.15) 70%,
    transparent 100%
  );
  transform: rotate(25deg);
  animation: lightSweep 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes lightSweep {
  0% {
    left: -189px;
  }
  100% {
    left: calc(100% + 189px);
  }
}

.select-trigger:hover {
  border-color: var(--primary);
  background-color: white;
  box-shadow: 0 0 12px rgba(0, 82, 217, 0.2);
}

.select-trigger:hover::before {
  animation-duration: 1.5s;
}

.select-text {
  font-weight: 500;
  text-align: center;
}

.select-arrow {
  position: absolute;
  right: 10px;
  font-size: 10px;
  color: var(--text-placeholder);
  transition: transform 0.2s ease;
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
  animation: dropdownSlide 0.2s ease;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.select-option {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.select-option:hover {
  background-color: var(--bg-gray);
  color: var(--primary);
}

.select-option.active {
  background-color: var(--primary-light);
  color: var(--primary);
  font-weight: 500;
}

.btn-recycle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  white-space: nowrap;
  flex: 1;
  min-width: 100px;
  max-width: 120px;
}

.btn-recycle:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.btn-icon-svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.toggle-icon-svg {
  width: 18px;
  height: 18px;
}

/* 事务列表可滚动区域 */
.task-list-scrollable {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  min-height: 0;
}

/* 自定义滚动条样式 */
.task-list-scrollable::-webkit-scrollbar,
.today-tasks-fixed :deep(.today-content)::-webkit-scrollbar {
  width: 6px;
}

.task-list-scrollable::-webkit-scrollbar-track,
.today-tasks-fixed :deep(.today-content)::-webkit-scrollbar-track {
  background: transparent;
}

.task-list-scrollable::-webkit-scrollbar-thumb,
.today-tasks-fixed :deep(.today-content)::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #c7d2fe 0%, #a5b4fc 100%);
  border-radius: 3px;
}

.task-list-scrollable::-webkit-scrollbar-thumb:hover,
.today-tasks-fixed :deep(.today-content)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #a5b4fc 0%, #818cf8 100%);
}

.fab-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0052D9 0%, #003bb5 100%);
  color: white;
  font-size: 28px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 82, 217, 0.4);
  transition: all 0.3s ease;
  z-index: 100;
}

.fab-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 82, 217, 0.5), 0 0 0 4px rgba(18, 183, 245, 0.15);
}

/* ========== 手机端适配 - 单列流式布局 ========== */
@media (max-width: 768px) {
  /* 整体布局改为单列 */
  .main-layout {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 10px;
    width: 100%;
    max-width: 100%;
    overflow-y: auto;
    height: auto;
    box-sizing: border-box;
  }

  /* 左列右列间距调整 */
  .left-column,
  .right-column {
    gap: 10px;
    min-height: auto;
    width: 100%;
  }

  /* 今天的事务 - 手机端正常高度 */
  .today-tasks-fixed {
    flex: none;
    height: auto;
    min-height: 180px;
    max-height: 300px;
    width: 100%;
  }

  /* 事务列表区域 - 手机端正常高度 */
  .task-section-fixed {
    flex: none;
    height: auto;
    min-height: 350px;
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
  }

  /* 筛选行 - 手机端流式布局，每个元素100%宽度 */
  .filter-row {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
    width: 100%;
    box-sizing: border-box;
  }

  /* 搜索框 - 100%宽度 */
  .search-box {
    flex: none;
    width: 100%;
    min-width: auto;
    max-width: 100%;
  }

  /* 筛选组 - 竖向排列 */
  .filter-group {
    flex: none;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-sizing: border-box;
  }

  /* 自定义下拉框 - 100%宽度 */
  .custom-select {
    flex: none;
    width: 100%;
    min-width: auto;
    max-width: 100%;
  }

  .select-trigger {
    width: 100%;
    box-sizing: border-box;
  }

  /* 最近删除按钮 - 100%宽度 */
  .btn-recycle {
    flex: none;
    width: 100%;
    min-width: auto;
    max-width: 100%;
    padding: 12px 16px;
    margin-top: 4px;
  }

  /* 列表滚动区域 - 手机端 */
  .task-list-scrollable {
    max-height: 400px;
    overflow-y: auto;
    width: 100%;
  }

  /* 浮动按钮调整 */
  .fab-btn {
    width: 52px;
    height: 52px;
    font-size: 24px;
    bottom: 20px;
    right: 20px;
  }

  /* 标题栏 */
  .section-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .section-title {
    font-size: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .main-layout {
    padding: 8px;
    gap: 10px;
  }

  .section-title {
    font-size: 15px;
  }

  /* 筛选元素统一调整 */
  .filter-group {
    gap: 6px;
  }

  .custom-select {
    width: 100%;
    min-width: auto;
  }

  .select-trigger {
    height: 42px;
    font-size: 14px;
    padding: 0 12px;
  }

  .select-text {
    font-size: 14px;
  }

  .btn-recycle {
    width: 100%;
    min-width: auto;
    padding: 12px 16px;
    font-size: 14px;
  }

  .task-section-fixed {
    padding: 10px;
    min-height: 300px;
  }

  .search-input {
    padding: 10px 14px 10px 36px;
    font-size: 14px;
  }
}

/* 确认弹窗样式 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-content {
  background-color: white;
  border-radius: var(--radius-lg);
  padding: 28px 32px;
  min-width: 360px;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialogSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 12px;
}

.dialog-icon.warning {
  background-color: #FFFBE6;
}

.dialog-icon.danger {
  background-color: #FFF2F0;
}

.dialog-icon.info {
  background-color: #E8F7FF;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.dialog-body {
  margin-bottom: 24px;
}

.dialog-message {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel {
  padding: 10px 24px;
  background-color: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background-color: var(--bg-gray);
  border-color: #d0d5da;
}

.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-confirm.warning {
  background: linear-gradient(135deg, #FFC53D 0%, #FF9C00 100%);
}

.btn-confirm.danger {
  background: linear-gradient(135deg, #F53F3F 0%, #D9363E 100%);
}

.btn-confirm.info {
  background: linear-gradient(135deg, var(--primary) 0%, #0ea6e0 100%);
}

/* Transition animations */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog-content,
.dialog-fade-leave-active .dialog-content {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dialog-fade-enter-from .dialog-content,
.dialog-fade-leave-to .dialog-content {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

/* 手机端弹窗适配 */
@media (max-width: 768px) {
  .dialog-content {
    min-width: 300px;
    max-width: 90%;
    padding: 24px;
  }

  .dialog-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .dialog-title {
    font-size: 16px;
  }

  .dialog-message {
    font-size: 13px;
  }

  .dialog-footer {
    flex-direction: column-reverse;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
    padding: 12px 20px;
  }
}
</style>
