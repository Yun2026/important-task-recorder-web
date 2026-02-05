<script setup lang="ts">
import { ref, watch } from 'vue'
import { Priority, Category, TaskStatus, SortType } from '@/types'

interface Props {
  filter: {
    priority: Priority | ''
    status: TaskStatus | ''
    category: Category | ''
    sort: SortType
    searchKey: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'filterChange', filter: any): void
  (e: 'showRecycleBin'): void
}>()

const localFilter = ref({ ...props.filter })

watch(() => props.filter, (newFilter) => {
  localFilter.value = { ...newFilter }
}, { deep: true })

const handleFilterChange = () => {
  emit('filterChange', localFilter.value)
}
</script>

<template>
  <div class="filter-panel">
    <div class="filter-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          placeholder="搜索事务..."
          :value="localFilter.searchKey"
          @input="(e) => { localFilter.searchKey = (e.target as HTMLInputElement).value; handleFilterChange() }"
          class="search-input"
        />
      </div>

      <div class="filter-group">
        <div class="filter-item">
          <div class="select-wrapper">
            <select v-model="localFilter.priority" @change="handleFilterChange">
              <option value="">所有优先级</option>
              <option :value="Priority.HIGH">高</option>
              <option :value="Priority.MID">中</option>
              <option :value="Priority.LOW">低</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <div class="select-wrapper">
            <select v-model="localFilter.status" @change="handleFilterChange">
              <option value="">所有状态</option>
              <option :value="TaskStatus.UNFINISHED">未完成</option>
              <option :value="TaskStatus.FINISHED">已完成</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <div class="select-wrapper">
            <select v-model="localFilter.category" @change="handleFilterChange">
              <option value="">所有分类</option>
              <option :value="Category.WORK">工作</option>
              <option :value="Category.PERSONAL">个人</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <div class="select-wrapper">
            <select v-model="localFilter.sort" @change="handleFilterChange">
              <option :value="SortType.CREATE_NEW">最新创建</option>
              <option :value="SortType.CREATE_OLD">最早创建</option>
              <option :value="SortType.DEADLINE_NEAR">截止日期近→远</option>
              <option :value="SortType.DEADLINE_FAR">截止日期远→近</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <button class="btn-recycle" @click="$emit('showRecycleBin')">
          <span class="btn-icon">🗑️</span>
          <span>最近删除</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-panel {
  width: 100%;
}

.filter-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-box {
  position: relative;
  flex: 2;
  max-width: none;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--text-placeholder);
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-main);
  background-color: var(--bg-gray);
  transition: all 0.3s ease;
}

.search-input:focus {
  background-color: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(18, 183, 245, 0.1);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 3;
  justify-content: space-between;
}

.filter-item {
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.filter-item::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 0.5cm;
  height: 200%;
  background: linear-gradient(
    135deg,
    transparent,
    rgba(0, 82, 217, 0.6),
    transparent
  );
  transform: rotate(45deg);
  transition: left 1.5s ease;
  pointer-events: none;
  z-index: 1;
}

.filter-item:hover::before {
  left: 150%;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-item select {
  width: 100%;
  height: 38px;
  padding: 0 28px 0 0;
  border: 1px solid #d0d5da;
  border-radius: var(--radius-md);
  color: var(--text-main);
  background: linear-gradient(180deg, #f8f9fa 0%, #e8ecf0 100%);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  text-align-last: center;
  line-height: 36px;
  transition: all 0.3s ease;
  appearance: none;
  -webkit-appearance: none;
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 2px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.filter-item select:hover {
  border-color: #b0b8c0;
  background: linear-gradient(180deg, #ffffff 0%, #f0f4f8 100%);
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.95),
    inset 0 -1px 2px rgba(0, 0, 0, 0.06),
    0 3px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.06);
}

.filter-item select:focus {
  border-color: var(--primary);
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fa 100%);
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.95),
    inset 0 -1px 2px rgba(0, 0, 0, 0.05),
    0 0 0 3px rgba(18, 183, 245, 0.12),
    0 3px 8px rgba(18, 183, 245, 0.15);
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: var(--text-placeholder);
  pointer-events: none;
}

.filter-item select option {
  text-align: center;
  background: linear-gradient(180deg, #fafbfc 0%, #f0f3f5 100%);
  color: var(--text-main);
  font-weight: 500;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
}

.filter-item select option:checked {
  background: linear-gradient(180deg, var(--primary) 0%, #0ea6e0 100%);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.filter-item select:hover {
  border-color: var(--primary);
  background-color: white;
}

.filter-item select:focus {
  border-color: var(--primary);
  background-color: white;
  box-shadow: 0 0 0 3px rgba(18, 183, 245, 0.1);
  outline: none;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: var(--text-placeholder);
  pointer-events: none;
}

.btn-recycle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  white-space: nowrap;
}

.btn-recycle:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.btn-recycle .btn-icon {
  font-size: 14px;
}
</style>
