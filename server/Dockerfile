FROM node:18-alpine

WORKDIR /app

# 创建数据目录
RUN mkdir -p /app/data

COPY package*.json ./
RUN npm install --production

# 安装 sqlite3 依赖
RUN npm install sqlite3

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
