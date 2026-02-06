# 使用 nginx:alpine 作为基础镜像
FROM nginx:alpine

# 复制前端构建产物
COPY dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
