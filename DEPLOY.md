# 🚀 部署指南

## 服务器信息
- **IP**: 106.52.126.158
- **系统**: Ubuntu
- **部署方式**: Docker + Nginx

## 快速部署（推荐）

### 方式一：使用 PowerShell 脚本（Windows 推荐）

1. 确保已安装 PowerShell
2. 确保可以通过 SSH 连接到服务器
3. 在项目目录中打开 PowerShell，执行：

```powershell
.\deploy.ps1
```

### 方式二：使用 Bash 脚本（Git Bash / WSL）

```bash
# 在 Git Bash 或 WSL 中执行
bash deploy.sh
```

### 方式三：手动部署

#### 步骤 1：上传文件

```bash
# 压缩 dist 目录
cd "c:\Users\Admin_yun\CodeBuddy\重要事务记录本Web"
tar -czvf deploy-package.tar.gz dist Dockerfile

# 上传到服务器
scp deploy-package.tar.gz root@106.52.126.158:/root/
scp deploy-remote.sh root@106.52.126.158:/root/
```

#### 步骤 2：在服务器上执行

```bash
# SSH 登录服务器
ssh root@106.52.126.158

# 执行部署脚本
bash /root/deploy-remote.sh
```

## 部署后验证

1. **访问网站**: http://106.52.126.158
2. **检查容器状态**:
   ```bash
   docker ps | grep task-recorder
   ```
3. **查看日志**:
   ```bash
   docker logs task-recorder-app
   ```

## 更新部署

当代码更新后，重新执行部署脚本即可：

```powershell
# 重新构建
npm run build

# 重新部署
.\deploy.ps1
```

## 故障排除

### 问题 1：SSH 连接失败
- 检查服务器 IP 是否正确
- 确保服务器已开启 SSH 服务
- 检查防火墙设置

### 问题 2：Docker 安装失败
```bash
# 手动安装 Docker
apt-get update
apt-get install -y docker.io
systemctl start docker
systemctl enable docker
```

### 问题 3：端口被占用
```bash
# 查看端口占用
netstat -tlnp | grep 80

# 停止占用端口的进程
kill -9 <PID>
```

### 问题 4：容器启动失败
```bash
# 查看容器日志
docker logs task-recorder-app

# 重新启动容器
docker restart task-recorder-app
```

## 功能清单

✅ **事务管理**
- 创建、编辑、删除事务
- 标记完成/未完成
- 优先级设置（高/中/低）
- 分类管理（工作/个人）

✅ **专注模式**
- 番茄钟倒计时（默认 25 分钟）
- 可自定义时长（15/25/45/60 分钟）
- 高亮当前专注事务
- 其他事务 80% 透明度

✅ **数据管理**
- 本地存储
- 云端同步（登录后）
- 数据导出（CSV/Excel）
- 回收站功能

✅ **筛选和搜索**
- 关键词搜索
- 优先级筛选
- 状态筛选
- 分类筛选
- 排序功能

## 技术栈

- **前端**: Vue 3 + TypeScript
- **UI 组件**: TDesign Vue Next
- **构建工具**: Vite
- **容器化**: Docker
- **Web 服务器**: Nginx

## 联系方式

如有问题，请检查：
1. 服务器是否正常运行
2. Docker 服务是否启动
3. 防火墙是否开放 80 端口
