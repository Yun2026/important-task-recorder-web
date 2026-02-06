<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CloseIcon } from 'tdesign-icons-vue-next'
import { loginUser, registerUser, checkEmailExists, initCloudAuth } from '@/utils/cloudAuth2'

defineProps<{
  visible: boolean
}>()

// 事件定义
interface Emits {
  (e: 'close'): void
  (e: 'login', data: { email: string; password: string; nickname: string }): void
  (e: 'register', data: { nickname: string; email: string; password: string; confirmPassword: string }): void
}

const emit = defineEmits<Emits>()

// 初始化 CloudBase
onMounted(async () => {
  await initCloudAuth()
})

// ==================== 登录/注册切换 ====================
const isLogin = ref(true)

// ==================== 表单数据 ====================
const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// ==================== 表单错误提示 ====================
const loginErrors = ref({
  email: '',
  password: ''
})

const registerErrors = ref({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// ==================== 自定义弹窗状态 ====================
const dialog = ref({
  visible: false,
  title: '',
  content: '',
  confirmText: '',
  cancelText: '',
  showConfirm: true,
  showCancel: true,
  onConfirm: () => {},
  onCancel: () => {}
})

// ==================== 显示自定义弹窗 ====================
const showDialog = (options: {
  title: string
  content: string
  confirmText?: string
  cancelText?: string
  showConfirm?: boolean
  showCancel?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}) => {
  dialog.value = {
    visible: true,
    title: options.title,
    content: options.content,
    confirmText: options.confirmText || '确认',
    cancelText: options.cancelText || '取消',
    showConfirm: options.showConfirm !== false,
    showCancel: options.showCancel !== false,
    onConfirm: () => {
      dialog.value.visible = false
      options.onConfirm?.()
    },
    onCancel: () => {
      dialog.value.visible = false
      options.onCancel?.()
    }
  }
}

// ==================== 关闭弹窗 ====================
const closeDialog = () => {
  dialog.value.visible = false
}

// ==================== 切换登录/注册模式 ====================
const switchMode = () => {
  isLogin.value = !isLogin.value
  // 清空表单和错误
  loginForm.value = { email: '', password: '' }
  registerForm.value = { nickname: '', email: '', password: '', confirmPassword: '' }
  loginErrors.value = { email: '', password: '' }
  registerErrors.value = { nickname: '', email: '', password: '', confirmPassword: '' }
}

// ==================== 验证邮箱格式 ====================
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ==================== 验证登录表单 ====================
const validateLogin = () => {
  let valid = true
  loginErrors.value = { email: '', password: '' }

  if (!loginForm.value.email.trim()) {
    loginErrors.value.email = '请输入邮箱'
    valid = false
  } else if (!validateEmail(loginForm.value.email)) {
    loginErrors.value.email = '请输入有效的邮箱地址'
    valid = false
  }

  if (!loginForm.value.password) {
    loginErrors.value.password = '请输入密码'
    valid = false
  }

  return valid
}

// ==================== 验证注册表单 ====================
const validateRegister = () => {
  let valid = true
  registerErrors.value = { nickname: '', email: '', password: '', confirmPassword: '' }

  if (!registerForm.value.nickname.trim()) {
    registerErrors.value.nickname = '请输入昵称'
    valid = false
  } else if (registerForm.value.nickname.length < 2) {
    registerErrors.value.nickname = '昵称至少需要2个字符'
    valid = false
  }

  if (!registerForm.value.email.trim()) {
    registerErrors.value.email = '请输入邮箱'
    valid = false
  } else if (!validateEmail(registerForm.value.email)) {
    registerErrors.value.email = '请输入有效的邮箱地址'
    valid = false
  }

  if (!registerForm.value.password) {
    registerErrors.value.password = '请输入密码'
    valid = false
  } else if (registerForm.value.password.length < 6) {
    registerErrors.value.password = '密码至少需要6个字符'
    valid = false
  }

  if (!registerForm.value.confirmPassword) {
    registerErrors.value.confirmPassword = '请确认密码'
    valid = false
  } else if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerErrors.value.confirmPassword = '两次输入的密码不一致'
    valid = false
  }

  return valid
}

// ==================== 检查邮箱是否已注册 ====================
const isEmailRegistered = async (email: string): Promise<boolean> => {
  return await checkEmailExists(email)
}

// ==================== 处理登录 ====================
const handleLogin = async () => {
  // 表单验证
  if (!validateLogin()) {
    return
  }

  const email = loginForm.value.email.trim()
  const password = loginForm.value.password

  // 调用云端登录
  const result = await loginUser({ email, password })

  if (!result.success) {
    // 账号不存在或密码错误 - 显示自定义弹窗
    showDialog({
      title: '登录失败',
      content: result.msg || '密码错误或账号不存在',
      confirmText: '',
      cancelText: '取消',
      showConfirm: false,
      showCancel: true
    })
    return
  }

  // 登录成功
  emit('login', { 
    email, 
    password,
    nickname: result.user?.nickname || ''
  })
}

// ==================== 处理注册 ====================
const handleRegister = async () => {
  // 表单验证
  if (!validateRegister()) {
    return
  }

  const email = registerForm.value.email.trim()

  // 检查账号是否已存在
  const exists = await isEmailRegistered(email)
  if (exists) {
    // 账号已存在 - 显示自定义弹窗
    showDialog({
      title: '注册失败',
      content: '该账号已存在',
      confirmText: '确认',
      cancelText: '',
      showConfirm: true,
      showCancel: false
    })
    return
  }

  // 调用云端注册
  const result = await registerUser({
    nickname: registerForm.value.nickname,
    email: registerForm.value.email,
    password: registerForm.value.password
  })

  if (!result.success) {
    showDialog({
      title: '注册失败',
      content: result.msg || '注册失败，请重试',
      confirmText: '确认',
      cancelText: '',
      showConfirm: true,
      showCancel: false
    })
    return
  }

  // 注册成功
  emit('register', {
    nickname: registerForm.value.nickname,
    email: registerForm.value.email,
    password: registerForm.value.password,
    confirmPassword: registerForm.value.confirmPassword
  })
}

// ==================== 清除所有表单数据 ====================
const clearForms = () => {
  loginForm.value = { email: '', password: '' }
  registerForm.value = { nickname: '', email: '', password: '', confirmPassword: '' }
  loginErrors.value = { email: '', password: '' }
  registerErrors.value = { nickname: '', email: '', password: '', confirmPassword: '' }
}

// ==================== 关闭认证弹窗 ====================
const handleClose = () => {
  clearForms()
  emit('close')
}

// ==================== 处理遮罩层点击 ====================
const handleMaskClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

// ==================== 暴露方法给父组件 ====================
defineExpose({
  clearForms
})
</script>

<template>
  <!-- 使用Teleport将弹窗渲染到body，避免层级问题 -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="auth-modal-mask" @click="handleMaskClick">
        <div class="auth-modal-content">
          <!-- 关闭按钮 -->
          <button class="close-btn" @click="handleClose">
            <CloseIcon />
          </button>

          <!-- 标题 -->
          <div class="auth-header">
            <h2 class="auth-title">{{ isLogin ? '登录账号' : '创建账号' }}</h2>
            <p class="auth-subtitle">{{ isLogin ? '登录以同步您的云端数据' : '注册开始使用云端同步功能' }}</p>
          </div>

          <!-- ==================== 登录表单 ==================== -->
          <form v-if="isLogin" class="auth-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label">邮箱</label>
              <input
                v-model="loginForm.email"
                type="email"
                class="form-input"
                placeholder="请输入邮箱"
                :class="{ 'has-error': loginErrors.email }"
              />
              <span v-if="loginErrors.email" class="error-text">{{ loginErrors.email }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <input
                v-model="loginForm.password"
                type="password"
                class="form-input"
                placeholder="请输入密码"
                :class="{ 'has-error': loginErrors.password }"
              />
              <span v-if="loginErrors.password" class="error-text">{{ loginErrors.password }}</span>
            </div>

            <button type="submit" class="submit-btn">登录</button>

            <div class="switch-text">
              还没有账号？
              <button type="button" class="switch-link" @click="switchMode">立即注册</button>
            </div>
          </form>

          <!-- ==================== 注册表单 ==================== -->
          <form v-else class="auth-form" @submit.prevent="handleRegister">
            <div class="form-group">
              <label class="form-label">昵称</label>
              <input
                v-model="registerForm.nickname"
                type="text"
                class="form-input"
                placeholder="请输入昵称"
                :class="{ 'has-error': registerErrors.nickname }"
              />
              <span v-if="registerErrors.nickname" class="error-text">{{ registerErrors.nickname }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">邮箱</label>
              <input
                v-model="registerForm.email"
                type="email"
                class="form-input"
                placeholder="请输入邮箱"
                :class="{ 'has-error': registerErrors.email }"
              />
              <span v-if="registerErrors.email" class="error-text">{{ registerErrors.email }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <input
                v-model="registerForm.password"
                type="password"
                class="form-input"
                placeholder="请输入密码（至少6位）"
                :class="{ 'has-error': registerErrors.password }"
              />
              <span v-if="registerErrors.password" class="error-text">{{ registerErrors.password }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">确认密码</label>
              <input
                v-model="registerForm.confirmPassword"
                type="password"
                class="form-input"
                placeholder="请再次输入密码"
                :class="{ 'has-error': registerErrors.confirmPassword }"
              />
              <span v-if="registerErrors.confirmPassword" class="error-text">{{ registerErrors.confirmPassword }}</span>
            </div>

            <button type="submit" class="submit-btn">注册</button>

            <div class="switch-text">
              已有账号？
              <button type="button" class="switch-link" @click="switchMode">立即登录</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ==================== 自定义提示弹窗 ==================== -->
    <Transition name="dialog-fade">
      <div v-if="dialog.visible" class="custom-dialog-mask" @click.self="closeDialog">
        <div class="custom-dialog-content">
          <!-- 弹窗标题 -->
          <div class="dialog-header">
            <h3 class="dialog-title">{{ dialog.title }}</h3>
          </div>

          <!-- 弹窗内容 -->
          <div class="dialog-body">
            <p class="dialog-message">{{ dialog.content }}</p>
          </div>

          <!-- 弹窗按钮 -->
          <div class="dialog-footer">
            <!-- 取消按钮 -->
            <button
              v-if="dialog.showCancel"
              type="button"
              class="dialog-btn dialog-btn-cancel"
              @click="dialog.onCancel"
            >
              {{ dialog.cancelText }}
            </button>
            <!-- 确认按钮 -->
            <button
              v-if="dialog.showConfirm"
              type="button"
              class="dialog-btn dialog-btn-confirm"
              @click="dialog.onConfirm"
            >
              {{ dialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ==================== 认证弹窗样式 ==================== */
.auth-modal-mask {
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
  padding: 20px;
}

.auth-modal-content {
  background-color: white;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: modalSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.auth-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.form-input {
  height: 44px;
  padding: 0 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  background-color: white;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #0052D9;
  box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.1);
}

.form-input.has-error {
  border-color: #f5222d;
}

.error-text {
  font-size: 12px;
  color: #f5222d;
}

.submit-btn {
  height: 44px;
  background: linear-gradient(135deg, #0052D9 0%, #003bb5 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

.switch-text {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.switch-link {
  background: none;
  border: none;
  color: #0052D9;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  transition: color 0.2s ease;
}

.switch-link:hover {
  color: #003bb5;
  text-decoration: underline;
}

/* ==================== 自定义提示弹窗样式 ==================== */
.custom-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(4px);
  padding: 20px;
}

.custom-dialog-content {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialogSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  text-align: center;
  margin-bottom: 16px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.dialog-body {
  margin-bottom: 20px;
}

.dialog-message {
  font-size: 14px;
  color: #666;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.dialog-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.dialog-btn-confirm {
  background: linear-gradient(135deg, #0052D9 0%, #003bb5 100%);
  color: white;
}

.dialog-btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.4);
}

.dialog-btn-cancel {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.dialog-btn-cancel:hover {
  background-color: #e8e8e8;
  color: #333;
}

/* ==================== 动画过渡效果 ==================== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .auth-modal-content,
.modal-fade-leave-active .auth-modal-content {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-fade-enter-from .auth-modal-content,
.modal-fade-leave-to .auth-modal-content {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .custom-dialog-content,
.dialog-fade-leave-active .custom-dialog-content {
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dialog-fade-enter-from .custom-dialog-content,
.dialog-fade-leave-to .custom-dialog-content {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* ==================== 手机端适配 ==================== */
@media (max-width: 480px) {
  .auth-modal-content {
    padding: 24px;
  }

  .auth-title {
    font-size: 20px;
  }

  .form-input {
    height: 48px;
  }

  .submit-btn {
    height: 48px;
  }

  .custom-dialog-content {
    padding: 20px;
  }

  .dialog-title {
    font-size: 16px;
  }

  .dialog-message {
    font-size: 13px;
  }

  .dialog-btn {
    height: 44px;
    padding: 0 32px;
  }
}
</style>
