// API接口配置 - 使用相对路径，通过 Nginx 反向代理到后端
const API_BASE_URL = '/api' // 启用后端API

// 获取token
const getToken = () => localStorage.getItem('token')

// 通用请求封装
async function request<T>(url: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; msg?: string }> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    })
    
    const result = await response.json()
    
    if (result.code === 200 || result.code === 201) {
      return { success: true, data: result.data, msg: result.msg }
    } else {
      return { success: false, msg: result.msg || '请求失败' }
    }
  } catch (error) {
    console.error('API请求失败:', error)
    return { success: false, msg: '网络请求失败，请检查服务器是否运行' }
  }
}

// 认证响应类型
interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    nickname: string
  }
}

// 认证API - 使用后端API
export const authApi = {
  // 注册
  register: async (data: { nickname: string; email: string; password: string; confirmPassword: string }) => {
    console.log('Register (Backend):', data)
    const result = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nickname: data.nickname,
        email: data.email,
        password: data.password
      })
    })
    
    if (result.success && result.data) {
      localStorage.setItem('token', result.data.token)
      localStorage.setItem('VUE_TASK_USER', JSON.stringify(result.data.user))
    }
    
    return result
  },
  
  // 登录
  login: async (data: { email: string; password: string }) => {
    console.log('Login (Backend):', data)
    const result = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password
      })
    })
    
    if (result.success && result.data) {
      localStorage.setItem('token', result.data.token)
      localStorage.setItem('VUE_TASK_USER', JSON.stringify(result.data.user))
    }
    
    return result
  },
  
  // 获取当前用户信息
  getCurrentUser: async () => {
    return await request('/auth/me')
  },
  
  // 退出登录
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('VUE_TASK_USER')
  }
}

// 事务相关API - 直接使用CloudBase数据库
export interface TaskData {
  id?: string
  user_id?: string
  title: string
  content?: string
  start_time?: string
  end_time?: string
  priority?: 'high' | 'medium' | 'low'
  tags?: string
  is_completed?: number
  create_time?: string
  update_time?: string
}

export const taskApi = {
  // 获取所有事务
  getAll: async () => {
    return await request<TaskData[]>('/tasks')
  },
  
  // 添加事务
  create: async (data: Partial<TaskData>) => {
    return await request<TaskData>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  // 更新事务
  update: async (id: string, data: Partial<TaskData>) => {
    return await request<TaskData>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  
  // 更新完成状态
  toggleComplete: async (id: string, isCompleted: boolean) => {
    return await request(`/tasks/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: isCompleted })
    })
  },
  
  // 删除事务
  delete: async (id: string) => {
    return await request(`/tasks/${id}`, {
      method: 'DELETE'
    })
  },
  
  // 清除已完成事务
  clearCompleted: async () => {
    return await request('/tasks/completed/clear', {
      method: 'DELETE'
    })
  }
}

// 回收站相关API
export const recycleBinApi = {
  getAll: async () => {
    return await request('/recycle-bin')
  },
  restore: async (id: string) => {
    return await request(`/recycle-bin/${id}/restore`, {
      method: 'POST'
    })
  },
  permanentDelete: async (id: string) => {
    return await request(`/recycle-bin/${id}`, {
      method: 'DELETE'
    })
  },
  clear: async () => {
    return await request('/recycle-bin/clear', {
      method: 'DELETE'
    })
  }
}
