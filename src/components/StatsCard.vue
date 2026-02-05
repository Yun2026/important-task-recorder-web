<script setup lang="ts">
import { computed } from 'vue'
import { Task, Priority, TaskStatus } from '@/types'

interface Props {
  tasks: Task[]
}

const props = defineProps<Props>()

const stats = computed(() => {
  const high = props.tasks.filter(t => t.priority === Priority.HIGH && t.status !== TaskStatus.FINISHED).length
  const mid = props.tasks.filter(t => t.priority === Priority.MID && t.status !== TaskStatus.FINISHED).length
  const low = props.tasks.filter(t => t.priority === Priority.LOW && t.status !== TaskStatus.FINISHED).length
  const completed = props.tasks.filter(t => t.status === TaskStatus.FINISHED).length

  // 统一视觉风格：白色背景图标 + 主色填充圆圈和符号
  return [
    { label: '高优先级', count: high, color: '#F53F3F', iconColor: '#F53F3F', bgColor: '#F53F3F', iconBgColor: '#FFFFFF' },
    { label: '中优先级', count: mid, color: '#FFC53D', iconColor: '#FFC53D', bgColor: '#FFC53D', iconBgColor: '#FFFFFF' },
    { label: '低优先级', count: low, color: '#0052D9', iconColor: '#0052D9', bgColor: '#0052D9', iconBgColor: '#FFFFFF' },
    { label: '已完成', count: completed, color: '#00B42A', iconColor: '#00B42A', bgColor: '#00B42A', iconBgColor: '#FFFFFF' }
  ]
})
</script>

<template>
  <div class="stats-container">
    <div class="stats-grid">
      <div
        v-for="(stat, index) in stats"
        :key="stat.label"
        class="stat-card"
        :style="{ backgroundColor: stat.bgColor }"
      >
        <div class="stat-icon-wrapper" :style="{ backgroundColor: stat.iconBgColor }">
          <!-- 高优先级: 填充圆圈 + 感叹号 -->
          <svg v-if="index === 0" class="stat-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" :fill="stat.iconColor"/>
            <path d="M12 7v5M12 14v1" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <!-- 中优先级: 填充圆圈 + 横线 -->
          <svg v-else-if="index === 1" class="stat-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" :fill="stat.iconColor"/>
            <line x1="7" y1="12" x2="17" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <!-- 低优先级: 填充圆圈 + 向下箭头 -->
          <svg v-else-if="index === 2" class="stat-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" :fill="stat.iconColor"/>
            <path d="M12 15l-4-5h8l-4 5z" fill="white"/>
          </svg>
          <!-- 已完成: 填充圆圈 + 对勾 -->
          <svg v-else class="stat-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" :fill="stat.iconColor"/>
            <path d="M7 12l3 3 7-7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-count">{{ stat.count }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-container {
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.stat-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-svg {
  width: 32px;
  height: 32px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stat-count {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
}

.stat-label {
  font-size: 13px;
  color: #ffffff;
  font-weight: 500;
}

/* ========== 手机端适配 - 2×2网格布局 ========== */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, calc(50% - 5px));
    gap: 10px;
    width: 100%;
  }

  .stat-card {
    padding: 16px 8px;
    gap: 8px;
    width: 100%;
    min-width: 0;
    flex-direction: column;
  }

  .stat-icon-wrapper {
    width: 44px;
    height: 44px;
  }

  .stat-svg {
    width: 24px;
    height: 24px;
  }

  .stat-count {
    font-size: 24px;
  }

  .stat-label {
    font-size: 12px;
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, calc(50% - 4px));
    gap: 8px;
  }

  .stat-card {
    padding: 12px 6px;
    gap: 6px;
  }

  .stat-icon-wrapper {
    width: 38px;
    height: 38px;
  }

  .stat-svg {
    width: 22px;
    height: 22px;
  }

  .stat-count {
    font-size: 22px;
  }

  .stat-label {
    font-size: 11px;
  }
}

</style>
