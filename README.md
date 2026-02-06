# 📝 重要事务记录本

## 项目介绍

重要事务记录本是一款专注于提升工作效率的现代化任务管理Web应用，采用前后端分离架构，为用户提供简洁高效的个人事务管理解决方案。

## 技术架构

项目采用**前后端分离**的现代化架构：

- **前端**：Vue 3 + TypeScript + Vite 构建，使用 Tailwind CSS 进行样式设计，TDesign Vue Next 作为 UI 组件库
- **后端**：Node.js + Express + SQLite，提供 RESTful API 服务
- **数据存储**：SQLite 本地数据库，实现数据完全自主可控
- **部署方式**：Docker 容器化部署，Nginx 作为静态文件服务器和反向代理
- **认证**：JWT Token 认证

## ✨ 核心功能

- ✅ **任务管理** - 创建、编辑、删除任务，支持优先级设置和分类
- 🍅 **专注模式** - 番茄钟计时器，帮助提高工作效率
- 📊 **数据统计** - 任务完成统计、时间分布分析
- 🔐 **用户系统** - 登录/注册功能
- 📱 **响应式设计** - 适配桌面和移动端

## 🌐 在线访问

**访问地址**: http://106.52.126.158:8080

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

### Docker 部署

```bash
# 构建前端
npm run build

# 启动容器
cd /path/to/project && docker-compose up -d --build
```

## 📦 技术栈

- **前端**: Vue 3 + TypeScript + Vite + Tailwind CSS + TDesign Vue Next
- **后端**: Node.js + Express + SQLite
- **部署**: Docker + Nginx
- **认证**: JWT Token
