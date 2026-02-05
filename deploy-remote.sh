#!/bin/bash

# 远程服务器部署脚本
set -e

REMOTE_DIR="/app/task-recorder"
CONTAINER_NAME="task-recorder-app"
IMAGE_NAME="task-recorder"

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
