# syntax=docker/dockerfile:1
# ============================================================
# EasyDetek 站点 Dockerfile（多阶段构建）
# 阶段 1：用 Node 构建静态站
# 阶段 2：用 nginx 托管构建产物
# ============================================================

# ---------- 阶段 1：构建 ----------
FROM node:20-alpine AS builder
WORKDIR /app

# 先拷贝依赖清单，利用 Docker 层缓存（依赖未变时跳过 npm install）
COPY package.json package-lock.json ./
RUN npm ci

# 拷贝源码并构建
COPY . .

# 通过构建参数指定站点最终访问地址（影响 sitemap、og 标签等）
# 默认 http://localhost:80，部署时用 --build-arg SITE_URL=... 覆盖
ARG SITE_URL=http://localhost
ENV SITE_URL=$SITE_URL
# 容器内无完整 git worktree，关闭「最后更新时间」避免构建失败
ENV DISABLE_LAST_UPDATE=1
RUN npm run build

# ---------- 阶段 2：托管 ----------
FROM nginx:alpine AS runtime

# 清空 nginx 默认站点，放入自定义配置
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 把构建产物复制到 nginx 站点根目录
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
