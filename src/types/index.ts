// 优先级枚举
export enum Priority {
  HIGH = 'high',
  MID = 'mid',
  LOW = 'low'
}

// 分类枚举
export enum Category {
  WORK = 'work',
  PERSONAL = 'personal'
}

// 状态枚举
export enum TaskStatus {
  UNFINISHED = 'unfinished',
  FINISHED = 'finished'
}

// 排序类型枚举
export enum SortType {
  CREATE_NEW = 'createNew',
  CREATE_OLD = 'createOld',
  DEADLINE_NEAR = 'deadlineNear',
  DEADLINE_FAR = 'deadlineFar'
}

// 视图类型枚举
export enum ViewType {
  LIST = 'list',
  GRID = 'grid'
}

// 事务核心接口
export interface Task {
  id: string
  title: string
  subTitle: string
  priority: Priority
  category: Category
  startDate: string
  startTime: string
  endTime: string
  deadline: string
  tags: string[]
  status: TaskStatus
  createTime: string
  focusTime?: number // 专注时间（秒）
}

// 筛选条件接口
export interface FilterCondition {
  priority: Priority | ''
  status: TaskStatus | ''
  category: Category | ''
  sort: SortType
  searchKey: string
}

// 弹窗操作类型
export enum ModalType {
  CREATE = 'create',
  EDIT = 'edit'
}

// 弹窗状态接口
export interface ModalState {
  visible: boolean
  type: ModalType
  editTask?: Task
}
