import { Task, TaskStatus, Priority, Category } from '@/types'
import { initCloudBase, app as cloudApp } from './cloudAuth2'

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

// 转换后端数据格式为前端格式
function convertTaskData(data: any): Task {
  const priorityMap: Record<string, Priority> = {
    'high': Priority.HIGH,
    'medium': Priority.MID,
    'low': Priority.LOW
  }

  return {
    id: data._id || String(data.id || Date.now()),
    title: data.title,
    subTitle: data.content || '',
    priority: priorityMap[data.priority || 'medium'] || Priority.MID,
    category: Category.PERSONAL,
    startDate: data.startDate || '',
    startTime: data.startTime || '',
    endTime: data.endTime || '',
    deadline: data.deadline || '',
    tags: data.tags ? (Array.isArray(data.tags) ? data.tags : data.tags.split(',').filter(Boolean)) : [],
    status: data.isCompleted ? TaskStatus.FINISHED : TaskStatus.UNFINISHED,
    createTime: data.createTime || new Date().toISOString()
  }
}

// 转换前端数据格式为后端格式
function convertToTaskData(task: Task): any {
  const priorityMap: Record<Priority, 'high' | 'medium' | 'low'> = {
    [Priority.HIGH]: 'high',
    [Priority.MID]: 'medium',
    [Priority.LOW]: 'low'
  }

  return {
    title: task.title,
    content: task.subTitle,
    startDate: task.startDate,
    startTime: task.startTime,
    endTime: task.endTime,
    deadline: task.deadline,
    priority: priorityMap[task.priority],
    tags: Array.isArray(task.tags) ? task.tags.join(',') : task.tags,
    isCompleted: task.status === TaskStatus.FINISHED,
    createTime: task.createTime,
    user_email: getCurrentUserEmail(), // 添加用户邮箱用于数据隔离
    updateTime: new Date().toISOString()
  }
}

// 本地存储键 - 任务数据（作为缓存）
function getTasksKey(): string {
  const email = getCurrentUserEmail()
  return email ? `VUE_TASKS_${email}` : 'VUE_TASKS_GUEST'
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取数据库实例
async function getDatabase() {
  const success = await initCloudBase()
  if (!success) {
    throw new Error('CloudBase 未初始化')
  }
  // 使用从 cloudAuth2 导出的 app 实例
  if (!cloudApp) {
    throw new Error('CloudBase app 实例未初始化')
  }
  return cloudApp.database()
}

export const cloudStorage = {
  // ===== 获取任务列表 =====
  async getTasks(): Promise<Task[]> {
    try {
      notifySyncStatus('syncing', '正在同步...')
      
      const email = getCurrentUserEmail()
      if (!email) {
        notifySyncStatus('synced', '已加载本地数据')
        const localData = localStorage.getItem(getTasksKey())
        return localData ? JSON.parse(localData) : []
      }
      
      const db = await getDatabase()
      const tasksCollection = db.collection('tasks')
      
      // 查询当前用户的任务
      const result = await tasksCollection.where({ user_email: email }).get()
      
      if (result.data && result.data.length > 0) {
        notifySyncStatus('synced', '同步完成')
        const tasks = result.data.map(convertTaskData)
        // 同时保存到本地缓存
        localStorage.setItem(getTasksKey(), JSON.stringify(tasks))
        return tasks
      }
      
      notifySyncStatus('synced', '暂无数据')
      return []
    } catch (error: any) {
      console.error('获取任务失败:', error)
      
      // 出错时从本地存储获取
      const localData = localStorage.getItem(getTasksKey())
      if (localData) {
        notifySyncStatus('synced', '已加载本地数据')
        return JSON.parse(localData)
      }
      
      notifySyncStatus('error', '同步失败')
      return []
    }
  },

  // ===== 保存任务列表（批量保存，这里用不到） =====
  saveTasks(_tasks: Task[]): void {
    // CloudBase 不需要批量保存，此方法保留用于兼容
  },

  // ===== 添加任务 =====
  async addTask(task: Task): Promise<void> {
    try {
      notifySyncStatus('syncing', '正在保存...')
      
      const email = getCurrentUserEmail()
      if (!email) {
        // 未登录，只保存到本地
        const localData = localStorage.getItem(getTasksKey())
        const tasks: Task[] = localData ? JSON.parse(localData) : []
        tasks.push(task)
        localStorage.setItem(getTasksKey(), JSON.stringify(tasks))
        notifySyncStatus('synced', '已保存到本地')
        return
      }
      
      // 确保任务有ID
      if (!task.id) {
        task.id = generateId()
      }
      
      // 先保存到本地缓存
      const localData = localStorage.getItem(getTasksKey())
      const tasks: Task[] = localData ? JSON.parse(localData) : []
      tasks.push(task)
      localStorage.setItem(getTasksKey(), JSON.stringify(tasks))
      
      // 保存到 CloudBase
      try {
        const db = await getDatabase()
        const tasksCollection = db.collection('tasks')
        const taskData = convertToTaskData(task)
        
        const result = await tasksCollection.add(taskData)
        
        if (result.code) {
          console.error('CloudBase 保存失败:', result.message)
          notifySyncStatus('synced', '已保存到本地')
        } else {
          // 更新本地任务的ID
          if (result.id) {
            task.id = result.id
          }
          notifySyncStatus('synced', '已保存')
        }
      } catch (apiError) {
        console.error('CloudBase 保存失败:', apiError)
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
      
      const email = getCurrentUserEmail()
      if (!email) {
        // 未登录，只更新本地
        const localData = localStorage.getItem(getTasksKey())
        if (localData) {
          const tasks: Task[] = JSON.parse(localData)
          const index = tasks.findIndex(t => t.id === updatedTask.id)
          if (index !== -1) {
            tasks[index] = updatedTask
            localStorage.setItem(getTasksKey(), JSON.stringify(tasks))
          }
        }
        notifySyncStatus('synced', '已更新到本地')
        return
      }
      
      // 先更新本地缓存
      const localData = localStorage.getItem(getTasksKey())
      if (localData) {
        const tasks: Task[] = JSON.parse(localData)
        const index = tasks.findIndex(t => t.id === updatedTask.id)
        if (index !== -1) {
          tasks[index] = updatedTask
          localStorage.setItem(getTasksKey(), JSON.stringify(tasks))
        }
      }
      
      // 更新 CloudBase
      try {
        const db = await getDatabase()
        const tasksCollection = db.collection('tasks')
        const taskData = convertToTaskData(updatedTask)
        
        const result = await tasksCollection.doc(updatedTask.id).update(taskData)
        
        if (result.code) {
          console.error('CloudBase 更新失败:', result.message)
          notifySyncStatus('synced', '已更新到本地')
        } else {
          notifySyncStatus('synced', '已更新')
        }
      } catch (apiError) {
        console.error('CloudBase 更新失败:', apiError)
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
      
      const email = getCurrentUserEmail()
      
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
      
      // 如果已登录，从 CloudBase 删除
      if (email) {
        try {
          const db = await getDatabase()
          const tasksCollection = db.collection('tasks')
          await tasksCollection.doc(id).remove()
        } catch (apiError) {
          console.error('CloudBase 删除失败:', apiError)
        }
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
      const email = getCurrentUserEmail()
      if (!email) return
      
      const db = await getDatabase()
      const tasksCollection = db.collection('tasks')
      await tasksCollection.doc(id).remove()
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
      
      // 从 CloudBase 删除
      const email = getCurrentUserEmail()
      if (email) {
        try {
          const db = await getDatabase()
          const tasksCollection = db.collection('tasks')
          await tasksCollection.doc(id).remove()
        } catch (apiError) {
          console.error('CloudBase 删除失败:', apiError)
        }
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
        
        // 更新 CloudBase
        const email = getCurrentUserEmail()
        if (email) {
          try {
            const db = await getDatabase()
            const tasksCollection = db.collection('tasks')
            
            const result = await tasksCollection.doc(id).update({
              isCompleted: !isCompleted,
              updateTime: new Date().toISOString()
            })
            
            if (result.code) {
              console.error('CloudBase 更新失败:', result.message)
              notifySyncStatus('error', result.message || '更新失败')
            } else {
              notifySyncStatus('synced', '状态已更新')
            }
          } catch (apiError) {
            console.error('CloudBase 更新失败:', apiError)
            notifySyncStatus('error', '网络错误')
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
        
        // 添加到任务列表
        await this.addTask(task)
        
        notifySyncStatus('synced', '已恢复')
        return task
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

// 导出认证API（空对象，因为已移至cloudAuth2）
export const authApi = {
  register: async () => ({ success: false, msg: '请使用 cloudAuth2 模块' }),
  login: async () => ({ success: false, msg: '请使用 cloudAuth2 模块' }),
  getCurrentUser: () => Promise.resolve({ success: false, msg: '请使用 cloudAuth2 模块' })
}
