<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  content: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info' | 'danger'
}

withDefaults(defineProps<Props>(), {
  title: '确认操作',
  confirmText: '确认',
  cancelText: '',
  type: 'warning'
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleMaskClick = () => {
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="visible" class="dialog-mask" @click.self="handleMaskClick">
        <div class="dialog-content">
          <div class="dialog-header">
            <div class="dialog-icon" :class="type">
              <span v-if="type === 'warning'">⚠️</span>
              <span v-else-if="type === 'danger'">🗑️</span>
              <span v-else>ℹ️</span>
            </div>
            <h3 class="dialog-title">{{ title }}</h3>
          </div>
          
          <div class="dialog-body">
            <p class="dialog-message">{{ content }}</p>
          </div>
          
          <div class="dialog-footer">
            <button v-if="cancelText && cancelText !== ''" class="btn-cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button 
              class="btn-confirm" 
              :class="type"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-mask {
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
}

.dialog-content {
  background-color: white;
  border-radius: var(--radius-lg);
  padding: 28px 32px;
  min-width: 360px;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialogSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 12px;
}

.dialog-icon.warning {
  background-color: #FFFBE6;
}

.dialog-icon.danger {
  background-color: #FFF2F0;
}

.dialog-icon.info {
  background-color: #E8F7FF;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.dialog-body {
  margin-bottom: 24px;
}

.dialog-message {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel {
  padding: 10px 24px;
  background-color: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background-color: var(--bg-gray);
  border-color: #d0d5da;
}

.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-confirm.warning {
  background: linear-gradient(135deg, #FFC53D 0%, #FF9C00 100%);
}

.btn-confirm.danger {
  background: linear-gradient(135deg, #F53F3F 0%, #D9363E 100%);
}

.btn-confirm.info {
  background: linear-gradient(135deg, var(--primary) 0%, #0ea6e0 100%);
}

/* Transition animations */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog-content,
.dialog-fade-leave-active .dialog-content {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dialog-fade-enter-from .dialog-content,
.dialog-fade-leave-to .dialog-content {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}
</style>
