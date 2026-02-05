<script setup lang="ts">
import { ref } from 'vue'
import { Task, Priority, TaskStatus } from '@/types'
import { isExpired, highlightKeyword } from '@/utils/tools'
import ConfirmDialog from './ConfirmDialog.vue'

interface TaskViewProps {
  tasks: Task[]
  viewType: 'list' | 'grid'
  searchKey: string
  recycleBinEnabled?: boolean
  focusMode?: boolean
  focusedTaskId?: string | null
}

const props = withDefaults(defineProps<TaskViewProps>(), {
  recycleBinEnabled: true,
  focusMode: false,
  focusedTaskId: null
})

const emit = defineEmits<{
  (e: 'toggleStatus', id: string): void
  (e: 'edit', task: Task): void
  (e: 'delete', id: string): void
  (e: 'refresh'): void
  (e: 'enterFocus', taskId: string): void
}>()

// 确认弹窗状态
const confirmVisible = ref(false)
const confirmTitle = ref('确认删除')
const confirmContent = ref('')
const deleteId = ref('')
const confirmType = ref<'warning' | 'danger' | 'info'>('danger')

// 动画状态管理
const completingTasks = ref<Set<string>>(new Set())
const undoingTasks = ref<Set<string>>(new Set())

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case Priority.HIGH: return '#F53F3F'
    case Priority.MID: return '#FFC53D'
    case Priority.LOW: return '#0052D9'
    default: return '#999'
  }
}

const handleToggleStatus = (id: string) => {
  const task = props.tasks.find(t => t.id === id)
  if (!task) return
  
  if (task.status === TaskStatus.UNFINISHED) {
    // 标记完成动画（视觉反馈，不阻塞）
    completingTasks.value.add(id)
    setTimeout(() => {
      completingTasks.value.delete(id)
    }, 800)
  } else {
    // 撤销动画 - 蓝色平行四边形滑行动画
    undoingTasks.value.add(id)
    setTimeout(() => {
      undoingTasks.value.delete(id)
    }, 600)
  }
  
  // 立即更新状态
  emit('toggleStatus', id)
  
  // 触发刷新统计
  emit('refresh')
}

const handleEdit = (task: Task) => {
  emit('edit', task)
}

const handleDelete = (id: string) => {
  const task = props.tasks.find(t => t.id === id)
  deleteId.value = id
  
  if (props.recycleBinEnabled) {
    confirmContent.value = task 
      ? `确定要删除事务「${task.title}」吗？删除后可在最近删除中30天内找回。`
      : '确定要删除这个事务吗？删除后可在最近删除中30天内找回。'
  } else {
    confirmContent.value = task 
      ? `确定要删除事务「${task.title}」吗？删除后将永久删除，无法恢复！`
      : '确定要删除这个事务吗？删除后将永久删除，无法恢复！'
  }
  
  confirmType.value = 'danger'
  confirmVisible.value = true
}

const confirmDelete = () => {
  emit('delete', deleteId.value)
  confirmVisible.value = false
}

const cancelDelete = () => {
  confirmVisible.value = false
  deleteId.value = ''
}

// 专注模式已移除

// 格式化完整日期时间（只显示到分钟）
const formatDateTime = (dateStr: string, timeStr: string) => {
  // 如果时间包含秒，去掉秒
  const timeWithoutSeconds = timeStr ? timeStr.split(':').slice(0, 2).join(':') : ''
  return `${dateStr} ${timeWithoutSeconds}`
}

</script>

<template>
  <!-- PC端平铺视图 -->
  <div v-if="tasks.length > 0 && viewType === 'list'" class="task-list">
    <div
      v-for="(task, index) in tasks"
      :key="task.id"
      class="task-card"
      :data-task-id="task.id"
      :class="{ 
        'task-completed': task.status === TaskStatus.FINISHED,
        'is-completing': completingTasks.has(task.id),
        'is-undoing': undoingTasks.has(task.id),
        'task-focused': focusMode && focusedTaskId === task.id,
        'task-dimmed': focusMode && focusedTaskId !== task.id
      }"
      :style="{ 
        borderLeftColor: getPriorityColor(task.priority),
        animationDelay: `${index * 0.05}s`
      }"
      @click="focusMode && focusedTaskId !== task.id ? null : null"
    >
      <!-- 圆形选择框 - 强制绑定点击事件，确保100%响应 -->
      <div class="task-selector" @click.stop.prevent="handleToggleStatus(task.id)">
        <div 
          class="selector-circle"
          :class="{ 
            checked: task.status === TaskStatus.FINISHED,
            'is-completing': completingTasks.has(task.id),
            'is-undoing': undoingTasks.has(task.id)
          }"
          :title="task.status === TaskStatus.FINISHED ? '点击撤销完成' : '点击标记完成'"
        >
          <span v-if="task.status === TaskStatus.FINISHED" class="check-icon">✓</span>
        </div>
      </div>

      <div class="task-main">
        <div class="task-header-row">
          <div class="title-wrapper">
            <h3 
              class="task-title"
              :class="{ 'task-completed': task.status === TaskStatus.FINISHED }"
              v-html="highlightKeyword(task.title, searchKey)"
            ></h3>
            <p 
              v-if="task.subTitle"
              class="task-subtitle"
              :class="{ 'task-completed': task.status === TaskStatus.FINISHED }"
              v-html="highlightKeyword(task.subTitle, searchKey)"
            ></p>
          </div>
          <!-- 图标靠右竖排 -->
          <div class="task-actions-vertical">
            <button class="icon-btn-vertical edit" @click="handleEdit(task)" title="编辑">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.26 3.6L20.4 10.74C20.79 11.13 20.79 11.76 20.4 12.15L12.15 20.4C11.94 20.61 11.66 20.72 11.37 20.72H4.23C3.56 20.72 3 20.16 3 19.49V12.35C3 12.06 3.11 11.78 3.32 11.57L11.57 3.32C11.96 2.93 12.59 2.93 12.98 3.32L13.26 3.6ZM11.37 5.69L5.28 11.78V18.14H11.64L17.73 12.05L11.37 5.69Z" fill="currentColor"/>
              </svg>
            </button>
            <button class="icon-btn-vertical delete" @click="handleDelete(task.id)" title="删除">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 信息行：开始时间 + 分类 -->
        <div class="task-info-row">
          <span class="info-item">
            <svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
            </svg>
            {{ formatDateTime(task.startDate, task.startTime) }}
          </span>
          <span class="info-item category">
            <svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path v-if="task.category === 'work'" d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z" fill="currentColor"/>
              <path v-else d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z" fill="currentColor"/>
            </svg>
            {{ task.category === 'work' ? '工作' : '个人' }}
          </span>
        </div>

        <div v-if="task.tags.length > 0" class="task-tags">
          <span v-for="tag in task.tags" :key="tag" class="tag-item" :class="{ 'task-completed': task.status === TaskStatus.FINISHED }">{{ tag }}</span>
        </div>
      </div>
      
      <!-- 撤销动画 -->
      <div 
        v-if="undoingTasks.has(task.id)"
        class="undo-line-container"
      >
        <div class="undo-line"></div>
      </div>
    </div>
  </div>

  <!-- 方块视图 -->
  <div v-else-if="tasks.length > 0" class="task-grid" :class="{ 'focus-mode-active': focusMode }">
    <div
      v-for="(task, index) in tasks"
      :key="task.id"
      class="task-card-grid"
      :class="{ 
        'task-finished': task.status === TaskStatus.FINISHED,
        'task-expired': task.status !== TaskStatus.FINISHED && isExpired(task.deadline),
        'task-focused': focusMode && focusedTaskId === task.id,
        'task-dimmed': focusMode && focusedTaskId !== task.id
      }"
      :style="{ 
        borderLeftColor: getPriorityColor(task.priority),
        animationDelay: `${index * 0.05}s`
      }"
    >
      <div class="card-main">
        <div class="card-checkbox" @click="handleToggleStatus(task.id)">
          <span :class="['checkbox', { checked: task.status === TaskStatus.FINISHED }]">
            {{ task.status === TaskStatus.FINISHED ? '✓' : '' }}
          </span>
        </div>
        
        <div class="card-content">
          <h3 
            class="card-title"
            :class="{ 'line-through': task.status === TaskStatus.FINISHED }"
            v-html="highlightKeyword(task.title, searchKey)"
          ></h3>
          
          <p 
            v-if="task.subTitle"
            class="card-subtitle"
            v-html="highlightKeyword(task.subTitle, searchKey)"
          ></p>

          <!-- 信息行：开始时间 + 分类 -->
          <div class="card-info-row">
            <span class="card-info-item">
              <svg class="card-info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
              </svg>
              {{ formatDateTime(task.startDate, task.startTime) }}
            </span>
            <span class="card-info-item category">
              <svg class="card-info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path v-if="task.category === 'work'" d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z" fill="currentColor"/>
                <path v-else d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z" fill="currentColor"/>
              </svg>
              {{ task.category === 'work' ? '工作' : '个人' }}
            </span>
          </div>

          <div v-if="task.tags.length > 0" class="card-tags">
            <span v-for="tag in task.tags" :key="tag" class="card-tag">{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- 卡片操作按钮 -->
      <div class="card-actions-vertical">
        <button class="card-icon-btn edit" @click="handleEdit(task)" title="编辑">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.26 3.6L20.4 10.74C20.79 11.13 20.79 11.76 20.4 12.15L12.15 20.4C11.94 20.61 11.66 20.72 11.37 20.72H4.23C3.56 20.72 3 20.16 3 19.49V12.35C3 12.06 3.11 11.78 3.32 11.57L11.57 3.32C11.96 2.93 12.59 2.93 12.98 3.32L13.26 3.6ZM11.37 5.69L5.28 11.78V18.14H11.64L17.73 12.05L11.37 5.69Z" fill="currentColor"/>
          </svg>
        </button>
        <button class="card-icon-btn delete" @click="handleDelete(task.id)" title="删除">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- 自定义确认弹窗 -->
  <ConfirmDialog
    :visible="confirmVisible"
    :title="confirmTitle"
    :content="confirmContent"
    :type="confirmType"
    confirm-text="确认删除"
    cancel-text="取消"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<style scoped>
.task-list {
  padding: 0 0 20px;
}

.task-card {
  display: flex;
  background-color: white;
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-radius: var(--radius-lg);
  margin-bottom: 12px;
  transition: all 0.3s ease;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  min-height: 80px;
}

.task-card.task-completed {
  opacity: 0.6;
  background-color: #f5f5f5;
  border-color: #d9d9d9;
}

.task-card.task-completed .task-main {
  filter: grayscale(0.5);
}

.task-card.task-completed .task-title,
.task-card.task-completed .task-subtitle {
  color: #999;
}

.task-card.task-completed .task-title {
  text-decoration: line-through;
}

.task-card.task-completed .task-subtitle {
  text-decoration: line-through;
}

/* 圆形选择框样式 - 强制响应点击 */
.task-selector {
  display: flex;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.selector-circle {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: white;
  flex-shrink: 0;
  pointer-events: none;
}

.task-selector:active .selector-circle {
  transform: scale(0.9);
}

.selector-circle:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 82, 217, 0.15);
}

.selector-circle.checked {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  border-color: #52c41a;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.4);
  animation: checkBounce 0.3s ease;
}

@keyframes checkBounce {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.selector-circle.is-completing {
  animation: completingPulse 0.3s ease;
}

@keyframes completingPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(82, 196, 26, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
  }
}

.check-icon {
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  animation: checkPop 0.2s ease;
}

@keyframes checkPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 已完成状态样式 - 有内容才划横线，横线只划到内容最大长度 */
.task-title.task-completed {
  color: #999999 !important;
  text-decoration: line-through;
  text-decoration-thickness: 2px;
  display: inline-block;
}

.task-subtitle.task-completed {
  color: #999999 !important;
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  display: inline-block;
}

.tag-item.task-completed {
  color: #999999;
}

/* 空内容时不划横线 */
.task-title.task-completed:empty,
.task-subtitle.task-completed:empty {
  text-decoration: none;
}

.task-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.task-main {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.title-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  line-height: 1.4;
}

.task-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.task-info-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.info-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.info-item.expired {
  color: #f53f3f;
}

.info-item.category {
  color: var(--purple);
}



.info-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.expired-tag {
  color: #f53f3f;
  font-weight: 600;
  font-size: 11px;
  margin-left: 4px;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  padding: 2px 8px;
  background-color: var(--bg-gray);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--text-secondary);
}

/* 图标靠右竖排样式 - 垂直居中 */
.task-actions-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  align-self: center;
  justify-content: center;
  height: 100%;
  min-height: 60px;
}

.icon-btn-vertical {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.icon-btn-vertical svg {
  width: 16px;
  height: 16px;
}

.icon-btn-vertical.edit {
  color: #0052d9;
}

.icon-btn-vertical.edit:hover {
  background: #e6f0ff;
  border-color: #0052d9;
}

.icon-btn-vertical.focus {
  color: white;
  background: linear-gradient(135deg, #0052d9, #0066ff);
  border-color: #0052d9;
}

.icon-btn-vertical.focus:hover {
  background: linear-gradient(135deg, #0040b3, #0052d9);
  border-color: #0040b3;
  transform: scale(1.1);
}

.icon-btn-vertical.delete {
  color: #f53f3f;
}

.icon-btn-vertical.delete:hover {
  background: #fff2f0;
  border-color: #f53f3f;
}

/* 撤销动画 - 蓝色平行四边形从左到右滑行动画 */
.undo-line-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 100;
}

.undo-line {
  position: absolute;
  top: 0;
  left: -100px;
  width: 80px;
  height: 100%;
  background: #0052D9;
  transform: skewX(-15deg);
  animation: undoSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes undoSlide {
  0% {
    left: -100px;
  }
  100% {
    left: calc(100% + 40px);
  }
}

/* 已完成状态动画 - 两条灰色横线划过标题和内容 */
.task-card.is-completing .task-title,
.task-card.is-completing .task-subtitle {
  position: relative;
}

.task-card.is-completing .task-title::after,
.task-card.is-completing .task-subtitle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: #999;
  transform: translateY(-50%) scaleX(0);
  transform-origin: left center;
  animation: strikeThrough 0.4s ease-out forwards;
  pointer-events: none;
}

.task-card.is-completing .task-title::after {
  animation-delay: 0.1s;
}

.task-card.is-completing .task-subtitle::after {
  animation-delay: 0.25s;
}

@keyframes strikeThrough {
  0% {
    transform: translateY(-50%) scaleX(0);
  }
  100% {
    transform: translateY(-50%) scaleX(1);
  }
}

/* 标题和副标题需要相对定位以容纳横线 */
.task-title,
.task-subtitle {
  position: relative;
}

/* 方块视图 */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.task-card-grid {
  display: flex;
  background-color: white;
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-radius: var(--radius-lg);
  padding: 12px;
  transition: all 0.3s ease;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.task-card-grid.task-finished {
  opacity: 0.7;
}

.task-card-grid.task-finished .card-main {
  filter: grayscale(0.3);
}

.task-card-grid:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-main {
  flex: 1;
  display: flex;
  gap: 10px;
  min-width: 0;
}

.card-checkbox {
  flex-shrink: 0;
  padding-top: 2px;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  color: white;
  transition: all 0.3s ease;
  background-color: white;
}

.checkbox:hover {
  border-color: var(--primary);
}

.checkbox.checked {
  background: linear-gradient(135deg, #00B42A 0%, #00a854 100%);
  border-color: #00B42A;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  line-height: 1.4;
}

.card-title.line-through {
  text-decoration: line-through;
  color: #999;
}

.card-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.card-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-secondary);
}

.card-info-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.card-info-item.expired {
  color: #f53f3f;
}

.card-info-item.category {
  color: var(--purple);
}

.card-info-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.card-tag {
  padding: 2px 8px;
  background-color: var(--bg-gray);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--text-secondary);
}

/* 方块视图操作按钮 */
.card-actions-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  align-self: center;
  margin-left: 8px;
}

.card-icon-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-icon-btn svg {
  width: 14px;
  height: 14px;
}

.card-icon-btn.edit {
  color: #0052d9;
}

.card-icon-btn.edit:hover {
  background: #e6f0ff;
  border-color: #0052d9;
}

.card-icon-btn.delete {
  color: #f53f3f;
}

.card-icon-btn.focus {
  color: white;
  background: linear-gradient(135deg, #0052d9, #0066ff);
  border-color: #0052d9;
}

.card-icon-btn.focus:hover {
  background: linear-gradient(135deg, #0040b3, #0052d9);
  border-color: #0040b3;
  transform: scale(1.1);
}

.card-icon-btn.delete:hover {
  background: #fff2f0;
  border-color: #f53f3f;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 手机端适配 - 竖向流式布局 ========== */
@media (max-width: 768px) {
  /* 任务列表 - 全宽显示 */
  .task-list {
    padding: 0;
    width: 100%;
  }

  .task-card {
    margin-bottom: 10px;
    min-height: auto;
    width: 100%;
    box-sizing: border-box;
  }

  /* 任务主体内容 - 竖向堆叠 */
  .task-main {
    padding: 12px;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  /* 标题行 - 左侧内容占满，右侧按钮固定 */
  .task-header-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .title-wrapper {
    flex: 1;
    min-width: 0;
    gap: 4px;
  }

  .task-title {
    font-size: 15px;
    line-height: 1.4;
    word-break: break-all;
  }

  .task-subtitle {
    font-size: 12px;
    line-height: 1.4;
    word-break: break-all;
  }

  /* 信息行 - 竖向排列 */
  .task-info-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    font-size: 12px;
    width: 100%;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }

  .info-icon {
    width: 14px;
    height: 14px;
  }

  /* 标签区域 */
  .task-tags {
    width: 100%;
    gap: 6px;
  }

  /* 选择器区域 */
  .task-selector {
    padding: 0 8px;
    flex-shrink: 0;
  }

  .selector-circle {
    width: 20px;
    height: 20px;
  }

  /* 操作按钮 - 右侧竖向 */
  .task-actions-vertical {
    gap: 6px;
    flex-shrink: 0;
  }

  .icon-btn-vertical {
    width: 28px;
    height: 28px;
  }

  .icon-btn-vertical svg {
    width: 14px;
    height: 14px;
  }

  /* 方块视图 - 手机端单列 */
  .task-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 0;
    width: 100%;
  }

  .task-card-grid {
    padding: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .card-main {
    flex-direction: column;
    gap: 8px;
  }

  .card-content {
    gap: 6px;
    width: 100%;
  }

  .card-title {
    font-size: 15px;
  }

  .card-subtitle {
    font-size: 13px;
  }

  /* 卡片信息行竖向 */
  .card-info-row {
    flex-direction: column;
    align-items: flex-start;
    font-size: 12px;
    gap: 4px;
  }

  .card-info-icon {
    width: 14px;
    height: 14px;
  }

  .card-actions-vertical {
    gap: 6px;
  }

  .card-icon-btn {
    width: 28px;
    height: 28px;
  }

  .card-icon-btn svg {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 480px) {
  .task-card {
    margin-bottom: 8px;
  }

  .task-main {
    padding: 10px;
  }

  .task-title {
    font-size: 14px;
  }

  .task-info-row {
    gap: 5px;
  }

  .info-item {
    font-size: 11px;
  }

  .tag-item {
    font-size: 11px;
    padding: 2px 8px;
  }

  .task-actions-vertical {
    gap: 4px;
  }

  .icon-btn-vertical {
    width: 26px;
    height: 26px;
  }
}

/* ========== 专注模式样式 ========== */

/* 专注模式激活时的事务卡片样式 */
.task-list.focus-mode-active .task-card,
.task-grid.focus-mode-active .task-card-grid {
  transition: all 0.4s ease;
}

/* 被聚焦的事务卡片 - 高亮显示 */
.task-card.task-focused,
.task-card-grid.task-focused {
  opacity: 1 !important;
  transform: scale(1.02);
  box-shadow: 0 0 0 4px #0052D9, 0 8px 32px rgba(0, 82, 217, 0.3) !important;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0f7ff 100%) !important;
  z-index: 10;
  position: relative;
}

/* 变暗的事务卡片 - 80%透明度并禁用交互 */
.task-card.task-dimmed,
.task-card-grid.task-dimmed {
  opacity: 0.2;
  pointer-events: none;
  filter: grayscale(60%);
}

/* 专注模式下禁用事务卡片的hover效果 */
.task-list.focus-mode-active .task-card.task-dimmed:hover,
.task-grid.focus-mode-active .task-card-grid.task-dimmed:hover {
  transform: none;
  box-shadow: none;
}

/* 专注模式下聚焦卡片的内部元素高亮 */
.task-card.task-focused .task-title,
.task-card-grid.task-focused .card-title {
  color: #0052D9;
  font-weight: 700;
}

.task-card.task-focused .task-subtitle,
.task-card-grid.task-focused .card-subtitle {
  color: #003bb5;
}

/* 专注模式动画 */
@keyframes focusPulse {
  0%, 100% {
    box-shadow: 0 0 0 4px #0052D9, 0 8px 32px rgba(0, 82, 217, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px #0052D9, 0 12px 40px rgba(0, 82, 217, 0.4);
  }
}

.task-card.task-focused,
.task-card-grid.task-focused {
  animation: focusPulse 2s ease-in-out infinite;
}
</style>
