#!/bin/bash

# 事务记录本 Web 应用部署脚本
# 目标服务器: 106.52.126.158

set -e

echo "🚀 开始部署事务记录本 Web 应用..."

# 配置
SERVER_IP="106.52.126.158"
SERVER_USER="root"
REMOTE_DIR="/app/task-recorder"
CONTAINER_NAME="task-recorder-app"
IMAGE_NAME="task-recorder"

# 检查本地 dist 目录是否存在
if [ ! -d "dist" ]; then
    echo "❌ 错误: dist 目录不存在，请先运行 npm run build"
    exit 1
fi

echo "📦 准备部署文件..."

# 创建临时部署包
tar -czvf deploy-package.tar.gz dist Dockerfile

echo "📤 上传文件到服务器..."
scp deploy-package.tar.gz ${SERVER_USER}@${SERVER_IP}:/root/

echo "🔧 在服务器上执行部署..."
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    set -e
    
    echo "📂 创建应用目录..."
    mkdir -p ${REMOTE_DIR}
    cd ${REMOTE_DIR}
    
    echo "📦 解压部署包..."
    tar -xzvf /root/deploy-package.tar.gz -C ${REMOTE_DIR}
    
    echo "🐳 检查 Docker 是否安装..."
    if ! command -v docker &> /dev/null; then
        echo "🔧 安装 Docker..."
        apt-get update
        apt-get install -y docker.io
        systemctl start docker
        systemctl enable docker
    fi
    
    echo "🛑 停止旧容器..."
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    
    echo "🗑️ 删除旧镜像..."
    docker rmi ${IMAGE_NAME} 2>/dev/null || true
    
    echo "🔨 构建新镜像..."
    cd ${REMOTE_DIR}
    docker build -t ${IMAGE_NAME} .
    
echo "🚀 启动新容器..."
docker run -d \
    --name ${CONTAINER_NAME} \
    -p 80:8080 \
    --restart always \
    ${IMAGE_NAME}
    
    echo "🔥 配置防火墙..."
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 8080/tcp 2>/dev/null || true
    
    echo "✅ 部署完成！"
    echo "🌐 访问地址: http://${SERVER_IP}"
EOF

echo "🧹 清理临时文件..."
rm -f deploy-package.tar.gz

echo ""
echo "🎉 部署成功！"
echo "🌐 网站地址: http://${SERVER_IP}"
echo ""
