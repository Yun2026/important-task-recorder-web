<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Task, Priority, Category, ModalType, TaskStatus } from '@/types'
import { generateUUID, formatDate, formatDateTime } from '@/utils/tools'

interface Props {
  visible: boolean
  type: ModalType
  editTask?: Task
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', task: Task): void
}>()

// 获取北京时间（UTC+8）
const getBeijingTime = () => {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + (3600000 * 8))
}

// 表单数据 - 只保留deadline
const form = ref({
  title: '',
  subTitle: '',
  priority: Priority.MID,
  category: Category.WORK,
  deadlineDate: '',
  deadlineTime: '',
  tags: ''
})

// 计算当前北京时间
const beijingNow = computed(() => getBeijingTime())
const currentBeijingDate = computed(() => formatDate(beijingNow.value))
const currentBeijingHour = computed(() => beijingNow.value.getHours())
const currentBeijingMinute = computed(() => beijingNow.value.getMinutes())

// 格式化时间为两位数
const formatTwoDigits = (num: number) => num.toString().padStart(2, '0')

// 重置表单
const resetForm = () => {
  const today = currentBeijingDate.value
  const currentTime = `${formatTwoDigits(currentBeijingHour.value)}:${formatTwoDigits(currentBeijingMinute.value)}`
  form.value = {
    title: '',
    subTitle: '',
    priority: Priority.MID,
    category: Category.WORK,
    deadlineDate: today,
    deadlineTime: currentTime,
    tags: ''
  }
}

// 加载编辑数据
const loadEditData = () => {
  if (!props.editTask) return

  const task = props.editTask
  const deadlineParts = task.deadline.split(' ')
  const date = deadlineParts[0]
  const time = deadlineParts[1] || '18:00'

  form.value = {
    title: task.title,
    subTitle: task.subTitle,
    priority: task.priority,
    category: task.category,
    deadlineDate: date,
    deadlineTime: time,
    tags: task.tags.join(', ')
  }
}

// 监听弹窗显示和编辑任务变化
watch(() => props.visible, (visible) => {
  if (visible) {
    if (props.type === ModalType.CREATE) {
      resetForm()
    } else if (props.editTask) {
      loadEditData()
    }
  }
})

// 同时监听 editTask 变化，确保数据更新
watch(() => props.editTask, (newTask) => {
  if (props.visible && props.type === ModalType.EDIT && newTask) {
    loadEditData()
  }
}, { immediate: true, deep: true })

// 注意：不再自动同步开始和结束日期/时间，允许用户自由设置跨日事务

const handleClose = () => {
  emit('close')
}

const handleSave = () => {
  if (!form.value.title.trim()) {
    alert('请输入事务标题')
    return
  }
  if (!form.value.deadlineDate || !form.value.deadlineTime) {
    alert('请选择开始时间')
    return
  }

  const task: Task = {
    id: props.editTask?.id || generateUUID(),
    title: form.value.title.trim(),
    subTitle: form.value.subTitle.trim(),
    priority: form.value.priority,
    category: form.value.category,
    startDate: form.value.deadlineDate,
    startTime: form.value.deadlineTime,
    endTime: form.value.deadlineTime,
    deadline: `${form.value.deadlineDate} ${form.value.deadlineTime}`,
    tags: form.value.tags.split(',').map(t => t.trim()).filter(t => t),
    status: props.editTask?.status || TaskStatus.UNFINISHED,
    createTime: props.editTask?.createTime || formatDateTime()
  }

  emit('save', task)
}
</script>

<template>
  <div v-if="visible" class="modal-mask" @click.self="handleClose">
    <div class="modal-content slide-in-right">
      <div class="modal-header">
        <h2>{{ type === ModalType.CREATE ? '新建事务' : '编辑事务' }}</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>事务标题 <span class="required">*</span></label>
          <input v-model="form.title" type="text" class="input-normal" placeholder="请输入事务标题" />
        </div>

        <div class="form-group">
          <label>内容/详细</label>
          <textarea v-model="form.subTitle" class="input-normal" rows="2" placeholder="请输入详细描述（可选）"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>优先级</label>
            <select v-model="form.priority" class="input-normal">
              <option :value="Priority.HIGH">高</option>
              <option :value="Priority.MID">中</option>
              <option :value="Priority.LOW">低</option>
            </select>
          </div>

          <div class="form-group">
            <label>分类</label>
            <select v-model="form.category" class="input-normal">
              <option :value="Category.WORK">工作</option>
              <option :value="Category.PERSONAL">个人</option>
            </select>
          </div>
        </div>

        <!-- 开始时间 -->
        <div class="form-group datetime-group">
          <label>开始时间 <span class="required">*</span></label>
          <div class="datetime-row">
            <input v-model="form.deadlineDate" type="date" class="input-normal date-input" />
            <div class="time-picker-wrapper">
              <input
                v-model="form.deadlineTime"
                type="time"
                class="time-picker-input"
                step="60"
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>自定义标签</label>
          <input v-model="form.tags" type="text" class="input-normal" placeholder="用逗号分隔多个标签，例如：重要,紧急" />
          <p class="form-hint">提示：多个标签请用英文逗号分隔</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="handleClose">取消</button>
        <button class="btn-save" @click="handleSave">
          {{ type === ModalType.CREATE ? '创建' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-mask {
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

.modal-content {
  background-color: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 90%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  font-size: 18px;
  color: var(--text-main);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--bg-gray);
  color: var(--text-secondary);
  font-size: 18px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: var(--expired);
  color: white;
}

.modal-body {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.required {
  color: var(--expired);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 14px;
  background-color: white;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary);
  outline: none;
}

.form-group input.invalid {
  border-color: var(--expired);
  background-color: #fff2f0;
}

.form-hint {
  font-size: 12px;
  color: var(--text-placeholder);
  margin-top: 4px;
}

.error-text {
  font-size: 12px;
  color: var(--expired);
  margin-top: 4px;
}

.datetime-group {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.datetime-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.date-input {
  flex: 1;
  min-width: 130px;
}

/* 时间选择器样式 - 圆润边角 + 文字双居中 */
.time-picker-wrapper {
  flex: 1;
  min-width: 110px;
  position: relative;
}

.time-picker-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  color: var(--text-main);
  transition: all 0.2s ease;
  
  /* 文字水平 + 垂直双居中 */
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 移除默认样式 */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.time-picker-input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.1);
}

/* 时间选择器图标自定义 */
.time-picker-input::-webkit-calendar-picker-indicator {
  position: absolute;
  right: 8px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.time-picker-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* 滑动时间选择器样式（已废弃，保留用于兼容） */
.time-slider-container {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-display {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
  font-family: 'JetBrains Mono', monospace;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f0ff 100%);
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid var(--primary-light);
  box-shadow: inset 0 2px 4px rgba(0, 82, 217, 0.1);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slider-separator {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  padding: 0 4px;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-placeholder);
  padding: 0 4px;
}

.time-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 10px;
  border-radius: 10px;
  background: linear-gradient(90deg, #e8e8e8 0%, #f0f0f0 100%);
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-slider:hover {
  background: linear-gradient(90deg, #e0e0e0 0%, #e8e8e8 100%);
}

.time-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0052D9 0%, #0066ff 100%);
  cursor: grab;
  box-shadow: 0 3px 10px rgba(0, 82, 217, 0.4), 0 0 0 4px rgba(0, 82, 217, 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid white;
}

.time-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 14px rgba(0, 82, 217, 0.5), 0 0 0 6px rgba(0, 82, 217, 0.15);
}

.time-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0, 82, 217, 0.4), 0 0 0 3px rgba(0, 82, 217, 0.2);
}

.time-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0052D9 0%, #0066ff 100%);
  cursor: grab;
  box-shadow: 0 3px 10px rgba(0, 82, 217, 0.4), 0 0 0 4px rgba(0, 82, 217, 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid white;
}

.time-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 14px rgba(0, 82, 217, 0.5), 0 0 0 6px rgba(0, 82, 217, 0.15);
}

.time-slider::-moz-range-thumb:active {
  cursor: grabbing;
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0, 82, 217, 0.4), 0 0 0 3px rgba(0, 82, 217, 0.2);
}

/* 分钟滑块更紧凑 */
.time-slider.minute::-webkit-slider-thumb {
  width: 22px;
  height: 22px;
}

.time-slider.minute::-moz-range-thumb {
  width: 22px;
  height: 22px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.btn-cancel {
  padding: 8px 20px;
  background-color: white;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
}

.btn-cancel:hover {
  background-color: var(--bg-gray);
}

.btn-save {
  padding: 8px 20px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
}

.btn-save:hover {
  background-color: #0ea6e0;
}

  @media (max-width: 768px) {
    .modal-content {
      width: 92%;
      max-width: none;
      max-height: 85vh;
      padding: 16px;
    }

    .modal-header h2 {
      font-size: 16px;
    }

    .form-group {
      margin-bottom: 12px;
    }

    .datetime-group {
      padding: 10px;
    }

    .datetime-row {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
    }

    .date-input {
      min-width: auto;
      width: 100%;
    }

    .time-picker {
      width: 100%;
      justify-content: center;
    }

    .modal-footer {
      flex-direction: column-reverse;
      gap: 10px;
    }

    .btn-cancel,
    .btn-save {
      width: 100%;
      padding: 12px 20px;
    }
  }
</style>
