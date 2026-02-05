<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'show-help'): void
}>()

// 当前时间
const currentTime = ref('')
const currentDate = ref('')
const currentWeekday = ref('')

// 获取时段问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    return '上午好！'
  } else if (hour >= 12 && hour < 14) {
    return '中午好！'
  } else if (hour >= 14 && hour < 18) {
    return '下午好！'
  } else {
    return '晚上好！'
  }
})

// 格式化时间
const updateDateTime = () => {
  const now = new Date()
  
  // 时间 HH:MM:SS
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  })
  
  // 日期 YYYY年MM月DD日
  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  
  // 星期
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  currentWeekday.value = weekdays[now.getDay()]
}

let timer: ReturnType<typeof setInterval>

onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  <div class="datetime-bar">
    <div class="datetime-wrapper">
      <!-- 问候时间组件 - 居中 -->
      <div class="datetime-content">
        <span class="greeting-text">{{ greeting }}</span>
        <span class="datetime-date">{{ currentDate }}</span>
        <span class="datetime-time">{{ currentTime }}</span>
        <span class="datetime-weekday">{{ currentWeekday }}</span>
      </div>

      <!-- 网站说明按钮 - 独立方块，右侧 -->
      <button class="help-btn" @click="emit('show-help')">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor"/>
        </svg>
        <span>网站说明</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.datetime-bar {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(180deg, rgba(10, 22, 40, 0.05) 0%, transparent 100%);
}

/* 外层包装器 - 左右布局 */
.datetime-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  max-width: 1920px;
  margin: 0 auto;
  position: relative;
}

/* 问候时间组件 - 居中 */
.datetime-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 32px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  border: 1px solid rgba(100, 150, 255, 0.15);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

/* 网站说明按钮 - 独立方块，右侧 */
.help-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #0052D9 0%, #722ED1 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.25);
  flex-shrink: 0;
}

.help-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 82, 217, 0.35);
}

.help-btn svg {
  width: 18px;
  height: 18px;
}

.greeting-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
  padding: 4px 12px;
  background: linear-gradient(135deg, #e0e7ff 0%, #dbe4ff 100%);
  border-radius: 16px;
  white-space: nowrap;
}

.datetime-date {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
}

.datetime-time {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
  font-family: 'Roboto Mono', 'Courier New', monospace;
  letter-spacing: 1px;
}

.datetime-weekday {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 4px 12px;
  background: linear-gradient(135deg, #e0e7ff 0%, #dbe4ff 100%);
  border-radius: 12px;
}

/* ========== 手机端适配 ========== */
@media (max-width: 768px) {
  .datetime-bar {
    padding: 12px 16px;
  }

  /* 手机端竖向堆叠 */
  .datetime-wrapper {
    flex-direction: column;
    gap: 12px;
  }

  .datetime-content {
    gap: 10px;
    padding: 10px 20px;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
  }

  /* 网站说明按钮手机端全宽 */
  .help-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 20px;
    font-size: 14px;
  }

  .greeting-text {
    font-size: 13px;
    padding: 3px 10px;
  }

  .datetime-date {
    font-size: 12px;
  }

  .datetime-time {
    font-size: 18px;
    letter-spacing: 0.5px;
  }

  .datetime-weekday {
    font-size: 12px;
    padding: 3px 10px;
  }
}

@media (max-width: 480px) {
  .datetime-bar {
    padding: 10px 12px;
  }

  .datetime-wrapper {
    gap: 10px;
  }

  .datetime-content {
    gap: 6px;
    padding: 8px 12px;
  }

  .help-btn {
    padding: 10px 16px;
    font-size: 13px;
  }

  .help-btn svg {
    width: 16px;
    height: 16px;
  }

  .greeting-text {
    font-size: 11px;
    padding: 2px 8px;
  }

  .datetime-date {
    font-size: 10px;
  }

  .datetime-time {
    font-size: 16px;
  }

  .datetime-weekday {
    font-size: 10px;
    padding: 2px 8px;
  }
}

</style>
