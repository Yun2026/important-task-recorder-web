import cloudbase from '@cloudbase/js-sdk'

// CloudBase 配置
const ENV_ID = 'important-affair-notebook-a047f6'
const REGION = 'ap-shanghai'

// 初始化 CloudBase
let app: any = null
let isInitialized = false

// 导出 app 供其他模块使用
export { app }

export async function initCloudBase(): Promise<boolean> {
  if (isInitialized && app) {
    return true
  }
  
  try {
    // 初始化 CloudBase
    app = cloudbase.init({
      env: ENV_ID,
      region: REGION
    })
    
    // 获取认证实例并进行匿名登录
    const auth = app.auth()
    
    // 检查当前登录状态
    const loginState = await auth.getLoginState()
    if (!loginState) {
      // 未登录，进行匿名登录
      console.log('进行匿名登录...')
      await auth.anonymousAuthProvider().signIn()
      console.log('匿名登录成功')
    } else {
      console.log('已处于登录状态')
    }
    
    isInitialized = true
    console.log('CloudBase 初始化成功')
    return true
  } catch (error: any) {
    console.error('CloudBase 初始化失败:', error)
    // 静默失败，不影响本地功能
    return false
  }
}

// 获取数据库实例
async function getDatabase() {
  const success = await initCloudBase()
  if (!success || !app) {
    throw new Error('CloudBase 未初始化')
  }
  return app.database()
}

// 用户数据接口
export interface CloudUser {
  _id?: string
  email: string
  nickname: string
  password: string
  createdAt: string
}

// 本地用户存储（用于开发和测试）
const LOCAL_USERS_KEY = 'LOCAL_USERS_DB'

// 获取本地用户数据库
function getLocalUsers(): CloudUser[] {
  try {
    const usersStr = localStorage.getItem(LOCAL_USERS_KEY)
    return usersStr ? JSON.parse(usersStr) : []
  } catch {
    return []
  }
}

// 保存本地用户数据库
function saveLocalUsers(users: CloudUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

// ==================== 用户注册 ====================
export async function registerUser(data: {
  nickname: string
  email: string
  password: string
}): Promise<{ success: boolean; msg?: string; user?: CloudUser }> {
  try {
    console.log('开始注册流程...')
    
    // 检查邮箱是否已存在（本地存储）
    const localUsers = getLocalUsers()
    console.log('当前本地用户数量:', localUsers.length)
    
    const existingUser = localUsers.find(u => u.email === data.email)
    if (existingUser) {
      return { success: false, msg: '该账号已存在' }
    }

    // 创建新用户
    const newUser: CloudUser = {
      _id: 'user_' + Date.now(),
      email: data.email,
      nickname: data.nickname,
      password: data.password,
      createdAt: new Date().toISOString()
    }
    
    // 保存到本地存储
    localUsers.push(newUser)
    saveLocalUsers(localUsers)
    console.log('用户已保存到本地存储:', newUser._id)

    // 尝试同步到 CloudBase（异步，不阻塞）
    syncUserToCloudbase(newUser).catch(err => {
      console.log('同步到云端失败（可忽略）:', err)
    })

    // 保存登录状态到本地
    saveLoginState(newUser)
    console.log('用户注册成功:', newUser._id)

    return { success: true, user: newUser }
  } catch (error: any) {
    console.error('注册失败详细错误:', error)
    return { success: false, msg: '注册失败：' + (error.message || '未知错误') }
  }
}

// 尝试同步用户到 CloudBase（异步）
async function syncUserToCloudbase(user: CloudUser) {
  try {
    const initSuccess = await initCloudBase()
    if (!initSuccess) return
    
    const db = await getDatabase()
    const usersCollection = db.collection('users')
    await usersCollection.add(user)
    console.log('用户已同步到云端')
  } catch (error) {
    console.log('同步到云端失败:', error)
  }
}

// ==================== 用户登录 ====================
export async function loginUser(data: {
  email: string
  password: string
}): Promise<{ success: boolean; msg?: string; user?: CloudUser }> {
  try {
    console.log('开始登录流程...')
    
    // 从本地存储查询用户
    const localUsers = getLocalUsers()
    const user = localUsers.find(u => u.email === data.email && u.password === data.password)
    
    if (!user) {
      return { success: false, msg: '密码错误或账号不存在' }
    }

    // 保存登录状态
    saveLoginState(user)
    console.log('登录成功:', user._id)

    return { success: true, user }
  } catch (error: any) {
    console.error('登录失败:', error)
    return { success: false, msg: '登录失败：' + (error.message || '网络错误') }
  }
}

// ==================== 获取当前用户 ====================
export function getCurrentUser(): CloudUser | null {
  const userStr = localStorage.getItem('VUE_TASK_USER')
  if (userStr) {
    return JSON.parse(userStr)
  }
  return null
}

// ==================== 保存登录状态 ====================
export function saveLoginState(user: CloudUser) {
  localStorage.setItem('VUE_TASK_USER', JSON.stringify(user))
  localStorage.setItem('token', 'cloud_token_' + Date.now())
}

// ==================== 退出登录 ====================
export function logoutUser() {
  localStorage.removeItem('VUE_TASK_USER')
  localStorage.removeItem('token')
}

// ==================== 检查邮箱是否注册 ====================
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // 从本地存储检查
    const localUsers = getLocalUsers()
    return localUsers.some(u => u.email === email)
  } catch (error: any) {
    console.error('检查邮箱失败:', error)
    return false
  }
}

// ==================== 初始化 CloudBase 并检查 ====================
export async function initCloudAuth(): Promise<boolean> {
  // 尝试初始化 CloudBase，但失败不影响本地功能
  try {
    return await initCloudBase()
  } catch (error) {
    console.log('CloudBase 初始化失败，使用本地模式')
    return false
  }
}
