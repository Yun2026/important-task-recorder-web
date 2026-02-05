import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Task, Priority, Category, TaskStatus } from '@/types'
import { cloudStorage } from './cloudStorage'
import { formatDate, generateUUID } from './tools'

export async function exportTasks(type: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
  const tasks = await cloudStorage.getTasks()
  const exportData = tasks.map(task => ({
    '主标题': task.title,
    '副标题/详情': task.subTitle,
    '优先级': task.priority === Priority.HIGH ? '高' : task.priority === Priority.MID ? '中' : '低',
    '分类': task.category === Category.WORK ? '工作' : '个人',
    '截止日期': task.deadline,
    '自定义标签': task.tags.join(','),
    '状态': task.status === TaskStatus.FINISHED ? '已完成' : '未完成',
    '创建时间': task.createTime
  }))

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '事务记录')

  const fileName = `事务管理记录_${formatDate()}.${type}`
  if (type === 'xlsx') {
    XLSX.writeFile(wb, fileName)
  } else {
    const csv = XLSX.utils.sheet_to_csv(ws)
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), fileName)
  }

  alert(`✅ 导出成功！文件已保存为：${fileName}`)
}

export async function importTasks(
  file: File,
  setProgress: (progress: number) => void
): Promise<{ success: boolean; msg: string }> {
  try {
    setProgress(20)
    const data = await readFileAsBinary(file)
    setProgress(50)
    
    const wb = XLSX.read(data, { type: 'binary' })
    const wsname = wb.SheetNames[0]
    const ws = wb.Sheets[wsname]
    const rawData = XLSX.utils.sheet_to_json(ws) as any[]
    setProgress(70)

    const validTasks: Task[] = []
    const invalidRows: number[] = []
    rawData.forEach((row, index) => {
      if (!row['主标题'] || !row['优先级'] || !row['分类'] || !row['截止日期']) {
        invalidRows.push(index + 2)
        return
      }

      let priority: Priority
      if (row['优先级'] === '高') priority = Priority.HIGH
      else if (row['优先级'] === '中') priority = Priority.MID
      else if (row['优先级'] === '低') priority = Priority.LOW
      else {
        invalidRows.push(index + 2)
        return
      }

      let category: Category
      if (row['分类'] === '工作') category = Category.WORK
      else if (row['分类'] === '个人') category = Category.PERSONAL
      else {
        invalidRows.push(index + 2)
        return
      }

      let status: TaskStatus = TaskStatus.UNFINISHED
      if (row['状态'] === '已完成') status = TaskStatus.FINISHED

      const tags = row['自定义标签'] ? String(row['自定义标签']).split(',').map(t => t.trim()) : []

      const deadline = String(row['截止日期']).trim()
      const deadlineParts = deadline.split(' ')
      validTasks.push({
        id: generateUUID(),
        title: String(row['主标题']).trim(),
        subTitle: row['副标题/详情'] ? String(row['副标题/详情']).trim() : '',
        priority,
        category,
        startDate: deadlineParts[0],
        startTime: deadlineParts[1] || '00:00',
        endTime: deadlineParts[1] || '00:00',
        deadline: deadline,
        tags,
        status,
        createTime: formatDate()
      })
    })

    setProgress(90)

    if (validTasks.length === 0) {
      return { success: false, msg: '导入失败：未找到有效数据' }
    }

    for (const task of validTasks) {
      await cloudStorage.addTask(task)
    }

    setProgress(100)

    let msg = `✅ 导入成功！共导入 ${validTasks.length} 条事务`
    if (invalidRows.length > 0) {
      msg += `\n⚠️ 以下行数据无效，已跳过：${invalidRows.join(', ')}`
    }
    return { success: true, msg }
  } catch (error) {
    return { success: false, msg: '导入失败：' + (error instanceof Error ? error.message : '未知错误') }
  }
}

function readFileAsBinary(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('文件读取错误'))
    reader.readAsBinaryString(file)
  })
}
