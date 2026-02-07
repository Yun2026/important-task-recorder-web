# 📝 重要事务记录本

## 项目介绍

重要事务记录本是一款专注于提升工作效率的现代化任务管理Web应用，采用前后端分离架构，为用户提供简洁高效的个人事务管理解决方案。

**设计理念**：在信息爆炸的时代，高效管理个人事务变得尤为重要。本项目以"简洁、高效、专注"为核心理念，通过直观的界面设计和科学的时间管理方法，帮助用户建立良好的工作习惯，提升生产力。

**技术亮点**：项目采用Vue 3组合式API配合TypeScript，确保代码的类型安全和可维护性。前端使用TDesign Vue Next组件库，保证了界面的一致性和专业感。后端采用Node.js + Express轻量级架构，配合SQLite本地数据库，实现数据完全自主可控，无需担心隐私泄露问题。Docker容器化部署方案确保了应用的可移植性和部署便捷性。

**适用场景**：无论是学生管理课程作业、职场人士安排工作任务，还是自由职业者规划项目进度，本应用都能提供专业可靠的技术支撑。响应式设计确保用户可以在桌面端和移动端无缝切换使用。

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

**服务器地址**: http://106.52.126.158:8080

**部署信息**:
- 服务器: 腾讯云轻量应用服务器 (lhins-p81lgfsx)
- 地域: 广州 (ap-guangzhou)
- 部署方式: Docker Compose
- 容器运行状态: ✅ 正常运行
- 最后部署: 2026-02-07

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

## 📄 许可证

MIT License

---

## 🙏 致谢

感谢以下开源项目和技术社区的支持：
- Vue.js - 渐进式 JavaScript 框架
- TDesign Vue Next - 腾讯企业级设计体系
- Node.js + Express - 后端服务框架
- SQLite - 轻量级数据库
- Docker - 容器化技术
- Nginx - 高性能 Web 服务器

---

**享受高效的任务管理体验！** 🚀
