# 📝 重要事务记录本

一个简洁高效的任务管理 Web 应用，支持番茄钟、任务优先级管理和数据统计。

## ✨ 功能特性

- ✅ **任务管理** - 创建、编辑、删除任务，支持优先级设置和分类
- 🍅 **专注模式** - 番茄钟计时器，帮助提高工作效率
- 📊 **数据统计** - 任务完成统计、时间分布分析
- 🔐 **用户系统** - 登录/注册功能
- 💾 **数据持久化** - 本地缓存 + 云端存储
- 📱 **响应式设计** - 适配桌面和移动端

## 🌐 在线访问

**服务器地址**: http://106.52.126.158:8080

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 部署

```bash
# 构建 Docker 镜像
docker build -t task-recorder .

# 运行容器
docker run -d -p 8080:80 --name task-recorder task-recorder
```

## 📦 技术栈

| 技术 | 说明 |
|------|------|
| **框架** | Vue 3 + TypeScript |
| **UI组件** | TDesign Vue Next |
| **构建工具** | Vite |
| **CSS框架** | Tailwind CSS |
| **数据存储** | CloudBase NoSQL |

## 📄 许可证

MIT License
