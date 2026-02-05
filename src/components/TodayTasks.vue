<script setup lang="ts">
import { computed } from 'vue'
import { Task, Priority, TaskStatus } from '@/types'
import { formatDate, isExpired } from '@/utils/tools'

interface Props {
  tasks: Task[]
}

const props = defineProps<Props>()

// 获取今天的事务（仅 startDate 为今天）
const todayTasks = computed(() => {
  const today = formatDate()
  return props.tasks.filter(task => task.startDate === today)
})

// 今天待完成的事务（startDate 为今天且未完成）
const todayUnfinishedTasks = computed(() => {
  const today = formatDate()
  return props.tasks.filter(task => 
    task.startDate === today && task.status !== TaskStatus.FINISHED
  )
})

// 今天已完成的事务（startDate 为今天且已完成）
const todayCompletedTasks = computed(() => {
  const today = formatDate()
  return props.tasks.filter(task => 
    task.startDate === today && task.status === TaskStatus.FINISHED
  )
})

// 优先级颜色
const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case Priority.HIGH: return '#F53F3F'
    case Priority.MID: return '#FFC53D'
    case Priority.LOW: return '#0052D9'
    default: return '#999'
  }
}

const emit = defineEmits<{
  (e: 'edit', task: Task): void
  (e: 'toggle', id: string): void
  (e: 'exportToday', type: 'xlsx' | 'csv'): void
}>()

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

const handleToggle = (id: string) => {
  emit('toggle', id)
}

const handleEdit = (task: Task) => {
  emit('edit', task)
}

// 导出今天的事务
const handleExportToday = () => {
  emit('exportToday', 'xlsx')
}
</script>

<template>
  <div class="today-tasks-card">
    <div class="today-header">
      <div class="today-title">
        <span class="title-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" fill="currentColor"/>
          </svg>
        </span>
        <span class="title-text">今日事务</span>
      </div>
      <div class="header-actions">
        <div class="today-stats">
          <span class="stat-item">
            <span class="stat-num">{{ todayUnfinishedTasks.length }}</span>
            <span class="stat-label">待完成</span>
          </span>
          <span class="stat-item">
            <span class="stat-num completed">{{ todayCompletedTasks.length }}</span>
            <span class="stat-label">已完成</span>
          </span>
        </div>
        <button class="export-btn" @click="handleExportToday">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
          </svg>
          导出
        </button>
      </div>
    </div>

    <div class="today-content">
      <div v-if="todayTasks.length === 0" class="empty-today">
        <div class="empty-icon-wrapper">
          <div class="sun-container">
            <!-- 旋转的太阳本体和光芒 -->
            <svg class="sun-rotate" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- 太阳 -->
              <circle cx="60" cy="60" r="25" fill="url(#sunGradient)"/>
              <!-- 光芒 -->
              <g stroke="url(#sunGradient)" stroke-width="4" stroke-linecap="round">
                <line x1="60" y1="20" x2="60" y2="10"/>
                <line x1="60" y1="100" x2="60" y2="110"/>
                <line x1="20" y1="60" x2="10" y2="60"/>
                <line x1="100" y1="60" x2="110" y2="60"/>
                <line x1="32" y1="32" x2="25" y2="25"/>
                <line x1="88" y1="88" x2="95" y2="95"/>
                <line x1="88" y1="32" x2="95" y2="25"/>
                <line x1="32" y1="88" x2="25" y2="95"/>
              </g>
              <defs>
                <linearGradient id="sunGradient" x1="30" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#FFD700"/>
                  <stop offset="0.5" stop-color="#FFA500"/>
                  <stop offset="1" stop-color="#FF8C00"/>
                </linearGradient>
              </defs>
            </svg>
            <!-- 不旋转的脸部 -->
            <svg class="sun-face" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- 脸部 -->
              <circle cx="52" cy="55" r="3" fill="#333"/>
              <circle cx="68" cy="55" r="3" fill="#333"/>
              <path d="M52 68 Q60 75 68 68" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <!-- 腮红 -->
              <ellipse cx="45" cy="62" rx="4" ry="2.5" fill="#ffb6c1" opacity="0.6"/>
              <ellipse cx="75" cy="62" rx="4" ry="2.5" fill="#ffb6c1" opacity="0.6"/>
            </svg>
          </div>
        </div>
        <p class="empty-text">今天没有事务，放松一下，心情会更好～</p>
      </div>

      <div v-else class="task-list">
        <div 
          v-for="task in todayTasks" 
          :key="task.id"
          class="today-task-item"
          :class="{ 'task-completed': task.status === TaskStatus.FINISHED }"
        >
          <div class="task-checkbox" @click="handleToggle(task.id)">
            <span :class="['checkbox', { checked: task.status === TaskStatus.FINISHED }]">
              {{ task.status === TaskStatus.FINISHED ? '✓' : '' }}
            </span>
          </div>
          
          <div class="task-info" @click="handleEdit(task)">
            <div class="task-title-row">
              <span class="task-title" :class="{ 'line-through': task.status === TaskStatus.FINISHED }">
                {{ task.title }}
              </span>
              <span 
                class="priority-dot"
                :style="{ backgroundColor: getPriorityColor(task.priority) }"
              ></span>
            </div>
            <div class="task-meta">
              <span class="meta-item" :class="{ 'expired': isExpired(task.deadline) && task.status !== TaskStatus.FINISHED }">
                截止: {{ formatDeadlineDisplay(task.deadline) }}
              </span>
              <span class="meta-item category-tag">
              <svg v-if="task.category === 'work'" class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z" fill="currentColor"/>
              </svg>
              <svg v-else class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z" fill="currentColor"/>
              </svg>
              {{ task.category === 'work' ? '工作' : '个人' }}
            </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.today-tasks-card {
  width: 100%;
  background-color: white;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: var(--bg-gray);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn:hover {
  background-color: var(--border);
}

.today-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  width: 24px;
  height: 24px;
  color: var(--primary);
}

.title-icon svg {
  width: 100%;
  height: 100%;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-icon svg {
  width: 100%;
  height: 100%;
}

.title-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.today-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.stat-num.completed {
  color: var(--priority-low);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.today-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.today-content::-webkit-scrollbar {
  width: 4px;
}

.today-content::-webkit-scrollbar-track {
  background: transparent;
}

.today-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

.empty-today {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: var(--text-placeholder);
}

/* 空状态图标样式 */
.empty-icon-wrapper {
  margin-bottom: 16px;
}

.sun-container {
  position: relative;
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 4px 16px rgba(255, 165, 0, 0.3));
}

/* 旋转的太阳本体和光芒 */
.sun-rotate {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  animation: sunRotate 8s linear infinite;
}

/* 不旋转的脸部 */
.sun-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 不添加旋转动画，保持静止 */
}

@keyframes sunRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 太阳光芒动画 */
.sun-rotate g {
  animation: sunPulse 2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes sunPulse {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.empty-text {
  font-size: 14px;
  margin: 0;
  color: var(--text-secondary);
  text-align: center;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.today-task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background-color: var(--bg-gray);
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.today-task-item:hover {
  background-color: #f0f4f8;
  transform: translateX(4px);
}

.today-task-item.task-completed {
  opacity: 0.6;
}

.task-checkbox {
  flex-shrink: 0;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 2px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  color: white;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background-color: var(--priority-low);
  border-color: var(--priority-low);
}

.task-info {
  flex: 1;
}

.task-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.task-title.line-through {
  text-decoration: line-through;
  color: var(--finished);
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.meta-item.expired {
  color: var(--expired);
  font-weight: 600;
}

.meta-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

/* 分类标签样式 - 与 TaskView 统一 */
.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--purple);
  font-size: 12px;
}

.category-tag .tag-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ========== 手机端适配 ========== */
@media (max-width: 768px) {
  .today-tasks {
    padding: 14px;
  }

  .section-title-today {
    font-size: 16px;
  }

  .section-title-today .icon-svg {
    width: 20px;
    height: 20px;
  }

  .today-content {
    max-height: 280px;
  }

  .task-item-today {
    padding: 10px 12px;
  }

  .task-title-today {
    font-size: 14px;
  }

  .task-meta {
    font-size: 11px;
    gap: 10px;
  }

  .category-tag {
    font-size: 11px;
  }

  .category-tag .tag-icon {
    width: 12px;
    height: 12px;
  }
}

  @media (max-width: 480px) {
  .today-tasks {
    padding: 12px;
  }

  .section-title-today {
    font-size: 15px;
  }

  .today-content {
    max-height: 240px;
  }

  .task-item-today {
    padding: 8px 10px;
  }

  .task-title-today {
    font-size: 13px;
  }
}

</style>
