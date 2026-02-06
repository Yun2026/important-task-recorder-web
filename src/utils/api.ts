// API接口配置 - 使用相对路径，通过 Nginx 反向代理到后端
const API_BASE_URL = ''

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
    return { success: false, msg: '网络请求失败' }
  }
}

// 认证API - 调用后端服务（支持跨设备登录）
export const authApi = {
  // 注册 - 调用后端API
  register: async (data: { nickname: string; email: string; password: string; confirmPassword: string }) => {
    console.log('Register (API):', data)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.code === 200 || result.code === 201) {
        // 注册成功后自动登录
        const loginResponse = await authApi.login({ 
          email: data.email, 
          password: data.password 
        })
        return loginResponse
      } else {
        return { success: false, msg: result.msg || '注册失败' }
      }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, msg: '网络错误，请检查后端服务是否正常运行' }
    }
  },
  
  // 登录 - 调用后端API
  login: async (data: { email: string; password: string }) => {
    console.log('Login (API):', data)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        // 保存token和用户信息到localStorage
        localStorage.setItem('token', result.data.token)
        localStorage.setItem('VUE_TASK_USER', JSON.stringify({
          username: result.data.userInfo.nickname,
          email: result.data.userInfo.email
        }))
        
        return { 
          success: true, 
          data: result.data 
        }
      } else {
        return { success: false, msg: result.msg || '登录失败' }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, msg: '网络错误，请检查后端服务是否正常运行' }
    }
  },
  
  // 获取当前用户信息 - 调用后端API
  getCurrentUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, msg: '用户未登录' }
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        return { 
          success: true, 
          data: result.data 
        }
      } else {
        return { success: false, msg: result.msg || '获取用户信息失败' }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return { success: false, msg: '网络错误' }
    }
  }
}

// 事务相关API
export interface TaskData {
  id?: number
  user_id?: number
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
  getAll: () => request<TaskData[]>('/api/tasks', { method: 'GET' }),
  
  // 添加事务
  create: (data: Partial<TaskData>) => 
    request<TaskData>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  // 更新事务
  update: (id: number, data: Partial<TaskData>) => 
    request<TaskData>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  
  // 更新完成状态
  toggleComplete: (id: number, isCompleted: boolean) => 
    request<TaskData>(`/api/tasks/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ is_completed: isCompleted })
    }),
  
  // 删除事务
  delete: (id: number) => 
    request(`/api/tasks/${id}`, { method: 'DELETE' }),
  
  // 清除已完成事务
  clearCompleted: () => 
    request('/api/tasks/clear-completed', { method: 'DELETE' })
}

// 回收站相关API（预留）
export const recycleBinApi = {
  getAll: () => Promise.resolve({ success: true, data: [] }),
  restore: (_id: string) => Promise.resolve({ success: true }),
  permanentDelete: (_id: string) => Promise.resolve({ success: true }),
  clear: () => Promise.resolve({ success: true })
}
