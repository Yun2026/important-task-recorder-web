@echo off
chcp 65001 >nul
echo 🚀 开始部署事务记录本 Web 应用...
echo.

REM 配置
set SERVER_IP=106.52.126.158
set SERVER_USER=root
set REMOTE_DIR=/app/task-recorder
set CONTAINER_NAME=task-recorder-app
set IMAGE_NAME=task-recorder

REM 检查本地 dist 目录是否存在
if not exist "dist" (
    echo ❌ 错误: dist 目录不存在，请先运行 npm run build
    pause
    exit /b 1
)

echo 📦 准备部署文件...

REM 创建临时部署包
tar -czvf deploy-package.tar.gz dist Dockerfile
if errorlevel 1 (
    echo ❌ 创建部署包失败
    pause
    exit /b 1
)

echo.
echo 📤 上传文件到服务器...
scp deploy-package.tar.gz %SERVER_USER%@%SERVER_IP%:/root/
if errorlevel 1 (
    echo ❌ 上传文件失败，请检查 SSH 连接
    pause
    exit /b 1
)

echo.
echo 🔧 在服务器上执行部署...
ssh %SERVER_USER%@%SERVER_IP% "bash -s" < deploy-remote.sh
if errorlevel 1 (
    echo ❌ 远程部署失败
    pause
    exit /b 1
)

echo.
echo 🧹 清理临时文件...
del /f deploy-package.tar.gz 2>nul

echo.
echo 🎉 部署成功！
echo 🌐 网站地址: http://%SERVER_IP%
echo.
pause
