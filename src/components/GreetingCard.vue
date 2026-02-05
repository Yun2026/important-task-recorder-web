<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 问候语配置 - 浅蓝白融合色调
const greetings = {
  morning: {
    title: '早上好！',
    subtitle: '晨光熹微，新的一天充满希望，元气满满开启美好旅程～',
    icon: '🌅',
    // 清晨：浅蓝白融合色
    gradient: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 30%, #90CAF9 60%, #64B5F6 100%)'
  },
  noon: {
    title: '中午好！',
    subtitle: '忙了一上午啦，记得好好吃午饭，稍作休息，充充电再出发～',
    icon: '☀️',
    // 正午：明亮浅蓝白
    gradient: 'linear-gradient(135deg, #F0F8FF 0%, #E1F5FE 30%, #B3E5FC 60%, #81D4FA 100%)'
  },
  afternoon: {
    title: '下午好！',
    subtitle: '午后阳光正好，愿你抛开疲惫，保持好心情，万事皆顺意～',
    icon: '🌤️',
    // 午后：柔和蓝白
    gradient: 'linear-gradient(135deg, #E8F4F8 0%, #D4EEF9 30%, #B2EBF2 60%, #80DEEA 100%)'
  },
  evening: {
    title: '晚上好！',
    subtitle: '夕阳西下，忙碌的一天结束啦，愿你卸下疲惫，享受轻松惬意的黄昏时光～',
    icon: '🌇',
    // 傍晚：淡紫蓝白
    gradient: 'linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 30%, #B39DDB 60%, #9575CD 100%)'
  },
  night: {
    title: '晚上好！',
    subtitle: '夜深人静，繁星点点，愿你拥有一夜好眠，美梦相伴～',
    icon: '🌙',
    // 深夜：深蓝白融合
    gradient: 'linear-gradient(135deg, #E8EAF6 0%, #C5CAE9 30%, #9FA8DA 60%, #7986CB 100%)'
  }
}

// 获取当前小时
const currentHour = computed(() => new Date().getHours())

// 判断是否夜晚（22点-5点）
const isNight = computed(() => currentHour.value >= 22 || currentHour.value < 5)

// 判断是否傍晚（18点-22点）
const isEvening = computed(() => currentHour.value >= 18 && currentHour.value < 22)

// 获取当前问候语
const currentGreeting = computed(() => {
  const hour = currentHour.value
  
  if (hour >= 5 && hour < 12) {
    return greetings.morning
  } else if (hour >= 12 && hour < 14) {
    return greetings.noon
  } else if (hour >= 14 && hour < 18) {
    return greetings.afternoon
  } else if (hour >= 18 && hour < 22) {
    return greetings.evening
  } else {
    return greetings.night
  }
})

// 生成星星的随机位置和大小
const getStarStyle = (_index: number) => {
  const top = Math.random() * 100
  const left = Math.random() * 100
  const size = Math.random() * 3 + 1
  const delay = Math.random() * 3
  const duration = Math.random() * 2 + 2
  return {
    top: `${top}%`,
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

// 格式化日期
const currentDate = computed(() => {
  const now = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return {
    date: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
    weekday: weekdays[now.getDay()]
  }
})

// 当前时间
const currentTime = ref('')

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  })
}

let timer: ReturnType<typeof setInterval>

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  <div class="greeting-card" :style="{ background: currentGreeting.gradient }">
    <!-- 夜晚星星装饰 -->
    <div v-if="isNight" class="stars">
      <div v-for="n in 20" :key="n" class="star" :style="getStarStyle(n)"></div>
    </div>
    <!-- 傍晚太阳装饰 -->
    <div v-if="isEvening" class="sunset-decoration">
      <div class="sun"></div>
    </div>
    <div class="greeting-content">
      <div class="greeting-left">
        <div class="greeting-icon">{{ currentGreeting.icon }}</div>
        <div class="greeting-text">
          <h1 class="greeting-title">{{ currentGreeting.title }}</h1>
        </div>
      </div>
      <div class="greeting-right">
        <div class="time-display">{{ currentTime }}</div>
        <div class="date-display">
          <span class="date">{{ currentDate.date }}</span>
          <span class="weekday">{{ currentDate.weekday }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.greeting-card {
  width: 100%;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 夜晚星星装饰 */
.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.8);
  animation: twinkle ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 傍晚太阳装饰 */
.sunset-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.sun {
  position: absolute;
  top: 30px;
  right: 40px;
  width: 60px;
  height: 60px;
  background: linear-gradient(180deg, #FFD700 0%, #FF8C00 100%);
  border-radius: 50%;
  box-shadow: 0 0 40px 10px rgba(255, 140, 0, 0.5);
  animation: sunset-glow 4s ease-in-out infinite alternate;
}

@keyframes sunset-glow {
  0% {
    box-shadow: 0 0 40px 10px rgba(255, 140, 0, 0.5);
    transform: translateY(0);
  }
  100% {
    box-shadow: 0 0 60px 20px rgba(255, 100, 0, 0.7);
    transform: translateY(10px);
  }
}

.greeting-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.greeting-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.greeting-icon {
  font-size: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.greeting-text {
  color: white;
}

.greeting-title {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 6px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

.greeting-subtitle {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  opacity: 0.95;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1.4;
}

.greeting-right {
  text-align: left;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-display {
  font-size: 42px;
  font-weight: 700;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

.date-display {
  font-size: 18px;
  font-weight: 500;
  opacity: 0.9;
}

.date {
  margin-right: 12px;
}

</style>
