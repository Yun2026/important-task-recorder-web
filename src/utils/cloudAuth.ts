import cloudbase from '@cloudbase/js-sdk'

// CloudBase 配置
const ENV_ID = 'important-affair-notebook-a047f6'

// 初始化 CloudBase
let app: any = null

export function initCloudBase() {
  if (!app) {
    app = cloudbase.init({
      env: ENV_ID
    })
  }
  return app
}

// 获取数据库实例
function getDatabase() {
  const app = initCloudBase()
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

// ==================== 用户注册 ====================
export async function registerUser(data: {
  nickname: string
  email: string
  password: string
}): Promise<{ success: boolean; msg?: string; user?: CloudUser }> {
  try {
    const db = getDatabase()
    const usersCollection = db.collection('users')

    // 检查邮箱是否已存在
    const checkRes = await usersCollection.where({ email: data.email }).get()
    if (checkRes.data && checkRes.data.length > 0) {
      return { success: false, msg: '该账号已存在' }
    }

    // 创建新用户
    const newUser: CloudUser = {
      email: data.email,
      nickname: data.nickname,
      password: data.password, // 实际项目应加密
      createdAt: new Date().toISOString()
    }

    const result = await usersCollection.add(newUser)
    
    if (result.code) {
      return { success: false, msg: '注册失败：' + result.message }
    }

    // 保存登录状态到本地
    const userWithId = { ...newUser, _id: result.id }
    saveLoginState(userWithId)

    return { success: true, user: userWithId }
  } catch (error: any) {
    console.error('注册失败:', error)
    return { success: false, msg: '注册失败：' + (error.message || '网络错误') }
  }
}

// ==================== 用户登录 ====================
export async function loginUser(data: {
  email: string
  password: string
}): Promise<{ success: boolean; msg?: string; user?: CloudUser }> {
  try {
    const db = getDatabase()
    const usersCollection = db.collection('users')

    // 查询用户
    const result = await usersCollection
      .where({
        email: data.email,
        password: data.password
      })
      .get()

    if (!result.data || result.data.length === 0) {
      return { success: false, msg: '密码错误或账号不存在' }
    }

    const user = result.data[0] as CloudUser
    
    // 保存登录状态
    saveLoginState(user)

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
    const db = getDatabase()
    const usersCollection = db.collection('users')
    const result = await usersCollection.where({ email }).get()
    return result.data && result.data.length > 0
  } catch (error) {
    console.error('检查邮箱失败:', error)
    return false
  }
}

// ==================== 初始化 CloudBase 并检查 ====================
export async function initCloudAuth(): Promise<boolean> {
  try {
    initCloudBase()
    // 匿名登录获取权限
    const auth = app.auth()
    await auth.anonymousAuthProvider().signIn()
    return true
  } catch (error) {
    console.error('CloudBase 初始化失败:', error)
    return false
  }
}
