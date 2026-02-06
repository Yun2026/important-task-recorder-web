# 📝 重要事务记录本

## 项目介绍

重要事务记录本是一款简洁高效的任务管理 Web 应用，旨在帮助用户更好地规划和管理日常事务。项目采用现代化的前端技术栈，结合腾讯云 CloudBase 服务，实现了用户注册登录、任务创建管理、番茄钟专注、数据统计等核心功能。界面采用 TDesign 组件库设计，支持响应式布局，适配桌面和移动设备。

## 技术架构

项目采用**前后端分离**的现代化架构：

- **前端**：Vue 3 + TypeScript + Vite 构建，使用 Tailwind CSS 进行样式设计，TDesign Vue Next 作为 UI 组件库
- **后端**：采用腾讯云 CloudBase 无服务器架构，前端直接通过 CloudBase JavaScript SDK 连接云数据库
- **数据存储**：CloudBase NoSQL 数据库，支持用户注册登录、任务数据的云端存储
- **部署方式**：Docker 容器化部署，Nginx 作为静态文件服务器

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

---

## 🙏 致谢

感谢腾讯云 CloudBase 服务提供的技术支持，包括：
- CloudBase NoSQL 数据库服务
- CloudBase 静态网站托管
- CloudBase JavaScript SDK

同时感谢 TDesign 开源组件库提供的优秀 UI 组件。

---

**享受高效的任务管理体验！** 🚀
