import cloudbase from '@cloudbase/js-sdk'

// CloudBase 配置
const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID || ''

// 检查是否配置了环境 ID
const isCloudBaseEnabled = !!envId

// 初始化 CloudBase（仅在配置了环境 ID 时）
export const app = isCloudBaseEnabled ? cloudbase.init({ env: envId }) : null

// 获取数据库实例
export const db = isCloudBaseEnabled ? app!.database() : null

// 匿名登录
export async function anonymousLogin() {
  if (!isCloudBaseEnabled) {
    console.log('CloudBase 未配置，跳过登录')
    return false
  }
  try {
    const auth = app!.auth()
    await (auth as any).signInAnonymously()
    console.log('匿名登录成功')
    return true
  } catch (error) {
    console.error('匿名登录失败:', error)
    return false
  }
}

// 检查登录状态
export async function checkLoginStatus() {
  if (!isCloudBaseEnabled) return false
  const auth = app!.auth()
  return auth.hasLoginState()
}

// 获取当前用户 OpenID
export function getOpenId() {
  if (!isCloudBaseEnabled) return ''
  const auth = app!.auth()
  const loginState = auth.hasLoginState()
  if (loginState) {
    return loginState.user?.uid || ''
  }
  return ''
}
