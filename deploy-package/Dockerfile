# 第一阶段 - 构建后端应用
FROM node:18 as backend-builder

WORKDIR /server

# 安装构建依赖
RUN apt-get update && apt-get install -y python3 make g++

# 复制后端 package 文件
COPY server/package*.json ./
RUN npm install

# 复制后端源代码
COPY server/ ./

# 第二阶段 - 生产环境
FROM node:18-slim

# 安装 nginx 和运行依赖
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制前端构建产物（从本地dist目录）
COPY dist /usr/share/nginx/html

# 复制后端应用
COPY --from=backend-builder /server /app/server
WORKDIR /app/server
RUN npm install --production

# Nginx 配置 - 使用正确的代理路径
RUN printf 'server {\n    listen 80;\n    server_name localhost;\n    \n    # 前端静态资源\n    location / {\n        root /usr/share/nginx/html;\n        index index.html index.htm;\n        try_files $uri $uri/ /index.html;\n    }\n    \n    # 后端 API 代理\n    location /api/ {\n        proxy_pass http://127.0.0.1:3001/api/;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n    \n    error_page 500 502 503 504 /50x.html;\n    location = /50x.html {\n        root /usr/share/nginx/html;\n    }\n}' > /etc/nginx/sites-available/default

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
