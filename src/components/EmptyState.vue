<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  totalTasks: number
  filter?: {
    priority: string
    status: string
    category: string
    searchKey: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  totalTasks: 0,
  filter: () => ({
    priority: '',
    status: '',
    category: '',
    searchKey: ''
  })
})

// 计算空数据文案
const emptyMessage = computed(() => {
  // 全局无事务
  if (props.totalTasks === 0) {
    return '暂无事务，点击加号按钮创建新事务吧'
  }

  // 有全局事务但被筛选后无结果，动态拼接文案
  const { priority, status, category } = props.filter

  // 获取分类文本
  const categoryText = category === 'work' ? '工作' : category === 'personal' ? '个人' : ''

  // 获取优先级文本
  const priorityText = priority === 'high' ? '高优先级' : priority === 'mid' ? '中优先级' : priority === 'low' ? '低优先级' : ''

  // 获取状态文本
  const statusText = status === 'finished' ? '已完成' : status === 'unfinished' ? '未完成' : ''

  // 拼接文案：分类 + 优先级 + 状态
  let parts: string[] = []
  if (categoryText) parts.push(categoryText)
  if (priorityText) parts.push(priorityText)
  if (statusText) parts.push(statusText)

  // 构建最终文案
  if (parts.length === 0) {
    return '暂无符合条件的事务'
  }

  // 格式：暂无{分类}{优先级}{状态}事务
  return `暂无${parts.join('')}${parts.length === 1 && categoryText ? '类' : ''}事务`
})

// 注意：totalTasks 用于计算空状态提示，后续可扩展显示创建引导
</script>

<template>
  <div v-if="visible" class="empty-state">
    <div class="empty-icon">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
      </svg>
    </div>
    <p class="empty-main-text">{{ emptyMessage }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background-color: var(--bg-gray);
  border-radius: var(--radius-lg);
  margin-top: 20px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
  color: var(--text-placeholder);
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-state p {
  font-size: 18px;
  color: var(--text-placeholder);
  margin: 8px 0;
  text-align: center;
  font-weight: 500;
}

.empty-hint {
  font-size: 14px;
  color: var(--text-secondary);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
