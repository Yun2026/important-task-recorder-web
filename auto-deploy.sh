#!/bin/bash
# 事务记录本自动部署脚本
# 服务器: 106.52.126.158

set -e

echo "🚀 开始自动部署事务记录本..."
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
REMOTE_DIR="/home/ubuntu/task-recorder"
CONTAINER_NAME="task-recorder-app"
IMAGE_NAME="task-recorder"
PACKAGE_FILE="/home/ubuntu/deploy-package.tar.gz"

# 1. 检查部署包
if [ ! -f "$PACKAGE_FILE" ]; then
    echo -e "${RED}❌ 错误: 部署包不存在: $PACKAGE_FILE${NC}"
    echo "请先上传 deploy-package.tar.gz 到 /root/ 目录"
    exit 1
fi

# 2. 检查 Docker
echo -e "${YELLOW}📦 检查 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请使用 sudo 权限安装${NC}"
    echo "运行: sudo apt-get update && sudo apt-get install -y docker.io"
    exit 1
else
    echo -e "${GREEN}✅ Docker 已安装${NC}"
fi

# 3. 创建应用目录
echo -e "${YELLOW}📂 创建应用目录...${NC}"
mkdir -p $REMOTE_DIR

# 4. 停止并删除旧容器
echo -e "${YELLOW}🛑 停止旧容器...${NC}"
sudo docker stop $CONTAINER_NAME 2>/dev/null || true
sudo docker rm $CONTAINER_NAME 2>/dev/null || true
echo -e "${GREEN}✅ 旧容器已清理${NC}"

# 5. 删除旧镜像
echo -e "${YELLOW}🗑️ 删除旧镜像...${NC}"
sudo docker rmi $IMAGE_NAME 2>/dev/null || true

# 6. 解压部署包
echo -e "${YELLOW}📦 解压部署包...${NC}"
tar -xzf $PACKAGE_FILE -C $REMOTE_DIR
echo -e "${GREEN}✅ 解压完成${NC}"

# 7. 构建 Docker 镜像
echo -e "${YELLOW}🔨 构建 Docker 镜像...${NC}"
cd $REMOTE_DIR
sudo docker build -t $IMAGE_NAME . > /tmp/docker-build.log 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    cat /tmp/docker-build.log
    exit 1
fi

# 8. 启动容器
echo -e "${YELLOW}🚀 启动容器...${NC}"
sudo docker run -d \
    --name $CONTAINER_NAME \
    -p 80:8080 \
    --restart always \
    $IMAGE_NAME

# 9. 等待容器启动
sleep 3

# 10. 检查容器状态
echo ""
echo -e "${YELLOW}🔍 检查容器状态...${NC}"
if sudo docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${GREEN}✅ 容器运行正常${NC}"
    sudo docker ps | grep $CONTAINER_NAME
else
    echo -e "${RED}❌ 容器未正常运行${NC}"
    echo "日志:"
    sudo docker logs $CONTAINER_NAME 2>&1 | tail -20
    exit 1
fi

# 11. 配置防火墙
echo -e "${YELLOW}🔥 配置防火墙...${NC}"
ufw allow 80/tcp 2>/dev/null || true
ufw allow 8080/tcp 2>/dev/null || true
echo -e "${GREEN}✅ 防火墙配置完成${NC}"

# 12. 测试本地访问
echo ""
echo -e "${YELLOW}🧪 测试本地访问...${NC}"
if curl -s http://localhost:8080 > /dev/null; then
    echo -e "${GREEN}✅ 本地访问正常${NC}"
else
    echo -e "${YELLOW}⚠️ 本地访问测试失败，但容器可能在启动中${NC}"
fi

# 13. 完成
echo ""
echo "================================"
echo -e "${GREEN}🎉 部署成功！${NC}"
echo ""
echo -e "🌐 ${YELLOW}访问地址:${NC} http://106.52.126.158"
echo ""
echo "📋 常用命令:"
echo "  查看日志: sudo docker logs -f $CONTAINER_NAME"
echo "  重启服务: sudo docker restart $CONTAINER_NAME"
echo "  停止服务: sudo docker stop $CONTAINER_NAME"
echo "  查看状态: sudo docker ps | grep $CONTAINER_NAME"
echo ""
echo -e "${YELLOW}⚠️  重要提示:${NC}"
echo "   请确保腾讯云控制台防火墙已放行 80 端口！"
echo "   控制台: https://console.cloud.tencent.com/lighthouse"
echo ""
