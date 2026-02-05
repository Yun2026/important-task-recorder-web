<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  isLoggedIn: boolean
  username?: string
  toastMessage?: string
  showToast?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'logout'): void
  (e: 'toastHidden'): void
}>()

const handleLoginClick = () => {
  emit('login')
}

const handleLogoutClick = () => {
  emit('logout')
}

// 滚动状态
const isScrolled = ref(false)

const handleScroll = () => {
  // 当滚动超过 10px 时切换为玻璃态
  isScrolled.value = window.scrollY > 10
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  // 初始检查
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="top-bar" :class="{ 'scrolled': isScrolled }">
    <!-- 科技感光效层 -->
    <div class="light-effect"></div>
    <div class="light-effect-2"></div>
    <div class="light-orbit"></div>
    
    <div class="top-bar-content">
      <div class="logo">
        <span class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
          </svg>
        </span>
          <div class="logo-text-wrapper">
          <span class="logo-text">重要事务记录本</span>
        </div>
      </div>

      <!-- 登录/用户信息区域 -->
      <div class="auth-area">
        <template v-if="isLoggedIn && username">
          <div class="user-info">
            <span class="user-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
            </span>
            <span class="username">{{ username }}</span>
          </div>
          <button class="auth-btn logout" @click="handleLogoutClick">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
            </svg>
            退出
          </button>
        </template>
        <template v-else>
          <button class="auth-btn login" @click="handleLoginClick">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
            登录 / 注册
          </button>
        </template>
      </div>
    </div>
    
    <!-- 底部波浪动画 - 悬停时显示 -->
    <div class="wave-container">
      <div class="wave wave1"></div>
      <div class="wave wave2"></div>
      <div class="wave wave3"></div>
    </div>

    <!-- 顶部提示消息 - 登录/注册成功提示 -->
    <Transition name="toast-slide">
      <div v-if="showToast && toastMessage" class="toast-message">
        <span class="toast-icon">✓</span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.top-bar {
  height: 80px;
  background: linear-gradient(135deg, #0a1628 0%, #1a2a5c 25%, #2d1b69 60%, #461959 100%);
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(45, 27, 105, 0.4), 0 0 40px rgba(70, 25, 89, 0.2);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 滚动后的玻璃态效果 */
.top-bar.scrolled {
  background: rgba(22, 93, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
}

/* 渐变光影微流动效果 */
.top-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(100, 150, 255, 0.1) 50%,
    transparent 100%
  );
  animation: lightFlow 8s ease-in-out infinite;
}

/* 悬停时增强光效 */
.top-bar:hover::before {
  animation: lightFlow 3s ease-in-out infinite;
}

@keyframes lightFlow {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

/* 淡色光效层 */
.light-effect {
  position: absolute;
  top: -50%;
  left: 20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(100, 150, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
  pointer-events: none;
}

.light-effect-2 {
  position: absolute;
  bottom: -50%;
  right: 15%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(138, 43, 226, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite reverse;
  pointer-events: none;
}

/* 环绕光轨 */
.light-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 100px;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(100, 150, 255, 0.1);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.top-bar:hover .light-orbit {
  opacity: 1;
  animation: orbit 10s linear infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, -20px) scale(1.1);
  }
}

@keyframes orbit {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.top-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1920px;
  padding: 0 24px;
  position: relative;
  z-index: 2;
}

/* 登录/用户信息区域 */
.auth-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.user-icon {
  width: 18px;
  height: 18px;
  color: rgba(200, 210, 255, 0.9);
}

.user-icon svg {
  width: 100%;
  height: 100%;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: rgba(224, 231, 255, 0.95);
}

.auth-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.auth-btn.login {
  background: linear-gradient(135deg, #0052D9 0%, #722ED1 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.3);
}

.auth-btn.login:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 82, 217, 0.4);
}

.auth-btn.logout {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(224, 231, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.auth-btn.logout:hover {
  background: rgba(245, 63, 63, 0.2);
  border-color: rgba(245, 63, 63, 0.4);
  color: #ff9999;
}

.auth-btn svg {
  width: 16px;
  height: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-text-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.logo-icon {
  width: 42px;
  height: 42px;
  color: rgba(200, 210, 255, 0.9);
  filter: drop-shadow(0 0 10px rgba(100, 150, 255, 0.5));
  animation: iconGlow 3s ease-in-out infinite;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

@keyframes iconGlow {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(100, 150, 255, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(100, 150, 255, 0.6));
  }
}

.logo-text {
  font-size: 38px;
  font-weight: 800;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 30%, #a5b4fc 60%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  text-shadow: 0 0 30px rgba(100, 150, 255, 0.3);
  line-height: 1;
}

/* 悬停时的文字光效 */
.top-bar:hover .logo-text {
  background: linear-gradient(135deg, #f0f4ff 0%, #dbe4ff 30%, #c7d2fe 60%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 顶部提示消息样式 - 位于标题栏下方居中 */
.toast-message {
  position: absolute;
  top: 85px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(82, 196, 26, 0.5), 0 0 30px rgba(82, 196, 26, 0.2);
  z-index: 1001;
  white-space: nowrap;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toast-icon {
  width: 18px;
  height: 18px;
  background: white;
  color: #52c41a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* 提示消息滑入滑出动画 - 从上方滑入 */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.9);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-15px) scale(0.95);
}

/* 底部波浪动画容器 - 一直播放 */
.wave-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  overflow: hidden;
  opacity: 1;
  pointer-events: none;
}

/* 波浪层 */
.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background-repeat: repeat-x;
  background-position: 0 bottom;
  transform-origin: center bottom;
}

/* 波浪1 - 最外层 */
.wave1 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z' fill='rgba(100,150,255,0.15)'/%3E%3C/svg%3E");
  background-size: 600px 40px;
  animation: waveMove 8s linear infinite;
  opacity: 0.8;
}

/* 波浪2 - 中间层 */
.wave2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,120 L0,120 Z' fill='rgba(138,43,226,0.12)'/%3E%3C/svg%3E");
  background-size: 500px 35px;
  animation: waveMove 6s linear infinite reverse;
  opacity: 0.6;
  bottom: -5px;
}

/* 波浪3 - 最内层 */
.wave3 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,50 C180,90 360,10 600,50 C840,90 1020,10 1200,50 L1200,120 L0,120 Z' fill='rgba(100,200,255,0.1)'/%3E%3C/svg%3E");
  background-size: 700px 30px;
  animation: waveMove 10s linear infinite;
  opacity: 0.4;
  bottom: -8px;
}

@keyframes waveMove {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* ========== 手机端适配 ========== */
@media (max-width: 768px) {
  .top-bar {
    height: 70px;
  }

  .top-bar-content {
    padding: 0 16px;
  }

  .logo-text {
    font-size: 22px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
  }

  /* 手机端简化登录按钮 */
  .auth-area {
    gap: 8px;
  }

  .user-info {
    padding: 4px 10px;
  }

  .username {
    font-size: 12px;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .auth-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .auth-btn svg {
    width: 14px;
    height: 14px;
  }

  /* 手机端隐藏用户图标 */
  .user-icon {
    display: none;
  }

  .wave-container {
    height: 30px;
  }

  .wave1, .wave2, .wave3 {
    background-size: 400px 30px;
  }
}

@media (max-width: 480px) {
  .top-bar {
    height: 60px;
  }

  .top-bar-content {
    padding: 0 12px;
  }

  .logo-text {
    font-size: 18px;
  }

  .logo-icon {
    width: 26px;
    height: 26px;
  }

  .logo {
    gap: 8px;
  }

  /* 小屏手机进一步简化 */
  .auth-btn {
    padding: 5px 10px;
    font-size: 11px;
  }

  .auth-btn svg {
    width: 12px;
    height: 12px;
  }

  .username {
    max-width: 60px;
  }

  .wave-container {
    height: 24px;
  }
}

</style>
