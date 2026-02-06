# 📝 重要事务记录本

## 项目介绍

重要事务记录本是一款简洁高效的任务管理 Web 应用，旨在帮助用户更好地规划和管理日常事务。项目采用现代化的前端技术栈，结合腾讯云 CloudBase 服务，实现了用户注册登录、任务创建管理、番茄钟专注、数据统计等核心功能。界面采用 TDesign 组件库设计，支持响应式布局，适配桌面和移动设备。

## 技术架构

项目采用**前后端分离**的现代化架构：

- **前端**：Vue 3 + TypeScript + Vite 构建，使用 Tailwind CSS 进行样式设计，TDesign Vue Next 作为 UI 组件库
- **后端**：Node.js + Express + SQLite，提供 RESTful API 服务
- **数据存储**：SQLite 本地数据库，实现数据完全自主可控
- **部署方式**：Docker 容器化部署，Nginx 作为静态文件服务器和反向代理
- **认证**：JWT Token 认证

## ✨ 功能特性

- ✅ **任务管理** - 创建、编辑、删除任务，支持优先级设置和分类
- 🍅 **专注模式** - 番茄钟计时器，帮助提高工作效率
- 📊 **数据统计** - 任务完成统计、时间分布分析
- 🔐 **用户系统** - 登录/注册功能
- 💾 **数据持久化** - 本地缓存 + 云端存储
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
# 方式1: 使用部署脚本
./deploy.sh

# 方式2: 手动部署
# 构建前端
npm run build

# 打包部署文件
tar -czf deploy.tar.gz dist server Dockerfile docker-compose.yml

# 上传到服务器并部署
scp deploy.tar.gz root@106.52.126.158:/root/
ssh root@106.52.126.158
cd /root && mkdir -p task-recorder && tar -xzf deploy.tar.gz -C task-recorder
cd task-recorder && docker-compose up -d --build
```

## 📦 技术栈

| 技术 | 说明 |
|------|------|
| **前端框架** | Vue 3 + TypeScript |
| **UI组件** | TDesign Vue Next |
| **构建工具** | Vite |
| **CSS框架** | Tailwind CSS |
| **后端框架** | Node.js + Express |
| **数据库** | SQLite |
| **认证** | JWT Token |
| **部署** | Docker + Nginx |

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
