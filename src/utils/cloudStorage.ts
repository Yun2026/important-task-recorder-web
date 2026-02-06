import { Task, TaskStatus, Priority, Category } from '@/types'
import { taskApi, authApi, TaskData } from './api'

// 同步状态回调
type SyncStatusCallback = (status: 'syncing' | 'synced' | 'error' | 'unsynced', message?: string) => void
let syncStatusCallback: SyncStatusCallback | null = null

export function setSyncStatusCallback(callback: SyncStatusCallback) {
  syncStatusCallback = callback
}

function notifySyncStatus(status: 'syncing' | 'synced' | 'error' | 'unsynced', message?: string) {
  syncStatusCallback?.(status, message)
}

// 获取当前用户邮箱（用于数据隔离）
function getCurrentUserEmail(): string | null {
  const userStr = localStorage.getItem('VUE_TASK_USER')
  if (userStr) {
    const user = JSON.parse(userStr)
    return user.email || null
  }
  return null
}

// 本地存储键 - 回收站数据仍然本地存储
function getRecycleKey(): string {
  const email = getCurrentUserEmail()
  return email ? `VUE_TASK_RECYCLE_${email}` : 'VUE_TASK_RECYCLE_GUEST'
}

// 将 ISO 时间字符串转换为 YYYY-MM-DD HH:mm:ss 格式
// 注意：直接提取 ISO 字符串的日期时间部分，不做时区转换
function formatDateTimeFromISO(isoString: string | null | undefined): string {
  if (!isoString) return ''
  
  // ISO 格式: 2026-02-02T07:00:00.000Z 或 2026-02-02T07:00:00
  // 直接提取日期和时间部分
  const match = isoString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})/)
  if (match) {
    return `${match[1]} ${match[2]}:${match[3]}:${match[4]}`
  }
  
  return ''
}

// 转换后端数据格式为前端格式
function convertTaskData(data: TaskData): Task {
  const priorityMap: Record<string, Priority> = {
    'high': Priority.HIGH,
    'medium': Priority.MID,
    'low': Priority.LOW
  }

  // 转换时间格式 - 直接从 ISO 字符串提取，不做时区转换
  const startDateTime = formatDateTimeFromISO(data.start_time)
  const endDateTime = formatDateTimeFromISO(data.end_time)
  
  // 提取日期部分
  const startDate = startDateTime ? startDateTime.split(' ')[0] : ''
  
  // 提取时间部分 (HH:mm)
  const startTime = startDateTime ? startDateTime.split(' ')[1]?.substring(0, 5) : ''
  const endTime = endDateTime ? endDateTime.split(' ')[1]?.substring(0, 5) : ''

  return {
    id: String(data.id),
    title: data.title,
    subTitle: data.content || '',
    priority: priorityMap[data.priority || 'medium'] || Priority.MID,
    category: Category.PERSONAL,
    startDate: startDate,
    startTime: startTime,
    endTime: endTime,
    deadline: endDateTime,
    tags: data.tags ? data.tags.split(',').filter(Boolean) : [],
    status: data.is_completed ? TaskStatus.FINISHED : TaskStatus.UNFINISHED,
    createTime: data.create_time ? formatDateTimeFromISO(data.create_time) : new Date().toISOString()
  }
}

// 转换前端数据格式为后端格式
function convertToTaskData(task: Task): Partial<TaskData> {
  const priorityMap: Record<Priority, 'high' | 'medium' | 'low'> = {
    [Priority.HIGH]: 'high',
    [Priority.MID]: 'medium',
    [Priority.LOW]: 'low'
  }

  // 组合日期和时间成 ISO 格式（不带时区，假定为本地时间）
  const startDateTime = task.startDate && task.startTime
    ? `${task.startDate}T${task.startTime}:00`
    : undefined
  // 从deadline解析结束日期和时间
  const endDate = task.deadline ? task.deadline.split(' ')[0] : task.startDate
  const endDateTime = endDate && task.endTime
    ? `${endDate}T${task.endTime}:00`
    : undefined

  // 构建返回数据
  const result: Partial<TaskData> = {
    title: task.title,
    content: task.subTitle,
    start_time: startDateTime,
    end_time: endDateTime,
    priority: priorityMap[task.priority],
    tags: task.tags.join(','),
    is_completed: task.status === TaskStatus.FINISHED ? 1 : 0
  }

  return result
}

// 本地存储键 - 任务数据
function getTasksKey(): string {
  const email = getCurrentUserEmail()
  return email ? `VUE_TASKS_${email}` : 'VUE_TASKS_GUEST'
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const cloudStorage = {
  // ===== 获取任务列表 =====
  async getTasks(): Promise<Task[]> {
    try {
      notifySyncStatus('syncing', '正在同步...')
      
      // 先尝试从API获取
      const result = await taskApi.getAll()
      if (result.success && result.data) {
        notifySyncStatus('synced', '同步完成')
        const tasks = result.data.map(convertTaskData)
        // 同时保存到本地
        localStorage.setItem(getTasksKey(), JSON.stringify(tasks))
        return tasks
      }
      
      // API失败时从本地存储获取
      const localData = localStorage.getItem(getTasksKey())
      if (localData) {
        notifySyncStatus('synced', '已加载本地数据')
        return JSON.parse(localData)
      }
      
      notifySyncStatus('error', '同步失败')
      return []
    } catch (error) {
      console.error('获取任务失败:', error)
      
      // 出错时从本地存储获取
      const localData = localStorage.getItem(getTasksKey())
      if (localData) {
        notifySyncStatus('synced', '已加载本地数据')
        return JSON.parse(localData)
      }
      
      notifySyncStatus('error', '网络错误')
      return []
    }
  },

  // ===== 保存任务列表（批量保存，这里用不到，因为后端是单个操作） =====
  saveTasks(_tasks: Task[]): void {
    // 后端API是单个操作，此方法保留用于兼容
  },

  // ===== 添加任务 =====
  async addTask(task: Task): Promise<void> {
    try {
      notifySyncStatus('syncing', '正在保存...')
      
      // 确保任务有ID
      if (!task.id) {
        task.id = generateId()
      }
      
      // 先保存到本地
      const localData = localStorage.getItem(getTasksKey())
      const tasks: Task[] = localData ? JSON.parse(localData) : []
      tasks.push(task)
      localStorage.setItem(getTasksKey(), JSON.stringify(tasks))
      
      // 尝试同步到服务器
      try {
        const result = await taskApi.create(convertToTaskData(task))
        if (result.success) {
          notifySyncStatus('synced', '已保存')
        } else {
          // 服务器保存失败但本地已保存
          notifySyncStatus('synced', '已保存到本地')
        }
      } catch (apiError) {
        // API调用失败，但本地已保存
        console.log('API保存失败，已保存到本地:', apiError)
        notifySyncStatus('synced', '已保存到本地')
      }
    } catch (error) {
      console.error('添加任务失败:', error)
      notifySyncStatus('error', '保存失败')
    }
  },

  // ===== 更新任务 =====
  async updateTask(updatedTask: Task): Promise<void> {
    try {
      notifySyncStatus('syncing', '正在更新...')
      
      // 先更新本地
      const localData = localStorage.getItem(getTasksKey())
      if (localData) {
        const tasks: Task[] = JSON.parse(localData)
        const index = tasks.findIndex(t => t.id === updatedTask.id)
        if (index !== -1) {
          tasks[index] = updatedTask
          localStorage.setItem(getTasksKey(), JSON.stringify(tasks))
        }
      }
      
      // 尝试同步到服务器
      try {
        const taskId = parseInt(updatedTask.id)
        if (!isNaN(taskId)) {
          const result = await taskApi.update(taskId, convertToTaskData(updatedTask))
          if (result.success) {
            notifySyncStatus('synced', '已更新')
          } else {
            notifySyncStatus('synced', '已更新到本地')
          }
        } else {
          notifySyncStatus('synced', '已更新到本地')
        }
      } catch (apiError) {
        console.log('API更新失败，已更新到本地:', apiError)
        notifySyncStatus('synced', '已更新到本地')
      }
    } catch (error) {
      console.error('更新任务失败:', error)
      notifySyncStatus('error', '更新失败')
    }
  },

  // ===== 删除任务（移到回收站） =====
  async deleteTask(id: string): Promise<void> {
    try {
      notifySyncStatus('syncing', '正在删除...')
      
      // 先从本地获取任务信息
      const localData = localStorage.getItem(getTasksKey())
      const tasks: Task[] = localData ? JSON.parse(localData) : []
      const task = tasks.find(t => t.id === id)
      
      if (task) {
        // 移到本地回收站
        const recycleData = localStorage.getItem(getRecycleKey())
        const recycleTasks: Task[] = recycleData ? JSON.parse(recycleData) : []
        recycleTasks.push(task)
        localStorage.setItem(getRecycleKey(), JSON.stringify(recycleTasks))
        
        // 从本地任务列表移除
        const updatedTasks = tasks.filter(t => t.id !== id)
        localStorage.setItem(getTasksKey(), JSON.stringify(updatedTasks))
      }
      
      // 尝试从服务器删除
      try {
        const taskId = parseInt(id)
        if (!isNaN(taskId)) {
          await taskApi.delete(taskId)
        }
      } catch (apiError) {
        console.log('API删除失败，已从本地删除:', apiError)
      }
      
      notifySyncStatus('synced', '已删除')
    } catch (error) {
      console.error('删除任务失败:', error)
      notifySyncStatus('error', '删除失败')
    }
  },

  // ===== 永久删除（仅从API） =====
  async permanentDelete(id: string): Promise<void> {
    try {
      const taskId = parseInt(id)
      if (!isNaN(taskId)) {
        await taskApi.delete(taskId)
      }
    } catch (error) {
      console.error('永久删除失败:', error)
    }
  },

  // ===== 永久删除任务（本地+API）- 用于回收站关闭时 =====
  async permanentDeleteTask(id: string): Promise<void> {
    try {
      notifySyncStatus('syncing', '正在删除...')
      
      // 从本地任务列表移除
      const localData = localStorage.getItem(getTasksKey())
      if (localData) {
        const tasks: Task[] = JSON.parse(localData)
        const updatedTasks = tasks.filter(t => t.id !== id)
        localStorage.setItem(getTasksKey(), JSON.stringify(updatedTasks))
      }
      
      // 尝试从服务器删除
      try {
        const taskId = parseInt(id)
        if (!isNaN(taskId)) {
          await taskApi.delete(taskId)
        }
      } catch (apiError) {
        console.log('API删除失败，已从本地删除:', apiError)
      }
      
      notifySyncStatus('synced', '已删除')
    } catch (error) {
      console.error('永久删除任务失败:', error)
      notifySyncStatus('error', '删除失败')
    }
  },

  // ===== 切换任务状态 =====
  async toggleTaskStatus(id: string): Promise<void> {
    try {
      const tasks = await this.getTasks()
      const task = tasks.find(t => t.id === id)
      if (task) {
        const isCompleted = task.status === TaskStatus.FINISHED
        const newStatus = isCompleted ? TaskStatus.UNFINISHED : TaskStatus.FINISHED
        notifySyncStatus('syncing', '正在更新...')
        
        const taskId = parseInt(id)
        if (!isNaN(taskId)) {
          const result = await taskApi.toggleComplete(taskId, !isCompleted)
          if (result.success) {
            notifySyncStatus('synced', '状态已更新')
          } else {
            notifySyncStatus('error', result.msg || '更新失败')
          }
        }
        
        // 无论API是否成功，都更新本地存储以确保UI立即响应
        const localData = localStorage.getItem(getTasksKey())
        if (localData) {
          const localTasks: Task[] = JSON.parse(localData)
          const index = localTasks.findIndex(t => t.id === id)
          if (index !== -1) {
            localTasks[index].status = newStatus
            localStorage.setItem(getTasksKey(), JSON.stringify(localTasks))
          }
        }
      }
    } catch (error) {
      console.error('切换任务状态失败:', error)
      notifySyncStatus('error', '网络错误')
    }
  },

  // ===== 回收站（仍使用本地存储） =====
  async getRecycleBin(): Promise<Task[]> {
    const data = localStorage.getItem(getRecycleKey())
    if (!data) return []
    const tasks: Task[] = JSON.parse(data)
    return tasks
  },

  async restoreFromRecycleBin(id: string): Promise<Task | null> {
    try {
      notifySyncStatus('syncing', '正在恢复...')
      const recycleData = localStorage.getItem(getRecycleKey())
      const recycleTasks: Task[] = recycleData ? JSON.parse(recycleData) : []
      
      const task = recycleTasks.find(t => t.id === id)
      if (task) {
        // 从回收站移除
        const updatedRecycle = recycleTasks.filter(t => t.id !== id)
        localStorage.setItem(getRecycleKey(), JSON.stringify(updatedRecycle))
        
        // 添加到服务器（生成新ID）
        const result = await taskApi.create(convertToTaskData(task))
        if (result.success) {
          notifySyncStatus('synced', '已恢复')
          return task
        }
      }
      notifySyncStatus('error', '恢复失败')
      return null
    } catch (error) {
      console.error('恢复任务失败:', error)
      notifySyncStatus('error', '网络错误')
      return null
    }
  },

  async permanentDeleteFromRecycleBin(id: string): Promise<void> {
    const recycleData = localStorage.getItem(getRecycleKey())
    if (recycleData) {
      const recycleTasks: Task[] = JSON.parse(recycleData)
      const updatedRecycle = recycleTasks.filter(t => t.id !== id)
      localStorage.setItem(getRecycleKey(), JSON.stringify(updatedRecycle))
    }
  },

  async clearRecycleBin(): Promise<void> {
    localStorage.removeItem(getRecycleKey())
  },

  // ===== 同步功能 =====
  async syncFromCloud(): Promise<boolean> {
    try {
      notifySyncStatus('syncing', '正在同步...')
      await this.getTasks()
      notifySyncStatus('synced', '同步完成')
      return true
    } catch (error) {
      notifySyncStatus('error', '同步失败')
      return false
    }
  },

  async syncToCloud(): Promise<boolean> {
    // 实时同步，无需手动上传
    notifySyncStatus('synced', '数据已同步')
    return true
  },
}

// 为了向后兼容，导出storage别名
export const storage = cloudStorage

// 导出认证API
export { authApi }
