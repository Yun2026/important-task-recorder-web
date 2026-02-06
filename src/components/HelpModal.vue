<script setup lang="ts">
import { CloseIcon } from 'tdesign-icons-vue-next'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = () => {
  emit('close')
}

const handleMaskClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="help-modal-mask" @click="handleMaskClick">
        <div class="help-modal-content">
          <!-- 关闭按钮 -->
          <button class="close-btn" @click="handleClose">
            <CloseIcon />
          </button>
          
          <!-- 头部 -->
          <div class="help-header">
            <div class="header-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor"/>
              </svg>
            </div>
            <h2 class="help-title">网站说明</h2>
            <p class="help-subtitle">重要事务记录本使用指南</p>
          </div>
          
          <!-- 内容 -->
          <div class="help-body">
            <!-- 欢迎卡片 -->
            <div class="welcome-card">
              <div class="welcome-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                </svg>
              </div>
              <p class="welcome-text">
                欢迎使用重要事务记录本，这是一款高效的任务管理工具，帮你清晰管理关键事务。
              </p>
            </div>
            
            <!-- 核心功能 -->
            <div class="features-section">
              <h3 class="section-title">
                <span class="title-icon">✨</span>
                核心功能
              </h3>
              <div class="feature-cards">
                <div class="feature-card">
                  <div class="feature-icon yellow">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div class="feature-info">
                    <h4 class="feature-name">优先级管理</h4>
                    <p class="feature-desc">高/中/低优先级分类，直观区分任务重要性</p>
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon purple">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div class="feature-info">
                    <h4 class="feature-name">数据安全</h4>
                    <p class="feature-desc">采用加密存储，保护你的隐私数据</p>
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon green">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div class="feature-info">
                    <h4 class="feature-name">专注模式</h4>
                    <p class="feature-desc">支持正计时/倒计时自由切换，可自定义计时时长，背景与字体颜色随心设置，专注办公学习，提升效率</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 隐私保护 -->
            <div class="privacy-section">
              <h3 class="section-title">
                <span class="title-icon">🔒</span>
                隐私保护
              </h3>
              <ul class="privacy-list">
                <li>你的所有事务数据仅存储在你的专属账号下，不会被他人访问</li>
                <li>我们不会收集或共享你的个人信息</li>
              </ul>
            </div>
            
            <!-- 使用提示 -->
            <div class="tips-section">
              <h3 class="section-title">
                <span class="title-icon">💡</span>
                使用提示
              </h3>
              <ul class="tips-list">
                <li>注册账号即可开启云端同步，多端管理更便捷</li>
                <li>点击右下角"+"按钮快速添加新事务</li>
                <li>通过筛选功能快速定位目标事务</li>
              </ul>
            </div>
            
            <!-- 忘记密码提示 -->
            <div class="notice-section">
              <div class="notice-icon">⚠️</div>
              <div class="notice-content">
                <h4>关于忘记密码</h4>
                <p>因技术原因，暂未设置忘记密码功能。请您妥善保管好登录密码，建议将密码记录在安全的地方。</p>
              </div>
            </div>

            <!-- 云端同步提示 -->
            <div class="notice-section">
              <div class="notice-icon">☁️</div>
              <div class="notice-content">
                <h4>关于云端同步</h4>
                <p>因技术调试原因，当前云端同步功能暂不稳定，我们正在全力优化中，待功能完善后将第一时间推送更新通知。</p>
              </div>
            </div>

            <!-- 提醒功能说明 -->
            <div class="notice-section">
              <div class="notice-icon">🔔</div>
              <div class="notice-content">
                <h4>关于消息提醒</h4>
                <p>由于域名安全配置、浏览器适配及移动端技术限制，当前暂不支持消息推送提醒功能，建议您使用系统自带的日历或提醒事项应用设置待办通知。</p>
              </div>
            </div>
          </div>
          
          <!-- 底部 -->
          <div class="help-footer">
            <div class="footer-info">
              <span class="version">重要事务记录本 v1.0</span>
              <span class="divider">|</span>
              <span class="slogan">云端同步 · 数据安全</span>
            </div>
            <button class="confirm-btn" @click="handleClose">关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.help-modal-mask {
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

.help-modal-content {
  background-color: white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
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
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  z-index: 10;
}

.close-btn:hover {
  background-color: var(--bg-gray);
  color: var(--text-main);
}

/* 头部样式 */
.help-header {
  text-align: center;
  padding: 32px 24px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid var(--border);
}

.header-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #0052D9 0%, #003bb5 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(0, 82, 217, 0.3);
}

.header-icon svg {
  width: 32px;
  height: 32px;
}

.help-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 8px 0;
}

.help-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 内容区域 */
.help-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 欢迎卡片 */
.welcome-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f0ff 100%);
  border-radius: 12px;
  border: 1px solid #d6e8ff;
}

.welcome-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0052D9;
  box-shadow: 0 2px 8px rgba(0, 82, 217, 0.15);
}

.welcome-icon svg {
  width: 24px;
  height: 24px;
}

.welcome-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 功能区域 */
.features-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
}

.feature-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.feature-card:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 12px rgba(0, 82, 217, 0.1);
  transform: translateX(4px);
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon svg {
  width: 24px;
  height: 24px;
}

.feature-icon.blue {
  background: linear-gradient(135deg, #e6f0ff 0%, #d6e8ff 100%);
  color: #0052D9;
}

.feature-icon.yellow {
  background: linear-gradient(135deg, #fff8e6 0%, #ffefd6 100%);
  color: #faad14;
}

.feature-icon.green {
  background: linear-gradient(135deg, #e6ffed 0%, #d6f5e0 100%);
  color: #52c41a;
}

.feature-icon.purple {
  background: linear-gradient(135deg, #f0e6ff 0%, #e8d6ff 100%);
  color: #722ed1;
}

.feature-info {
  flex: 1;
}

.feature-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.feature-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* 隐私保护区域 */
.privacy-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.privacy-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.privacy-list li {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.privacy-list li::marker {
  color: var(--primary);
}

/* 使用提示 */
.tips-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tips-list li {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tips-list li::marker {
  color: #faad14;
}

/* 通知区域 */
.notice-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #fff7e6 0%, #fff1e6 100%);
  border-radius: 12px;
  border: 1px solid #ffd8bf;
}

.notice-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notice-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #ad6800;
  margin: 0 0 6px 0;
}

.notice-content p {
  font-size: 13px;
  color: #d48806;
  line-height: 1.5;
  margin: 0;
}

/* 底部 */
.help-footer {
  padding: 20px 24px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-placeholder);
}

.divider {
  color: var(--border);
}

.confirm-btn {
  padding: 10px 32px;
  background: linear-gradient(135deg, #0052D9 0%, #003bb5 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.4);
}

/* Transition animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .help-modal-content,
.modal-fade-leave-active .help-modal-content {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-fade-enter-from .help-modal-content,
.modal-fade-leave-to .help-modal-content {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

/* 手机端适配 */
@media (max-width: 480px) {
  .help-modal-content {
    max-height: 90vh;
    border-radius: 16px;
  }
  
  .help-header {
    padding: 24px 20px 20px;
  }
  
  .header-icon {
    width: 56px;
    height: 56px;
  }
  
  .header-icon svg {
    width: 28px;
    height: 28px;
  }
  
  .help-title {
    font-size: 20px;
  }
  
  .help-body {
    padding: 20px;
    gap: 20px;
  }
  
  .feature-card {
    padding: 12px 14px;
  }
  
  .feature-icon {
    width: 40px;
    height: 40px;
  }
  
  .feature-icon svg {
    width: 20px;
    height: 20px;
  }
  
  .feature-name {
    font-size: 14px;
  }
  
  .feature-desc {
    font-size: 12px;
  }
  
  .help-footer {
    padding: 16px 20px 20px;
  }
  
  .footer-info {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
  
  .divider {
    display: none;
  }
}
</style>
