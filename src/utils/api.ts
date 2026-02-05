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

// 本地存储模式 - 认证API模拟
// 纯本地存储实现，不依赖后端服务
export const authApi = {
  // 注册 - 本地存储模式
  // 注意：账号是否已存在的验证已在 AuthModal.vue 中完成，此函数仅执行注册操作
  register: async (data: { nickname: string; email: string; password: string; confirmPassword: string }) => {
    console.log('Register (mock local):', data)
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))

      // 创建新用户
      const newUser = {
        id: Date.now(),
        nickname: data.nickname,
        email: data.email,
        password: data.password, // 明文存储仅用于演示
        create_time: new Date().toISOString()
      }

      // 保存到本地存储
      const existingUsers = JSON.parse(localStorage.getItem('mock_users') || '[]')
      existingUsers.push(newUser)
      localStorage.setItem('mock_users', JSON.stringify(existingUsers))

      // 生成token并自动登录
      const mockToken = 'mock_token_' + Date.now()
      localStorage.setItem('token', mockToken)
      localStorage.setItem('VUE_TASK_USER', JSON.stringify({
        username: data.nickname,
        email: data.email
      }))

      return {
        success: true,
        data: {
          token: mockToken,
          userInfo: {
            userId: newUser.id,
            nickname: data.nickname,
            email: data.email
          }
        }
      }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, msg: '注册失败，请重试' }
    }
  },
  
  // 登录 - 本地存储模式
  // 注意：账号存在性验证已在 AuthModal.vue 中完成，此函数仅执行登录操作
  login: async (data: { email: string; password: string }) => {
    console.log('Login (mock local):', data)
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))

      // 从本地存储查找用户（验证已通过，直接获取用户信息）
      const existingUsers = JSON.parse(localStorage.getItem('mock_users') || '[]')
      const user = existingUsers.find((u: any) => u.email === data.email && u.password === data.password)

      if (!user) {
        return { success: false, msg: '用户不存在' }
      }

      // 生成 token 并保存登录状态
      const mockToken = 'mock_token_' + Date.now()
      localStorage.setItem('token', mockToken)
      localStorage.setItem('VUE_TASK_USER', JSON.stringify({
        username: user.nickname,
        email: user.email
      }))

      return {
        success: true,
        data: {
          token: mockToken,
          userInfo: {
            userId: user.id,
            nickname: user.nickname,
            email: user.email
          }
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, msg: '登录失败，请重试' }
    }
  },
  
  // 获取当前用户信息 - 本地存储模式
  getCurrentUser: () => {
    const userInfo = localStorage.getItem('VUE_TASK_USER')
    if (userInfo) {
      return Promise.resolve({ 
        success: true, 
        data: JSON.parse(userInfo)
      })
    }
    return Promise.resolve({ 
      success: false, 
      msg: '用户未登录' 
    })
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
