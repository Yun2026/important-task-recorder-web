<script setup lang="ts">
import { computed } from 'vue'

interface Task {
  id: string
  title: string
  deadline: string
  status: string
}

const props = defineProps<{
  tasks: Task[]
}>()

// 计算今天是否有事务
const hasTasksToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return props.tasks?.some(task => {
    const taskDate = task.deadline?.split(' ')[0]
    return taskDate === today && task.status !== 'finished'
  }) || false
})

// 有事务时的底部文案
const busyMessages = [
  { title: '高效工作，专注当下', subtitle: '完成每一个重要目标' },
  { title: '今日事，今日毕', subtitle: '让效率成为你的标签' },
  { title: '全力以赴，不留遗憾', subtitle: '每一分钟都值得珍惜' },
  { title: '专注当下，成就未来', subtitle: '你的努力终将有回报' },
  { title: '时间管理大师', subtitle: '合理规划，事半功倍' }
]

// 无事务时的底部文案
const relaxMessages = [
  { title: '享受生活，放松身心', subtitle: '休息是为了更好地出发' },
  { title: '今日暂无事务', subtitle: '享受这难得的清闲时光' },
  { title: '生活不止工作', subtitle: '放慢脚步，感受美好' },
  { title: '悠闲自在', subtitle: '给自己充充电吧' },
  { title: '宁静致远', subtitle: '静心享受当下' }
]

// 当前底部文案
const currentBottomMessage = computed(() => {
  const messages = hasTasksToday.value ? busyMessages : relaxMessages
  const index = Math.floor(Date.now() / 86400000) % messages.length
  return messages[index]
})
</script>

<template>
  <div class="message-card">
    <!-- 文案区域 -->
    <div class="card-content">
      <p class="message-title">{{ currentBottomMessage.title }}</p>
      <p class="message-subtitle">{{ currentBottomMessage.subtitle }}</p>
    </div>
  </div>
</template>

<style scoped>
.message-card {
  width: 100%;
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  box-sizing: border-box;
}

/* 蓝色背景装饰效果 */
.message-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  animation: shimmer 6s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(10%, 10%) rotate(180deg);
  }
}

.message-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
}

/* 卡片内容 - 白色文字适配蓝色背景 */
.card-content {
  text-align: center;
  color: white;
  position: relative;
  z-index: 5;
}

.message-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.message-subtitle {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* ========== 手机端适配 ========== */
@media (max-width: 768px) {
  .message-card {
    padding: 20px 14px;
    min-height: 100px;
  }

  .message-title {
    font-size: 16px;
  }

  .message-subtitle {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .message-card {
    padding: 16px 12px;
    min-height: 90px;
  }

  .message-title {
    font-size: 15px;
  }

  .message-subtitle {
    font-size: 12px;
  }
}

</style>
