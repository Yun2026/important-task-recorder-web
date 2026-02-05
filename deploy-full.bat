@echo off
chcp 65001 >nul
echo 🚀 开始部署事务记录本 Web 应用到服务器 106.52.126.158...
echo.

REM 上传文件
echo 📤 正在上传部署包...
scp -o StrictHostKeyChecking=no deploy-final.tar.gz root@106.52.126.158:/root/
if errorlevel 1 (
    echo ❌ 上传失败
    exit /b 1
)
echo ✅ 上传成功
echo.

REM 在服务器上执行部署命令
echo 🔧 正在服务器上执行部署...
ssh -o StrictHostKeyChecking=no root@106.52.126.158 "mkdir -p /app/task-recorder && cd /app/task-recorder && tar -xzvf /root/deploy-final.tar.gz -C /app/task-recorder && docker stop task-recorder-app 2>/dev/null; docker rm task-recorder-app 2>/dev/null; docker rmi task-recorder 2>/dev/null; docker build -t task-recorder . && docker run -d --name task-recorder-app -p 80:8080 --restart always task-recorder && echo '✅ 部署完成'"
if errorlevel 1 (
    echo ❌ 部署失败
    exit /b 1
)

echo.
echo 🎉 部署成功！
echo 🌐 访问地址: http://106.52.126.158
echo.
pause
