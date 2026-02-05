<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Task, Priority, TaskStatus } from '@/types'
import { cloudStorage } from '@/utils/cloudStorage'

interface RecycledTask extends Task {
  deletedAt?: string
}

interface Props {
  enabled: boolean
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'restore'): void
  (e: 'toggle', enabled: boolean): void
  (e: 'update:visible', value: boolean): void
}>()

const recycledTasks = ref<RecycledTask[]>([])
const selectedTasks = ref<string[]>([])

// 确认对话框状态
const confirmDialog = ref({
  visible: false,
  title: '',
  message: '',
  confirmText: '确定',
  cancelText: '',
  type: 'danger' as 'danger' | 'warning',
  onConfirm: () => {},
  onCancel: () => {}
})

// 加载回收站数据
const loadRecycledTasks = async () => {
  recycledTasks.value = await cloudStorage.getRecycleBin()
}

// 计算属性
const hasTasks = computed(() => recycledTasks.value.length > 0)
const allSelected = computed(() => 
  recycledTasks.value.length > 0 && selectedTasks.value.length === recycledTasks.value.length
)

// 格式化删除时间
const formatDeleteTime = (deletedAt: string) => {
  const date = new Date(deletedAt)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 格式化截止时间显示（只显示到分钟）
const formatDeadlineDisplay = (deadline: string): string => {
  if (!deadline) return ''
  // 如果包含秒，去掉秒
  const parts = deadline.split(':')
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`
  }
  return deadline
}

// 获取剩余保留天数
const getRemainingDays = (deletedAt: string) => {
  const deleteDate = new Date(deletedAt)
  const expireDate = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  const remaining = Math.ceil((expireDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  return Math.max(0, remaining)
}

// 优先级标签
const getPriorityLabel = (priority: Priority) => {
  switch (priority) {
    case Priority.HIGH: return { text: '高', color: '#F53F3F' }
    case Priority.MID: return { text: '中', color: '#FFC53D' }
    case Priority.LOW: return { text: '低', color: '#0052D9' }
    default: return { text: '无', color: '#999' }
  }
}

// 状态标签
const getStatusLabel = (status: TaskStatus) => {
  return status === TaskStatus.FINISHED ? { text: '已完成', color: '#00B42A' } : { text: '未完成', color: '#FF7D00' }
}

// 选择/取消选择
const toggleSelect = (id: string) => {
  const index = selectedTasks.value.indexOf(id)
  if (index > -1) {
    selectedTasks.value.splice(index, 1)
  } else {
    selectedTasks.value.push(id)
  }
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedTasks.value = []
  } else {
    selectedTasks.value = recycledTasks.value.map(t => t.id)
  }
}

// 恢复单个任务
const restoreTask = async (id: string) => {
  await cloudStorage.restoreFromRecycleBin(id)
  await loadRecycledTasks()
  emit('restore')
}

// 恢复选中的任务
const restoreSelected = async () => {
  for (const id of selectedTasks.value) {
    await cloudStorage.restoreFromRecycleBin(id)
  }
  selectedTasks.value = []
  await loadRecycledTasks()
  emit('restore')
}

// 显示确认对话框
const showConfirm = (options: {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning'
  onConfirm: () => void
}) => {
  confirmDialog.value = {
    visible: true,
    title: options.title,
    message: options.message,
    confirmText: options.confirmText || '确定',
    cancelText: options.cancelText === undefined ? '' : options.cancelText,
    type: options.type || 'danger',
    onConfirm: () => {
      confirmDialog.value.visible = false
      options.onConfirm()
    },
    onCancel: () => {
      confirmDialog.value.visible = false
    }
  }
}

// 永久删除单个任务
const permanentDelete = (id: string) => {
  showConfirm({
    title: '永久删除确认',
    message: '确定要永久删除这个任务吗？此操作不可恢复！',
    confirmText: '永久删除',
    cancelText: '取消',
    type: 'danger',
    onConfirm: async () => {
      await cloudStorage.permanentDeleteFromRecycleBin(id)
      await loadRecycledTasks()
    }
  })
}

// 永久删除选中的任务
const permanentDeleteSelected = () => {
  showConfirm({
    title: '批量永久删除确认',
    message: `确定要永久删除选中的 ${selectedTasks.value.length} 个任务吗？此操作不可恢复！`,
    confirmText: '永久删除',
    cancelText: '取消',
    type: 'danger',
    onConfirm: async () => {
      for (const id of selectedTasks.value) {
        await cloudStorage.permanentDeleteFromRecycleBin(id)
      }
      selectedTasks.value = []
      await loadRecycledTasks()
    }
  })
}

// 清空回收站
const clearAll = () => {
  showConfirm({
    title: '清空回收站确认',
    message: '确定要清空回收站吗？所有任务将被永久删除，此操作不可恢复！',
    confirmText: '清空回收站',
    cancelText: '取消',
    type: 'danger',
    onConfirm: async () => {
      await cloudStorage.clearRecycleBin()
      await loadRecycledTasks()
      selectedTasks.value = []
    }
  })
}

onMounted(() => {
  loadRecycledTasks()
})

// 监听visible变化，当变为true时重新加载数据
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    loadRecycledTasks()
  }
})

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="recycle-bin-overlay" @click.self="handleClose">
    <div class="recycle-bin-modal">
      <div class="modal-header">
        <div class="header-left">
          <span class="header-icon">🗑️</span>
          <h2>最近删除</h2>
          <span class="task-count" v-if="hasTasks">({{ recycledTasks.length }})</span>
        </div>
        <div class="header-right">
          <!-- 回收站开关 -->
          <div class="recycle-bin-toggle">
            <span class="toggle-label">回收站</span>
            <label class="switch">
              <input 
                type="checkbox" 
                :checked="props.enabled"
                @change="(e) => emit('toggle', (e.target as HTMLInputElement).checked)"
              />
              <span class="slider"></span>
            </label>
          </div>
          <button class="close-btn" @click="handleClose">✕</button>
        </div>
      </div>

      <div class="modal-body">
        <!-- 批量操作栏 -->
        <div class="batch-actions" v-if="hasTasks">
          <label class="select-all">
            <input 
              type="checkbox" 
              :checked="allSelected"
              @change="toggleSelectAll"
            />
            <span>全选</span>
          </label>
          <div class="action-btns">
            <button 
              class="btn-restore" 
              :disabled="selectedTasks.length === 0"
              @click="restoreSelected"
            >
              <span>↩</span> 恢复选中
            </button>
            <button 
              class="btn-delete" 
              :disabled="selectedTasks.length === 0"
              @click="permanentDeleteSelected"
            >
              <span>✕</span> 永久删除
            </button>
            <button class="btn-clear" @click="clearAll">
              <span>🗑️</span> 清空回收站
            </button>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="task-list" v-if="hasTasks">
          <div 
            v-for="task in recycledTasks" 
            :key="task.id"
            class="task-item"
            :class="{ selected: selectedTasks.includes(task.id) }"
          >
            <div class="item-checkbox">
              <input 
                type="checkbox" 
                :checked="selectedTasks.includes(task.id)"
                @change="toggleSelect(task.id)"
              />
            </div>
            
            <div class="item-content">
              <div class="item-main">
                <span class="task-title">{{ task.title }}</span>
                <span 
                  class="priority-tag"
                  :style="{ backgroundColor: getPriorityLabel(task.priority).color + '20', color: getPriorityLabel(task.priority).color }"
                >
                  {{ getPriorityLabel(task.priority).text }}
                </span>
              </div>
              <div class="item-meta">
                <span class="meta-item category">
                  {{ task.category === 'work' ? '💼 工作' : '👤 个人' }}
                </span>
                <span class="meta-item status" :style="{ color: getStatusLabel(task.status).color }">
                  {{ getStatusLabel(task.status).text }}
                </span>
                <span class="meta-item deadline">
                  📅 截止: {{ formatDeadlineDisplay(task.deadline) }}
                </span>
              </div>
            </div>

            <div class="item-actions">
              <div class="delete-info">
                <span class="delete-time">删除于 {{ task.deletedAt ? formatDeleteTime(task.deletedAt) : '未知' }}</span>
                <span class="remaining-days">保留 {{ task.deletedAt ? getRemainingDays(task.deletedAt) : '0' }} 天</span>
              </div>
              <div class="action-btns">
                <button class="btn-icon-restore" @click="restoreTask(task.id)" title="恢复">
                  ↩
                </button>
                <button class="btn-icon-delete" @click="permanentDelete(task.id)" title="永久删除">
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-else>
          <div class="empty-icon">🗑️</div>
          <p class="empty-title">回收站是空的</p>
          <p class="empty-desc" v-if="props.enabled">删除的任务会在这里保留30天</p>
          <p class="empty-desc" v-else>回收站已关闭，删除的任务将永久删除</p>
        </div>
      </div>

      <div class="modal-footer">
        <p class="tip" v-if="props.enabled">💡 提示：回收站已开启，删除的任务将在30天后自动永久删除</p>
        <p class="tip" v-else style="color: #F53F3F;">⚠️ 提示：回收站已关闭，删除的任务将永久删除，无法恢复！</p>
      </div>
    </div>

    <!-- 自定义确认对话框 -->
    <div v-if="confirmDialog.visible" class="confirm-dialog-overlay" @click.self="confirmDialog.onCancel">
      <div class="confirm-dialog">
        <div class="confirm-dialog-header" :class="confirmDialog.type">
          <span class="confirm-icon">{{ confirmDialog.type === 'danger' ? '⚠️' : '⚡' }}</span>
          <h3>{{ confirmDialog.title }}</h3>
        </div>
        <div class="confirm-dialog-body">
          <p>{{ confirmDialog.message }}</p>
        </div>
        <div class="confirm-dialog-footer">
          <button v-if="confirmDialog.cancelText && confirmDialog.cancelText !== ''" class="btn-cancel" @click="confirmDialog.onCancel">{{ confirmDialog.cancelText }}</button>
          <button class="btn-confirm" :class="confirmDialog.type" @click="confirmDialog.onConfirm">
            {{ confirmDialog.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recycle-bin-overlay {
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
}

.recycle-bin-modal {
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border, #e5e5e5);
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 28px;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.task-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

/* 回收站开关 */
.recycle-bin-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-label {
  font-size: 14px;
  color: white;
  font-weight: 500;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #00B42A;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary, #666);
}

.select-all input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.action-btns {
  display: flex;
  gap: 8px;
}

.btn-restore,
.btn-delete,
.btn-clear {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-restore {
  background-color: #00B42A;
  color: white;
}

.btn-restore:hover:not(:disabled) {
  background-color: #009926;
}

.btn-delete {
  background-color: #F53F3F;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background-color: #d9363e;
}

.btn-clear {
  background-color: #86909c;
  color: white;
}

.btn-clear:hover {
  background-color: #6b7785;
}

.btn-restore:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.task-item:hover {
  background-color: #f0f4f8;
}

.task-item.selected {
  border-color: #0052D9;
  background-color: #f0f7ff;
}

.item-checkbox input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.item-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary, #666);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.delete-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.delete-time {
  font-size: 12px;
  color: var(--text-placeholder, #999);
}

.remaining-days {
  font-size: 11px;
  color: #F53F3F;
  font-weight: 500;
}

.item-actions .action-btns {
  display: flex;
  gap: 6px;
}

.btn-icon-restore,
.btn-icon-delete {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-restore {
  background-color: #00B42A20;
  color: #00B42A;
}

.btn-icon-restore:hover {
  background-color: #00B42A;
  color: white;
}

.btn-icon-delete {
  background-color: #F53F3F20;
  color: #F53F3F;
}

.btn-icon-delete:hover {
  background-color: #F53F3F;
  color: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main, #333);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary, #666);
  margin: 0;
}

.modal-footer {
  padding: 12px 24px;
  background-color: #f8f9fa;
  border-top: 1px solid var(--border, #e5e5e5);
}

.tip {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary, #666);
}

/* 自定义确认对话框 */
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirm-dialog {
  width: 90%;
  max-width: 420px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.confirm-dialog-header.warning {
  background: linear-gradient(135deg, #ffc53d 0%, #ff9c00 100%);
}

.confirm-dialog-header.danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.confirm-icon {
  font-size: 28px;
}

.confirm-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.confirm-dialog-body {
  padding: 24px;
  text-align: center;
}

.confirm-dialog-body p {
  margin: 0;
  font-size: 15px;
  color: var(--text-main, #333);
  line-height: 1.6;
}

.confirm-dialog-footer {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
  justify-content: center;
}

.btn-cancel,
.btn-confirm {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-width: 100px;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: var(--text-secondary, #666);
}

.btn-cancel:hover {
  background-color: #e0e0e0;
}

.btn-confirm {
  color: white;
}

.btn-confirm.danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.btn-confirm.danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
}

.btn-confirm.warning {
  background: linear-gradient(135deg, #ffc53d 0%, #ff9c00 100%);
  box-shadow: 0 4px 12px rgba(255, 197, 61, 0.3);
}

.btn-confirm.warning:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 197, 61, 0.4);
}

/* ========== 手机端适配 ========== */
@media (max-width: 768px) {
  .recycle-bin-modal {
    width: 95%;
    max-height: 90vh;
  }

  .modal-header h3 {
    font-size: 16px;
  }

  .batch-actions {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .action-btns {
    width: 100%;
    justify-content: flex-end;
  }

  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .item-actions {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .delete-info {
    align-items: flex-start;
  }

  /* 确认对话框手机端适配 */
  .confirm-dialog {
    width: 92%;
    max-width: none;
  }

  .confirm-dialog-header {
    padding: 16px 20px;
  }

  .confirm-dialog-header h3 {
    font-size: 16px;
  }

  .confirm-dialog-body {
    padding: 20px;
  }

  .confirm-dialog-footer {
    padding: 0 20px 20px;
    flex-direction: column-reverse;
    gap: 10px;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
    padding: 12px 20px;
  }
}

@media (max-width: 480px) {
  .modal-content {
    padding: 16px;
  }

  .task-title {
    font-size: 14px;
  }

  .task-meta {
    font-size: 11px;
  }
}

</style>
